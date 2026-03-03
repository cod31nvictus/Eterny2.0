export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  OtpRequest: undefined;
  OtpVerify: { phone: string };
  Threads: undefined;
  ChatThread: { threadId: string; title?: string };
  Profile: undefined;
};

