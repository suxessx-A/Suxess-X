import "./global.css";
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
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CoachingProvider } from "@/context/CoachingContext";
import { AccessProvider, useAccess } from "@/context/AccessContext";
import { UserProvider, useUser } from "@/context/UserContext";
import OnboardingScreen from "@/app/onboarding";
import LoginScreen from "@/app/login";
import { initIAP, teardownIAP } from "@/lib/iap";

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="flow" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

// AppGate sequence (v1.2 login-only):
//   1. Wait for AsyncStorage hydration in both contexts.
//   2. No session → LoginScreen (it also handles magic-link deep links).
//   3. Session but no profile → OnboardingScreen (collects industry/level/etc.,
//      email is taken from the logged-in user so step 2 is skipped).
//   4. Session + profile → main app inside CoachingProvider + Stack.
function AppGate() {
  const { isCheckingAccess, sessionToken } = useAccess();
  const { isLoading: userLoading, hasCompletedOnboarding } = useUser();
  if (isCheckingAccess || userLoading) return null;
  if (!sessionToken) return <LoginScreen />;
  if (!hasCompletedOnboarding) return <OnboardingScreen />;
  return (
    <CoachingProvider>
      <RootLayoutNav />
    </CoachingProvider>
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

  // Warm up the StoreKit connection at app root once on mount so the home
  // inactive view's Subscribe button can render the localized price
  // immediately rather than waiting on its own first connect. Both surfaces
  // call initIAP() defensively; the underlying connection is idempotent.
  useEffect(() => {
    // initIAP() warms up the StoreKit connection and, only AFTER initConnection()
    // succeeds, attaches the purchase listeners (see lib/iap.ts). Ordering matters:
    // in v15 the native listener is inert unless attached post-connect.
    void initIAP().catch((err) => {
      console.warn("Root IAP warm-up failed:", err);
    });
    return () => {
      void teardownIAP();
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <UserProvider>
                <AccessProvider>
                  <AppGate />
                </AccessProvider>
              </UserProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
