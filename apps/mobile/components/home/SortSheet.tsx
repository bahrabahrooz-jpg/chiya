import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { searchSort, optLabel, type Opt } from "./data";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

/** SortSheet — a small bottom sheet for choosing a sort order. */
export function SortSheet({
  open,
  onClose,
  value,
  onChange,
  options = searchSort,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  options?: Opt[];
}) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(ty, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(ty, { toValue: WINDOW_H, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <AnimatedPressable onPress={onClose} style={[styles.scrim, { opacity: scrim, backgroundColor: colors.overlay }]} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfacePage,
              borderTopLeftRadius: radius.card,
              borderTopRightRadius: radius.card,
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY: ty }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <Text style={[type.bodyLg, styles.title, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
            {t("sort.title")}
          </Text>
          {options.map((o) => {
            const on = value === o.value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  onClose();
                }}
                style={styles.opt}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text
                  style={[
                    type.body,
                    { color: on ? colors.brandForeground : colors.textPrimary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sans },
                  ]}
                >
                  {optLabel(o)}
                </Text>
                {on ? <Check size={18} color={colors.brandForeground} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { paddingTop: 8, paddingHorizontal: 20 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 8, opacity: 0.5 },
  title: { marginBottom: 8 },
  opt: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
});
