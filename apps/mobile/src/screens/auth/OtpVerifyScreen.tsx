import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity, TextInput } from "react-native";
import AppHeader from "../../components/AppHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing, typography } from "../../theme";
import { apiClient } from "../../services/apiClient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "OtpVerify">;

const OtpVerifyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { phone } = route.params;
  const { loginWithTokens } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!code || code.length < 4) {
      Alert.alert("Invalid code", "Please enter the full verification code.");
      return;
    }
    try {
      setSubmitting(true);
      const data = await apiClient.request<{
        accessToken: string;
        refreshToken: string;
      }>("/auth/otp/verify", {
        method: "POST",
        body: { phone, code },
      });
      await loginWithTokens(data.accessToken, data.refreshToken);
      navigation.replace("Threads");
    } catch (err: any) {
      Alert.alert("OTP verification failed", err.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Verify code" showBack onBackPress={() => navigation.goBack()} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
        }}
      >
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontFamily: typography.fontFamilyBold,
              fontSize: 24,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            Enter verification code
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamilyRegular,
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            We sent a 6‑digit code to {phone}. Enter it below.
          </Text>
        </View>

        <TextInput
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          placeholderTextColor={colors.meta}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 999,
            textAlign: "center",
            height: 56,
            fontFamily: typography.fontFamilyBold,
            fontSize: 22,
            letterSpacing: 6,
            color: colors.textPrimary,
            marginBottom: spacing.lg,
          }}
        />

        <PrimaryButton label="Verify" onPress={onSubmit} disabled={submitting} />

        <View style={{ alignItems: "center", marginTop: spacing.lg }}>
          <TouchableOpacity onPress={() => navigation.navigate("OtpRequest")}>
            <Text
              style={{
                fontFamily: typography.fontFamilyMedium,
                fontSize: 14,
                color: colors.textPrimary,
              }}
            >
              Resend code
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OtpVerifyScreen;
