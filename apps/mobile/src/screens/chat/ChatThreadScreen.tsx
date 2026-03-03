import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import AppHeader from "../../components/AppHeader";
import { colors, spacing, typography } from "../../theme";
import { apiClient } from "../../services/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { API_BASE_URL } from "../../config/environment";

type Props = NativeStackScreenProps<RootStackParamList, "ChatThread">;

type Message = {
  id: string;
  role: string;
  content: string;
  metadata?: { imageBase64?: string; imageMimeType?: string } | null;
  createdAt: string;
  streaming?: boolean;
};

type Attachment =
  | { type: "image"; base64: string; mimeType: string; name: string; previewUri: string }
  | { type: "document"; name: string; text: string };

const STREAMING_ID = "__streaming__";

const ChatThreadScreen: React.FC<Props> = ({ route, navigation }) => {
  const { threadId, title } = route.params;
  const { accessToken } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState(title || "Conversation");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await apiClient.request<Message[]>(
        `/chat/threads/${threadId}/messages`,
        { method: "GET", token: accessToken }
      );
      setMessages(data);
    } catch {
      // ignore
    }
  }, [accessToken, threadId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const refreshThreadTitle = async () => {
    if (!accessToken) return;
    try {
      const thread = await apiClient.request<{ id: string; title: string }>(
        `/chat/threads/${threadId}`,
        { method: "GET", token: accessToken }
      );
      setHeaderTitle(thread.title);
    } catch {
      // ignore
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (!asset.base64) return;
      setAttachment({
        type: "image",
        base64: asset.base64,
        mimeType: asset.mimeType ?? "image/jpeg",
        name: asset.fileName ?? "image.jpg",
        previewUri: asset.uri,
      });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/plain"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      try {
        const formData = new FormData();
        formData.append("file", {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
        } as any);
        const parsed = await fetch(`${API_BASE_URL}/uploads/parse`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        if (!parsed.ok) throw new Error("Parse failed");
        const { text } = await parsed.json();
        setAttachment({ type: "document", name: asset.name, text });
      } catch {
        // ignore silently — user can try again
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !accessToken || sending || streaming) return;
    setError(null);

    let content = input.trim();
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (attachment?.type === "image") {
      imageBase64 = attachment.base64;
      imageMimeType = attachment.mimeType;
      if (!content) content = "What can you tell me about this image?";
    } else if (attachment?.type === "document") {
      content = content
        ? `${content}\n\n[Attached document: ${attachment.name}]\n${attachment.text}`
        : `[Attached document: ${attachment.name}]\n${attachment.text}`;
    }

    setInput("");
    setAttachment(null);

    try {
      setSending(true);
      const body: Record<string, any> = { content };
      if (imageBase64) body.imageBase64 = imageBase64;
      if (imageMimeType) body.imageMimeType = imageMimeType;

      const userMsg = await apiClient.request<Message>(
        `/chat/threads/${threadId}/messages`,
        { method: "POST", token: accessToken, body }
      );
      setMessages((prev) => [...prev, userMsg]);
      setSending(false);

      // Add placeholder streaming bubble
      setStreaming(true);
      setMessages((prev) => [
        ...prev,
        { id: STREAMING_ID, role: "assistant", content: "", createdAt: new Date().toISOString(), streaming: true },
      ]);

      const streamUrl = `${API_BASE_URL}/chat/threads/${threadId}/stream`;
      const res = await fetch(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok || !res.body) throw new Error("Stream request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { delta } = JSON.parse(payload);
            if (delta) {
              setMessages((prev) =>
                prev.map((m) => (m.id === STREAMING_ID ? { ...m, content: m.content + delta } : m))
              );
            }
          } catch {
            // ignore
          }
        }
      }

      setMessages((prev) => prev.filter((m) => m.id !== STREAMING_ID));
      await loadMessages();
      await refreshThreadTitle();
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== STREAMING_ID));
      setError(e?.message || "Could not get assistant reply.");
    } finally {
      setSending(false);
      setStreaming(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isStreamingBubble = item.streaming;
    const imgBase64 = item.metadata?.imageBase64;
    const imgMime = item.metadata?.imageMimeType ?? "image/jpeg";

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isUser ? "flex-end" : "flex-start",
          marginBottom: spacing.sm,
        }}
      >
        {!isUser && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#F3F4F6",
              marginRight: spacing.sm,
            }}
          />
        )}
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: isUser ? colors.textPrimary : "#F9FAFB",
            borderRadius: 16,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          {isUser && imgBase64 ? (
            <Image
              source={{ uri: `data:${imgMime};base64,${imgBase64}` }}
              style={{ width: 180, height: 180, borderRadius: 8, marginBottom: item.content ? spacing.sm : 0 }}
              resizeMode="cover"
            />
          ) : null}
          {item.content || isStreamingBubble ? (
            <Text
              style={{
                fontFamily: typography.fontFamilyRegular,
                fontSize: 14,
                color: isUser ? "#FFFFFF" : colors.textPrimary,
              }}
            >
              {item.content || (isStreamingBubble ? "▋" : "")}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={headerTitle} showBack onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={flatListRef}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {error ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: "#FEE2E2" }}>
            <Text style={{ fontFamily: typography.fontFamilyRegular, fontSize: 12, color: "#B91C1C" }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Attachment preview */}
        {attachment ? (
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
            {attachment.type === "image" ? (
              <Image
                source={{ uri: attachment.previewUri }}
                style={{ width: 48, height: 48, borderRadius: 8, marginRight: spacing.sm }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 4,
                  marginRight: spacing.sm,
                  maxWidth: 200,
                }}
              >
                <Text
                  style={{ fontFamily: typography.fontFamilyRegular, fontSize: 12, color: colors.textPrimary }}
                  numberOfLines={1}
                >
                  {attachment.name}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setAttachment(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 18, color: colors.meta }}>×</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Input row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => setAttachMenuOpen(true)}
            disabled={sending || streaming}
            style={{ marginRight: spacing.sm }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 26, lineHeight: 28, color: sending || streaming ? colors.meta : colors.textPrimary }}>
              +
            </Text>
          </TouchableOpacity>

          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              fontFamily: typography.fontFamilyRegular,
              fontSize: 14,
              color: colors.textPrimary,
            }}
            placeholder="Type a message..."
            placeholderTextColor={colors.meta}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Text
            onPress={handleSend}
            style={{
              marginLeft: spacing.sm,
              fontFamily: typography.fontFamilySemibold,
              fontSize: 14,
              color: sending || streaming ? colors.meta : colors.textPrimary,
            }}
          >
            {streaming ? "..." : "Send"}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* ── Attach options sheet ── */}
      <Modal
        visible={attachMenuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAttachMenuOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          activeOpacity={1}
          onPress={() => setAttachMenuOpen(false)}
        >
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingTop: spacing.md,
              paddingBottom: 36,
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamilySemibold,
                fontSize: 13,
                color: colors.meta,
                textAlign: "center",
                paddingVertical: spacing.sm,
              }}
            >
              Attach
            </Text>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
            <TouchableOpacity
              onPress={() => { setAttachMenuOpen(false); setTimeout(pickImage, 300); }}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 16, color: colors.textPrimary }}>
                Photo / Image
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAttachMenuOpen(false); setTimeout(pickDocument, 300); }}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 16, color: colors.textPrimary }}>
                Document (PDF / text)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAttachMenuOpen(false)}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 16, color: colors.meta }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ChatThreadScreen;
