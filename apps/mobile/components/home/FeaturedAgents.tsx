import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "@/lib/i18n";
import { SectionHeader } from "./SectionHeader";
import { AgentCard } from "./AgentCard";
import { featuredAgents } from "./data";

/** FeaturedAgents — "Featured Agents" header + a horizontal row of agent cards. */
export function FeaturedAgents() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.head}>
        <SectionHeader title={t("home.featuredAgents")} onSeeAll={() => router.push("/agents")} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {featuredAgents.map((a) => (
          <View key={a.id} style={styles.item}>
            <AgentCard agent={a} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, marginBottom: 14 },
  scroll: { paddingHorizontal: 20, paddingVertical: 6, gap: 14 },
  item: { width: 280 },
});
