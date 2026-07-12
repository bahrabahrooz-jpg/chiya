import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { Button } from "./Button";
import { useConfirm, dismissConfirm, type ConfirmOptions } from "@/lib/confirm";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

/** ConfirmHost — mounted once at the app root; renders the Chiya confirmation
 *  bottom sheet whenever `confirm(...)` is called. */
export function ConfirmHost() {
  const options = useConfirm();
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(false);
  // Hold the last options so the content stays visible during the exit animation.
  const [cfg, setCfg] = useState<ConfirmOptions | null>(options);
  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (options) {
      setCfg(options);
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
  }, [options]);

  if (!mounted || !cfg) return null;

  const Icon = cfg.icon;
  const iconTint = cfg.destructive ? colors.error : cfg.warning ? colors.warningText : colors.brandForeground;
  const iconBg = cfg.destructive ? "rgba(192,57,43,0.12)" : cfg.warning ? colors.warningSurface : colors.brandSubtle;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={dismissConfirm}>
      <View style={styles.fill}>
        <AnimatedPressable onPress={dismissConfirm} style={[styles.scrim, { opacity: scrim, backgroundColor: colors.overlay }]} />

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

          <View style={styles.body}>
            {Icon ? (
              <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <Icon size={26} color={iconTint} strokeWidth={2} />
              </View>
            ) : null}
            <Text style={[type.displaySm, styles.title, { color: colors.textPrimary, fontSize: 22 }]}>{cfg.title}</Text>
            {cfg.message ? (
              <Text style={[type.body, styles.message, { color: colors.textSecondary }]}>{cfg.message}</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button
              title={cfg.confirmLabel}
              variant={cfg.destructive ? "destructive" : cfg.warning ? "warning" : "primary"}
              onPress={() => {
                const run = cfg.onConfirm;
                dismissConfirm();
                // Run the action only after the sheet has fully dismissed. Firing a
                // LayoutAnimation (or presenting another modal) while this one is still
                // animating out freezes the screen on iOS — the same reason ActionSheet
                // defers presenting this sheet. 240ms > the 200ms exit animation above.
                setTimeout(run, 240);
              }}
            />
            <Button title={cfg.cancelLabel ?? t("common.cancel")} variant="secondary" onPress={dismissConfirm} />
          </View>
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
  body: { alignItems: "center", paddingTop: 12, paddingBottom: 20, gap: 6 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { textAlign: "center" },
  message: { textAlign: "center", lineHeight: 22, maxWidth: 340 },
  actions: { gap: 10 },
});
