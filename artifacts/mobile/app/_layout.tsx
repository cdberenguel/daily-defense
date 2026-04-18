import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setBaseUrl } from "@workspace/api-client-react";
import { AppProvider } from "@/context/AppContext";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="response" options={{ presentation: "card" }} />
      <Stack.Screen name="chat" options={{ presentation: "card" }} />
      <Stack.Screen name="topic/[id]" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="apologetics" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="faith-companion" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="tactics" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="opponent" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="bible" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="library" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="generator" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="notes" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="achievement/[id]" options={{ presentation: "card", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
