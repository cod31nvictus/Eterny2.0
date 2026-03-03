import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import AppHeader from "../../components/AppHeader";
import TextInputField from "../../components/TextInputField";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing, typography } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../services/apiClient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSocialLogin = async (provider: "google" | "apple" | "microsoft") => {
    try {
      await apiClient.request(`/auth/${provider}`, { method: "POST" });
    } catch {
      const names = { google: "Google", apple: "Apple", microsoft: "Microsoft" };
      Alert.alert(`${names[provider]} login coming soon.`);
    }
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await login(phone.trim(), password);
      navigation.replace("Threads");
    } catch (err: any) {
      Alert.alert("Sign in failed", err.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Sign In" showBack={false} />
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
            Welcome to Eterny 2.0
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamilyRegular,
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            Enter your details to access your secure workspace.
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

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton label="Sign in" onPress={onSubmit} disabled={submitting} />
        </View>

        <View
          style={{
            alignItems: "center",
            marginTop: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <TouchableOpacity onPress={() => navigation.navigate("OtpRequest")}>
            <Text
              style={{
                fontFamily: typography.fontFamilyMedium,
                fontSize: 14,
                color: colors.textPrimary,
              }}
            >
              Sign in with OTP instead
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontFamily: typography.fontFamilyRegular,
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              New here?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text
                style={{
                  fontFamily: typography.fontFamilyBold,
                  fontSize: 14,
                  color: colors.textPrimary,
                }}
              >
                Create account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          {(["google", "apple", "microsoft"] as const).map((provider) => (
            <TouchableOpacity
              key={provider}
              onPress={() => handleSocialLogin(provider)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 999,
                height: 48,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamilyMedium,
                  fontSize: 14,
                  color: colors.textPrimary,
                }}
              >
                Continue with{" "}
                {provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Microsoft"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;

