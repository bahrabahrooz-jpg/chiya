import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Heart, MapPin, BedDouble, Bath, Maximize, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { useIsFavorite, toggleFavorite } from "@/lib/favorites";
import { priceLabel, labelFor, dealCategories, type Listing } from "./data";

function Spec({ Icon, label }: { Icon: LucideIcon; label: string }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.spec}>
      <Icon size={15} color={colors.textTertiary} strokeWidth={2} />
      <Text style={[type.bodySm, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

/** PropertyCard — image with deal badge + favorite, then title/price and specs. */
export function PropertyCard({ property: p, fullWidth = false }: { property: Listing; fullWidth?: boolean }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const fav = useIsFavorite(p.id);
  const dealLabel = labelFor(dealCategories, p.deal === "rent" ? "rent" : "buy");

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/property/[id]", params: { id: p.id } })}
      style={[
        styles.card,
        fullWidth && styles.cardFull,
        { backgroundColor: colors.surfaceCard, borderRadius: radius.card, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={[styles.media, { borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }]}>
        <Image source={{ uri: p.cover }} style={styles.img} resizeMode="cover" />
        <View style={styles.badge}>
          <Text style={[styles.badgeTxt, { color: colors.brandPrimary, fontFamily: fontFamily.sansSemibold }]}>{dealLabel}</Text>
        </View>
        <Pressable style={styles.heart} onPress={() => toggleFavorite(p.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("card.save")}>
          <Heart size={18} color={fav ? colors.error : "#33383F"} fill={fav ? colors.error : "transparent"} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[type.body, styles.title, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
            {p.title}
          </Text>
          <Text style={[type.body, { color: colors.brandForeground, fontFamily: fontFamily.sansBold }]}>{priceLabel(p)}</Text>
        </View>

        <View style={styles.loc}>
          <MapPin size={14} color={colors.textTertiary} strokeWidth={2} />
          <Text numberOfLines={1} style={[type.bodySm, styles.locTxt, { color: colors.textSecondary }]}>
            {p.address}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.specs}>
          {p.beds != null ? <Spec Icon={BedDouble} label={t("spec.bed", { count: p.beds })} /> : null}
          {p.baths != null ? <Spec Icon={Bath} label={t("spec.bath", { count: p.baths })} /> : null}
          <Spec Icon={Maximize} label={t("spec.areaSqm", { area: p.area })} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 280, borderWidth: 1 },
  cardFull: { width: "100%" },
  media: { height: 160, overflow: "hidden", backgroundColor: "#e9edf0" },
  img: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 12,
    start: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeTxt: { fontSize: 12 },
  heart: {
    position: "absolute",
    top: 10,
    end: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 14, gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1 },
  loc: { flexDirection: "row", alignItems: "center", gap: 5 },
  locTxt: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  specs: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 2 },
  spec: { flexDirection: "row", alignItems: "center", gap: 5 },
});
