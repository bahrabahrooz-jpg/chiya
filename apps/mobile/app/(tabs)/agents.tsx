import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Users, Clock, Search as SearchIcon, ChevronDown } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { HighlightText } from "@/components/ui";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { AgentFilterDrawer } from "@/components/home/AgentFilterDrawer";
import { AgentCard } from "@/components/home/AgentCard";
import { SortSheet } from "@/components/home/SortSheet";
import {
  filterAgents,
  suggestAgents,
  agentExperience,
  labelFor,
  countAgentFilters,
  emptyAgentFilters,
  cityLabel,
  agentLanguageLabel,
  agentSort,
  agentSortShortLabel,
  type AgentFilters,
} from "@/components/home/data";
import { agentSearchHistory } from "@/lib/search-history";

export default function AgentsScreen() {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AgentFilters>(emptyAgentFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [sort, setSort] = useState("");
  const [sortOpen, setSortOpen] = useState(false);

  const results = useMemo(() => filterAgents({ query, filters, sort }), [query, filters, sort]);
  const sorted = sort !== "";
  const history = agentSearchHistory.useHistory();
  const matches = useMemo(() => suggestAgents(query), [query]);

  const pickSuggestion = (q: string) => {
    setQuery(q);
    agentSearchHistory.add(q);
    Keyboard.dismiss();
  };

  // Removable active-filter chips.
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.cities.forEach((c) =>
    chips.push({ key: `city-${c}`, label: cityLabel(c), onRemove: () => setFilters((f) => ({ ...f, cities: f.cities.filter((x) => x !== c) })) }),
  );
  filters.languages.forEach((l) =>
    chips.push({ key: `lang-${l}`, label: agentLanguageLabel(l), onRemove: () => setFilters((f) => ({ ...f, languages: f.languages.filter((x) => x !== l) })) }),
  );
  if (filters.experience)
    chips.push({ key: "exp", label: labelFor(agentExperience, filters.experience), onRemove: () => setFilters((f) => ({ ...f, experience: "" })) });

  const suggestionsPanel = (
    <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.suggScroll}>
      {query.trim().length > 0 ? (
        matches.length > 0 ? (
          <>
            <Text style={[type.label, styles.suggHead, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>{t("agents.head")}</Text>
            {matches.map((m) => (
              <Pressable key={m} onPress={() => pickSuggestion(m)} style={({ pressed }) => [styles.suggRow, pressed && { backgroundColor: colors.surfaceSunken }]}>
                <Users size={18} color={colors.textTertiary} strokeWidth={2} />
                <HighlightText text={m} query={query} numberOfLines={1} style={[type.body, { color: colors.textSecondary, flex: 1 }]} />
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.suggEmpty}>
            <Text style={[type.body, { color: colors.textSecondary }]}>{t("agents.noMatch", { query: query.trim() })}</Text>
          </View>
        )
      ) : history.length > 0 ? (
        <>
          <View style={styles.suggHeadRow}>
            <Text style={[type.label, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>{t("search.recentSearches")}</Text>
            <Pressable onPress={agentSearchHistory.clear} hitSlop={8}>
              <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>{t("search.clear")}</Text>
            </Pressable>
          </View>
          {history.map((h) => (
            <Pressable key={h} onPress={() => pickSuggestion(h)} style={({ pressed }) => [styles.suggRow, pressed && { backgroundColor: colors.surfaceSunken }]}>
              <Clock size={18} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.body, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{h}</Text>
              <Pressable onPress={() => agentSearchHistory.remove(h)} hitSlop={8}>
                <X size={16} color={colors.textTertiary} strokeWidth={2} />
              </Pressable>
            </Pressable>
          ))}
        </>
      ) : (
        <View style={styles.suggEmpty}>
          <SearchIcon size={26} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[type.body, { color: colors.textSecondary, textAlign: "center", marginTop: 10 }]}>
            {t("agents.hint")}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Text
          style={[type.displaySm, { color: colors.textPrimary, fontSize: 26 }, searchFocused && styles.hidden]}
          accessibilityElementsHidden={searchFocused}
        >
          {t("agents.title")}
        </Text>
        <HomeSearchBar
          value={query}
          onChangeText={setQuery}
          onOpenFilters={() => setDrawerOpen(true)}
          activeCount={countAgentFilters(filters)}
          placeholder={t("agents.searchPlaceholder")}
          onFocusChange={setSearchFocused}
        />
      </View>

      {searchFocused ? (
        suggestionsPanel
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {chips.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeRow}>
              {chips.map((c) => (
                <Pressable key={c.key} onPress={c.onRemove} style={[styles.aChip, { backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault }]}>
                  <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{c.label}</Text>
                  <X size={14} color={colors.textTertiary} strokeWidth={2.5} />
                </Pressable>
              ))}
              <Pressable onPress={() => setFilters(emptyAgentFilters)} style={styles.clearAll} hitSlop={6}>
                <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>{t("search.clearAll")}</Text>
              </Pressable>
            </ScrollView>
          ) : null}

          <View style={[styles.pad, styles.resultsHead]}>
            <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansMedium }]}>
              {t(results.length === 1 ? "search.resultOne" : "search.resultOther", { count: results.length })}
            </Text>
            <Pressable
              onPress={() => setSortOpen(true)}
              style={[
                styles.sortBtn,
                {
                  borderRadius: 999,
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
                {sorted ? agentSortShortLabel(sort) : t("sort.label")}
              </Text>
              <ChevronDown size={15} color={sorted ? colors.brandForeground : colors.textTertiary} strokeWidth={2} />
            </Pressable>
          </View>

          {results.length > 0 ? (
            <View style={styles.grid}>
              {results.map((a) => (
                <View key={a.id} style={styles.gridItem}>
                  <AgentCard agent={a} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("agents.noAgentsTitle")}</Text>
              <Text style={[type.body, styles.emptyText, { color: colors.textSecondary }]}>{t("search.noHomesBody")}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <AgentFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} value={filters} onApply={setFilters} />

      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} options={agentSort} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 14, paddingBottom: 12 },
  scroll: { paddingTop: 6, paddingBottom: 40 },
  activeRow: { gap: 8, paddingHorizontal: 20, alignItems: "center" },
  aChip: { flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 12, borderWidth: 1, borderRadius: 999 },
  clearAll: { height: 34, justifyContent: "center", paddingHorizontal: 4 },
  pad: { paddingHorizontal: 20 },
  resultsHead: { marginTop: 18, marginBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 5, height: 34, paddingHorizontal: 12, borderWidth: 1 },
  grid: { paddingHorizontal: 20, gap: 14, marginTop: 12 },
  gridItem: { width: "100%" },
  empty: { alignItems: "center", justifyContent: "center", paddingHorizontal: 40, paddingTop: 60 },
  emptyText: { textAlign: "center", marginTop: 6 },
  hidden: { opacity: 0 },
  suggScroll: { paddingTop: 6, paddingBottom: 40 },
  suggHead: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, letterSpacing: 0.6 },
  suggHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  suggRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 13 },
  suggEmpty: { alignItems: "center", justifyContent: "center", paddingTop: 48, paddingHorizontal: 40 },
});
