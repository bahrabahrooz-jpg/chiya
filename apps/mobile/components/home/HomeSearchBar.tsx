import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { useTheme } from "@/theme";

/**
 * HomeSearchBar — a tappable search field (jumps to the Search tab) plus a solid
 * filter button that opens the filter drawer. Shows the active-filter count.
 */
export function HomeSearchBar({ onOpenFilters, activeCount = 0 }: { onOpenFilters: () => void; activeCount?: number }) {
  const { colors, type, radius } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.field, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.control }]}
        onPress={() => router.push("/search")}
        accessibilityRole="search"
      >
        <Search size={19} color={colors.textTertiary} strokeWidth={2} />
        <Text style={[type.body, { color: colors.textPlaceholder }]}>Search homes, areas…</Text>
      </Pressable>

      <Pressable
        style={[styles.filter, { backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault, borderRadius: radius.control }]}
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel="Filters"
      >
        <SlidersHorizontal size={20} color={colors.textPrimary} strokeWidth={2} />
        {activeCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.brandPrimary, borderColor: colors.surfacePage }]}>
            <Text style={[styles.badgeTxt, { color: colors.textOnBrand }]}>{activeCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  field: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  filter: { width: 52, height: 52, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
});
