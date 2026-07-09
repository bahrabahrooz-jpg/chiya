import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { BadgeCheck, Star, Heart, MapPin } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useIsFavorite, toggleFavorite } from "@/lib/favorites";
import { type Agent } from "./data";

/** AgentCard — vertical card (photo + verified badge + heart, name, city, rating). */
export function AgentCard({ agent: a }: { agent: Agent }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const router = useRouter();
  const fav = useIsFavorite(a.id);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/agents/[id]", params: { id: a.id } })}
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
        <Pressable style={styles.heart} onPress={() => toggleFavorite(a.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Save">
          <Heart size={18} color={fav ? colors.error : "#33383F"} fill={fav ? colors.error : "transparent"} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text numberOfLines={1} style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
          {a.name}
        </Text>
        <View style={styles.loc}>
          <MapPin size={13} color={colors.textTertiary} strokeWidth={2} />
          <Text numberOfLines={1} style={[type.bodySm, { color: colors.textSecondary, flex: 1 }]}>{a.city}</Text>
        </View>
        <View style={styles.stats}>
          <Star size={14} color={colors.brandAccent} fill={colors.brandAccent} strokeWidth={0} />
          <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{a.rating.toFixed(1)}</Text>
          <Text style={[type.bodySm, { color: colors.textTertiary }]}>· {a.listings} listings</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", borderWidth: 1 },
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
  heart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 14, gap: 6 },
  loc: { flexDirection: "row", alignItems: "center", gap: 4 },
  stats: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
});
