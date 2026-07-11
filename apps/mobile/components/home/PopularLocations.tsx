import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { rtlFlip } from "@/lib/rtl";
import { SectionHeader } from "./SectionHeader";
import { locations, locationDisplay, type Location } from "./data";

function LocationRow({ location: l }: { location: Location }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { isRTL } = useTranslation();
  const d = locationDisplay(l);
  return (
    <Pressable
      style={[styles.row, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
      accessibilityRole="button"
    >
      <Image source={{ uri: l.cover }} style={[styles.thumb, { borderRadius: radius.md }]} resizeMode="cover" />
      <View style={styles.body}>
        <Text numberOfLines={1} style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
          {d.name}
        </Text>
        <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansMedium }]}>{d.count}</Text>
        <Text numberOfLines={1} style={[type.caption, { color: colors.textTertiary }]}>{d.subtitle}</Text>
      </View>
      <View style={[styles.arrow, { backgroundColor: colors.surfaceSunken }]}>
        <ArrowUpRight size={18} color={colors.textPrimary} strokeWidth={2} style={rtlFlip(isRTL)} />
      </View>
    </Pressable>
  );
}

/** PopularLocations — "Popular Locations" header + a vertical list of city cards. */
export function PopularLocations() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.head}>
        <SectionHeader title={t("home.popularLocations")} onSeeAll={() => router.push("/search")} />
      </View>
      <View style={styles.list}>
        {locations.map((l) => (
          <LocationRow key={l.id} location={l} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, marginBottom: 14 },
  list: { paddingHorizontal: 20, gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderWidth: 1,
  },
  thumb: { width: 62, height: 62, backgroundColor: "#e9edf0" },
  body: { flex: 1, gap: 2 },
  arrow: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
