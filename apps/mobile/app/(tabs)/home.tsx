import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { DealChips } from "@/components/home/DealChips";
import { RecommendedSection } from "@/components/home/RecommendedSection";
import { PopularLocations } from "@/components/home/PopularLocations";
import { FeaturedAgents } from "@/components/home/FeaturedAgents";
import { FilterDrawer } from "@/components/home/FilterDrawer";
import { emptyFilters, countFilters, type Filters } from "@/components/home/data";

export default function HomeScreen() {
  const { colors } = useTheme();
  const [deal, setDeal] = useState("all");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.pad}>
          <HomeHeader />
        </View>

        <View style={[styles.pad, styles.searchRow]}>
          <HomeSearchBar onOpenFilters={() => setDrawerOpen(true)} activeCount={countFilters(filters)} />
        </View>

        <View style={styles.chipsRow}>
          <DealChips active={deal} onChange={setDeal} />
        </View>

        <View style={styles.section}>
          <RecommendedSection />
        </View>

        <View style={styles.section}>
          <PopularLocations />
        </View>

        <View style={styles.section}>
          <FeaturedAgents />
        </View>
      </ScrollView>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        deal={deal}
        value={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingTop: 8, paddingBottom: 40 },
  pad: { paddingHorizontal: 20 },
  searchRow: { marginTop: 18 },
  chipsRow: { marginTop: 16, paddingLeft: 20 },
  section: { marginTop: 24 },
});
