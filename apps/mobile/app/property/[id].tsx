import { useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Dimensions, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  CircleCheck,
  Sofa,
  SquareParking,
  Home,
  CalendarCheck,
  Layers,
  Compass,
  BadgeCheck,
  X,
  Navigation,
  type LucideIcon,
} from "lucide-react-native";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "@/theme";
import { useTranslation, type TKey } from "@/lib/i18n";
import { formatTimeSlot } from "@/lib/i18n/format";
import { rtlFlip } from "@/lib/rtl";
import { Button } from "@/components/ui";
import { useIsFavorite, toggleFavorite } from "@/lib/favorites";
import { shareProperty } from "@/lib/share";
import { openDirections } from "@/lib/maps";
import { addViewing, toISODate, formatViewingDate } from "@/lib/viewings";
import { addNotification } from "@/lib/notifications";
import { BookViewingSheet } from "@/components/property/BookViewingSheet";
import { getListing, galleryFor, listingCoords, priceLabel, propertyTypes, amenities as amenityOpts, labelFor, optLabel, dealCategories, featuredAgents, getAgent } from "@/components/home/data";

const GALLERY_W = Dimensions.get("window").width - 40;

/* Map the raw English feature enum values to i18n keys so the Features grid
   renders them translated (en/ar/ku); fall back to the raw value if unmapped. */
const FURNISHING_KEYS: Record<string, TKey> = {
  "Unfurnished": "property.unfurnished",
  "Semi-furnished": "property.semiFurnished",
  "Fully furnished": "property.fullyFurnished",
};
const ORIENTATION_KEYS: Record<string, TKey> = {
  "North facing": "property.orientNorth",
  "South facing": "property.orientSouth",
  "East facing": "property.orientEast",
  "West facing": "property.orientWest",
};
const CONDITION_KEYS: Record<string, TKey> = {
  "New": "property.condNew",
  "Good": "property.condGood",
  "Needs renovation": "property.condNeedsReno",
};

function Gallery({ photos, onPressPhoto }: { photos: string[]; onPressPhoto: (i: number) => void }) {
  const { colors, radius } = useTheme();
  const [idx, setIdx] = useState(0);
  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / GALLERY_W))}
        style={[styles.gallery, { borderRadius: radius.card }]}
      >
        {photos.map((uri, i) => (
          <Pressable key={i} onPress={() => onPressPhoto(i)}>
            <Image source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.counter}>
        <Text style={styles.counterTxt}>
          {idx + 1} / {photos.length}
        </Text>
      </View>
      <View style={styles.dots}>
        {photos.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { width: i === idx ? 18 : 6, backgroundColor: i === idx ? colors.brandForeground : colors.borderStrong }]}
          />
        ))}
      </View>
    </View>
  );
}

/** Fullscreen swipeable photo viewer (lightbox). */
function PhotoViewer({ photos, startIndex, onClose }: { photos: string[]; startIndex: number; onClose: () => void }) {
  const { t } = useTranslation();
  const W = Dimensions.get("window").width;
  const H = Dimensions.get("window").height;
  const [idx, setIdx] = useState(startIndex);
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: startIndex * W, y: 0 }}
          onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
        >
          {photos.map((uri, i) => (
            <ScrollView
              key={i}
              style={{ width: W }}
              contentContainerStyle={styles.zoomContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              centerContent
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Image source={{ uri }} style={{ width: W, height: H }} resizeMode="contain" />
            </ScrollView>
          ))}
        </ScrollView>
        <Pressable onPress={onClose} hitSlop={10} style={styles.viewerClose} accessibilityLabel={t("property.close")}>
          <X size={24} color="#fff" strokeWidth={2} />
        </Pressable>
        <View style={styles.viewerCounter}>
          <Text style={styles.viewerCounterTxt}>
            {idx + 1} / {photos.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function Heading({ children }: { children: string }) {
  const { colors, type, fontFamily } = useTheme();
  return <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold, marginBottom: 14 }]}>{children}</Text>;
}

export default function PropertyDetailScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t, locale, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListing(id);
  const fav = useIsFavorite(id);
  const [viewer, setViewer] = useState<number | null>(null);
  const [bookOpen, setBookOpen] = useState(false);

  if (!listing) {
    return (
      <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: colors.surfacePage }]}>
        <Text style={[type.bodyLg, { color: colors.textPrimary }]}>{t("property.notFound")}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={[type.body, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>{t("property.goBack")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const typeLabel = labelFor(propertyTypes, listing.type);
  const TypeIcon = propertyTypes.find((tp) => tp.value === listing.type)?.Icon ?? Home;
  const dealLabel = labelFor(dealCategories, listing.deal === "rent" ? "rent" : "buy");
  const photos = galleryFor(listing);
  const coords = listingCoords(listing);

  const amenityList = listing.amenities.map((a) => labelFor(amenityOpts, a));
  const availability = listing.deal === "rent" ? t("property.availForRent") : t("property.availForSale");
  const areaStr = t("spec.areaSqm", { area: listing.area });
  const desc =
    locale === "ar"
      ? `${typeLabel}${listing.beds ? ` مكوّن من ${listing.beds} غرف نوم` : ""} في ${listing.address}، بمساحة ${areaStr} للمعيشة${
          amenityList.length ? ` ويضم ${amenityList.join("، ")}` : ""
        }. ${availability}`
      : `A ${listing.beds ? `${listing.beds}-bedroom ` : ""}${typeLabel.toLowerCase()} in ${listing.address}, offering ${areaStr} of living space${
          amenityList.length ? ` with ${amenityList.map((a) => a.toLowerCase()).join(", ")}` : ""
        }. ${availability}`;

  const statCols: { key: string; label: string; Icon: LucideIcon; value: string }[] = [
    ...(listing.beds != null ? [{ key: "beds", label: t("property.bedrooms"), Icon: BedDouble, value: String(listing.beds) }] : []),
    ...(listing.baths != null ? [{ key: "baths", label: t("property.bathrooms"), Icon: Bath, value: String(listing.baths) }] : []),
    { key: "area", label: t("property.builtUpArea"), Icon: Maximize, value: areaStr },
  ];

  // The Features grid mirrors exactly the Add-property wizard's fields — each
  // row shown only when the listing carries a value (land omits most).
  const tv = (keys: Record<string, TKey>, v: string) => (keys[v] ? t(keys[v]) : v);
  const features: { key: string; Icon: LucideIcon; label: string; value: string }[] = [
    { key: "type", Icon: TypeIcon, label: t("property.propertyType"), value: typeLabel },
    { key: "status", Icon: CircleCheck, label: t("property.status"), value: dealLabel },
    ...(listing.parking != null ? [{ key: "parking", Icon: SquareParking, label: t("property.parking"), value: String(listing.parking) }] : []),
    ...(listing.floor != null ? [{ key: "floor", Icon: Layers, label: t("property.floor"), value: String(listing.floor) }] : []),
    ...(listing.year != null ? [{ key: "year", Icon: CalendarCheck, label: t("property.yearBuilt"), value: String(listing.year) }] : []),
    ...(listing.orientation ? [{ key: "orientation", Icon: Compass, label: t("property.orientation"), value: tv(ORIENTATION_KEYS, listing.orientation) }] : []),
    ...(listing.condition ? [{ key: "condition", Icon: BadgeCheck, label: t("property.condition"), value: tv(CONDITION_KEYS, listing.condition) }] : []),
    ...(listing.furnishing ? [{ key: "furnishing", Icon: Sofa, label: t("property.furnishing"), value: tv(FURNISHING_KEYS, listing.furnishing) }] : []),
  ];

  // The property's assigned agent — the same agent the admin manages for this
  // listing (falls back to a featured agent if the link is ever missing).
  const agent = getAgent(listing.agentId) ?? featuredAgents[0];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.plainBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} style={rtlFlip(isRTL)} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("property.title")}</Text>
        <Pressable onPress={() => shareProperty(listing)} hitSlop={8} style={[styles.hbtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}>
          <Share2 size={19} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Gallery */}
        <View style={styles.heroWrap}>
          <Gallery photos={photos} onPressPhoto={(i) => setViewer(i)} />
          <View style={styles.badge}>
            <Text style={[styles.badgeTxt, { color: colors.brandPrimary, fontFamily: fontFamily.sansSemibold }]}>{dealLabel}</Text>
          </View>
          <Pressable onPress={() => toggleFavorite(id)} style={styles.heart} hitSlop={8}>
            <Heart size={20} color={fav ? colors.error : "#33383F"} fill={fav ? colors.error : "transparent"} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Title + price */}
          <View style={styles.titleRow}>
            <Text style={[type.displaySm, styles.title, { color: colors.textPrimary, fontSize: 26, lineHeight: 32 }]}>{listing.title}</Text>
            <Text style={[type.bodyLg, { color: colors.brandForeground, fontFamily: fontFamily.sansBold }]}>{priceLabel(listing)}</Text>
          </View>
          <View style={styles.loc}>
            <MapPin size={16} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[type.body, { color: colors.textSecondary }]}>{listing.address}</Text>
          </View>

          {/* Key stats */}
          <View style={[styles.statsCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
            {statCols.map((s, i) => (
              <View
                key={s.key}
                style={[styles.statCol, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.borderSubtle }]}
              >
                <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>{s.label}</Text>
                <View style={styles.statRow}>
                  <View style={[styles.statIcon, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder }]}>
                    <s.Icon size={18} color={colors.brandForeground} strokeWidth={2} />
                  </View>
                  <Text
                    style={[styles.statValue, { color: colors.textPrimary, fontFamily: fontFamily.sansBold }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {s.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Heading>{t("property.description")}</Heading>
            <Text style={[type.body, { color: colors.textSecondary, lineHeight: 24 }]}>{desc}</Text>
          </View>

          {/* Property features */}
          <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
            <Heading>{t("property.features")}</Heading>
            <View style={styles.featGrid}>
              {features.map((f) => (
                <View key={f.key} style={styles.feat}>
                  <View style={[styles.featIcon, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder }]}>
                    <f.Icon size={18} color={colors.brandForeground} strokeWidth={2} />
                  </View>
                  <View style={styles.featText}>
                    <Text numberOfLines={1} style={[type.caption, { color: colors.textTertiary }]}>{f.label}</Text>
                    <Text numberOfLines={1} style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
                      {f.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Amenities */}
          {listing.amenities.length > 0 ? (
            <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
              <Heading>{t("property.amenities")}</Heading>
              <View style={styles.wrap}>
                {listing.amenities.map((a) => {
                  const opt = amenityOpts.find((o) => o.value === a);
                  const Icon = opt?.Icon;
                  return (
                    <View key={a} style={[styles.amenity, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.pill }]}>
                      {Icon ? <Icon size={15} color={colors.brandForeground} strokeWidth={2} /> : null}
                      <Text style={[type.bodySm, { color: colors.textSecondary }]}>{opt ? optLabel(opt) : a}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Location */}
          <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
            <Heading>{t("property.location")}</Heading>
            <Pressable
              onPress={() => openDirections({ lat: coords.lat, lng: coords.lng, label: listing.title })}
              style={({ pressed }) => [styles.map, { borderColor: colors.borderSubtle, borderRadius: radius.card, opacity: pressed ? 0.85 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={t("property.directionsA11y", { address: listing.address })}
            >
              <MapView
                style={styles.mapView}
                pointerEvents="none"
                initialRegion={{ latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={listing.title} description={listing.address} pinColor={colors.brandPrimary} />
              </MapView>
              <View style={[styles.mapCta, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.pill }]} pointerEvents="none">
                <Navigation size={14} color={colors.brandForeground} strokeWidth={2.2} />
                <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("property.directions")}</Text>
              </View>
            </Pressable>
            <View style={styles.mapAddr}>
              <MapPin size={15} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.bodySm, { color: colors.textSecondary }]}>{listing.address}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View style={[styles.bar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={() => router.push({ pathname: "/agents/[id]", params: { id: agent.id } })}
          style={[styles.agentBtn, { borderColor: colors.borderSubtle }]}
          accessibilityRole="button"
          accessibilityLabel={t("property.contactA11y", { name: agent.name })}
        >
          <Image source={{ uri: agent.photo }} style={styles.agentImg} resizeMode="cover" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            title={t("property.bookViewing")}
            left={<CalendarCheck size={19} color={colors.textOnBrand} strokeWidth={2} />}
            onPress={() => setBookOpen(true)}
          />
        </View>
      </View>

      {viewer !== null ? <PhotoViewer photos={photos} startIndex={viewer} onClose={() => setViewer(null)} /> : null}

      <BookViewingSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        propertyId={listing.id}
        property={{ title: listing.title, address: listing.address }}
        agent={{ name: agent.name, city: agent.city, photo: agent.photo, verified: agent.verified, rating: agent.rating, reviews: agent.reviews }}
        onConfirm={({ date, time }) => {
          const iso = toISODate(date);
          addViewing({
            id: `${listing.id}-${Date.now()}`,
            propertyId: listing.id,
            title: listing.title,
            address: listing.address,
            cover: listing.cover,
            agentId: agent.id,
            agentName: agent.name,
            agentPhoto: agent.photo,
            date: iso,
            time,
            status: "requested",
            createdAt: Date.now(),
          });
          addNotification({
            type: "viewing",
            title: t("notif.viewingRequestedTitle"),
            body: t("notif.viewingRequestedBody", { title: listing.title, date: formatViewingDate(iso), time: formatTimeSlot(time), agent: agent.name }),
            href: "/(tabs)/viewings",
          });
        }}
      />
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
  hbtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  plainBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginStart: -8 },
  heroWrap: { paddingHorizontal: 20, paddingTop: 8 },
  gallery: { width: GALLERY_W, height: 260, overflow: "hidden", backgroundColor: "#e9edf0" },
  galleryImg: { width: GALLERY_W, height: 260 },
  counter: {
    position: "absolute",
    bottom: 32,
    end: 32,
    backgroundColor: "rgba(11,32,24,0.7)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },
  badge: {
    position: "absolute",
    top: 20,
    start: 32,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeTxt: { fontSize: 12 },
  heart: {
    position: "absolute",
    top: 20,
    end: 32,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  title: { flex: 1 },
  loc: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  section: { marginTop: 28 },
  sectionDivided: { marginTop: 24, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth },
  statsCard: { flexDirection: "row", marginTop: 20, borderWidth: 1, overflow: "hidden" },
  statCol: { flex: 1, paddingHorizontal: 12, paddingVertical: 16 },
  statLabel: { fontSize: 11, letterSpacing: 0.6 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  statIcon: { width: 36, height: 36, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue: { fontSize: 18, flexShrink: 1 },
  featGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 18 },
  feat: { width: "47%", flexDirection: "row", alignItems: "center", gap: 10 },
  featIcon: { width: 40, height: 40, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  featText: { flex: 1 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenity: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 12, borderWidth: 1 },
  map: { height: 190, borderWidth: 1, overflow: "hidden", backgroundColor: "#e9edf0" },
  // Extend below the clipped container so Apple's bottom attribution is cropped.
  mapView: { position: "absolute", top: -14, left: 0, right: 0, bottom: -26 },
  mapCta: {
    position: "absolute",
    bottom: 12,
    end: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mapAddr: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
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
  agentBtn: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, overflow: "hidden" },
  agentImg: { width: "100%", height: "100%", backgroundColor: "#e9edf0" },
  viewer: { flex: 1, backgroundColor: "#000" },
  zoomContent: { flexGrow: 1, justifyContent: "center" },
  viewerClose: {
    position: "absolute",
    top: 52,
    end: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCounter: {
    position: "absolute",
    bottom: 44,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewerCounterTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
