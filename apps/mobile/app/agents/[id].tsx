import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Star,
  Phone,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { rtlFlip } from "@/lib/rtl";
import { AgentAvatar, Button, WhatsAppIcon } from "@/components/ui";
import { PropertyCard } from "@/components/home/PropertyCard";
import { getAgent, listings, user } from "@/components/home/data";
import { reviewsForAgent } from "@/components/home/reviews-data";
import { confirm } from "@/lib/confirm";
import { shareAgent } from "@/lib/share";

interface Review {
  id: string;
  name: string;
  stars: number;
  when: string;
  text: string;
  own?: boolean;
  /** New reviews stay "pending" until an admin approves them; approved reviews are public. */
  status?: "pending" | "approved";
}

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

function StatTile({ Icon, value, label }: { Icon: LucideIcon; value: string; label: string }) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.md }]}>
      <Icon size={19} color={colors.brandForeground} strokeWidth={2} />
      <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansBold, marginTop: 6 }]}>{value}</Text>
      <Text style={[type.caption, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

function Heading({ children }: { children: string }) {
  const { colors, type, fontFamily } = useTheme();
  return <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold, marginBottom: 14 }]}>{children}</Text>;
}

function StarPicker({ value, onChange, size = 30 }: { value: number; onChange: (n: number) => void; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.starPick}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={4}>
          <Star size={size} color={colors.warning} fill={i <= value ? colors.warning : "transparent"} strokeWidth={i <= value ? 0 : 1.5} />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewComposer({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Review | null;
  onSubmit: (stars: number, text: string) => void;
  onCancel?: () => void;
}) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const editing = !!initial;
  const [rating, setRating] = useState(initial?.stars ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const [focused, setFocused] = useState(false);
  const canPost = rating > 0 && text.trim().length > 0;

  const post = () => {
    if (!canPost) return;
    onSubmit(rating, text.trim());
    if (!editing) {
      setRating(0);
      setText("");
    }
  };

  return (
    <View style={[styles.composer, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
      <View style={styles.composerHead}>
        <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>
          {editing ? t("agentDetail.editReview") : t("agentDetail.rateExperience")}
        </Text>
        {onCancel ? (
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>{t("common.cancel")}</Text>
          </Pressable>
        ) : null}
      </View>
      <StarPicker value={rating} onChange={setRating} />
      <TextInput
        style={[
          styles.composerInput,
          type.body,
          { color: colors.textPrimary, borderColor: focused ? colors.borderFocus : colors.borderSubtle, borderRadius: radius.control },
          focused && { boxShadow: `0 0 0 4px ${colors.ringBrand}` },
        ]}
        value={text}
        onChangeText={setText}
        placeholder={t("agentDetail.sharePlaceholder")}
        placeholderTextColor={colors.textPlaceholder}
        multiline
        selectionColor={colors.brandForeground}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <Button title={editing ? t("agentDetail.updateReview") : t("agentDetail.postReview")} onPress={post} disabled={!canPost} />
    </View>
  );
}

function ReviewCard({ review: r, onEdit, onDelete }: { review: Review; onEdit?: () => void; onDelete?: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.review, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
      <View style={styles.reviewHead}>
        <View style={[styles.reviewAvatar, { backgroundColor: colors.brandPrimary }]}>
          <Text style={{ color: "#fff", fontSize: 13, fontFamily: fontFamily.sansSemibold }}>{initials(r.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{r.name}</Text>
          <Text style={[type.caption, { color: colors.textTertiary }]}>{r.when}</Text>
        </View>
        {r.status === "pending" ? (
          <View style={[styles.pendingBadge, { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder }]}>
            <Text style={[type.caption, { color: colors.warningText, fontFamily: fontFamily.sansSemibold }]}>{t("agentDetail.pendingBadge")}</Text>
          </View>
        ) : (
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={13} color={colors.warning} fill={i <= r.stars ? colors.warning : "transparent"} strokeWidth={i <= r.stars ? 0 : 1.5} />
            ))}
          </View>
        )}
      </View>
      {r.status === "pending" ? (
        <View style={styles.pendingStarsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={13} color={colors.warning} fill={i <= r.stars ? colors.warning : "transparent"} strokeWidth={i <= r.stars ? 0 : 1.5} />
          ))}
        </View>
      ) : null}
      <Text style={[type.bodySm, { color: colors.textSecondary, lineHeight: 21, marginTop: 10 }]}>“{r.text}”</Text>
      {r.status === "pending" ? (
        <Text style={[type.caption, { color: colors.textTertiary, marginTop: 8 }]}>{t("agentDetail.pendingNote")}</Text>
      ) : null}
      {onEdit || onDelete ? (
        <View style={styles.reviewActions}>
          {onEdit ? (
            <Pressable onPress={onEdit} hitSlop={6}>
              <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>{t("agentDetail.edit")}</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} hitSlop={6}>
              <Text style={[type.bodySm, { color: colors.textError, fontFamily: fontFamily.sansSemibold }]}>{t("agentDetail.delete")}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function AgentDetailScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t, locale, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agent = getAgent(id);
  /** Localized "N ago" label for a review, from its age in days. */
  const relLabel = (days: number) => {
    if (days <= 0) return t("agentDetail.justNow");
    if (days < 7) return t("agentDetail.daysAgo", { count: days });
    if (days < 30) return t("agentDetail.weeksAgo", { count: Math.round(days / 7) });
    if (days < 365) return t("agentDetail.monthsAgo", { count: Math.round(days / 30) });
    return t("agentDetail.yearsAgo", { count: Math.round(days / 365) });
  };
  const [reviews, setReviews] = useState<Review[]>(() =>
    reviewsForAgent(agent?.id ?? "").map((r) => ({ id: r.id, name: r.name, stars: r.stars, when: relLabel(r.daysAgo), text: r.text, status: "approved" as const })),
  );
  const [editing, setEditing] = useState<Review | null>(null);

  const addReview = (stars: number, text: string) => {
    // Reviews are not published straight away — they wait for admin approval.
    setReviews((rs) => [{ id: `r-${Date.now()}`, name: user.fullName, stars, when: t("agentDetail.justNow"), text, own: true, status: "pending" }, ...rs]);
    Alert.alert(t("agentDetail.submittedTitle"), t("agentDetail.submittedMessage"));
  };
  const updateReview = (rid: string, stars: number, text: string) =>
    setReviews((rs) => rs.map((r) => (r.id === rid ? { ...r, stars, text, when: t("agentDetail.editedJustNow") } : r)));
  const deleteReview = (rid: string) => setReviews((rs) => rs.filter((r) => r.id !== rid));
  const confirmDelete = (rid: string) =>
    confirm({
      title: t("agentDetail.deleteReviewTitle"),
      message: t("agentDetail.deleteReviewMessage"),
      confirmLabel: t("agentDetail.deleteReviewTitle"),
      destructive: true,
      icon: Trash2,
      onConfirm: () => deleteReview(rid),
    });

  if (!agent) {
    return (
      <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: colors.surfacePage }]}>
        <Text style={[type.bodyLg, { color: colors.textPrimary }]}>{t("agentDetail.notFound")}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={[type.body, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>{t("agentDetail.goBack")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const first = agent.name.split(" ")[0];
  const sold = agent.sold;
  const experience = agent.experience;
  const hasReviews = agent.reviews > 0;
  /* Track-record clause only when there are approved reviews / closed deals, so
     new agents (0 reviews) don't read as "0-star across 0 reviews". */
  const trackAr = hasReviews
    ? `بتقييم ${agent.rating.toFixed(1)} نجمة عبر ${agent.reviews} مراجعة و${agent.listings} إعلانًا نشطًا، `
    : `مع ${agent.listings} إعلانًا نشطًا، `;
  const trackEn = hasReviews
    ? `With a ${agent.rating.toFixed(1)}-star rating across ${agent.reviews} client reviews and ${agent.listings} active listings, `
    : `With ${agent.experience} years of experience and ${agent.listings} active listings, `;
  const trackKu = hasReviews
    ? `بە هەڵسەنگاندنی ${agent.rating.toFixed(1)} ئەستێرە لە ${agent.reviews} پێداچوونەوە و ${agent.listings} ئاگاداری چالاک، `
    : `لەگەڵ ${agent.experience} ساڵ ئەزموون و ${agent.listings} ئاگاداری چالاک، `;
  const bio =
    locale === "ar"
      ? `${agent.name} وكيل موثّق ومقره ${agent.city}. ${trackAr}يساعد ${first} المشترين والبائعين والمستأجرين في العثور على المنزل المناسب في ${agent.city}.`
      : locale === "ku"
        ? `${agent.name} بریکارێکی پشتڕاستکراوە کە لە ${agent.city} نیشتەجێیە. ${trackKu}${first} یارمەتی کڕیار و فرۆشیار و بەکرێگرەکان دەدات ماڵی گونجاو لە ${agent.city} بدۆزنەوە.`
        : `${agent.name} is a verified agent based in ${agent.city}. ${trackEn}${first} helps buyers, sellers, and renters find the right home across ${agent.city}.`;
  const agentListings = listings.filter((l) => l.agentId === agent.id);
  /* Service areas — the districts the agent actually lists in (address prefix,
     e.g. "Empire World, Erbil" → "Empire World"), mirroring how the website
     profile derives them. Falls back to the agent's city when they have no
     live listings. No admin "specialties" field exists, so we don't fabricate one. */
  const serviceAreas = (() => {
    const districts = [...new Set(agentListings.map((l) => l.address.split(",")[0].trim()).filter(Boolean))];
    return (districts.length ? districts : [agent.city]).slice(0, 6);
  })();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.plainBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} style={rtlFlip(isRTL)} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("agentDetail.title")}</Text>
        <Pressable onPress={() => shareAgent(agent)} hitSlop={8} style={[styles.hbtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}>
          <Share2 size={19} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <AgentAvatar photo={agent.photo} name={agent.name} verified={agent.verified} size={100} />
          <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 26, marginTop: 14 }]}>{agent.name}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <MapPin size={15} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.bodySm, { color: colors.textSecondary }]}>{agent.city}</Text>
            </View>
          </View>
          {hasReviews ? (
            <View style={styles.factRow}>
              <Star size={15} color={colors.warning} fill={colors.warning} strokeWidth={0} />
              <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{agent.rating.toFixed(1)}</Text>
              <Text style={[type.bodySm, { color: colors.textTertiary }]}>{t("agentDetail.reviewsParen", { count: agent.reviews })}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <StatTile Icon={ClipboardList} value={String(agent.listings)} label={t("agentDetail.listings")} />
          <StatTile Icon={TrendingUp} value={String(sold)} label={t("agentDetail.sold")} />
          <StatTile Icon={CalendarCheck} value={t("property.yrs", { count: experience })} label={t("agentDetail.experience")} />
        </View>

        <View style={styles.body}>
          {/* About */}
          <View style={styles.section}>
            <Heading>{t("agentDetail.about", { name: first })}</Heading>
            <Text style={[type.body, { color: colors.textSecondary, lineHeight: 24 }]}>{bio}</Text>
            <Text style={[type.label, { color: colors.textSecondary, marginTop: 18, marginBottom: 10 }]}>{t("agentDetail.serviceAreas")}</Text>
            <View style={styles.chips}>
              {serviceAreas.map((s) => (
                <View key={s} style={[styles.chip, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.pill }]}>
                  <Text style={[type.bodySm, { color: colors.textSecondary }]}>{s}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Active listings */}
          {agentListings.length > 0 ? (
            <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.listHead}>
                <Heading>{t("agentDetail.activeListings")}</Heading>
                <Pressable onPress={() => router.push({ pathname: "/agent-listings/[id]", params: { id: agent.id } })} hitSlop={8}>
                  <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>{t("agentDetail.seeAll")}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        {agentListings.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listScroll}>
            {agentListings.slice(0, 5).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.body}>
          {/* Reviews */}
          <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.listHead}>
              <Heading>{t("agentDetail.reviews")}</Heading>
              <Text style={[type.bodySm, { color: colors.textTertiary }]}>{reviews.filter((r) => r.status !== "pending").length}</Text>
            </View>
            <ReviewComposer
              key={editing?.id ?? "new"}
              initial={editing}
              onSubmit={(stars, text) => {
                if (editing) updateReview(editing.id, stars, text);
                else addReview(stars, text);
                setEditing(null);
              }}
              onCancel={editing ? () => setEditing(null) : undefined}
            />
            {reviews.length === 0 ? (
              <View style={[styles.reviewEmpty, { borderColor: colors.borderDefault, borderRadius: radius.card }]}>
                <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("agentDetail.noReviews")}</Text>
                <Text style={[type.bodySm, { color: colors.textSecondary, textAlign: "center", marginTop: 4 }]}>{t("agentDetail.noReviewsSub", { name: first })}</Text>
              </View>
            ) : (
              <View style={{ gap: 12, marginTop: 16 }}>
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    onEdit={r.own ? () => setEditing(r) : undefined}
                    onDelete={r.own ? () => confirmDelete(r.id) : undefined}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky contact bar */}
      <View style={[styles.bar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={() => Alert.alert(t("agentDetail.call"), t("agentDetail.callingMessage", { name: agent.name }))}
          style={[styles.callBtn, { borderColor: colors.borderDefault, borderRadius: radius.control }]}
        >
          <Phone size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            title={t("agentDetail.whatsapp")}
            left={<WhatsAppIcon size={19} color={colors.textOnBrand} />}
            onPress={() =>
              Linking.openURL(
                `https://wa.me/9647501234567?text=${encodeURIComponent(t("agentDetail.whatsappMessage", { name: agent.name }))}`,
              ).catch(() => {})
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  plainBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginStart: -8 },
  hbtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  factRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  stats: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 24 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 16, borderWidth: 1 },
  body: { paddingHorizontal: 20 },
  section: { marginTop: 28 },
  sectionDivided: { marginTop: 24, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 34, paddingHorizontal: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  listScroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6, gap: 14 },
  composer: { padding: 16, borderWidth: 1, gap: 12 },
  composerHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  starPick: { flexDirection: "row", gap: 8 },
  composerInput: { minHeight: 88, borderWidth: 1, padding: 12, textAlignVertical: "top" },
  reviewActions: { flexDirection: "row", gap: 18, marginTop: 12 },
  review: { padding: 14, borderWidth: 1 },
  reviewEmpty: { alignItems: "center", paddingVertical: 26, paddingHorizontal: 18, borderWidth: 1, borderStyle: "dashed", marginTop: 16 },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  pendingBadge: { height: 22, paddingHorizontal: 9, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pendingStarsRow: { flexDirection: "row", gap: 2, marginTop: 10 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  starsRow: { flexDirection: "row", gap: 2 },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  callBtn: { width: 54, height: 54, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
