import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, ArrowUpDown } from "lucide-react-native";
import { useTheme } from "@/theme";
import { SortSheet } from "@/components/home/SortSheet";
import { AgentCard } from "@/components/home/AgentCard";
import { agents, agentCities, agentSort, labelFor } from "@/components/home/data";

export default function AgentsScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [sort, setSort] = useState("listings");
  const [sortOpen, setSortOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = agents.filter((a) => {
      if (city !== "all" && a.city !== city) return false;
      if (q && !`${a.name} ${a.agency} ${a.city}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === "rating") list.sort((x, y) => y.rating - x.rating);
    else if (sort === "reviews") list.sort((x, y) => y.reviews - x.reviews);
    else list.sort((x, y) => y.listings - x.listings);
    return list;
  }, [query, city, sort]);

  const cities = ["all", ...agentCities];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 26 }]}>Agents</Text>
        <View
          style={[
            styles.field,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: focused ? colors.borderFocus : colors.borderSubtle,
              borderWidth: focused ? 1.5 : 1,
              borderRadius: radius.control,
            },
            focused && { boxShadow: `0 0 0 4px ${colors.ringBrand}` },
          ]}
        >
          <Search size={19} color={colors.textTertiary} strokeWidth={2} />
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: fontFamily.sans, fontSize: type.body.fontSize }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search agents, agencies…"
            placeholderTextColor={colors.textPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={colors.brandForeground}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color={colors.textTertiary} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {cities.map((c) => {
            const on = city === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCity(c)}
                style={[
                  styles.chip,
                  {
                    borderRadius: radius.pill,
                    backgroundColor: on ? colors.brandSubtle : colors.surfaceCard,
                    borderColor: on ? colors.brandForeground : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    type.bodySm,
                    { color: on ? colors.brandForeground : colors.textSecondary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium },
                  ]}
                >
                  {c === "all" ? "All cities" : c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.pad, styles.resultsHead]}>
          <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
            {results.length} agent{results.length === 1 ? "" : "s"}
          </Text>
          <Pressable onPress={() => setSortOpen(true)} style={[styles.sortBtn, { borderColor: colors.borderDefault, borderRadius: radius.pill }]}>
            <ArrowUpDown size={15} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{labelFor(agentSort, sort)}</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {results.map((a) => (
            <View key={a.id} style={styles.gridItem}>
              <AgentCard agent={a} />
            </View>
          ))}
        </View>
      </ScrollView>

      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} options={agentSort} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  field: { height: 52, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  input: { flex: 1, height: "100%", padding: 0 },
  scroll: { paddingTop: 14, paddingBottom: 40 },
  chipsRow: { gap: 8, paddingHorizontal: 20 },
  chip: { height: 36, paddingHorizontal: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pad: { paddingHorizontal: 20 },
  resultsHead: { marginTop: 18, marginBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderWidth: 1 },
  grid: { paddingHorizontal: 20, gap: 14, marginTop: 12 },
  gridItem: { width: "100%" },
});
