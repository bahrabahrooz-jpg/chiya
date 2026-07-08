import { useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Cormorant_500Medium, Cormorant_600SemiBold } from "@expo-google-fonts/cormorant";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { ThemeProvider, useTheme } from "@/theme";

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cormorant_500Medium,
    Cormorant_600SemiBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  const onReady = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <View style={{ flex: 1 }} onLayout={onReady}>
          {/* Launch flow: Splash (index) → Login. Cross-fade for a polished handoff. */}
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="property/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="agents/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="my-listings/new" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/edit" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/viewings" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/notifications" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/notification-settings" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/language" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/appearance" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/help" options={{ animation: "slide_from_right" }} />
          </Stack>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
