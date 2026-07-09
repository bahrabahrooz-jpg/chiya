import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Heart } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useUnreadCount } from "@/lib/notifications";
import { useProfile } from "@/lib/profile";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** HomeHeader — avatar on the left, Saved + notification actions on the right. */
export function HomeHeader() {
  const { colors, fontFamily } = useTheme();
  const router = useRouter();
  const unread = useUnreadCount();
  const profile = useProfile();
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push("/account/edit")} hitSlop={6} accessibilityRole="button" accessibilityLabel="My profile">
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.brandPrimary }]}>
            <Text style={[styles.avatarTxt, { fontFamily: fontFamily.sansSemibold }]}>{initialsOf(profile.fullName)}</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/saved")}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Saved"
        >
          <Heart size={20} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/account/notifications")}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={20} color={colors.textPrimary} strokeWidth={2} />
          {unread > 0 ? <View style={[styles.dot, { backgroundColor: colors.error, borderColor: colors.surfaceCard }]} /> : null}
        </Pressable>
      </View>
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
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
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
