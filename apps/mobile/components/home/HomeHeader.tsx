import { View, Text, Pressable, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { useTheme } from "@/theme";
import { BrandLockup } from "@/components/ui";
import { user } from "./data";

const initials = user.fullName
  .split(" ")
  .map((p) => p[0])
  .slice(0, 2)
  .join("")
  .toUpperCase();

/** HomeHeader — avatar on the left, Chiya logo centered, notification bell on the right. */
export function HomeHeader() {
  const { colors, fontFamily } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable hitSlop={6} accessibilityRole="button" accessibilityLabel="Profile">
        <View style={[styles.avatar, { backgroundColor: colors.brandPrimary }]}>
          <Text style={[styles.avatarTxt, { fontFamily: fontFamily.sansSemibold }]}>{initials}</Text>
        </View>
      </Pressable>

      <BrandLockup size={30} />

      <Pressable
        style={[styles.bell, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Bell size={20} color={colors.textPrimary} strokeWidth={2} />
        <View style={[styles.dot, { backgroundColor: colors.error, borderColor: colors.surfaceCard }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontSize: 15, letterSpacing: 0.5 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});
