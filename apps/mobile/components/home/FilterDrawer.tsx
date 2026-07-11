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
import { X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui";
import {
  propertyTypes,
  beds,
  baths,
  amenities,
  cityOpts,
  areaOptions,
  projectOptions,
  emptyFilters,
  countFilters,
  type Filters,
} from "./data";
import { SelectField, MultiSelectField } from "./SelectField";
import { PriceRange } from "./PriceRange";
import { AreaRange } from "./AreaRange";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

function Section({ title, first = false, children }: { title?: string; first?: boolean; children: ReactNode }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View
      style={[
        styles.section,
        // A hairline divider separates each group from the previous one.
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
      ]}
    >
      {title ? <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Current deal (all / buy / rent). */
  deal: string;
  value: Filters;
  onApply: (f: Filters, deal: string) => void;
}

/** FilterDrawer — the property filter sheet. Hybrid experience: chips for the
 *  two-option listing type, searchable multi-select dropdowns for larger sets
 *  (location, property type, amenities), dropdown selectors for beds/baths and
 *  min/max inputs for price and area. */
export function FilterDrawer({ open, onClose, deal, value, onApply }: FilterDrawerProps) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(open);
  const [draft, setDraft] = useState<Filters>(value);
  const [draftDeal, setDraftDeal] = useState(deal);
  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setDraft(value);
      setDraftDeal(deal);
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

  const n = countFilters(draft);
  const areaOpts = areaOptions(draft.cities);
  const projectOpts = projectOptions(draft.cities);

  /** Changing cities re-scopes areas/projects; drop selections outside the new scope. */
  const setCities = (cities: string[]) => {
    const validAreas = new Set(areaOptions(cities).map((o) => o.value));
    const validProjects = new Set(projectOptions(cities).map((o) => o.value));
    setDraft((d) => ({
      ...d,
      cities,
      areas: d.areas.filter((a) => validAreas.has(a)),
      projects: d.projects.filter((p) => validProjects.has(p)),
    }));
  };

  const dealChips = [
    { value: "buy", label: t("filters.buy") },
    { value: "rent", label: t("filters.rent") },
  ];

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
            <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 22 }]}>{t("filters.title")}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.surfaceSunken }]}>
              <X size={18} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
            <Section title={t("filters.listingType")} first>
              <View style={styles.dealRow}>
                {dealChips.map(({ value: v, label }) => {
                  const on = draftDeal === v;
                  return (
                    <Pressable
                      key={v}
                      // One tap switches; re-tapping the active chip clears back to "all".
                      onPress={() => setDraftDeal(on ? "all" : v)}
                      style={[
                        styles.dealChip,
                        {
                          borderRadius: radius.control,
                          borderColor: on ? colors.brandForeground : colors.borderDefault,
                          backgroundColor: on ? colors.brandSubtle : colors.surfaceCard,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text
                        style={[
                          styles.dealTxt,
                          {
                            color: on ? colors.brandForeground : colors.textSecondary,
                            fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title={t("filters.location")}>
              <MultiSelectField
                label={t("filters.city")}
                placeholder={t("filters.anyCity")}
                options={cityOpts}
                value={draft.cities}
                onChange={setCities}
              />
              <MultiSelectField
                label={t("filters.area")}
                placeholder={t("filters.anyArea")}
                options={areaOpts}
                value={draft.areas}
                onChange={(areas) => setDraft((d) => ({ ...d, areas }))}
              />
              <MultiSelectField
                label={t("filters.project")}
                placeholder={t("filters.anyProject")}
                options={projectOpts}
                value={draft.projects}
                onChange={(projects) => setDraft((d) => ({ ...d, projects }))}
              />
            </Section>

            <Section title={t("filters.propertyType")}>
              <MultiSelectField
                sheetTitle={t("filters.propertyType")}
                placeholder={t("filters.anyType")}
                options={propertyTypes}
                value={draft.types}
                onChange={(types) => setDraft((d) => ({ ...d, types }))}
              />
            </Section>

            <Section>
              <PriceRange
                title={draftDeal === "rent" ? t("filters.monthlyRent") : t("filters.priceRange")}
                value={draft.price}
                onChange={(p) => setDraft((d) => ({ ...d, price: p }))}
              />
            </Section>

            <Section>
              <AreaRange title={t("filters.propertySize")} value={draft.size} onChange={(s) => setDraft((d) => ({ ...d, size: s }))} />
            </Section>

            <Section title={t("filters.rooms")}>
              <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                  <SelectField
                    label={t("filters.bedrooms")}
                    placeholder={t("filters.any")}
                    options={beds}
                    value={draft.beds}
                    onChange={(v) => setDraft((d) => ({ ...d, beds: v }))}
                  />
                </View>
                <View style={styles.pairItem}>
                  <SelectField
                    label={t("filters.bathrooms")}
                    placeholder={t("filters.any")}
                    options={baths}
                    value={draft.baths}
                    onChange={(v) => setDraft((d) => ({ ...d, baths: v }))}
                  />
                </View>
              </View>
            </Section>

            <Section title={t("filters.amenities")}>
              <MultiSelectField
                sheetTitle={t("filters.amenities")}
                placeholder={t("filters.anyAmenities")}
                options={amenities}
                value={draft.amenities}
                onChange={(a) => setDraft((d) => ({ ...d, amenities: a }))}
              />
            </Section>
          </ScrollView>

          <View
            style={[
              styles.foot,
              { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Button
                title={t("filters.resetAll")}
                variant="secondary"
                onPress={() => {
                  setDraft(emptyFilters);
                  setDraftDeal("all");
                }}
              />
            </View>
            <View style={{ flex: 1.5 }}>
              <Button
                title={n ? t("filters.applyN", { count: n }) : t("filters.apply")}
                onPress={() => {
                  onApply(draft, draftDeal);
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
  sheet: { maxHeight: "90%", paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 8, opacity: 0.5 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 20, paddingVertical: 22, gap: 14 },
  dealRow: { flexDirection: "row", gap: 10 },
  dealChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 48,
    borderWidth: 1,
  },
  dealTxt: { fontSize: 15 },
  pairRow: { flexDirection: "row", gap: 12 },
  pairItem: { flex: 1 },
  foot: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
