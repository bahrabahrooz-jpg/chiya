import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Mail, Lock, ArrowLeft, Check, CircleCheck, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation, type TKey } from "@/lib/i18n";
import { rtlFlip } from "@/lib/rtl";
import { Button, TextField } from "@/components/ui";

const emailish = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Live requirements for a new password — same set as the admin reset flow.
const CHECKS: { key: TKey; test: (v: string) => boolean }[] = [
  { key: "auth.forgot.check8", test: (v) => v.length >= 8 },
  { key: "auth.forgot.checkUpper", test: (v) => /[A-Z]/.test(v) },
  { key: "auth.forgot.checkLower", test: (v) => /[a-z]/.test(v) },
  { key: "auth.forgot.checkNumber", test: (v) => /\d/.test(v) },
  { key: "auth.forgot.checkSpecial", test: (v) => /[^A-Za-z0-9]/.test(v) },
];
const STRENGTH_KEYS: TKey[] = [
  "auth.forgot.strengthNone",
  "auth.forgot.strengthWeak",
  "auth.forgot.strengthFair",
  "auth.forgot.strengthGood",
  "auth.forgot.strengthStrong",
];

// How long the user must wait before requesting another reset link.
const RESEND_SECONDS = 30;
const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

type Step = "email" | "sent" | "reset" | "done";

/** Circular badge for the confirmation states. */
function Badge({ icon: Icon }: { icon: LucideIcon }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.brandSubtle }]}>
      <Icon size={26} color={colors.brandForeground} strokeWidth={2} />
    </View>
  );
}

function StrengthMeter({ level }: { level: number }) {
  const { colors, type, space } = useTheme();
  const { t } = useTranslation();
  const color =
    level <= 1 ? colors.error : level === 2 ? colors.brandAccent : colors.brandForeground;
  return (
    <View style={{ marginTop: 6, gap: 6 }}>
      <View style={styles.segRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.seg, { backgroundColor: i < level ? color : colors.borderSubtle }]}
          />
        ))}
      </View>
      <Text style={[type.caption, styles.strengthLabel, { color: level === 0 ? colors.textTertiary : color }]}>
        {t(STRENGTH_KEYS[level])}
      </Text>
    </View>
  );
}

function Requirements({ pw }: { pw: string }) {
  const { colors, type, space } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: 20, gap: 8 }}>
      {CHECKS.map((c) => {
        const met = c.test(pw);
        return (
          <View key={c.key} style={styles.reqRow}>
            <View
              style={[
                styles.reqTick,
                met
                  ? { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }
                  : { borderColor: colors.borderStrong },
              ]}
            >
              {met ? <Check size={10} color={colors.textOnBrand} strokeWidth={3} /> : null}
            </View>
            <Text style={[type.bodySm, { color: met ? colors.textSecondary : colors.textTertiary }]}>
              {t(c.key)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const { colors, type, space } = useTheme();
  const { t, isRTL } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const results = CHECKS.map((c) => c.test(pw));
  const passed = results.filter(Boolean).length;
  const level = pw.length === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
  const allMet = passed === CHECKS.length;

  const goLogin = () => (router.canGoBack() ? router.back() : router.replace("/login"));

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = () => {
    if (cooldown > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // A real endpoint would re-issue and email a fresh reset link here.
    setCooldown(RESEND_SECONDS);
  };

  const sendReset = () => {
    if (!emailish(email.trim())) {
      setEmailErr(t("auth.forgot.errEmail"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setStep("sent");
    }, 620);
  };

  const updatePw = () => {
    // Button is only enabled once the rules pass and the two entries match.
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStep("done");
    }, 620);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {step !== "done" ? (
            <Pressable onPress={goLogin} hitSlop={10} style={styles.back} accessibilityLabel={t("auth.forgot.backToLogin")}>
              <ArrowLeft size={22} color={colors.textSecondary} strokeWidth={2} style={rtlFlip(isRTL)} />
            </Pressable>
          ) : null}

          <View style={styles.card}>
            {/* ---------- Step: request reset ---------- */}
            {step === "email" ? (
              <>
                <View style={styles.header}>
                  <Text style={[type.displaySm, styles.title, { color: colors.textPrimary }]}>{t("auth.forgot.resetTitle")}</Text>
                  <Text style={[type.body, styles.subtitle, { color: colors.textSecondary, marginTop: space[2] }]}>
                    {t("auth.forgot.resetSubtitle")}
                  </Text>
                </View>
                <TextField
                  label={t("auth.forgot.email")}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (emailErr) setEmailErr("");
                  }}
                  icon={Mail}
                  placeholder="you@email.com"
                  error={emailErr}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="username"
                  returnKeyType="go"
                  onSubmitEditing={sendReset}
                />
                <View style={{ marginTop: space[4] }}>
                  <Button
                    title={busy ? t("auth.forgot.sending") : t("auth.forgot.send")}
                    onPress={sendReset}
                    loading={busy}
                    disabled={!email.trim()}
                  />
                </View>
              </>
            ) : null}

            {/* ---------- Step: check inbox ---------- */}
            {step === "sent" ? (
              <View style={styles.centered}>
                <Badge icon={Mail} />
                <Text style={[type.displaySm, styles.title, { color: colors.textPrimary, marginTop: space[5] }]}>
                  {t("auth.forgot.checkInboxTitle")}
                </Text>
                <Text style={[type.body, styles.subtitle, { color: colors.textSecondary, marginTop: space[2] }]}>
                  {t("auth.forgot.sentPre")}<Text style={{ color: colors.textPrimary }}>{email || t("auth.forgot.yourEmail")}</Text>{t("auth.forgot.sentPost")}
                </Text>
                <View style={{ alignSelf: "stretch", marginTop: space[6] }}>
                  {/* No real email is sent — "Open email app" stands in for clicking the reset link. */}
                  <Button title={t("auth.forgot.openEmail")} variant="secondary" onPress={() => setStep("reset")} />
                </View>
                <View style={[styles.resendRow, { marginTop: space[5] }]}>
                  <Text style={[type.bodySm, { color: colors.textSecondary }]}>{t("auth.forgot.noEmail")}</Text>
                  {cooldown > 0 ? (
                    <Text style={[type.bodySm, { color: colors.brandHover }]}>
                      {t("auth.forgot.resendIn", { time: fmtCountdown(cooldown) })}
                    </Text>
                  ) : (
                    <Pressable onPress={resend} hitSlop={8}>
                      <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: type.label.fontFamily }]}>
                        {t("auth.forgot.resend")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : null}

            {/* ---------- Step: create new password ---------- */}
            {step === "reset" ? (
              <>
                <View style={styles.header}>
                  <Text style={[type.displaySm, styles.title, { color: colors.textPrimary }]}>{t("auth.forgot.newPwTitle")}</Text>
                  <Text style={[type.body, styles.subtitle, { color: colors.textSecondary, marginTop: space[2] }]}>
                    {t("auth.forgot.newPwSubtitlePre")}
                    <Text style={{ color: colors.textPrimary }}>{email || t("auth.forgot.yourAccount")}</Text>.
                  </Text>
                </View>

                <View>
                  <TextField
                    label={t("auth.forgot.newPassword")}
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
                    label={t("auth.forgot.confirmNewPassword")}
                    value={confirm}
                    onChangeText={setConfirm}
                    icon={Lock}
                    placeholder="••••••••"
                    secure
                    hideError
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={updatePw}
                  />
                  <Requirements pw={pw} />
                </View>

                <View style={{ marginTop: 20 }}>
                  <Button
                    title={busy ? t("auth.forgot.updating") : t("auth.forgot.update")}
                    onPress={updatePw}
                    loading={busy}
                    disabled={!allMet || confirm !== pw}
                  />
                </View>
              </>
            ) : null}

            {/* ---------- Step: done ---------- */}
            {step === "done" ? (
              <View style={styles.centered}>
                <Badge icon={CircleCheck} />
                <Text style={[type.displaySm, styles.title, { color: colors.textPrimary, marginTop: space[5] }]}>
                  {t("auth.forgot.doneTitle")}
                </Text>
                <Text style={[type.body, styles.subtitle, { color: colors.textSecondary, marginTop: space[2] }]}>
                  {t("auth.forgot.doneSubtitle")}
                </Text>
                <View style={{ alignSelf: "stretch", marginTop: space[6] }}>
                  <Button title={t("auth.forgot.login")} onPress={goLogin} />
                </View>
              </View>
            ) : null}
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
  centered: { alignItems: "center" },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", maxWidth: 360, alignSelf: "center" },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  segRow: { flexDirection: "row", gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { alignSelf: "flex-end" },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqTick: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  resendRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center" },
});
