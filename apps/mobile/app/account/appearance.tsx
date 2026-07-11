import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sun, Moon, SmartphoneNfc, Check, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation, type TKey } from "@/lib/i18n";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { useThemeMode, setThemeMode, THEME_MODES, type ThemeMode } from "@/lib/theme-mode";

const ICONS: Record<ThemeMode, LucideIcon> = { light: Sun, dark: Moon, system: SmartphoneNfc };
const SUB_KEY: Record<ThemeMode, TKey> = {
  light: "appearance.lightSub",
  dark: "appearance.darkSub",
  system: "appearance.systemSub",
};

export default function AppearanceScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const mode = useThemeMode();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={t("appearance.title")} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[type.bodySm, styles.intro, { color: colors.textSecondary }]}>
          {t("appearance.intro")}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
          {THEME_MODES.map((m, i) => {
            const on = mode === m.value;
            const Icon = ICONS[m.value];
            return (
              <Pressable
                key={m.value}
                onPress={() => setThemeMode(m.value)}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
                  pressed && { backgroundColor: colors.surfaceSunken },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <View style={[styles.iconTile, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder, borderRadius: radius.md }]}>
                  <Icon size={19} color={colors.brandForeground} strokeWidth={2} />
                </View>
                <View style={styles.labelWrap}>
                  <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{t(`appearance.${m.value}`)}</Text>
                  <Text style={[type.bodySm, { color: colors.textTertiary }]}>{t(SUB_KEY[m.value])}</Text>
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
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  iconTile: { width: 36, height: 36, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  labelWrap: { flex: 1, gap: 2 },
});
