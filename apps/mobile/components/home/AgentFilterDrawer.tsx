import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { agentCities, agentLanguages, agentExperience, emptyAgentFilters, countAgentFilters, type AgentFilters } from "./data";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
      <Text style={[styles.chipTxt, { color: fg, fontFamily: selected ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>{label}</Text>
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

export interface AgentFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  value: AgentFilters;
  onApply: (f: AgentFilters) => void;
}

/** AgentFilterDrawer — bottom sheet filtering agents by location, language, experience. */
export function AgentFilterDrawer({ open, onClose, value, onApply }: AgentFilterDrawerProps) {
  const { colors, type, radius } = useTheme();
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

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
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
            <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 22 }]}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.surfaceSunken }]}>
              <X size={18} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            <Section title="Location">
              {agentCities.map((c) => (
                <Chip key={c} label={c} selected={draft.cities.includes(c)} onPress={() => setDraft((d) => ({ ...d, cities: toggle(d.cities, c) }))} />
              ))}
            </Section>

            <Section title="Language">
              {agentLanguages.map((l) => (
                <Chip key={l} label={l} selected={draft.languages.includes(l)} onPress={() => setDraft((d) => ({ ...d, languages: toggle(d.languages, l) }))} />
              ))}
            </Section>

            <Section title="Years of experience">
              {agentExperience.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={draft.experience === o.value}
                  onPress={() => setDraft((d) => ({ ...d, experience: d.experience === o.value ? "" : o.value }))}
                />
              ))}
            </Section>
          </ScrollView>

          <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={{ flex: 1 }}>
              <Button title="Reset" variant="secondary" onPress={() => setDraft(emptyAgentFilters)} />
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
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 40, paddingHorizontal: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipTxt: { fontSize: 14 },
  foot: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
