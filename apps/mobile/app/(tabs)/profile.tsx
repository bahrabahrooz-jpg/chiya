import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  MapPin,
  ChevronRight,
  UserRound,
  KeyRound,
  Heart,
  Bell,
  Languages,
  Palette,
  CircleHelp,
  Info,
  ShieldCheck,
  LogOut,
} from "lucide-react-native";
import { useTheme } from "@/theme";
import { useProfile, languageLabel } from "@/lib/profile";
import { confirm } from "@/lib/confirm";
import { useThemeMode, themeModeLabel } from "@/lib/theme-mode";
import { useFavoriteIds } from "@/lib/favorites";
import { useViewings } from "@/lib/viewings";
import { useMyListings } from "@/lib/my-listings";
import { listings, agents } from "@/components/home/data";
import { MenuRow, Group } from "@/components/account/MenuRow";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function ProfileScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const themeMode = useThemeMode();
  const favIds = useFavoriteIds();
  const viewings = useViewings();
  const myListings = useMyListings();

  const savedHomes = listings.filter((l) => favIds.has(l.id)).length;
  const savedAgents = agents.filter((a) => favIds.has(a.id)).length;

  const stats: { label: string; value: number; onPress: () => void }[] = [
    { label: "Saved homes", value: savedHomes, onPress: () => router.push("/saved") },
    { label: "Saved agents", value: savedAgents, onPress: () => router.push("/saved") },
    { label: "Listings", value: myListings.length, onPress: () => router.push("/my-listings") },
    { label: "Viewings", value: viewings.length, onPress: () => router.push("/viewings") },
  ];

  const logout = () =>
    confirm({
      title: "Log out",
      message: "You'll need to sign in again to access your account.",
      confirmLabel: "Log out",
      destructive: true,
      icon: LogOut,
      onConfirm: () => router.replace("/login"),
    });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 26 }]}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Member card */}
        <Pressable
          onPress={() => router.push("/account/edit")}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card },
            pressed && { backgroundColor: colors.surfaceSunken },
          ]}
          accessibilityRole="button"
        >
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.brandPrimary }]}>
              <Text style={[styles.avatarTxt, { color: colors.textOnBrand, fontFamily: fontFamily.sansSemibold }]}>
                {initialsOf(profile.fullName)}
              </Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]} numberOfLines={1}>
              {profile.fullName}
            </Text>
            <View style={styles.locRow}>
              <MapPin size={13} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.bodySm, { color: colors.textSecondary }]} numberOfLines={1}>
                {profile.location}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>

        {/* Stats strip */}
        <View style={[styles.stats, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
          {stats.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={s.onPress}
              style={({ pressed }) => [
                styles.stat,
                i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.borderSubtle },
                pressed && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
            >
              <Text style={[type.displaySm, styles.statNum, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[type.bodySm, { color: colors.textTertiary }]} numberOfLines={1}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Group title="Account">
          <MenuRow icon={UserRound} label="My profile" onPress={() => router.push("/account/edit")} />
          <MenuRow icon={KeyRound} label="Change password" divider onPress={() => router.push("/account/change-password")} />
          <MenuRow icon={Heart} label="Saved" divider onPress={() => router.push("/saved")} />
          <MenuRow icon={Bell} label="Notifications" divider onPress={() => router.push("/account/notifications")} />
        </Group>

        <Group title="Preferences">
          <MenuRow
            icon={Palette}
            label="Appearance"
            value={themeModeLabel(themeMode)}
            onPress={() => router.push("/account/appearance")}
          />
          <MenuRow
            icon={Languages}
            label="Language"
            value={languageLabel(profile.language)}
            divider
            onPress={() => router.push("/account/language")}
          />
        </Group>

        <Group title="Support">
          <MenuRow icon={CircleHelp} label="Help & support" disabled />
          <MenuRow icon={Info} label="About Chiya" divider disabled />
          <MenuRow icon={ShieldCheck} label="Terms & privacy" divider disabled />
        </Group>

        <Group>
          <MenuRow icon={LogOut} label="Log out" danger chevron={false} bareIcon onPress={logout} />
        </Group>

        <Text style={[type.bodySm, styles.footer, { color: colors.textTertiary }]}>Chiya Estate · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 18 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderWidth: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 20, letterSpacing: 0.5 },
  cardBody: { flex: 1, gap: 4 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  stats: { flexDirection: "row", borderWidth: 1, overflow: "hidden" },
  stat: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 3 },
  statNum: { fontSize: 24 },
  footer: { textAlign: "center", marginTop: 4 },
});
