import { View, Image, Text, StyleSheet } from "react-native";
import { BadgeCheck } from "lucide-react-native";
import { useTheme } from "@/theme";

const initialsOf = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

/** AgentAvatar — circular agent portrait with the verified-badge treatment from
 *  the agent detail hero: solid brand circle, surface-matched ring, bottom-end
 *  corner. Shared by the detail hero and the assign-agent picker so the avatar
 *  reads identically everywhere. Proportions match the hero (100px avatar,
 *  30px badge, 3px ring, 16px icon) at any size. `ringColor` should match the
 *  surface the avatar sits on (defaults to the page background). When `photo` is
 *  empty, initials of `name` fill the circle (matching the initials avatars used
 *  for photo-less people elsewhere). */
export function AgentAvatar({
  photo,
  name,
  verified,
  size,
  ringColor,
}: {
  photo: string;
  name?: string;
  verified?: boolean;
  size: number;
  ringColor?: string;
}) {
  const { colors, fontFamily } = useTheme();
  const badge = Math.max(14, Math.round(size * 0.3));
  const ring = Math.max(2, Math.round(badge * 0.1));
  return (
    <View style={{ width: size, height: size }}>
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceSunken }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceSunken,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.textTertiary, fontFamily: fontFamily.sansSemibold, fontSize: Math.round(size * 0.36) }}>
            {name ? initialsOf(name) : ""}
          </Text>
        </View>
      )}
      {verified ? (
        <View
          style={[
            styles.badge,
            {
              width: badge,
              height: badge,
              borderRadius: badge / 2,
              borderWidth: ring,
              backgroundColor: colors.brandPrimary,
              borderColor: ringColor ?? colors.surfacePage,
            },
          ]}
        >
          <BadgeCheck size={Math.round(badge * 0.53)} color={colors.textOnBrand} strokeWidth={2.5} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: "absolute", end: -2, bottom: -2, alignItems: "center", justifyContent: "center" },
});
