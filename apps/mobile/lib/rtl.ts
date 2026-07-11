import type { StyleProp, ViewStyle } from "react-native";

/**
 * Horizontal mirror for direction-bearing icons (back arrows, disclosure
 * chevrons, arrow CTAs). React Native's RTL layout flips row direction and
 * start/end insets automatically, but it does NOT flip icon glyphs — so an
 * arrow pointing left keeps pointing left. Apply this to such icons so they
 * point the correct way when the UI is right-to-left.
 *
 * Usage: `<ArrowLeft style={rtlFlip(isRTL)} />`
 */
export function rtlFlip(isRTL: boolean): StyleProp<ViewStyle> {
  return isRTL ? { transform: [{ scaleX: -1 }] } : undefined;
}
