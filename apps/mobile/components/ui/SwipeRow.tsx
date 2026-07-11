import { useRef, useState, type ReactNode } from "react";
import { View, Text, Pressable, Animated, PanResponder, StyleSheet, LayoutAnimation } from "react-native";
import { Trash2 } from "lucide-react-native";
import { useTheme } from "@/theme";

const ACTION_W = 92;
/** A little overshoot past the action width so the drag feels elastic. */
const OVER = 28;

/**
 * SwipeRow — swipe a row toward its trailing edge to reveal a Delete action;
 * tap it or swipe far enough to delete. Built on PanResponder + Animated (no
 * gesture-handler dependency). Mirrors correctly in RTL: the reveal side and
 * drag direction both flip. Delete collapses the row via LayoutAnimation so the
 * neighbours slide up smoothly.
 */
export function SwipeRow({
  onDelete,
  deleteLabel,
  isRTL,
  children,
}: {
  onDelete: () => void;
  deleteLabel: string;
  isRTL: boolean;
  children: ReactNode;
}) {
  const { colors, fontFamily, radius } = useTheme();
  const tx = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const width = useRef(0);
  const [open, setOpen] = useState(false);
  // translateX is a physical transform (not auto-mirrored), so RTL flips the sign.
  const dir = isRTL ? 1 : -1;
  const openX = dir * ACTION_W;

  // Keep the latest onDelete reachable from the once-created PanResponder.
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;

  // Keep the delete panel hidden until the row is actually dragged, so a plain
  // press (which dims the foreground) never reveals red underneath.
  const actionOpacity = tx.interpolate({
    inputRange: dir < 0 ? [-10, 0] : [0, 10],
    outputRange: dir < 0 ? [1, 0] : [0, 1],
    extrapolate: "clamp",
  });

  const snap = (to: number) => {
    Animated.spring(tx, { toValue: to, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
    offset.current = to;
    setOpen(to !== 0);
  };

  const remove = () => {
    const off = dir * (width.current || 400);
    Animated.timing(tx, { toValue: off, duration: 180, useNativeDriver: true }).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
      onDeleteRef.current();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        tx.stopAnimation();
      },
      onPanResponderMove: (_e, g) => {
        const raw = offset.current + g.dx;
        // Strictly one-sided: only reveal toward the trailing edge (left in LTR,
        // right in RTL). Dragging the other way is clamped to closed.
        const next = dir < 0 ? Math.max(-(ACTION_W + OVER), Math.min(0, raw)) : Math.min(ACTION_W + OVER, Math.max(0, raw));
        tx.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        // Swiping only reveals the Delete button — it never deletes on its own.
        // Settle open when dragged past the action, otherwise snap closed.
        const mag = Math.abs(offset.current + g.dx);
        snap(mag >= ACTION_W * 0.5 ? openX : 0);
      },
      onPanResponderTerminate: () => snap(0),
    }),
  ).current;

  return (
    <View style={[styles.wrap, { borderRadius: radius.card }]} onLayout={(e) => (width.current = e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.action, { backgroundColor: colors.error, borderRadius: radius.card, opacity: actionOpacity }]}>
        <Pressable onPress={remove} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={deleteLabel}>
          <Trash2 size={20} color={colors.textOnBrand} strokeWidth={2} />
          <Text style={[styles.actionTxt, { color: colors.textOnBrand, fontFamily: fontFamily.sansSemibold }]}>{deleteLabel}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateX: tx }] }} {...pan.panHandlers}>
        {children}
        {open ? <Pressable style={StyleSheet.absoluteFill} onPress={() => snap(0)} accessibilityElementsHidden /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  action: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    // End side (right in LTR, left in RTL) — RN mirrors flex-end automatically.
    justifyContent: "flex-end",
    alignItems: "stretch",
  },
  actionBtn: { width: ACTION_W, alignItems: "center", justifyContent: "center", gap: 4 },
  actionTxt: { fontSize: 12 },
});
