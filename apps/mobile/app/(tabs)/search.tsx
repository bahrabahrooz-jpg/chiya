import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpDown, X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { DealChips } from "@/components/home/DealChips";
import { PropertyCard } from "@/components/home/PropertyCard";
import { FilterDrawer } from "@/components/home/FilterDrawer";
import { SortSheet } from "@/components/home/SortSheet";
import {
  emptyFilters,
  countFilters,
  searchListings,
  searchSort,
  labelFor,
  propertyTypes,
  beds as bedOpts,
  baths as bathOpts,
  amenities as amenityOpts,
  type Filters,
} from "@/components/home/data";
import { priceRangeLabel } from "@/components/home/PriceRange";
import { areaRangeLabel } from "@/components/home/AreaRange";

export default function SearchScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const [query, setQuery] = useState("");
  const [deal, setDeal] = useState("all");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState("recommended");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const results = useMemo(() => searchListings({ query, deal, filters, sort }), [query, deal, filters, sort]);

  // Removable active-filter chips (deal is already shown by the chips above).
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.cities.forEach((c) =>
    chips.push({ key: `city-${c}`, label: c, onRemove: () => setFilters((f) => ({ ...f, cities: f.cities.filter((x) => x !== c) })) }),
  );
  filters.types.forEach((t) =>
    chips.push({ key: `type-${t}`, label: labelFor(propertyTypes, t), onRemove: () => setFilters((f) => ({ ...f, types: f.types.filter((x) => x !== t) })) }),
  );
  if (filters.price)
    chips.push({ key: "price", label: priceRangeLabel(filters.price), onRemove: () => setFilters((f) => ({ ...f, price: null })) });
  if (filters.size)
    chips.push({ key: "size", label: areaRangeLabel(filters.size), onRemove: () => setFilters((f) => ({ ...f, size: null })) });
  if (filters.beds)
    chips.push({ key: "beds", label: filters.beds === "0" ? "Studio" : `${labelFor(bedOpts, filters.beds)} Beds`, onRemove: () => setFilters((f) => ({ ...f, beds: "" })) });
  if (filters.baths)
    chips.push({ key: "baths", label: `${labelFor(bathOpts, filters.baths)} Baths`, onRemove: () => setFilters((f) => ({ ...f, baths: "" })) });
  filters.amenities.forEach((a) =>
    chips.push({ key: `amen-${a}`, label: labelFor(amenityOpts, a), onRemove: () => setFilters((f) => ({ ...f, amenities: f.amenities.filter((x) => x !== a) })) }),
  );

  const clearAll = () => {
    setFilters(emptyFilters);
    setDeal("all");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <HomeSearchBar value={query} onChangeText={setQuery} onOpenFilters={() => setDrawerOpen(true)} activeCount={countFilters(filters)} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.chipsRow}>
          <DealChips active={deal} onChange={setDeal} />
        </View>

        {chips.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeRow}>
            {chips.map((c) => (
              <Pressable
                key={c.key}
                onPress={c.onRemove}
                style={[styles.chip, { backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault }]}
              >
                <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{c.label}</Text>
                <X size={14} color={colors.textTertiary} strokeWidth={2.5} />
              </Pressable>
            ))}
            <Pressable onPress={clearAll} style={styles.clearAll} hitSlop={6}>
              <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>Clear all</Text>
            </Pressable>
          </ScrollView>
        ) : null}

        <View style={[styles.pad, styles.resultsHead]}>
          <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansMedium }]}>
            {results.length} result{results.length === 1 ? "" : "s"}
          </Text>
          <Pressable onPress={() => setSortOpen(true)} style={[styles.sortBtn, { borderColor: colors.borderDefault, borderRadius: radius.pill }]}>
            <ArrowUpDown size={15} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{labelFor(searchSort, sort)}</Text>
          </Pressable>
        </View>

        {results.length > 0 ? (
          results.map((p) => (
            <View key={p.id} style={[styles.pad, styles.resultItem]}>
              <PropertyCard property={p} fullWidth />
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold, textAlign: "center" }]}>
              No homes found
            </Text>
            <Text style={[type.body, { color: colors.textSecondary, textAlign: "center", marginTop: 6 }]}>
              Try adjusting your search or filters.
            </Text>
            {chips.length > 0 ? (
              <Pressable onPress={clearAll} style={[styles.clearBtn, { borderColor: colors.borderDefault, borderRadius: radius.control }]}>
                <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>Clear filters</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>

      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} deal={deal} value={filters} onApply={setFilters} />
      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  scroll: { paddingBottom: 40 },
  pad: { paddingHorizontal: 20 },
  chipsRow: { paddingLeft: 20 },
  activeRow: { gap: 8, paddingHorizontal: 20, paddingTop: 14, alignItems: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  clearAll: { paddingHorizontal: 8, paddingVertical: 6 },
  resultsHead: { marginTop: 18, marginBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderWidth: 1 },
  resultItem: { marginTop: 14 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  clearBtn: { marginTop: 20, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
});
