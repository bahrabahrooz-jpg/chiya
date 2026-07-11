import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CalendarCheck, Clock, MapPin, X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { formatTimeSlot } from "@/lib/i18n/format";
import { useViewings, cancelViewing, formatViewingDate, type Viewing } from "@/lib/viewings";
import { confirm } from "@/lib/confirm";

function ViewingCard({ viewing: v }: { viewing: Viewing }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const confirmCancel = () =>
    confirm({
      title: t("viewings.cancelTitle"),
      message: t("viewings.cancelMessage", { title: v.title }),
      confirmLabel: t("viewings.cancelConfirm"),
      cancelLabel: t("viewings.keep"),
      destructive: true,
      icon: X,
      onConfirm: () => cancelViewing(v.id),
    });

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/property/[id]", params: { id: v.propertyId } })}
      style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
      accessibilityRole="button"
    >
      <View style={styles.top}>
        <Image source={{ uri: v.cover }} style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.surfaceSunken }]} resizeMode="cover" />
        <View style={styles.info}>
          <View style={[styles.badge, { backgroundColor: colors.brandSubtle }]}>
            <Clock size={11} color={colors.brandForeground} strokeWidth={2.5} />
            <Text style={[type.caption, { color: colors.brandForeground, fontFamily: fontFamily.sansSemibold }]}>{t("viewings.requested")}</Text>
          </View>
          <Text numberOfLines={1} style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
            {v.title}
          </Text>
          <View style={styles.loc}>
            <MapPin size={13} color={colors.textTertiary} strokeWidth={2} />
            <Text numberOfLines={1} style={[type.bodySm, { color: colors.textSecondary, flex: 1 }]}>
              {v.address}
            </Text>
          </View>
        </View>
        <Pressable onPress={confirmCancel} hitSlop={8} style={[styles.cancel, { backgroundColor: colors.surfaceSunken }]} accessibilityLabel={t("viewings.cancelConfirm")}>
          <X size={16} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={[styles.when, { backgroundColor: colors.surfaceSunken, borderRadius: radius.md }]}>
        <CalendarCheck size={16} color={colors.brandForeground} strokeWidth={2} />
        <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
          {formatViewingDate(v.date)}
        </Text>
        <Text style={[type.bodySm, { color: colors.textTertiary }]}>{t("viewings.at", { time: formatTimeSlot(v.time) })}</Text>
      </View>

      <View style={styles.agent}>
        <Image source={{ uri: v.agentPhoto }} style={styles.agentImg} resizeMode="cover" />
        <Text style={[type.bodySm, { color: colors.textSecondary }]} numberOfLines={1}>
          {t("viewings.withPrefix")}<Text style={{ color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }}>{v.agentName}</Text> · {v.agentAgency}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ViewingsScreen() {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  const viewings = useViewings();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 26 }]}>{t("viewings.title")}</Text>
      </View>

      {viewings.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {viewings.map((v) => (
            <View key={v.id} style={styles.item}>
              <ViewingCard viewing={v} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.brandSubtle }]}>
            <CalendarCheck size={26} color={colors.brandForeground} strokeWidth={2} />
          </View>
          <Text style={[type.bodyLg, styles.emptyTitle, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
            {t("viewings.emptyTitle")}
          </Text>
          <Text style={[type.body, styles.emptyText, { color: colors.textSecondary }]}>
            {t("viewings.emptyBody")}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  scroll: { paddingBottom: 40, paddingTop: 8 },
  item: { paddingHorizontal: 20, marginTop: 12 },
  card: { padding: 12, borderWidth: 1, gap: 12 },
  top: { flexDirection: "row", gap: 12 },
  thumb: { width: 76, height: 76, overflow: "hidden" },
  info: { flex: 1, gap: 4, justifyContent: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", height: 22, paddingHorizontal: 8, borderRadius: 999 },
  loc: { flexDirection: "row", alignItems: "center", gap: 4 },
  cancel: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  when: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  agent: { flexDirection: "row", alignItems: "center", gap: 8 },
  agentImg: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#e9edf0" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: -40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 16 },
  emptyText: { textAlign: "center", marginTop: 6, maxWidth: 320 },
});
