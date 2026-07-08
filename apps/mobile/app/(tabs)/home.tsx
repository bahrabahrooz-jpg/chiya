import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RecommendedSection } from "@/components/home/RecommendedSection";
import { PopularLocations } from "@/components/home/PopularLocations";
import { FeaturedAgents } from "@/components/home/FeaturedAgents";

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.pad}>
          <HomeHeader />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingTop: 8, paddingBottom: 40 },
  pad: { paddingHorizontal: 20 },
  section: { marginTop: 24 },
});
