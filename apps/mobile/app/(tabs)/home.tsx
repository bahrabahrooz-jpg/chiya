import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSearchButton } from "@/components/home/HomeSearchButton";
import { QuickActions } from "@/components/home/QuickActions";
import { BrowseByType } from "@/components/home/BrowseByType";
import { RecommendedSection } from "@/components/home/RecommendedSection";
import { RecentlyAdded } from "@/components/home/RecentlyAdded";
import { FeaturedAgents } from "@/components/home/FeaturedAgents";

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.pad}>
          <HomeHeader />
        </View>

        <View style={[styles.pad, styles.searchGap]}>
          <HomeSearchButton />
        </View>
        <View style={[styles.pad, styles.actionsGap]}>
          <QuickActions />
        </View>

        <View style={styles.section}>
          <BrowseByType />
        </View>
        <View style={styles.section}>
          <RecentlyAdded />
        </View>
        <View style={styles.section}>
          <RecommendedSection />
        </View>
        <View style={styles.section}>
          <FeaturedAgents />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingTop: 8, paddingBottom: 40 },
  pad: { paddingHorizontal: 20 },
  searchGap: { marginTop: 16 },
  actionsGap: { marginTop: 14 },
  section: { marginTop: 24 },
});
