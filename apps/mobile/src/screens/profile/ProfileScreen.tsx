import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AppHeader from "../../components/AppHeader";
import { colors, spacing, typography } from "../../theme";
import { apiClient } from "../../services/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/environment";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

type BucketData = Record<
  string,
  { key: string; value: unknown; effectiveAt: string }[]
>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { accessToken } = useAuth();
  const [data, setData] = useState<BucketData>({});
  const [uploading, setUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!accessToken) return;
    try {
      const resp = await apiClient.request<BucketData>("/profile", {
        method: "GET",
        token: accessToken,
      });
      setData(resp);
    } catch {
      // ignore
    }
  }, [accessToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      } as any);

      const uploadRes = await fetch(`${API_BASE_URL}/uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error((err as any).error || "Upload failed");
      }

      Alert.alert("Processing your report...", "Your profile will update shortly.");

      // Reload profile after a short delay for MCP ingestion
      setTimeout(() => {
        loadProfile();
        setUploading(false);
      }, 3000);
    } catch (err: any) {
      setUploading(false);
      Alert.alert("Upload failed", err.message || "Please try again.");
    }
  };

  const renderBucket = (bucket: string, items: BucketData[string]) => (
    <View
      key={bucket}
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: "#F9FAFB",
        }}
      >
        <Text
          style={{
            fontFamily: typography.fontFamilySemibold,
            fontSize: 12,
            color: colors.textSecondary,
            textTransform: "uppercase",
          }}
        >
          {bucket}
        </Text>
      </View>
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        {items.length === 0 ? (
          <Text
            style={{
              fontFamily: typography.fontFamilyRegular,
              fontSize: 14,
              color: colors.meta,
            }}
          >
            No data yet.
          </Text>
        ) : (
          items.map((f) => (
            <View
              key={f.key}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamilyRegular,
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                {f.key}
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamilySemibold,
                  fontSize: 14,
                  color: colors.textPrimary,
                }}
              >
                {typeof f.value === "object" ? JSON.stringify(f.value) : String(f.value)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        title="Profile"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <TouchableOpacity
          onPress={handleUpload}
          disabled={uploading}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingVertical: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text
              style={{
                fontFamily: typography.fontFamilyMedium,
                fontSize: 14,
                color: colors.textPrimary,
              }}
            >
              Upload report
            </Text>
          )}
        </TouchableOpacity>

        {Object.keys(data).length === 0 ? (
          <Text
            style={{
              fontFamily: typography.fontFamilyRegular,
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: spacing.xl,
            }}
          >
            No profile data yet — upload a lab report to see your health profile.
          </Text>
        ) : (
          Object.entries(data).map(([bucket, items]) => renderBucket(bucket, items))
        )}
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
