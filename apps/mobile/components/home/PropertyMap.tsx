import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { House } from "lucide-react-native";
import { useTheme } from "@/theme";
import { PropertyCard } from "./PropertyCard";
import { listingCoords, priceLabel, type Listing } from "./data";

// Region framing all of Kurdistan (Erbil · Sulaymaniyah · Duhok).
const KURDISTAN: Region = { latitude: 36.2, longitude: 44.2, latitudeDelta: 2.4, longitudeDelta: 3.4 };

/** PropertyMap — a real map of Kurdistan with a price pin per listing; tap a pin
 *  to preview the property in a card that floats above the map. */
export function PropertyMap({ listings }: { listings: Listing[] }) {
  const { colors, fontFamily } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset the selection whenever the result set changes (e.g. after filtering).
  useEffect(() => {
    setSelectedId(null);
  }, [listings]);

  const selected = listings.find((l) => l.id === selectedId) ?? null;

  return (
    <View style={styles.fill}>
      <MapView ref={mapRef} style={styles.map} initialRegion={KURDISTAN} onPress={() => setSelectedId(null)}>
        {listings.map((l) => {
          const c = listingCoords(l);
          const on = l.id === selectedId;
          return (
            <Marker
              key={l.id}
              coordinate={{ latitude: c.lat, longitude: c.lng }}
              onPress={(e) => {
                e.stopPropagation?.();
                setSelectedId(l.id);
              }}
              tracksViewChanges={false}
            >
              <View style={[styles.pin, { backgroundColor: on ? colors.brandPrimary : "#FFFFFF" }]}>
                <View style={[styles.pinDot, { backgroundColor: on ? "rgba(255,255,255,0.22)" : colors.iconTileBg }]}>
                  <House size={11} color={on ? "#FFFFFF" : colors.brandForeground} strokeWidth={2.5} />
                </View>
                <Text style={[styles.pinTxt, { color: on ? "#FFFFFF" : "#1A2A22", fontFamily: fontFamily.sansBold }]}>
                  {priceLabel(l)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selected ? (
        <View style={styles.previewWrap}>
          <PropertyCard property={selected} fullWidth />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: "hidden" },
  // Extend past the container's bottom edge so Apple Maps' logo + "Legal" link
  // (bottom-left) are clipped away.
  map: { position: "absolute", top: -14, left: 0, right: 0, bottom: -28 },
  pin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  pinTxt: { fontSize: 13 },
  previewWrap: { position: "absolute", left: 16, right: 16, bottom: 16 },
});
