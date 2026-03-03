import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppHeader from "../../components/AppHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing, typography } from "../../theme";
import { apiClient } from "../../services/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Threads">;

type Thread = {
  id: string;
  title: string;
  updatedAt: string;
};

const ThreadsScreen: React.FC<Props> = ({ navigation }) => {
  const { accessToken, logout } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Action sheet modal
  const [actionThread, setActionThread] = useState<Thread | null>(null);
  // Delete confirm modal
  const [confirmDeleteThread, setConfirmDeleteThread] = useState<Thread | null>(null);
  // Rename modal
  const [renameThread, setRenameThread] = useState<Thread | null>(null);
  const [renameText, setRenameText] = useState("");
  const [renameModalVisible, setRenameModalVisible] = useState(false);

  const isFirstLoad = useRef(true);

  const loadThreads = async (silent = false) => {
    if (!accessToken) return;
    try {
      if (!silent) setLoading(true);
      const data = await apiClient.request<Thread[]>("/chat/threads", {
        method: "GET",
        token: accessToken,
      });
      setThreads(data);
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Reload on every screen focus; spinner only on first load
  useFocusEffect(
    useCallback(() => {
      const silent = !isFirstLoad.current;
      isFirstLoad.current = false;
      loadThreads(silent);
    }, [accessToken])
  );

  const handleNewConversation = async () => {
    if (!accessToken) return;
    try {
      setCreating(true);
      const thread = await apiClient.request<Thread>("/chat/threads", {
        method: "POST",
        token: accessToken,
        body: { title: "New conversation" },
      });
      setThreads((prev) => [thread, ...prev]);
      navigation.navigate("ChatThread", { threadId: thread.id, title: thread.title });
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renameThread || !renameText.trim() || !accessToken) return;
    try {
      await apiClient.request(`/chat/threads/${renameThread.id}`, {
        method: "PATCH",
        token: accessToken,
        body: { title: renameText.trim() },
      });
      setThreads((prev) =>
        prev.map((t) => (t.id === renameThread.id ? { ...t, title: renameText.trim() } : t))
      );
      setRenameModalVisible(false);
      setRenameThread(null);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (thread: Thread) => {
    if (!accessToken) return;
    try {
      await apiClient.request(`/chat/threads/${thread.id}`, {
        method: "DELETE",
        token: accessToken,
      });
      setThreads((prev) => prev.filter((t) => t.id !== thread.id));
    } catch {
      // ignore
    }
  };

  const renderItem = ({ item }: { item: Thread }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("ChatThread", { threadId: item.id, title: item.title })}
      style={{
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
        <Text
          style={{
            fontFamily: typography.fontFamilySemibold,
            fontSize: 16,
            color: colors.textPrimary,
            flex: 1,
            marginRight: spacing.sm,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontFamily: typography.fontFamilyRegular,
              fontSize: 12,
              color: colors.meta,
              marginRight: spacing.sm,
            }}
          >
            {(() => {
              const d = new Date(item.updatedAt);
              const now = new Date();
              const isToday =
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate();
              return isToday
                ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            })()}
          </Text>
          <TouchableOpacity
            onPress={() => setActionThread(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 20, color: colors.meta, lineHeight: 22 }}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text
        style={{
          fontFamily: typography.fontFamilyRegular,
          fontSize: 14,
          color: colors.textSecondary,
        }}
        numberOfLines={1}
      >
        Conversation
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        title="Conversations"
        rightIcon={
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 12, color: colors.textSecondary }}>
                Profile
              </Text>
            </TouchableOpacity>
            <View style={{ width: spacing.md }} />
            <TouchableOpacity onPress={logout}>
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 12, color: colors.textSecondary }}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
        <PrimaryButton
          label={creating ? "Creating..." : "New conversation"}
          onPress={handleNewConversation}
          disabled={creating}
        />
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          data={threads}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: spacing.xl }}>
              <Text style={{ fontFamily: typography.fontFamilyRegular, fontSize: 14, color: colors.textSecondary }}>
                No conversations yet.
              </Text>
            </View>
          }
        />
      )}

      {/* ── Action sheet modal (⋮ menu) ── */}
      <Modal
        visible={!!actionThread}
        transparent
        animationType="slide"
        onRequestClose={() => setActionThread(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          activeOpacity={1}
          onPress={() => setActionThread(null)}
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
                paddingHorizontal: spacing.lg,
              }}
              numberOfLines={1}
            >
              {actionThread?.title}
            </Text>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
            <TouchableOpacity
              onPress={() => {
                const t = actionThread;
                setActionThread(null);
                // Small delay so the action sheet closes first
                setTimeout(() => {
                  setRenameThread(t);
                  setRenameText(t?.title ?? "");
                  setRenameModalVisible(true);
                }, 250);
              }}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 16, color: colors.textPrimary }}>
                Rename
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const t = actionThread;
                setActionThread(null);
                setTimeout(() => setConfirmDeleteThread(t), 250);
              }}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 16, color: "#DC2626" }}>
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActionThread(null)}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 16, color: colors.meta }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Delete confirmation modal ── */}
      <Modal
        visible={!!confirmDeleteThread}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteThread(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: spacing.lg, width: "80%" }}>
            <Text style={{ fontFamily: typography.fontFamilySemibold, fontSize: 16, color: colors.textPrimary, marginBottom: spacing.sm }}>
              Delete conversation?
            </Text>
            <Text style={{ fontFamily: typography.fontFamilyRegular, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg }}>
              This cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity onPress={() => setConfirmDeleteThread(null)} style={{ marginRight: spacing.lg }}>
                <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 14, color: colors.meta }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleDelete(confirmDeleteThread!);
                  setConfirmDeleteThread(null);
                }}
              >
                <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 14, color: "#DC2626" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Rename modal ── */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: spacing.lg, width: "80%" }}>
            <Text style={{ fontFamily: typography.fontFamilySemibold, fontSize: 16, color: colors.textPrimary, marginBottom: spacing.md }}>
              Rename conversation
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                fontFamily: typography.fontFamilyRegular,
                fontSize: 14,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={{ marginRight: spacing.lg }}>
                <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 14, color: colors.meta }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename}>
                <Text style={{ fontFamily: typography.fontFamilyMedium, fontSize: 14, color: colors.textPrimary }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ThreadsScreen;
