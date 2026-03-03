import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import OtpRequestScreen from "../screens/auth/OtpRequestScreen";
import OtpVerifyScreen from "../screens/auth/OtpVerifyScreen";
import ThreadsScreen from "../screens/chat/ThreadsScreen";
import ChatThreadScreen from "../screens/chat/ChatThreadScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import { View, Text } from "react-native";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OtpRequest" component={OtpRequestScreen} />
          <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Threads" component={ThreadsScreen} />
          <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;



