import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

export interface SheetAction {
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  onPress: () => void;
}

/** ActionSheet — a bottom sheet listing per-item actions (Edit, Delete, …) with
 *  a separate Cancel, matching the app's sheet pattern. */
export function ActionSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  const { colors, type, fontFamily, radius } = useTheme();
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
        <Animated.View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12), transform: [{ translateY: ty }] }]}>
          <View style={[styles.group, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
            {title ? (
              <Text style={[type.bodySm, styles.title, { color: colors.textTertiary, borderBottomColor: colors.borderSubtle }]} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {actions.map((a, i) => {
              const tint = a.destructive ? colors.error : colors.textPrimary;
              const Icon = a.icon;
              return (
                <Pressable
                  key={a.label}
                  onPress={() => {
                    onClose();
                    a.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.action,
                    (i > 0 || title) && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
                    pressed && { backgroundColor: colors.surfaceSunken },
                  ]}
                  accessibilityRole="button"
                >
                  {Icon ? <Icon size={19} color={tint} strokeWidth={2} /> : null}
                  <Text style={[type.body, { color: tint, fontFamily: fontFamily.sansMedium }]}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card },
              pressed && { backgroundColor: colors.surfaceSunken },
            ]}
            accessibilityRole="button"
          >
            <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject },
  wrap: { paddingHorizontal: 12, gap: 8 },
  group: { borderWidth: 1, overflow: "hidden" },
  title: { textAlign: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  action: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 16 },
  cancel: { borderWidth: 1, alignItems: "center", justifyContent: "center", paddingVertical: 16 },
});
