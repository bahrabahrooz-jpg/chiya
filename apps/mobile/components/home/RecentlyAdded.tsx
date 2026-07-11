import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "@/lib/i18n";
import { SectionHeader } from "./SectionHeader";
import { PropertyCard } from "./PropertyCard";
import { recentlyAdded } from "./data";

/** RecentlyAdded — "Recently Added" header + a horizontal row of the newest
 *  property cards. "See all" opens the Search tab sorted by Newest. */
export function RecentlyAdded() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.head}>
        <SectionHeader
          title={t("home.recentlyAdded")}
          onSeeAll={() => router.push({ pathname: "/search", params: { sort: "newest", ts: String(Date.now()) } })}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {recentlyAdded.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, marginBottom: 14 },
  scroll: { paddingHorizontal: 20, paddingVertical: 6, gap: 14 },
});
