import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { House, KeyRound, Plus, ChevronRight, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { rtlFlip } from "@/lib/rtl";

/** QuickActions — the two browse intents (Buy / Rent) as a side-by-side pair,
 *  plus a distinct, brand-tinted "List Property" call-to-action below (the
 *  contribution action, so it's set apart from the browsing ones). */
export function QuickActions() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t, isRTL } = useTranslation();
  const router = useRouter();

  const goSearch = (extra: Record<string, string>) =>
    router.push({ pathname: "/search", params: { ...extra, ts: String(Date.now()) } });

  const browse: { key: string; Icon: LucideIcon; title: string; desc: string; onPress: () => void }[] = [
    { key: "buy", Icon: House, title: t("home.buy"), desc: t("home.buyDesc"), onPress: () => goSearch({ deal: "buy" }) },
    { key: "rent", Icon: KeyRound, title: t("home.rent"), desc: t("home.rentDesc"), onPress: () => goSearch({ deal: "rent" }) },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {browse.map((a) => (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.tile, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder, borderRadius: radius.md }]}>
              <a.Icon size={20} color={colors.brandForeground} strokeWidth={2} />
            </View>
            <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{a.title}</Text>
            <Text style={[type.caption, { color: colors.textTertiary }]} numberOfLines={1}>{a.desc}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push("/my-listings")}
        style={({ pressed }) => [
          styles.listCard,
          { backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card },
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
        accessibilityRole="button"
      >
        <View style={[styles.listTile, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder, borderRadius: radius.md }]}>
          <Plus size={22} color={colors.brandForeground} strokeWidth={2.5} />
        </View>
        <View style={styles.listBody}>
          <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("home.listProperty")}</Text>
          <Text style={[type.bodySm, { color: colors.textSecondary }]} numberOfLines={1}>{t("home.listPropertyDesc")}</Text>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} style={rtlFlip(isRTL)} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  card: { flex: 1, borderWidth: 1, padding: 14, gap: 8, alignItems: "flex-start" },
  tile: { width: 40, height: 40, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  listCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  listTile: { width: 44, height: 44, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  listBody: { flex: 1, gap: 2 },
});
