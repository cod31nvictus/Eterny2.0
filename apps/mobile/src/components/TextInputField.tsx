import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { colors, spacing, typography } from "../theme";

type Props = TextInputProps & {
  label: string;
};

const TextInputField: React.FC<Props> = ({ label, ...inputProps }) => {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          fontFamily: typography.fontFamilySemibold,
          fontSize: 12,
          color: colors.textPrimary,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <TextInput
        {...inputProps}
        style={[
          {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: spacing.md,
            height: 48,
            fontFamily: typography.fontFamilyRegular,
            fontSize: 14,
            color: colors.textPrimary,
          },
          inputProps.style,
        ]}
        placeholderTextColor={colors.meta}
      />
    </View>
  );
};

export default TextInputField;

