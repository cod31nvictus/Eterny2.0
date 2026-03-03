import { ExpoConfig } from "expo-config";

const config: ExpoConfig = {
  name: "Eterny 2.0",
  slug: "eterny-2-0",
  scheme: "eterny",
  orientation: "portrait",
  userInterfaceStyle: "light",
  primaryColor: "#111827",
  platforms: ["ios", "android", "web"],
  android: {
    package: "com.anonymous.eterny20",
  },
  ios: {
    bundleIdentifier: "com.anonymous.eterny20",
  },
  plugins: ["expo-document-picker"],
};

export default config;

