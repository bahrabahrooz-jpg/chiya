import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { BadgeCheck, Star } from "lucide-react-native";
import { useTheme } from "@/theme";
import { SectionHeader } from "./SectionHeader";
import { featuredAgents, type Agent } from "./data";

function AgentCard({ agent: a }: { agent: Agent }) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surfaceCard, borderRadius: radius.card, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
    >
      <View style={[styles.media, { borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }]}>
        <Image source={{ uri: a.photo }} style={styles.img} resizeMode="cover" />
        {a.verified ? (
          <View style={styles.badge}>
            <BadgeCheck size={14} color={colors.brandPrimary} strokeWidth={2.5} />
            <Text style={[styles.badgeTxt, { color: colors.brandPrimary, fontFamily: fontFamily.sansSemibold }]}>Verified</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text numberOfLines={1} style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
          {a.name}
        </Text>
        <Text numberOfLines={1} style={[type.bodySm, { color: colors.textSecondary }]}>
          {a.agency} · {a.city}
        </Text>
        <View style={styles.stats}>
          <Star size={14} color={colors.brandAccent} fill={colors.brandAccent} strokeWidth={0} />
          <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{a.rating.toFixed(1)}</Text>
          <Text style={[type.bodySm, { color: colors.textTertiary }]}>· {a.listings} listings</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** FeaturedAgents — "Featured Agents" header + a horizontal row of agent cards. */
export function FeaturedAgents() {
  return (
    <View>
      <View style={styles.head}>
        {/* TODO: point "See all" at a dedicated Agents screen once it exists. */}
        <SectionHeader title="Featured Agents" onSeeAll={() => {}} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {featuredAgents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, marginBottom: 14 },
  scroll: { paddingHorizontal: 20, paddingVertical: 6, gap: 14 },
  card: { width: 280, borderWidth: 1 },
  media: { height: 160, overflow: "hidden", backgroundColor: "#e9edf0" },
  img: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeTxt: { fontSize: 12 },
  body: { padding: 14, gap: 6 },
  stats: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
});
