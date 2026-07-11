import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "@/lib/i18n";
import { SectionHeader } from "./SectionHeader";
import { PropertyCard } from "./PropertyCard";
import { recommended } from "./data";

/** RecommendedSection — "Recommended for you" header + horizontal property cards. */
export function RecommendedSection() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.head}>
        <SectionHeader
          title={t("home.featuredProperties")}
          onSeeAll={() => router.push({ pathname: "/search", params: { sort: "featured", ts: String(Date.now()) } })}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {recommended.map((p) => (
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
