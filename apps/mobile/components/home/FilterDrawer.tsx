import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import {
  propertyTypes,
  beds,
  baths,
  amenities,
  searchCities,
  emptyFilters,
  countFilters,
  type Filters,
} from "./data";
import { PriceRange } from "./PriceRange";
import { AreaRange } from "./AreaRange";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

function Chip({
  label,
  Icon,
  selected,
  onPress,
}: {
  label: string;
  Icon?: LucideIcon;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, fontFamily, radius } = useTheme();
  const fg = selected ? colors.brandForeground : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          borderColor: selected ? colors.brandForeground : colors.borderDefault,
          backgroundColor: selected ? colors.brandSubtle : colors.surfaceCard,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {Icon ? <Icon size={16} color={fg} strokeWidth={2} /> : null}
      <Text style={[styles.chipTxt, { color: fg, fontFamily: selected ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Current deal chip — decides which price presets to show. */
  deal: string;
  value: Filters;
  onApply: (f: Filters) => void;
}

/** FilterDrawer — a bottom-sheet with the website's search filters. */
export function FilterDrawer({ open, onClose, deal, value, onApply }: FilterDrawerProps) {
  const { colors, type, fontFamily, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(open);
  const [draft, setDraft] = useState<Filters>(value);
  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setDraft(value);
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

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const n = countFilters(draft);

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <AnimatedPressable
          onPress={onClose}
          style={[styles.scrim, { opacity: scrim, backgroundColor: colors.overlay }]}
        />

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
            <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 22 }]}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.surfaceSunken }]}>
              <X size={18} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            <Section title="Location">
              {searchCities.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={draft.cities.includes(c)}
                  onPress={() => setDraft((d) => ({ ...d, cities: toggle(d.cities, c) }))}
                />
              ))}
            </Section>

            <Section title="Property type">
              {propertyTypes.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  Icon={o.Icon}
                  selected={draft.types.includes(o.value)}
                  onPress={() => setDraft((d) => ({ ...d, types: toggle(d.types, o.value) }))}
                />
              ))}
            </Section>

            <View style={styles.section}>
              <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
                {deal === "rent" ? "Monthly rent" : "Price range"}
              </Text>
              <PriceRange value={draft.price} onChange={(p) => setDraft((d) => ({ ...d, price: p }))} />
            </View>

            <View style={styles.section}>
              <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>Property size</Text>
              <AreaRange value={draft.size} onChange={(s) => setDraft((d) => ({ ...d, size: s }))} />
            </View>

            <Section title="Bedrooms">
              {beds.map((o) => (
                <Chip
                  key={o.value || "any"}
                  label={o.label}
                  selected={draft.beds === o.value}
                  onPress={() => setDraft((d) => ({ ...d, beds: o.value }))}
                />
              ))}
            </Section>

            <Section title="Bathrooms">
              {baths.map((o) => (
                <Chip
                  key={o.value || "any"}
                  label={o.label}
                  selected={draft.baths === o.value}
                  onPress={() => setDraft((d) => ({ ...d, baths: o.value }))}
                />
              ))}
            </Section>

            <Section title="Amenities">
              {amenities.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  Icon={o.Icon}
                  selected={draft.amenities.includes(o.value)}
                  onPress={() => setDraft((d) => ({ ...d, amenities: toggle(d.amenities, o.value) }))}
                />
              ))}
            </Section>
          </ScrollView>

          <View
            style={[
              styles.foot,
              { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Button title="Reset" variant="secondary" onPress={() => setDraft(emptyFilters)} />
            </View>
            <View style={{ flex: 1.5 }}>
              <Button
                title={n ? `Apply (${n})` : "Apply"}
                onPress={() => {
                  onApply(draft);
                  onClose();
                }}
              />
            </View>
          </View>
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
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 14 },
  foot: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
