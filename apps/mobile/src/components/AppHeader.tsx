import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { colors, spacing, typography } from "../theme";

type Props = {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: React.ReactNode;
};

const AppHeader: React.FC<Props> = ({ title, showBack, onBackPress, rightIcon }) => {
  return (
    <View
      style={{
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <View style={{ width: 40, justifyContent: "center", alignItems: "flex-start" }}>
        {showBack && (
          <TouchableOpacity onPress={onBackPress}>
            <Text
              style={{
                fontFamily: typography.fontFamilyMedium,
                fontSize: 16,
                color: colors.textPrimary,
              }}
            >
              {"<"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text
          style={{
            fontFamily: typography.fontFamilySemibold,
            fontSize: 18,
            color: colors.textPrimary,
          }}
        >
          {title}
        </Text>
      </View>
      <View
        style={{
          minWidth: 40,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {rightIcon}
      </View>
    </View>
  );
};

export default AppHeader;

