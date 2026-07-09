import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BellOff,
  CalendarCheck,
  MessageCircle,
  Building2,
  Heart,
  Info,
  type LucideIcon,
} from "lucide-react-native";
import { useTheme } from "@/theme";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { useNotifications, useUnreadCount, markRead, markAllRead, timeAgo, type NotificationType, type AppNotification } from "@/lib/notifications";

const ICONS: Record<NotificationType, LucideIcon> = {
  viewing: CalendarCheck,
  message: MessageCircle,
  listing: Building2,
  saved: Heart,
  system: Info,
};

function NotificationItem({ item }: { item: AppNotification }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const Icon = ICONS[item.type];
  return (
    <Pressable
      onPress={() => markRead(item.id)}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: item.read ? colors.surfaceCard : colors.brandSubtle, borderColor: colors.borderSubtle, borderRadius: radius.card },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.iconTile, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder, borderRadius: radius.md }]}>
        <Icon size={19} color={colors.brandForeground} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[type.body, styles.title, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[type.caption, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={[type.bodySm, { color: colors.textSecondary, lineHeight: 20 }]} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.read ? <View style={[styles.dot, { backgroundColor: colors.brandForeground }]} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { colors, type, fontFamily } = useTheme();
  const notifications = useNotifications();
  const unread = useUnreadCount();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title="Notifications" />

      {notifications.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {unread > 0 ? (
            <View style={styles.headerRow}>
              <Text style={[type.bodySm, { color: colors.textSecondary }]}>
                {unread} unread
              </Text>
              <Pressable onPress={markAllRead} hitSlop={6}>
                <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>Mark all as read</Text>
              </Pressable>
            </View>
          ) : null}
          {notifications.map((n) => (
            <View key={n.id} style={styles.wrap}>
              <NotificationItem item={n} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.brandSubtle }]}>
            <BellOff size={26} color={colors.brandForeground} strokeWidth={2} />
          </View>
          <Text style={[type.bodyLg, styles.emptyTitle, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
            You're all caught up
          </Text>
          <Text style={[type.body, styles.emptyText, { color: colors.textSecondary }]}>
            New messages, viewing updates, and alerts will appear here.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  wrap: { marginBottom: 10 },
  item: { flexDirection: "row", gap: 12, padding: 14, borderWidth: 1, alignItems: "flex-start" },
  iconTile: { width: 38, height: 38, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: -40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 16 },
  emptyText: { textAlign: "center", marginTop: 6, maxWidth: 320 },
});
