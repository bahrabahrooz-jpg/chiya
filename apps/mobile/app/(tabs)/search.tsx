import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, LayoutList, Map as MapIcon, MapPin, Clock, Search as SearchIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { HighlightText } from "@/components/ui";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import { PropertyMap } from "@/components/home/PropertyMap";
import { FilterDrawer } from "@/components/home/FilterDrawer";
import {
  emptyFilters,
  countFilters,
  searchListings,
  suggestPlaces,
  labelFor,
  dealCategories,
  propertyTypes,
  beds as bedOpts,
  baths as bathOpts,
  amenities as amenityOpts,
  type Filters,
} from "@/components/home/data";
import { priceRangeLabel } from "@/components/home/PriceRange";
import { areaRangeLabel } from "@/components/home/AreaRange";
import { propertySearchHistory } from "@/lib/search-history";

export default function SearchScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const [query, setQuery] = useState("");
  const [deal, setDeal] = useState("all");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [searchFocused, setSearchFocused] = useState(false);
  const sort = "recommended";

  const results = useMemo(() => searchListings({ query, deal, filters, sort }), [query, deal, filters]);
  const history = propertySearchHistory.useHistory();
  const places = useMemo(() => suggestPlaces(query), [query]);

  const pickSuggestion = (q: string) => {
    setQuery(q);
    propertySearchHistory.add(q);
    Keyboard.dismiss();
  };

  // Removable active-filter chips, including the selected listing type (deal).
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (deal !== "all") chips.push({ key: "deal", label: labelFor(dealCategories, deal), onRemove: () => setDeal("all") });
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

  const searchRow = (
    <View style={styles.searchRow}>
      <View style={styles.flex}>
        <HomeSearchBar
          value={query}
          onChangeText={setQuery}
          onOpenFilters={() => setDrawerOpen(true)}
          activeCount={countFilters(filters)}
          onFocusChange={setSearchFocused}
        />
      </View>
      <Pressable
        onPress={() => setView(view === "list" ? "map" : "list")}
        style={[styles.viewBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault, borderRadius: radius.control }]}
        accessibilityRole="button"
        accessibilityLabel={view === "list" ? "Show map" : "Show list"}
      >
        {view === "list" ? (
          <MapIcon size={20} color={colors.textPrimary} strokeWidth={2} />
        ) : (
          <LayoutList size={20} color={colors.textPrimary} strokeWidth={2} />
        )}
      </Pressable>
    </View>
  );

  const headerBlock = (
    <>
      {/* Hidden (not removed) on the map so the search bar keeps the same position. */}
      <Text
        style={[type.displaySm, styles.title, { color: colors.textPrimary, fontSize: 26 }, (view === "map" || searchFocused) && styles.hidden]}
        accessibilityElementsHidden={view === "map" || searchFocused}
      >
        Search properties
      </Text>
      {searchRow}
    </>
  );

  const suggestionsPanel = (
    <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.suggScroll}>
      {query.trim().length > 0 ? (
        places.length > 0 ? (
          <>
            <Text style={[type.label, styles.suggHead, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>LOCATIONS</Text>
            {places.map((p) => (
              <Pressable key={p} onPress={() => pickSuggestion(p)} style={({ pressed }) => [styles.suggRow, pressed && { backgroundColor: colors.surfaceSunken }]}>
                <MapPin size={18} color={colors.textTertiary} strokeWidth={2} />
                <HighlightText text={p} query={query} numberOfLines={1} style={[type.body, { color: colors.textSecondary, flex: 1 }]} />
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.suggEmpty}>
            <Text style={[type.body, { color: colors.textSecondary }]}>No locations match “{query.trim()}”.</Text>
          </View>
        )
      ) : history.length > 0 ? (
        <>
          <View style={styles.suggHeadRow}>
            <Text style={[type.label, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>RECENT SEARCHES</Text>
            <Pressable onPress={propertySearchHistory.clear} hitSlop={8}>
              <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>Clear</Text>
            </Pressable>
          </View>
          {history.map((h) => (
            <Pressable key={h} onPress={() => pickSuggestion(h)} style={({ pressed }) => [styles.suggRow, pressed && { backgroundColor: colors.surfaceSunken }]}>
              <Clock size={18} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.body, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{h}</Text>
              <Pressable onPress={() => propertySearchHistory.remove(h)} hitSlop={8}>
                <X size={16} color={colors.textTertiary} strokeWidth={2} />
              </Pressable>
            </Pressable>
          ))}
        </>
      ) : (
        <View style={styles.suggEmpty}>
          <SearchIcon size={26} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[type.body, { color: colors.textSecondary, textAlign: "center", marginTop: 10 }]}>
            Search by city or area — Erbil, Ankawa, Sulaymaniyah…
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      {searchFocused ? (
        <>
          <View style={styles.header}>{headerBlock}</View>
          {suggestionsPanel}
        </>
      ) : view === "map" ? (
        <View style={styles.flex}>
          <PropertyMap listings={results} />
          <View style={[styles.header, styles.mapOverlay]}>{headerBlock}</View>
        </View>
      ) : (
        <>
          <View style={styles.header}>{headerBlock}</View>

          <ScrollView
            style={styles.flex}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
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

            <Text style={[styles.pad, styles.resultsCount, type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansMedium }]}>
              {results.length} result{results.length === 1 ? "" : "s"}
            </Text>

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
        </>
      )}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        deal={deal}
        value={filters}
        onApply={(f, d) => {
          setFilters(f);
          setDeal(d);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { marginBottom: 14 },
  hidden: { opacity: 0 },
  scroll: { paddingTop: 6, paddingBottom: 40 },
  pad: { paddingHorizontal: 20 },
  activeRow: { gap: 8, paddingHorizontal: 20, alignItems: "center" },
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
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  suggScroll: { paddingTop: 6, paddingBottom: 40 },
  suggHead: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, letterSpacing: 0.6 },
  suggHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  suggRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 13 },
  suggEmpty: { alignItems: "center", justifyContent: "center", paddingTop: 48, paddingHorizontal: 40 },
  mapOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  viewBtn: { width: 52, height: 52, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  resultsCount: { marginTop: 18, marginBottom: 4 },
  resultItem: { marginTop: 14 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  clearBtn: { marginTop: 20, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
});
