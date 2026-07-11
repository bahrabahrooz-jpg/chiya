import { useCallback, useEffect, useState } from "react";
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
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { ThemeProvider, useTheme } from "@/theme";
import { applyDirection, loadPersistedLocale } from "@/lib/i18n";
import { ConfirmHost } from "@/components/ui";

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
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  // Apply the persisted language's writing direction before the first paint so
  // Arabic launches straight into RTL (forceRTL persists natively across restarts).
  const [dirReady, setDirReady] = useState(false);
  useEffect(() => {
    loadPersistedLocale().then((locale) => {
      applyDirection(locale);
      setDirReady(true);
    });
  }, []);

  const onReady = useCallback(async () => {
    if ((fontsLoaded || fontError) && dirReady) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, dirReady]);

  if ((!fontsLoaded && !fontError) || !dirReady) return null;

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
            <Stack.Screen name="agent-listings/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="my-listings/new" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="saved" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/edit" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/change-password" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/notifications" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/language" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/appearance" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/help" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/contact" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/about" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/privacy" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account/terms" options={{ animation: "slide_from_right" }} />
          </Stack>
          <ConfirmHost />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
