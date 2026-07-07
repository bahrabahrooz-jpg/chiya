import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Mail, Lock } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button, TextField, Divider, GoogleIcon, Checkbox } from "@/components/ui";

const emailish = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Lightweight top toast — the app's stand-in for post-action feedback. */
function Toast({ message, tone, onHide }: { message: string; tone: "success" | "info"; onHide: () => void }) {
  const { colors, type, radius, elevation, space } = useTheme();
  const y = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(y, { toValue: -24, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(onHide);
    }, 2200);
    return () => clearTimeout(t);
  }, [y, opacity, onHide]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        elevation.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderSubtle,
          borderRadius: radius.lg,
          paddingVertical: space[3],
          paddingHorizontal: space[4],
          transform: [{ translateY: y }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toastDot, { backgroundColor: tone === "success" ? colors.success : colors.brandAccent }]} />
      <Text style={[type.bodySm, { color: colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const { colors, type, space } = useTheme();
  const router = useRouter();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [errors, setErrors] = useState<{ id?: string; pw?: string }>({});
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "info" } | null>(null);

  const submit = () => {
    const next: { id?: string; pw?: string } = {};
    if (!id.trim()) next.id = "Enter your email";
    else if (!emailish(id.trim())) next.id = "Enter a valid email";
    if (!pw.trim()) next.pw = "Enter your password";
    else if (pw.length < 6) next.pw = "Password must be at least 6 characters";
    setErrors(next);
    if (Object.keys(next).length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/home");
    }, 620);
  };

  const soon = () => setToast({ message: "Available in the next release", tone: "info" });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top", "bottom"]}>
      {toast ? <Toast message={toast.message} tone={toast.tone} onHide={() => setToast(null)} /> : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Brand + heading */}
            <View style={[styles.header, { marginBottom: space[8] }]}>
              <Text style={[type.displaySm, styles.title, { color: colors.textPrimary }]}>
                Welcome back
              </Text>
              <Text style={[type.body, styles.subtitle, { color: colors.textSecondary, marginTop: space[2] }]}>
                Sign in to continue to your account.
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: space[2] }}>
              <TextField
                label="Email"
                value={id}
                onChangeText={(v) => {
                  setId(v);
                  if (errors.id) setErrors((e) => ({ ...e, id: undefined }));
                }}
                icon={Mail}
                placeholder="you@email.com"
                error={errors.id}
                keyboardType={id.includes("@") || !id ? "email-address" : "default"}
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
              />
              <TextField
                label="Password"
                value={pw}
                onChangeText={(v) => {
                  setPw(v);
                  if (errors.pw) setErrors((e) => ({ ...e, pw: undefined }));
                }}
                icon={Lock}
                placeholder="••••••••"
                error={errors.pw}
                secure
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <View style={styles.metaRow}>
                <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
                <Pressable onPress={() => router.push("/forgot-password")} hitSlop={8}>
                  <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: type.label.fontFamily }]}>
                    Forgot password?
                  </Text>
                </Pressable>
              </View>

              <View style={{ marginTop: space[4] }}>
                <Button
                  title={busy ? "Logging in…" : "Log in"}
                  onPress={submit}
                  loading={busy}
                  disabled={!id.trim() || !pw.trim()}
                />
              </View>
            </View>

            {/* Alternate auth */}
            <View style={{ gap: space[5], marginTop: space[6] }}>
              <Divider label="or" />
              <Button title="Continue with Google" variant="social" left={<GoogleIcon />} onPress={soon} />
            </View>

            {/* Switch */}
            <View style={[styles.switch, { marginTop: space[8] }]}>
              <Text style={[type.bodySm, { color: colors.textSecondary }]}>New to Chiya? </Text>
              <Pressable onPress={() => router.push("/register")} hitSlop={8}>
                <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: type.label.fontFamily }]}>
                  Create an account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    // Top-aligned so the heading sits in the upper area (no logo above it now).
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  header: { alignItems: "center" },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", maxWidth: 340 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  switch: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  toast: {
    position: "absolute",
    top: 8,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
});
