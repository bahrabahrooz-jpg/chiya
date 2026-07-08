import { useState } from "react";
import { View, Text, Image, ScrollView, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Share2,
  BadgeCheck,
  MapPin,
  Building2,
  Star,
  Phone,
  MessageCircle,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  type LucideIcon,
} from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { PropertyCard } from "@/components/home/PropertyCard";
import { getAgent, listings, user } from "@/components/home/data";

const SPECIALTIES = ["Luxury villas", "Apartments", "Investment", "New developments", "Family homes"];

interface Review {
  id: string;
  name: string;
  stars: number;
  when: string;
  text: string;
  own?: boolean;
}
const INITIAL_REVIEWS: Review[] = [
  { id: "r1", name: "Sara Mahmood", stars: 5, when: "2 weeks ago", text: "Incredibly professional and responsive — found us the perfect home within days." },
  { id: "r2", name: "Karwan Ali", stars: 5, when: "1 month ago", text: "Smooth process from viewing to keys. Deep knowledge of the local market." },
  { id: "r3", name: "Nma Hassan", stars: 4, when: "2 months ago", text: "Patient and honest throughout. Would happily recommend to friends." },
];

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
          <Star size={size} color={colors.brandAccent} fill={i <= value ? colors.brandAccent : "transparent"} strokeWidth={i <= value ? 0 : 1.5} />
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
          {editing ? "Edit your review" : "Rate your experience"}
        </Text>
        {onCancel ? (
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>Cancel</Text>
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
        placeholder="Share your experience…"
        placeholderTextColor={colors.textPlaceholder}
        multiline
        selectionColor={colors.brandForeground}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <Button title={editing ? "Update review" : "Post review"} onPress={post} disabled={!canPost} />
    </View>
  );
}

function ReviewCard({ review: r, onEdit, onDelete }: { review: Review; onEdit?: () => void; onDelete?: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
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
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={13} color={colors.brandAccent} fill={i <= r.stars ? colors.brandAccent : "transparent"} strokeWidth={i <= r.stars ? 0 : 1.5} />
          ))}
        </View>
      </View>
      <Text style={[type.bodySm, { color: colors.textSecondary, lineHeight: 21, marginTop: 10 }]}>“{r.text}”</Text>
      {onEdit || onDelete ? (
        <View style={styles.reviewActions}>
          {onEdit ? (
            <Pressable onPress={onEdit} hitSlop={6}>
              <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} hitSlop={6}>
              <Text style={[type.bodySm, { color: colors.textError, fontFamily: fontFamily.sansSemibold }]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function AgentDetailScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agent = getAgent(id);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [editing, setEditing] = useState<Review | null>(null);

  const addReview = (stars: number, text: string) =>
    setReviews((rs) => [{ id: `r-${Date.now()}`, name: user.fullName, stars, when: "Just now", text, own: true }, ...rs]);
  const updateReview = (rid: string, stars: number, text: string) =>
    setReviews((rs) => rs.map((r) => (r.id === rid ? { ...r, stars, text, when: "Edited just now" } : r)));
  const deleteReview = (rid: string) => setReviews((rs) => rs.filter((r) => r.id !== rid));
  const confirmDelete = (rid: string) =>
    Alert.alert("Delete review", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteReview(rid) },
    ]);

  if (!agent) {
    return (
      <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: colors.surfacePage }]}>
        <Text style={[type.bodyLg, { color: colors.textPrimary }]}>Agent not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={[type.body, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const first = agent.name.split(" ")[0];
  const sold = agent.listings * 4 + (agent.reviews % 15);
  const experience = 3 + (agent.listings % 7);
  const bio = `${agent.name} is a verified ${agent.agency} agent based in ${agent.city}. With a ${agent.rating.toFixed(
    1,
  )}-star rating across ${agent.reviews} client reviews and ${agent.listings} active listings, ${first} helps buyers, sellers, and renters find the right home across ${agent.city}.`;
  const agentListings = listings.slice(0, 5);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.plainBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>Agent Profile</Text>
        <Pressable onPress={() => Alert.alert("Share", "Sharing coming soon.")} hitSlop={8} style={[styles.hbtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}>
          <Share2 size={19} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View>
            <Image source={{ uri: agent.photo }} style={styles.avatar} resizeMode="cover" />
            {agent.verified ? (
              <View style={[styles.vbadge, { backgroundColor: colors.brandPrimary, borderColor: colors.surfacePage }]}>
                <BadgeCheck size={16} color={colors.textOnBrand} strokeWidth={2.5} />
              </View>
            ) : null}
          </View>
          <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 26, marginTop: 14 }]}>{agent.name}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Building2 size={15} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.bodySm, { color: colors.textSecondary }]}>{agent.agency}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: colors.borderStrong }]} />
            <View style={styles.metaItem}>
              <MapPin size={15} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.bodySm, { color: colors.textSecondary }]}>{agent.city}</Text>
            </View>
          </View>
          <View style={styles.factRow}>
            <Star size={15} color={colors.brandAccent} fill={colors.brandAccent} strokeWidth={0} />
            <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{agent.rating.toFixed(1)}</Text>
            <Text style={[type.bodySm, { color: colors.textTertiary }]}>({agent.reviews} reviews)</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <StatTile Icon={ClipboardList} value={String(agent.listings)} label="Listings" />
          <StatTile Icon={TrendingUp} value={String(sold)} label="Sold" />
          <StatTile Icon={CalendarCheck} value={`${experience} yrs`} label="Experience" />
        </View>

        <View style={styles.body}>
          {/* About */}
          <View style={styles.section}>
            <Heading>{`About ${first}`}</Heading>
            <Text style={[type.body, { color: colors.textSecondary, lineHeight: 24 }]}>{bio}</Text>
            <Text style={[type.label, { color: colors.textSecondary, marginTop: 18, marginBottom: 10 }]}>SPECIALTIES</Text>
            <View style={styles.chips}>
              {SPECIALTIES.map((s) => (
                <View key={s} style={[styles.chip, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.pill }]}>
                  <Text style={[type.bodySm, { color: colors.textSecondary }]}>{s}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Active listings */}
          <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.listHead}>
              <Heading>Active listings</Heading>
              <Pressable onPress={() => router.push("/search")} hitSlop={8}>
                <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>See all</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listScroll}>
          {agentListings.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </ScrollView>

        <View style={styles.body}>
          {/* Reviews */}
          <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.listHead}>
              <Heading>Reviews</Heading>
              <Text style={[type.bodySm, { color: colors.textTertiary }]}>{reviews.length}</Text>
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
          </View>
        </View>
      </ScrollView>

      {/* Sticky contact bar */}
      <View style={[styles.bar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={() => Alert.alert("Call", `Calling ${agent.name}…`)}
          style={[styles.callBtn, { borderColor: colors.borderDefault, borderRadius: radius.control }]}
        >
          <Phone size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            title="Message"
            left={<MessageCircle size={19} color={colors.textOnBrand} strokeWidth={2} />}
            onPress={() => Alert.alert("Message", `Opening a chat with ${agent.name}…`)}
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
  plainBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  hbtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#e9edf0" },
  vbadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
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
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 10 },
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
