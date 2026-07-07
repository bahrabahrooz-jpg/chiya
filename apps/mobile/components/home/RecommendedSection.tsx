import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SectionHeader } from "./SectionHeader";
import { PropertyCard } from "./PropertyCard";
import { recommended } from "./data";

/** RecommendedSection — "Recommended for you" header + horizontal property cards. */
export function RecommendedSection() {
  const router = useRouter();
  return (
    <View>
      <View style={styles.head}>
        <SectionHeader title="Featured Properties" onSeeAll={() => router.push("/search")} />
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
