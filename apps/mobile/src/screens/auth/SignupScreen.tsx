import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import AppHeader from "../../components/AppHeader";
import TextInputField from "../../components/TextInputField";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing, typography } from "../../theme";
import { apiClient } from "../../services/apiClient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { loginWithTokens } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!phone || !password || !confirmPassword) {
      Alert.alert("Missing information", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    try {
      setSubmitting(true);
      const data = await apiClient.request<{
        accessToken: string;
        refreshToken: string;
      }>("/auth/signup", {
        method: "POST",
        body: { phone: phone.trim(), password },
      });
      await loginWithTokens(data.accessToken, data.refreshToken);
      navigation.replace("Threads");
    } catch (err: any) {
      Alert.alert("Signup failed", err.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Create Account" showBack onBackPress={() => navigation.goBack()} />
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
            Get started with Eterny
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamilyRegular,
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            Create your Eterny account using your phone number and a password.
          </Text>
        </View>

        <TextInputField
          label="Phone number"
          keyboardType="phone-pad"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInputField
          label="Password"
          secureTextEntry
          placeholder="********"
          value={password}
          onChangeText={setPassword}
        />
        <TextInputField
          label="Confirm password"
          secureTextEntry
          placeholder="********"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton label="Create account" onPress={onSubmit} disabled={submitting} />
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
              Already have an account?{" "}
              <Text
                style={{
                  fontFamily: typography.fontFamilyBold,
                  color: colors.textPrimary,
                }}
              >
                Sign in
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignupScreen;

