import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarCheck,
  MessageCircle,
  Building2,
  Heart,
  Info,
  MoreVertical,
  MoreHorizontal,
  CheckCheck,
  Check,
  Mail,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { ActionSheet, SwipeRow, type SheetAction } from "@/components/ui";
import { confirm } from "@/lib/confirm";
import {
  useNotifications,
  useUnreadCount,
  markRead,
  markUnread,
  markAllRead,
  removeNotification,
  clearNotifications,
  type NotificationType,
  type AppNotification,
} from "@/lib/notifications";

// LayoutAnimation on old-architecture Android needs this opt-in (no-op on Fabric).
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ICONS: Record<NotificationType, LucideIcon> = {
  viewing: CalendarCheck,
  message: MessageCircle,
  listing: Building2,
  saved: Heart,
  system: Info,
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Localized relative time: "Just now", "5 min ago", "Yesterday", "3 days ago", "12 Jun". */
function useTimeAgo() {
  const { t } = useTranslation();
  return (ts: number) => {
    const now = Date.now();
    const diff = Math.max(0, now - ts);
    if (diff < MIN) return t("notifications.ago.now");
    if (diff < HOUR) return t("notifications.ago.minutes", { count: Math.floor(diff / MIN) });
    const dayDiff = Math.round((startOfDay(now) - startOfDay(ts)) / DAY);
    if (dayDiff <= 0) return t("notifications.ago.hours", { count: Math.max(1, Math.floor(diff / HOUR)) });
    if (dayDiff === 1) return t("notifications.ago.yesterday");
    if (dayDiff < 7) return t("notifications.ago.days", { count: dayDiff });
    const months = t("notifications.monthsShort").split(" ");
    const d = new Date(ts);
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };
}

/** A subtle collapse/settle used when read-state or list membership changes. */
const animateNext = () =>
  LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

const haptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

function NotificationItem({
  item,
  onOpen,
  onMenu,
}: {
  item: AppNotification;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const Icon = ICONS[item.type];
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.item,
        {
          // Opaque press feedback (never translucent) so the delete panel behind
          // the row can't bleed through when the row is pressed to start a swipe.
          backgroundColor: item.read
            ? pressed
              ? colors.surfaceSunken
              : colors.surfaceCard
            : colors.brandSubtle,
          borderColor: item.read ? colors.borderSubtle : colors.brandForeground,
          borderRadius: radius.card,
        },
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
          {!item.read ? <View style={[styles.dot, { backgroundColor: colors.brandForeground }]} /> : null}
        </View>
        <Text style={[type.bodySm, { color: colors.textSecondary, lineHeight: 20 }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[type.caption, { color: colors.textTertiary, marginTop: 4 }]}>{timeAgo(item.createdAt)}</Text>
      </View>

      <Pressable
        onPress={onMenu}
        hitSlop={8}
        style={styles.menuBtn}
        accessibilityRole="button"
        accessibilityLabel={t("notifications.more")}
      >
        <MoreVertical size={18} color={colors.textTertiary} strokeWidth={2} />
      </Pressable>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const notifications = useNotifications();
  const unread = useUnreadCount();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [sheet, setSheet] = useState<{ title?: string; actions: SheetAction[] } | null>(null);

  const list = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const openItem = (n: AppNotification) => {
    if (!n.read) {
      animateNext();
      markRead(n.id);
    }
    if (n.href) router.push(n.href);
  };

  const deleteItem = (id: string) => {
    haptic();
    removeNotification(id);
  };

  const openItemMenu = (n: AppNotification) => {
    const actions: SheetAction[] = [];
    if (n.read) {
      actions.push({ label: t("notifications.markAsUnread"), icon: Mail, onPress: () => { animateNext(); markUnread(n.id); } });
    } else {
      actions.push({ label: t("notifications.markAsRead"), icon: Check, onPress: () => { animateNext(); markRead(n.id); } });
    }
    actions.push({ label: t("notifications.delete"), icon: Trash2, destructive: true, onPress: () => { animateNext(); deleteItem(n.id); } });
    setSheet({ title: n.title, actions });
  };

  const openGlobalMenu = () => {
    const actions: SheetAction[] = [];
    if (unread > 0) actions.push({ label: t("notifications.markAll"), icon: CheckCheck, onPress: () => { animateNext(); markAllRead(); } });
    actions.push({
      label: t("notifications.clearAll"),
      icon: Trash2,
      destructive: true,
      onPress: () =>
        confirm({
          title: t("notifications.clearTitle"),
          message: t("notifications.clearMessage"),
          confirmLabel: t("notifications.clearConfirm"),
          destructive: true,
          icon: Trash2,
          onConfirm: () => { animateNext(); clearNotifications(); },
        }),
    });
    setSheet({ actions });
  };

  const tabs: { key: "all" | "unread"; label: string; count?: number }[] = [
    { key: "all", label: t("notifications.filterAll") },
    { key: "unread", label: t("notifications.filterUnread"), count: unread },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader
        title={t("notifications.title")}
        right={
          notifications.length > 0 ? (
            <Pressable onPress={openGlobalMenu} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("notifications.more")}>
              <MoreHorizontal size={22} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          ) : undefined
        }
      />

      {notifications.length > 0 ? (
        <>
          <View style={styles.tabs}>
            {tabs.map((tab) => {
              const on = filter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setFilter(tab.key)}
                  style={[
                    styles.tab,
                    { borderRadius: radius.pill, backgroundColor: on ? colors.brandSubtle : colors.surfaceCard, borderColor: on ? colors.brandForeground : colors.borderDefault },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[type.bodySm, { color: on ? colors.brandForeground : colors.textSecondary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>
                    {tab.label}
                  </Text>
                  {tab.count ? (
                    <View style={[styles.badge, { backgroundColor: on ? colors.brandForeground : colors.textTertiary }]}>
                      <Text style={[styles.badgeTxt, { color: colors.textOnBrand, fontFamily: fontFamily.sansSemibold }]}>{tab.count}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {list.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {list.map((n) => (
                <View key={n.id} style={styles.rowWrap}>
                  <SwipeRow onDelete={() => deleteItem(n.id)} deleteLabel={t("notifications.delete")} isRTL={isRTL}>
                    <NotificationItem item={n} onOpen={() => openItem(n)} onMenu={() => openItemMenu(n)} />
                  </SwipeRow>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.inlineEmpty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.brandSubtle }]}>
                <CheckCheck size={24} color={colors.brandForeground} strokeWidth={2} />
              </View>
              <Text style={[type.body, { color: colors.textSecondary, marginTop: 12 }]}>{t("notifications.emptyUnread")}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, styles.emptyIconLg, { backgroundColor: colors.brandSubtle }]}>
            <Bell size={26} color={colors.brandForeground} strokeWidth={2} />
          </View>
          <Text style={[type.bodyLg, styles.emptyTitle, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
            {t("notifications.emptyTitle")}
          </Text>
          <Text style={[type.body, styles.emptyText, { color: colors.textSecondary }]}>{t("notifications.emptyBody")}</Text>
        </View>
      )}

      <ActionSheet open={!!sheet} onClose={() => setSheet(null)} title={sheet?.title} actions={sheet?.actions ?? []} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  tab: { flexDirection: "row", alignItems: "center", gap: 7, height: 36, paddingHorizontal: 16, borderWidth: 1 },
  badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontSize: 11 },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  rowWrap: { marginBottom: 10 },
  item: { flexDirection: "row", gap: 12, padding: 14, borderWidth: 1, alignItems: "flex-start" },
  iconTile: { width: 38, height: 38, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  menuBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", marginStart: -2, marginTop: -2 },
  inlineEmpty: { alignItems: "center", justifyContent: "center", paddingTop: 70, paddingHorizontal: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: -40 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  emptyIconLg: { width: 64, height: 64, borderRadius: 32 },
  emptyTitle: { marginTop: 16 },
  emptyText: { textAlign: "center", marginTop: 6, maxWidth: 320 },
});
