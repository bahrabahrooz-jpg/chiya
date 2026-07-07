import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/theme";

// The outer frame is a rounded square rotated 45° (a diamond). Rotating a <Rect>
// via react-native-svg clips it to the un-rotated bounds, so instead we draw the
// diamond directly as a Path with its rounded corners already in final position —
// nothing to clip. Corner points computed from the source 29×29 rect (rx 8)
// rotated about (24,24); the arcs bulge out toward each vertex (radius 8).
const DIAMOND =
  "M29.657 9.151 L38.849 18.343 A8 8 0 0 1 38.849 29.657 L29.657 38.849 " +
  "A8 8 0 0 1 18.343 38.849 L9.151 29.657 A8 8 0 0 1 9.151 18.343 " +
  "L18.343 9.151 A8 8 0 0 1 29.657 9.151 Z";

/**
 * BrandMark — the Chiya arch symbol, recreated from public/brand/chiya-symbol.svg
 * with react-native-svg so it recolors for light/dark instead of shipping a
 * fixed-color asset.
 */
export function BrandMark({ size = 40, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const stroke = color ?? colors.brandMarkStroke;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d={DIAMOND} fill="none" stroke={stroke} strokeWidth={2} opacity={0.5} />
      <Path d="M15 30 L24 16 L33 30 Z" fill="none" stroke={stroke} strokeWidth={2.8} strokeLinejoin="round" />
      <Path d="M24 24 L28.5 30 H19.5 Z" fill={stroke} />
    </Svg>
  );
}

/**
 * BrandLockup — arch mark + "CHIYA" serif wordmark, matching the site header
 * lockup (uppercase, wide tracking).
 */
export function BrandLockup({ size = 40 }: { size?: number }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.row}>
      <BrandMark size={size} />
      <Text style={[type.wordmark, { color: colors.brandWordmark }]}>CHIYA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
