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
import { User, Mail, Phone, Lock, ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { rtlFlip } from "@/lib/rtl";
import { Button, TextField } from "@/components/ui";

const emailish = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Top success toast — same pattern as the login screen. */
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
      <View style={[styles.toastDot, { backgroundColor: colors.success }]} />
      <Text style={[type.bodySm, { color: colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

interface Fields {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}
type Errors = Partial<Record<keyof Fields, string>>;

export default function RegisterScreen() {
  const { colors, type, space } = useTheme();
  const { t, isRTL } = useTranslation();
  const router = useRouter();

  const [v, setV] = useState<Fields>({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const set = (k: keyof Fields) => (val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const goLogin = () => (router.canGoBack() ? router.back() : router.replace("/login"));

  const submit = () => {
    const next: Errors = {};
    if (!v.name.trim()) next.name = t("auth.register.errName");
    if (!emailish(v.email.trim())) next.email = t("auth.register.errEmail");
    if (v.phone.replace(/\D/g, "").length < 7) next.phone = t("auth.register.errPhone");
    if (v.password.length < 6) next.password = t("auth.register.errPwShort");
    if (!v.confirm || v.confirm !== v.password) next.confirm = t("auth.register.errConfirm");
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
      setToast(t("auth.register.welcomeToast", { name: v.name.trim().split(" ")[0] }));
    }, 620);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top", "bottom"]}>
      {toast ? <Toast message={toast} onHide={() => setToast(null)} /> : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={goLogin} hitSlop={10} style={styles.back} accessibilityLabel={t("auth.register.backToLogin")}>
            <ArrowLeft size={22} color={colors.textSecondary} strokeWidth={2} style={rtlFlip(isRTL)} />
          </Pressable>

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={[type.displaySm, styles.title, { color: colors.textPrimary }]}>{t("auth.register.title")}</Text>
              <Text style={[type.body, styles.subtitle, { color: colors.textSecondary, marginTop: space[2] }]}>
                {t("auth.register.subtitle")}
              </Text>
            </View>

            <View style={{ gap: space[2] }}>
              <TextField
                label={t("auth.register.name")}
                value={v.name}
                onChangeText={set("name")}
                icon={User}
                placeholder={t("auth.register.namePlaceholder")}
                error={errors.name}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
              <TextField
                label={t("auth.register.email")}
                value={v.email}
                onChangeText={set("email")}
                icon={Mail}
                placeholder={t("auth.register.emailPlaceholder")}
                error={errors.email}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
              <TextField
                label={t("auth.register.phone")}
                value={v.phone}
                onChangeText={set("phone")}
                icon={Phone}
                placeholder={t("auth.register.phonePlaceholder")}
                error={errors.phone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="next"
              />
              <TextField
                label={t("auth.register.password")}
                value={v.password}
                onChangeText={set("password")}
                icon={Lock}
                placeholder={t("auth.register.passwordPlaceholder")}
                error={errors.password}
                secure
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="next"
              />
              <TextField
                label={t("auth.register.confirm")}
                value={v.confirm}
                onChangeText={set("confirm")}
                icon={Lock}
                placeholder={t("auth.register.confirmPlaceholder")}
                error={errors.confirm}
                secure
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <View style={{ marginTop: space[4] }}>
                <Button
                  title={busy ? t("auth.register.submitting") : t("auth.register.submit")}
                  onPress={submit}
                  loading={busy}
                  disabled={!v.name.trim() || !v.email.trim() || !v.phone.trim() || !v.password || !v.confirm}
                />
              </View>
            </View>

            <View style={[styles.switch, { marginTop: space[6] }]}>
              <Text style={[type.bodySm, { color: colors.textSecondary }]}>{t("auth.register.haveAccount")}</Text>
              <Pressable onPress={goLogin} hitSlop={8}>
                <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: type.label.fontFamily }]}>
                  {t("auth.register.signIn")}
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  back: { alignSelf: "flex-start", padding: 8, marginStart: -8, marginBottom: 16 },
  card: { width: "100%", maxWidth: 440, alignSelf: "center" },
  header: { marginBottom: 24 },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", maxWidth: 360, alignSelf: "center" },
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
