import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { PropertyCard } from "@/components/home/PropertyCard";
import { getAgent, listings } from "@/components/home/data";

/** Full list of an agent's active listings (opened from the agent detail "See all"). */
export default function AgentListingsScreen() {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agent = getAgent(id);
  const agentListings = listings;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={t("agentListings.title")} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[type.bodySm, styles.count, { color: colors.textSecondary, fontFamily: fontFamily.sansMedium }]}>
          {t(agentListings.length === 1 ? "agentListings.countOne" : "agentListings.countOther", { count: agentListings.length })}
          {agent ? ` · ${agent.name}` : ""}
        </Text>
        {agentListings.map((p) => (
          <View key={p.id} style={styles.item}>
            <PropertyCard property={p} fullWidth />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40, paddingTop: 12 },
  count: { paddingHorizontal: 20, marginBottom: 2 },
  item: { paddingHorizontal: 20, marginTop: 14 },
});
