import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";

/** HomeSearchButton — a large, non-interactive search bar for the Home screen.
 *  It never searches here: tapping the field opens the Search tab (auto-focused),
 *  and tapping the filter icon opens the Search tab with the filter sheet open. */
export function HomeSearchButton() {
  const { colors, type, radius, fontFamily } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const go = (extra: Record<string, string>) =>
    router.push({ pathname: "/search", params: { ...extra, ts: String(Date.now()) } });

  return (
    <Pressable
      onPress={() => go({ focus: "1" })}
      style={[styles.field, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.control }]}
      accessibilityRole="search"
      accessibilityLabel={t("home.searchPlaceholder")}
    >
      <Search size={19} color={colors.textTertiary} strokeWidth={2} />
      <Text style={[styles.placeholder, type.body, { color: colors.textPlaceholder, fontFamily: fontFamily.sans }]} numberOfLines={1}>
        {t("home.searchPlaceholder")}
      </Text>

      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      <Pressable onPress={() => go({ openFilters: "1" })} hitSlop={8} style={styles.filter} accessibilityRole="button" accessibilityLabel={t("searchBar.filters")}>
        <SlidersHorizontal size={20} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { height: 56, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  placeholder: { flex: 1 },
  divider: { width: StyleSheet.hairlineWidth, height: 24 },
  filter: { alignItems: "center", justifyContent: "center", paddingLeft: 2 },
});
