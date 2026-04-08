import { Redirect, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "@/context/auth";

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/home" />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Slot />
    </AuthProvider>
  );
}
