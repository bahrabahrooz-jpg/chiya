import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, StyleSheet, Platform, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Lock, Check } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button, TextField } from "@/components/ui";
import { ScreenHeader } from "@/components/account/ScreenHeader";

// Live requirements for the new password — same set as the reset flow.
const CHECKS: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "At least one uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "At least one lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "At least one number", test: (v) => /\d/.test(v) },
  { label: "At least one special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];
const STRENGTH_LABELS = ["Not determined", "Weak", "Fair", "Good", "Strong"];

/** Top success toast — same pattern as the edit-profile screen. */
function Toast({ message, onHide }: { message: string; onHide: () => void }) {
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
    }, 1600);
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
      <View style={[styles.toastDot, { backgroundColor: colors.success }]} />
      <Text style={[type.bodySm, { color: colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

function StrengthMeter({ level }: { level: number }) {
  const { colors, type } = useTheme();
  const color = level <= 1 ? colors.error : level === 2 ? colors.brandAccent : colors.brandForeground;
  return (
    <View style={{ marginTop: 6, gap: 6 }}>
      <View style={styles.segRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < level ? color : colors.borderSubtle }]} />
        ))}
      </View>
      <Text style={[type.caption, styles.strengthLabel, { color: level === 0 ? colors.textTertiary : color }]}>
        {STRENGTH_LABELS[level]}
      </Text>
    </View>
  );
}

function Requirements({ pw }: { pw: string }) {
  const { colors, type } = useTheme();
  return (
    <View style={{ marginTop: 20, gap: 8 }}>
      {CHECKS.map((c) => {
        const met = c.test(pw);
        return (
          <View key={c.label} style={styles.reqRow}>
            <View
              style={[
                styles.reqTick,
                met ? { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary } : { borderColor: colors.borderStrong },
              ]}
            >
              {met ? <Check size={10} color={colors.textOnBrand} strokeWidth={3} /> : null}
            </View>
            <Text style={[type.bodySm, { color: met ? colors.textSecondary : colors.textTertiary }]}>{c.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const passed = CHECKS.filter((c) => c.test(pw)).length;
  const level = pw.length === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
  const allMet = passed === CHECKS.length;
  const canSubmit = current.length > 0 && allMet && confirm === pw && pw !== current;

  const submit = () => {
    if (!canSubmit) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setToast("Password updated");
      setTimeout(() => router.back(), 700);
    }, 620);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title="Change password" />
      {toast ? <Toast message={toast} onHide={() => setToast(null)} /> : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            label="Current password"
            value={current}
            onChangeText={setCurrent}
            icon={Lock}
            placeholder="••••••••"
            secure
            autoComplete="password"
            textContentType="password"
          />

          <View style={{ marginTop: space[4] }}>
            <TextField
              label="New password"
              value={pw}
              onChangeText={setPw}
              icon={Lock}
              placeholder="••••••••"
              secure
              hideError
              autoComplete="password-new"
              textContentType="newPassword"
            />
            <StrengthMeter level={level} />
          </View>

          <View style={{ marginTop: space[4] }}>
            <TextField
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              icon={Lock}
              placeholder="••••••••"
              secure
              hideError
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <Requirements pw={pw} />
          </View>
        </ScrollView>

        <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button title={busy ? "Updating…" : "Update password"} onPress={submit} loading={busy} disabled={!canSubmit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  foot: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  segRow: { flexDirection: "row", gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { alignSelf: "flex-end" },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqTick: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    zIndex: 10,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
});
