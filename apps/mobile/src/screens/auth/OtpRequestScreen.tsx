import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import AppHeader from "../../components/AppHeader";
import TextInputField from "../../components/TextInputField";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing, typography } from "../../theme";
import { apiClient } from "../../services/apiClient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "OtpRequest">;

const OtpRequestScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!phone) {
      Alert.alert("Missing phone", "Please enter your phone number.");
      return;
    }
    try {
      setSubmitting(true);
      const data = await apiClient.request<{ sent: boolean; code?: string }>("/auth/otp/request", {
        method: "POST",
        body: { phone: phone.trim() },
      });
      let message = "OTP sent successfully.";
      if (data.code) {
        message += ` (Dev only: code ${data.code})`;
      }
      Alert.alert("OTP requested", message, [
        {
          text: "OK",
          onPress: () => navigation.navigate("OtpVerify", { phone: phone.trim() }),
        },
      ]);
    } catch (err: any) {
      Alert.alert("OTP request failed", err.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Sign in with code" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
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
            Check your phone
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamilyRegular,
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            Enter your phone number and we’ll send you a 6‑digit verification code.
          </Text>
        </View>

        <TextInputField
          label="Phone number"
          keyboardType="phone-pad"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChangeText={setPhone}
        />

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton label="Send code" onPress={onSubmit} disabled={submitting} />
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.lg }}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text
              style={{
                fontFamily: typography.fontFamilyRegular,
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              Prefer password?{" "}
              <Text
                style={{
                  fontFamily: typography.fontFamilyBold,
                  color: colors.textPrimary,
                }}
              >
                Sign in with password
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default OtpRequestScreen;

