import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { lightTheme } from "@/theme";
import { BrandMark } from "@/components/ui";

// Splash is intentionally locked to Light Mode (clean white), independent of the
// device theme, so the brand entry always looks the same.
const t = lightTheme;

/** Timing (ms) — total on-screen time lands around ~2.2s. */
const IN_MS = 700;
const HOLD_MS = 1150;
const OUT_MS = 320;

/**
 * SplashScreen — the first screen on launch. Shows only the centered Chiya logo
 * with a subtle fade + scale, holds briefly, then replaces itself with Login so
 * it never sits in the back stack.
 *
 * Future: when auth exists, branch here to a home route if already signed in.
 */
export default function SplashScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const navigated = useRef(false);

  useEffect(() => {
    const goToLogin = () => {
      if (navigated.current) return;
      navigated.current = true;
      router.replace("/login");
    };

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const hold = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: OUT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.04, duration: OUT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(goToLogin);
    }, IN_MS + HOLD_MS);

    return () => clearTimeout(hold);
  }, [opacity, scale, router]);

  return (
    <View style={[styles.root, { backgroundColor: t.colors.surfaceCard }]}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.logo, { opacity, transform: [{ scale }] }]}>
        <BrandMark size={84} color={t.colors.brandMarkStroke} />
        <Text
          style={[
            styles.wordmark,
            { fontFamily: t.fontFamily.display, color: t.colors.brandWordmark },
          ]}
        >
          CHIYA
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    alignItems: "center",
    gap: 18,
  },
  wordmark: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: 5,
  },
});
