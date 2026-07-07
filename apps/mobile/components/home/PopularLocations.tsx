import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import { useTheme } from "@/theme";
import { SectionHeader } from "./SectionHeader";
import { locations, type Location } from "./data";

function LocationRow({ location: l }: { location: Location }) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <Pressable
      style={[styles.row, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
      accessibilityRole="button"
    >
      <Image source={{ uri: l.cover }} style={[styles.thumb, { borderRadius: radius.md }]} resizeMode="cover" />
      <View style={styles.body}>
        <Text numberOfLines={1} style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
          {l.name}
        </Text>
        <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansMedium }]}>{l.count}</Text>
        <Text numberOfLines={1} style={[type.caption, { color: colors.textTertiary }]}>{l.subtitle}</Text>
      </View>
      <View style={[styles.arrow, { backgroundColor: colors.surfaceSunken }]}>
        <ArrowUpRight size={18} color={colors.textPrimary} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

/** PopularLocations — "Popular Locations" header + a vertical list of city cards. */
export function PopularLocations() {
  const router = useRouter();
  return (
    <View>
      <View style={styles.head}>
        <SectionHeader title="Popular Locations" onSeeAll={() => router.push("/search")} />
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
