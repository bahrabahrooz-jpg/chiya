import { useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Alert, Dimensions, Modal } from "react-native";
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
  X,
  type LucideIcon,
} from "lucide-react-native";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { useIsFavorite, toggleFavorite } from "@/lib/favorites";
import { addViewing, toISODate, formatViewingDate } from "@/lib/viewings";
import { addNotification } from "@/lib/notifications";
import { BookViewingSheet } from "@/components/property/BookViewingSheet";
import { getListing, galleryFor, listingCoords, priceLabel, propertyTypes, amenities as amenityOpts, labelFor, featuredAgents } from "@/components/home/data";

const GALLERY_W = Dimensions.get("window").width - 40;

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
        <Pressable onPress={onClose} hitSlop={10} style={styles.viewerClose} accessibilityLabel="Close">
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
        <Text style={[type.bodyLg, { color: colors.textPrimary }]}>Property not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={[type.body, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const typeLabel = labelFor(propertyTypes, listing.type);
  const TypeIcon = propertyTypes.find((t) => t.value === listing.type)?.Icon ?? Home;
  const dealLabel = listing.deal === "rent" ? "For Rent" : "For Sale";
  const photos = galleryFor(listing);
  const coords = listingCoords(listing);

  const desc = `A ${listing.beds ? `${listing.beds}-bedroom ` : ""}${typeLabel.toLowerCase()} in ${listing.address}, offering ${listing.area} m² of living space${
    listing.amenities.length ? ` with ${listing.amenities.map((a) => labelFor(amenityOpts, a).toLowerCase()).join(", ")}` : ""
  }. ${listing.deal === "rent" ? "Available to rent now." : "Now available for sale."}`;

  const statCols: { label: string; Icon: LucideIcon; value: string }[] = [
    ...(listing.beds != null ? [{ label: "BEDROOMS", Icon: BedDouble, value: String(listing.beds) }] : []),
    ...(listing.baths != null ? [{ label: "BATHROOMS", Icon: Bath, value: String(listing.baths) }] : []),
    { label: "BUILT-UP AREA", Icon: Maximize, value: `${listing.area} m²` },
  ];

  const features: { Icon: LucideIcon; label: string; value: string }[] = [
    { Icon: TypeIcon, label: "Property type", value: typeLabel },
    { Icon: CircleCheck, label: "Status", value: listing.status },
    { Icon: Sofa, label: "Furnishing", value: listing.amenities.includes("furnished") ? "Furnished" : "Unfurnished" },
    { Icon: SquareParking, label: "Parking", value: listing.amenities.includes("parking") ? "Available" : "Not available" },
  ];

  // Assign a listing agent deterministically (listings aren't linked to one yet).
  const agent = featuredAgents[[...listing.id].reduce((s, c) => s + c.charCodeAt(0), 0) % featuredAgents.length];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.plainBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>Property Details</Text>
        <Pressable onPress={() => Alert.alert("Share", "Sharing coming soon.")} hitSlop={8} style={[styles.hbtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}>
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
            <Heart size={20} color={fav ? colors.error : colors.textPrimary} fill={fav ? colors.error : "transparent"} strokeWidth={2} />
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
                key={s.label}
                style={[styles.statCol, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.borderSubtle }]}
              >
                <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>{s.label}</Text>
                <View style={styles.statRow}>
                  <View style={[styles.statIcon, { backgroundColor: colors.brandSubtle }]}>
                    <s.Icon size={18} color={colors.textPrimary} strokeWidth={2} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary, fontFamily: fontFamily.sansBold }]}>{s.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Heading>Description</Heading>
            <Text style={[type.body, { color: colors.textSecondary, lineHeight: 24 }]}>{desc}</Text>
          </View>

          {/* Property features */}
          <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
            <Heading>Property features</Heading>
            <View style={styles.featGrid}>
              {features.map((f) => (
                <View key={f.label} style={styles.feat}>
                  <View style={[styles.featIcon, { backgroundColor: colors.brandSubtle }]}>
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
              <Heading>Amenities</Heading>
              <View style={styles.wrap}>
                {listing.amenities.map((a) => {
                  const opt = amenityOpts.find((o) => o.value === a);
                  const Icon = opt?.Icon;
                  return (
                    <View key={a} style={[styles.amenity, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.pill }]}>
                      {Icon ? <Icon size={15} color={colors.brandForeground} strokeWidth={2} /> : null}
                      <Text style={[type.bodySm, { color: colors.textSecondary }]}>{opt?.label ?? a}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Location */}
          <View style={[styles.sectionDivided, { borderTopColor: colors.borderSubtle }]}>
            <Heading>Location</Heading>
            <View style={[styles.map, { borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
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
            </View>
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
          accessibilityLabel={`Contact ${agent.name}`}
        >
          <Image source={{ uri: agent.photo }} style={styles.agentImg} resizeMode="cover" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            title="Book a viewing"
            left={<CalendarCheck size={19} color={colors.textOnBrand} strokeWidth={2} />}
            onPress={() => setBookOpen(true)}
          />
        </View>
      </View>

      {viewer !== null ? <PhotoViewer photos={photos} startIndex={viewer} onClose={() => setViewer(null)} /> : null}

      <BookViewingSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        property={{ title: listing.title, address: listing.address }}
        agent={{ name: agent.name, agency: agent.agency, city: agent.city, photo: agent.photo, verified: agent.verified }}
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
            agentAgency: agent.agency,
            date: iso,
            time,
            status: "requested",
            createdAt: Date.now(),
          });
          addNotification({
            type: "viewing",
            title: "Viewing requested",
            body: `Your viewing of ${listing.title} on ${formatViewingDate(iso)} at ${time} is being confirmed by ${agent.name}.`,
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
  plainBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  heroWrap: { paddingHorizontal: 20, paddingTop: 8 },
  gallery: { width: GALLERY_W, height: 260, overflow: "hidden", backgroundColor: "#e9edf0" },
  galleryImg: { width: GALLERY_W, height: 260 },
  counter: {
    position: "absolute",
    bottom: 32,
    right: 32,
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
    left: 32,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeTxt: { fontSize: 12 },
  heart: {
    position: "absolute",
    top: 20,
    right: 32,
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
  statCol: { flex: 1, paddingHorizontal: 14, paddingVertical: 16 },
  statLabel: { fontSize: 11, letterSpacing: 0.6 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  statIcon: { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18 },
  featGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 18 },
  feat: { width: "47%", flexDirection: "row", alignItems: "center", gap: 10 },
  featIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featText: { flex: 1 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenity: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 12, borderWidth: 1 },
  map: { height: 190, borderWidth: 1, overflow: "hidden", backgroundColor: "#e9edf0" },
  // Extend below the clipped container so Apple's bottom attribution is cropped.
  mapView: { position: "absolute", top: -14, left: 0, right: 0, bottom: -26 },
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
    right: 16,
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
