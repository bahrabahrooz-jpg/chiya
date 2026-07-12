import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, BadgeCheck, CalendarCheck, CircleCheck, MapPin, Star } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { dayName, monthName, formatDayMonth, formatTimeSlot } from "@/lib/i18n/format";
import { Button } from "@/components/ui";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

// Canonical slot values (stored on the viewing); display is localized via formatTimeSlot.
const TIME_SLOTS = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];

export interface BookViewingSheetProps {
  open: boolean;
  onClose: () => void;
  property: { title: string; address: string };
  agent: { name: string; city: string; photo: string; verified?: boolean; rating: number; reviews: number };
  /** Fired when a viewing is confirmed, with the chosen date + slot label. */
  onConfirm?: (details: { date: Date; time: string }) => void;
}

/** BookViewingSheet — a bottom-sheet that mirrors the website's "request a
 * viewing" flow: pick a date + time, see the viewing agent, submit → confirmed. */
export function BookViewingSheet({ open, onClose, property, agent, onConfirm }: BookViewingSheetProps) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(open);
  const [dateIdx, setDateIdx] = useState<number | null>(null);
  const [timeIdx, setTimeIdx] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  // Next 14 days as selectable pills.
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  useEffect(() => {
    if (open) {
      setDone(false);
      setDateIdx(null);
      setTimeIdx(null);
      setMounted(true);
      Animated.parallel([
        Animated.timing(ty, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(ty, { toValue: WINDOW_H, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  const canSubmit = dateIdx !== null && timeIdx !== null;
  const dayLabel = (d: Date, i: number) => (i === 0 ? t("bookViewing.today") : i === 1 ? t("bookViewing.tomorrow") : dayName(d));
  const whenLabel =
    dateIdx !== null
      ? `${formatDayMonth(days[dateIdx])}${timeIdx !== null ? ` · ${formatTimeSlot(TIME_SLOTS[timeIdx])}` : ""}`
      : "";

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <AnimatedPressable onPress={onClose} style={[styles.scrim, { opacity: scrim, backgroundColor: colors.overlay }]} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfacePage,
              borderTopLeftRadius: radius.card,
              borderTopRightRadius: radius.card,
              transform: [{ translateY: ty }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />

          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 22 }]}>
                {done ? t("bookViewing.requested") : t("bookViewing.request")}
              </Text>
              <Text numberOfLines={1} style={[type.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                {done ? t("bookViewing.confirmedWithin") : `${property.title} · ${property.address}`}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.surfaceSunken }]}>
              <X size={18} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          {done ? (
            <>
              <View style={styles.doneWrap}>
                <View style={[styles.doneIcon, { backgroundColor: colors.brandSubtle }]}>
                  <CircleCheck size={34} color={colors.brandForeground} strokeWidth={2} />
                </View>
                <Text style={[type.bodyLg, styles.doneTitle, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
                  {t("bookViewing.allSet")}
                </Text>
                <Text style={[type.body, styles.doneText, { color: colors.textSecondary }]}>
                  {t("bookViewing.thankYou", { name: agent.name, title: property.title, when: whenLabel })}
                </Text>
              </View>
              <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
                <Button title={t("bookViewing.done")} onPress={onClose} />
              </View>
            </>
          ) : (
            <>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
                {/* Date */}
                <View style={styles.section}>
                  <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("bookViewing.selectDate")}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                    {days.map((d, i) => {
                      const on = dateIdx === i;
                      return (
                        <Pressable
                          key={i}
                          onPress={() => setDateIdx(i)}
                          style={[
                            styles.datePill,
                            {
                              borderRadius: radius.md,
                              backgroundColor: on ? colors.brandPrimary : colors.surfaceCard,
                              borderColor: on ? colors.brandPrimary : colors.borderSubtle,
                            },
                          ]}
                        >
                          <Text style={[type.caption, { color: on ? colors.textOnBrand : colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>
                            {dayLabel(d, i)}
                          </Text>
                          <Text style={[styles.dateNum, { color: on ? colors.textOnBrand : colors.textPrimary, fontFamily: fontFamily.sansBold }]}>
                            {d.getDate()}
                          </Text>
                          <Text style={[type.caption, { color: on ? colors.textOnBrand : colors.textTertiary }]}>{monthName(d)}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Time */}
                <View style={styles.section}>
                  <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("bookViewing.availableTimes")}</Text>
                  <View style={styles.slots}>
                    {TIME_SLOTS.map((slot, i) => {
                      const on = timeIdx === i;
                      return (
                        <Pressable
                          key={slot}
                          onPress={() => setTimeIdx(i)}
                          style={[
                            styles.slot,
                            {
                              borderRadius: radius.pill,
                              backgroundColor: on ? colors.brandSubtle : colors.surfaceCard,
                              borderColor: on ? colors.brandForeground : colors.borderSubtle,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              type.bodySm,
                              { color: on ? colors.brandForeground : colors.textSecondary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium },
                            ]}
                          >
                            {formatTimeSlot(slot)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Agent */}
                <View style={styles.section}>
                  <Text style={[type.label, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>{t("bookViewing.viewingAgent")}</Text>
                  <View style={[styles.agentRow, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
                    <Image source={{ uri: agent.photo }} style={styles.agentImg} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <View style={styles.agentNameRow}>
                        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]} numberOfLines={1}>
                          {agent.name}
                        </Text>
                        {agent.verified ? <BadgeCheck size={15} color={colors.brandForeground} strokeWidth={2.5} /> : null}
                      </View>
                      <View style={styles.agentMeta}>
                        <MapPin size={13} color={colors.textTertiary} strokeWidth={2} />
                        <Text style={[type.bodySm, { color: colors.textSecondary }]} numberOfLines={1}>{agent.city}</Text>
                        <Star size={13} color={colors.warning} fill={colors.warning} strokeWidth={0} style={{ marginLeft: 4 }} />
                        <Text style={[type.bodySm, { color: colors.textSecondary }]}>
                          {agent.rating.toFixed(1)} ({agent.reviews})
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
                <Button
                  title={t("bookViewing.request")}
                  disabled={!canSubmit}
                  left={<CalendarCheck size={19} color={colors.textOnBrand} strokeWidth={2} />}
                  onPress={() => {
                    if (dateIdx === null || timeIdx === null) return;
                    onConfirm?.({ date: days[dateIdx], time: TIME_SLOTS[timeIdx] });
                    setDone(true);
                  }}
                />
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { maxHeight: "88%", paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 8, opacity: 0.5 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2 },
  section: { paddingHorizontal: 20, paddingTop: 18, gap: 12 },
  dateRow: { gap: 10, paddingRight: 4 },
  datePill: { width: 66, paddingVertical: 12, borderWidth: 1, alignItems: "center", gap: 3 },
  dateNum: { fontSize: 20 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: { paddingHorizontal: 16, height: 40, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  agentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1 },
  agentImg: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#e9edf0" },
  agentNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  agentMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  foot: { paddingHorizontal: 20, paddingTop: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  doneWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: "center" },
  doneIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  doneTitle: { marginTop: 16 },
  doneText: { textAlign: "center", marginTop: 8, lineHeight: 23 },
});
