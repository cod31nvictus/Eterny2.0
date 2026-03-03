// localhost:4000 works for both web and Android emulator.
// For Android, adb reverse tcp:4000 tcp:4000 tunnels localhost:4000
// on the emulator through to localhost:4000 on the host machine.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";

