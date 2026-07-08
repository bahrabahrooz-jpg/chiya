import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarCheck, BellRing, MessageCircle, Megaphone, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { MenuRow, Group } from "@/components/account/MenuRow";
import { useProfile, setNotification, type NotificationPrefs } from "@/lib/profile";

const ROWS: { key: keyof NotificationPrefs; icon: LucideIcon; label: string; sublabel: string }[] = [
  { key: "viewings", icon: CalendarCheck, label: "Viewing reminders", sublabel: "Booked tours and schedule changes" },
  { key: "savedSearches", icon: BellRing, label: "Saved-search alerts", sublabel: "New homes matching your searches" },
  { key: "messages", icon: MessageCircle, label: "Messages", sublabel: "Replies from agents you've contacted" },
  { key: "promotions", icon: Megaphone, label: "Promotions", sublabel: "Offers, news, and market updates" },
];

export default function NotificationSettingsScreen() {
  const { colors, type } = useTheme();
  const profile = useProfile();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title="Notification settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[type.bodySm, styles.intro, { color: colors.textSecondary }]}>
          Choose what Chiya can notify you about.
        </Text>
        <Group>
          {ROWS.map((r, i) => (
            <MenuRow
              key={r.key}
              icon={r.icon}
              label={r.label}
              sublabel={r.sublabel}
              divider={i > 0}
              trailing={
                <Switch
                  value={profile.notifications[r.key]}
                  onValueChange={(v) => setNotification(r.key, v)}
                  trackColor={{ true: colors.brandForeground, false: colors.borderStrong }}
                  thumbColor={colors.surfaceCard}
                  ios_backgroundColor={colors.borderStrong}
                />
              }
            />
          ))}
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  intro: { marginBottom: 2 },
});
