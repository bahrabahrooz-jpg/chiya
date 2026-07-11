import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { cityOpts, agentLanguageOpts, agentExperience, emptyAgentFilters, countAgentFilters, type AgentFilters } from "./data";
import { SelectField, MultiSelectField } from "./SelectField";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

function Section({ title, first = false, children }: { title: string; first?: boolean; children: ReactNode }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View
      style={[
        styles.section,
        // A hairline divider separates each group from the previous one.
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
      ]}
    >
      <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
      {children}
    </View>
  );
}

export interface AgentFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  value: AgentFilters;
  onApply: (f: AgentFilters) => void;
}

/** AgentFilterDrawer — bottom sheet filtering agents by location, language, and
 *  experience. Mirrors the property filter: searchable multi-select dropdowns for
 *  location and language, a single-select dropdown for experience. */
export function AgentFilterDrawer({ open, onClose, value, onApply }: AgentFilterDrawerProps) {
  const { colors, type, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(open);
  const [draft, setDraft] = useState<AgentFilters>(value);
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

  const n = countAgentFilters(draft);

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <AnimatedPressable onPress={onClose} style={[styles.scrim, { opacity: scrim, backgroundColor: colors.overlay }]} />

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.surfacePage, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, transform: [{ translateY: ty }] },
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
            <Section title={t("filters.location")} first>
              <MultiSelectField
                sheetTitle={t("filters.city")}
                placeholder={t("filters.anyCity")}
                options={cityOpts}
                value={draft.cities}
                onChange={(cities) => setDraft((d) => ({ ...d, cities }))}
              />
            </Section>

            <Section title={t("filters.language")}>
              <MultiSelectField
                sheetTitle={t("filters.language")}
                placeholder={t("filters.anyLanguage")}
                options={agentLanguageOpts}
                value={draft.languages}
                onChange={(languages) => setDraft((d) => ({ ...d, languages }))}
              />
            </Section>

            <Section title={t("filters.experience")}>
              <SelectField
                sheetTitle={t("filters.experience")}
                placeholder={t("filters.any")}
                options={agentExperience}
                value={draft.experience}
                onChange={(experience) => setDraft((d) => ({ ...d, experience }))}
              />
            </Section>
          </ScrollView>

          <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={{ flex: 1 }}>
              <Button title={t("filters.resetAll")} variant="secondary" onPress={() => setDraft(emptyAgentFilters)} />
            </View>
            <View style={{ flex: 1.5 }}>
              <Button
                title={n ? t("filters.applyN", { count: n }) : t("filters.apply")}
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
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 20, paddingVertical: 22, gap: 14 },
  foot: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
