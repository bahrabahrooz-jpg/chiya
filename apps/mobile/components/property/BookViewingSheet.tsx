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
import { X, BadgeCheck, CalendarCheck, CircleCheck, MapPin, Star, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { formatDayMonth, formatTimeSlot, monthNameFull, weekdayHeaders } from "@/lib/i18n/format";
import { toISODate, useViewings } from "@/lib/viewings";
import { VIEWING_SLOTS, isSlot, isClosedDay, seedReservedSlots, buildReservedIndex } from "@/lib/reservations";
import { Button } from "@/components/ui";

/** "yyyy-mm-dd" → local Date. */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

export interface BookViewingSheetProps {
  open: boolean;
  onClose: () => void;
  /** Property id — used to surface the member's own requests as reserved slots. */
  propertyId: string;
  property: { title: string; address: string };
  agent: { name: string; city: string; photo: string; verified?: boolean; rating: number; reviews: number };
  /** Fired when a viewing is confirmed, with the chosen date + slot label. */
  onConfirm?: (details: { date: Date; time: string }) => void;
}

/** BookViewingSheet — a bottom-sheet that mirrors the website's "request a
 * viewing" flow: pick a date + time, see the viewing agent, submit → confirmed.
 * Fixed hourly slots, Fridays closed, and already-reserved slots blocked. */
export function BookViewingSheet({ open, onClose, propertyId, property, agent, onConfirm }: BookViewingSheetProps) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const viewings = useViewings();

  const [mounted, setMounted] = useState(open);
  const [dateISO, setDateISO] = useState(""); // "" = none; canonical yyyy-mm-dd
  const [time, setTime] = useState(""); // "" = none; canonical slot label
  const [openField, setOpenField] = useState<null | "date" | "time">(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [done, setDone] = useState(false);

  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  // Reserved slots = demo seed + the member's own requests for this property,
  // so a slot just booked immediately shows as taken.
  const { byDate, dayStatus } = useMemo(() => {
    const own = viewings
      .filter((v) => v.propertyId === propertyId && isSlot(v.time))
      .map((v) => ({ date: v.date, time: v.time }));
    return buildReservedIndex([...seedReservedSlots(), ...own]);
  }, [viewings, propertyId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISODate(today);
  const reservedTimes = dateISO ? byDate.get(dateISO) : undefined;

  // Picking a day sets the date and drops a time that is reserved on it.
  const pickDay = (d: Date) => {
    const iso = toISODate(d);
    setDateISO(iso);
    const taken = byDate.get(iso);
    if (time && taken?.has(time)) setTime("");
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setOpenField(null);
  };
  const pickTime = (slot: string) => {
    setTime(slot);
    setOpenField(null);
  };

  useEffect(() => {
    if (open) {
      setDone(false);
      setDateISO("");
      setTime("");
      setOpenField(null);
      setViewMonth(() => {
        const d = new Date();
        d.setDate(1);
        return d;
      });
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

  const canSubmit = !!dateISO && !!time;
  const whenLabel = dateISO ? `${formatDayMonth(parseISODate(dateISO))}${time ? ` · ${formatTimeSlot(time)}` : ""}` : "";

  // Calendar cells for the visible month (leading blanks + each day).
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

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
                {/* Date & time — two dropdown fields, mirroring the website */}
                <View style={styles.section}>
                  <View style={styles.dtRow}>
                    <View style={styles.dtField}>
                      <Text style={[type.label, styles.dtLabel, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>{t("bookViewing.viewingDate")}</Text>
                      <Pressable
                        onPress={() => setOpenField((f) => (f === "date" ? null : "date"))}
                        style={[
                          styles.trigger,
                          { borderRadius: radius.control, backgroundColor: colors.surfaceCard, borderColor: openField === "date" ? colors.borderFocus : colors.borderDefault },
                        ]}
                      >
                        <Text numberOfLines={1} style={[type.bodySm, styles.triggerText, { color: dateISO ? colors.textPrimary : colors.textPlaceholder, fontFamily: dateISO ? fontFamily.sansMedium : fontFamily.sans }]}>
                          {dateISO ? formatDayMonth(parseISODate(dateISO)) : t("bookViewing.selectDate")}
                        </Text>
                        <CalendarIcon size={16} color={colors.textTertiary} strokeWidth={2} />
                      </Pressable>
                    </View>
                    <View style={styles.dtField}>
                      <Text style={[type.label, styles.dtLabel, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>{t("bookViewing.viewingTime")}</Text>
                      <Pressable
                        disabled={!dateISO}
                        onPress={() => setOpenField((f) => (f === "time" ? null : "time"))}
                        style={[
                          styles.trigger,
                          { borderRadius: radius.control, backgroundColor: colors.surfaceCard, borderColor: openField === "time" ? colors.borderFocus : colors.borderDefault, opacity: dateISO ? 1 : 0.55 },
                        ]}
                      >
                        <Text numberOfLines={1} style={[type.bodySm, styles.triggerText, { color: time ? colors.textPrimary : colors.textPlaceholder, fontFamily: time ? fontFamily.sansMedium : fontFamily.sans }]}>
                          {time ? formatTimeSlot(time) : dateISO ? t("bookViewing.selectTime") : t("bookViewing.pickDateFirst")}
                        </Text>
                        <Clock size={16} color={colors.textTertiary} strokeWidth={2} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Calendar dropdown */}
                  {openField === "date" ? (
                    <View style={[styles.dropdown, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.lg }]}>
                      <View style={styles.calHead}>
                        <Pressable onPress={() => setViewMonth(new Date(year, month - 1, 1))} hitSlop={8} style={styles.calNav}>
                          <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
                        </Pressable>
                        <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
                          {monthNameFull(viewMonth)} {year}
                        </Text>
                        <Pressable onPress={() => setViewMonth(new Date(year, month + 1, 1))} hitSlop={8} style={styles.calNav}>
                          <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />
                        </Pressable>
                      </View>
                      <View style={styles.calGrid}>
                        {weekdayHeaders().map((w) => (
                          <View key={w} style={styles.calCell}>
                            <Text style={[type.caption, { color: colors.textTertiary, fontFamily: fontFamily.sansBold, fontSize: 10.5 }]}>{w}</Text>
                          </View>
                        ))}
                        {cells.map((d, i) => {
                          if (!d) return <View key={"e" + i} style={styles.calCell} />;
                          const iso = toISODate(d);
                          const past = d < today;
                          const closed = isClosedDay(d);
                          const status = dayStatus.get(iso);
                          const full = status === "full";
                          const disabled = past || closed || full;
                          const selected = iso === dateISO;
                          const isToday = iso === todayISO;
                          return (
                            <View key={iso} style={styles.calCell}>
                              <Pressable
                                disabled={disabled}
                                onPress={() => pickDay(d)}
                                style={[styles.calDay, { borderRadius: radius.sm, backgroundColor: selected ? colors.brandSubtle : full ? colors.ringError : "transparent" }]}
                              >
                                <Text
                                  style={[
                                    type.bodySm,
                                    {
                                      color: full ? colors.textError : selected || isToday ? colors.brandForeground : past || closed ? colors.textPlaceholder : colors.textPrimary,
                                      fontFamily: selected || isToday ? fontFamily.sansSemibold : fontFamily.sansMedium,
                                      textDecorationLine: full ? "line-through" : "none",
                                    },
                                  ]}
                                >
                                  {d.getDate()}
                                </Text>
                                {status === "partial" && !selected ? <View style={[styles.calDot, { backgroundColor: colors.error }]} /> : null}
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  {/* Time dropdown — single-column slot list */}
                  {openField === "time" ? (
                    <View style={[styles.dropdown, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.lg }]}>
                      <ScrollView style={{ maxHeight: 244 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} nestedScrollEnabled>
                        {VIEWING_SLOTS.map((slot) => {
                          const reserved = reservedTimes?.has(slot) ?? false;
                          const selected = slot === time;
                          return (
                            <Pressable
                              key={slot}
                              disabled={reserved}
                              onPress={() => pickTime(slot)}
                              style={[
                                styles.slotRow,
                                {
                                  borderRadius: radius.md,
                                  backgroundColor: reserved ? colors.ringError : selected ? colors.brandSubtle : colors.surfaceCard,
                                  borderColor: reserved ? colors.ringError : selected ? colors.brandForeground : colors.borderSubtle,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  type.bodySm,
                                  {
                                    color: reserved ? colors.textError : selected ? colors.brandForeground : colors.textPrimary,
                                    fontFamily: selected ? fontFamily.sansSemibold : fontFamily.sansMedium,
                                    textDecorationLine: reserved ? "line-through" : "none",
                                  },
                                ]}
                              >
                                {formatTimeSlot(slot)}
                              </Text>
                              {reserved ? (
                                <Text style={[type.caption, { color: colors.textError, fontFamily: fontFamily.sansSemibold, fontSize: 10, letterSpacing: 0.4 }]}>
                                  {t("bookViewing.reserved").toUpperCase()}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}
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
                    if (!dateISO || !time) return;
                    onConfirm?.({ date: parseISODate(dateISO), time });
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
  dtRow: { flexDirection: "row", gap: 12 },
  dtField: { flex: 1, gap: 6 },
  dtLabel: { fontSize: 12.5 },
  trigger: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  triggerText: { flex: 1 },
  dropdown: { marginTop: 12, borderWidth: 1, padding: 10 },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 2 },
  calNav: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: `${100 / 7}%`, alignItems: "center", justifyContent: "center", paddingVertical: 2 },
  calDay: { position: "relative", width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  calDot: { position: "absolute", bottom: 5, width: 5, height: 5, borderRadius: 2.5 },
  slotRow: { minHeight: 40, paddingHorizontal: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
