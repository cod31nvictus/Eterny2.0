import React from "react";
import { TouchableOpacity, Text, StyleProp, ViewStyle } from "react-native";
import { colors, spacing, typography } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const PrimaryButton: React.FC<Props> = ({ label, onPress, style, disabled }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          height: 48,
          borderRadius: 12,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.lg,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: typography.fontFamilySemibold,
          fontSize: 14,
          color: "#FFFFFF",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;

