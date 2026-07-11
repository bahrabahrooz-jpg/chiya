import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { useTheme } from "@/theme";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { useProfile, updateProfile, LANGUAGES, type Language } from "@/lib/profile";
import {
  useTranslation,
  localeFor,
  applyDirection,
  needsDirectionReload,
  reloadApp,
  type TKey,
} from "@/lib/i18n";
import { setActiveLocale } from "@/lib/locale-state";
import { confirm } from "@/lib/confirm";

/** Secondary endonym under each option, translated to the active UI language. */
const NAME_KEY: Record<Language, TKey> = {
  en: "language.nameEn",
  ku: "language.nameKu",
  ar: "language.nameAr",
};

export default function LanguageScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const profile = useProfile();

  const choose = (value: Language) => {
    if (value === profile.language) return;
    const locale = localeFor(value);
    // Update the module-level locale first so non-hook label helpers
    // (optLabel/cityLabel/…) resolve the new language on the re-render that
    // updateProfile triggers — all strings switch immediately, no restart.
    setActiveLocale(locale);
    updateProfile({ language: value });
    // Switching across the LTR⇄RTL boundary needs a native reload to re-lay-out.
    if (needsDirectionReload(locale)) {
      applyDirection(locale);
      confirm({
        title: t("language.restartTitle"),
        message: t("language.restartMessage"),
        confirmLabel: t("language.restartConfirm"),
        onConfirm: () => {
          reloadApp();
        },
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={t("language.title")} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[type.bodySm, styles.intro, { color: colors.textSecondary }]}>
          {t("language.intro")}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
          {LANGUAGES.map((l, i) => {
            const on = profile.language === l.value;
            const secondary = t(NAME_KEY[l.value]);
            return (
              <Pressable
                key={l.value}
                onPress={() => choose(l.value)}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
                  pressed && { backgroundColor: colors.surfaceSunken },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <View style={styles.labelWrap}>
                  <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{l.native}</Text>
                  {l.native !== secondary ? (
                    <Text style={[type.bodySm, { color: colors.textTertiary }]}>{secondary}</Text>
                  ) : null}
                </View>
                {on ? <Check size={20} color={colors.brandForeground} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  intro: { marginBottom: 2 },
  card: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15 },
  labelWrap: { flex: 1, gap: 2 },
});
