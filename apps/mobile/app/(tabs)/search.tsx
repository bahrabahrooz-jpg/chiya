import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Keyboard, type TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { X, LayoutList, Map as MapIcon, MapPin, Clock, Search as SearchIcon, ChevronDown } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { HighlightText } from "@/components/ui";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import { PropertyMap } from "@/components/home/PropertyMap";
import { FilterDrawer } from "@/components/home/FilterDrawer";
import { SortSheet } from "@/components/home/SortSheet";
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
  cityLabel,
  allAreas,
  allProjects,
  sortShortLabel,
  type Filters,
} from "@/components/home/data";
import { priceRangeLabel } from "@/components/home/PriceRange";
import { areaRangeLabel } from "@/components/home/AreaRange";
import { propertySearchHistory } from "@/lib/search-history";

export default function SearchScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [deal, setDeal] = useState("all");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sort, setSort] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  // Deep-link params from the Home screen (Buy/Rent, a property type, sort,
  // open-filters, or focus). A `ts` nonce makes each tap apply even when the
  // tab is already mounted and the same option is chosen again.
  const params = useLocalSearchParams<{ deal?: string; type?: string; sort?: string; openFilters?: string; focus?: string; ts?: string }>();
  const lastTs = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!params.ts || params.ts === lastTs.current) return;
    lastTs.current = params.ts;
    if (params.deal) setDeal(params.deal);
    if (params.type) setFilters((f) => ({ ...f, types: [params.type as string] }));
    if (params.sort) setSort(params.sort === "default" ? "" : params.sort);
    if (params.openFilters === "1") setDrawerOpen(true);
    if (params.focus === "1") requestAnimationFrame(() => inputRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.ts]);

  const results = useMemo(() => searchListings({ query, deal, filters, sort }), [query, deal, filters, sort]);
  // A non-empty sort is a custom (non-Default) choice — the pill reflects it.
  const sorted = sort !== "";
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
    chips.push({ key: `city-${c}`, label: cityLabel(c), onRemove: () => setFilters((f) => ({ ...f, cities: f.cities.filter((x) => x !== c) })) }),
  );
  filters.areas.forEach((a) =>
    chips.push({ key: `area-${a}`, label: labelFor(allAreas, a), onRemove: () => setFilters((f) => ({ ...f, areas: f.areas.filter((x) => x !== a) })) }),
  );
  filters.projects.forEach((p) =>
    chips.push({ key: `project-${p}`, label: labelFor(allProjects, p), onRemove: () => setFilters((f) => ({ ...f, projects: f.projects.filter((x) => x !== p) })) }),
  );
  filters.types.forEach((t) =>
    chips.push({ key: `type-${t}`, label: labelFor(propertyTypes, t), onRemove: () => setFilters((f) => ({ ...f, types: f.types.filter((x) => x !== t) })) }),
  );
  if (filters.price)
    chips.push({ key: "price", label: priceRangeLabel(filters.price), onRemove: () => setFilters((f) => ({ ...f, price: null })) });
  if (filters.size)
    chips.push({ key: "size", label: areaRangeLabel(filters.size), onRemove: () => setFilters((f) => ({ ...f, size: null })) });
  if (filters.beds)
    chips.push({ key: "beds", label: filters.beds === "0" ? t("search.studio") : t("search.bedsSuffix", { label: labelFor(bedOpts, filters.beds) }), onRemove: () => setFilters((f) => ({ ...f, beds: "" })) });
  if (filters.baths)
    chips.push({ key: "baths", label: t("search.bathsSuffix", { label: labelFor(bathOpts, filters.baths) }), onRemove: () => setFilters((f) => ({ ...f, baths: "" })) });
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
          inputRef={inputRef}
        />
      </View>
      <Pressable
        onPress={() => setView(view === "list" ? "map" : "list")}
        style={[styles.viewBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault, borderRadius: radius.control }]}
        accessibilityRole="button"
        accessibilityLabel={view === "list" ? t("search.showMap") : t("search.showList")}
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
        {t("search.title")}
      </Text>
      {searchRow}
    </>
  );

  const suggestionsPanel = (
    <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.suggScroll}>
      {query.trim().length > 0 ? (
        places.length > 0 ? (
          <>
            <Text style={[type.label, styles.suggHead, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>{t("search.locations")}</Text>
            {places.map((p) => (
              <Pressable key={p} onPress={() => pickSuggestion(p)} style={({ pressed }) => [styles.suggRow, pressed && { backgroundColor: colors.surfaceSunken }]}>
                <MapPin size={18} color={colors.textTertiary} strokeWidth={2} />
                <HighlightText text={p} query={query} numberOfLines={1} style={[type.body, { color: colors.textSecondary, flex: 1 }]} />
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.suggEmpty}>
            <Text style={[type.body, { color: colors.textSecondary }]}>{t("search.noLocations", { query: query.trim() })}</Text>
          </View>
        )
      ) : history.length > 0 ? (
        <>
          <View style={styles.suggHeadRow}>
            <Text style={[type.label, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>{t("search.recentSearches")}</Text>
            <Pressable onPress={propertySearchHistory.clear} hitSlop={8}>
              <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>{t("search.clear")}</Text>
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
            {t("search.hint")}
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
                  <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>{t("search.clearAll")}</Text>
                </Pressable>
              </ScrollView>
            ) : null}

            <View style={[styles.pad, styles.resultsRow]}>
              <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansMedium }]}>
                {t(results.length === 1 ? "search.resultOne" : "search.resultOther", { count: results.length })}
              </Text>
              <Pressable
                onPress={() => setSortOpen(true)}
                style={[
                  styles.sortBtn,
                  {
                    borderRadius: radius.pill,
                    borderColor: sorted ? colors.brandForeground : colors.borderDefault,
                    backgroundColor: sorted ? colors.brandSubtle : colors.surfaceCard,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("sort.title")}
              >
                <Text
                  style={[
                    type.bodySm,
                    {
                      color: sorted ? colors.brandForeground : colors.textSecondary,
                      fontFamily: sorted ? fontFamily.sansSemibold : fontFamily.sansMedium,
                    },
                  ]}
                >
                  {sorted ? sortShortLabel(sort) : t("sort.label")}
                </Text>
                <ChevronDown size={15} color={sorted ? colors.brandForeground : colors.textTertiary} strokeWidth={2} />
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
                  {t("search.noHomesTitle")}
                </Text>
                <Text style={[type.body, { color: colors.textSecondary, textAlign: "center", marginTop: 6 }]}>
                  {t("search.noHomesBody")}
                </Text>
                {chips.length > 0 ? (
                  <Pressable onPress={clearAll} style={[styles.clearBtn, { borderColor: colors.borderDefault, borderRadius: radius.control }]}>
                    <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("search.clearFilters")}</Text>
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

      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} />
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
  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 4 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 5, height: 34, paddingHorizontal: 12, borderWidth: 1 },
  resultItem: { marginTop: 14 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  clearBtn: { marginTop: 20, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
});
