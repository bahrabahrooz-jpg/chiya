import Svg, { Path, Rect, Circle, Line } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Brand glyphs drawn to match lucide's outline style (stroke-based), since
 *  lucide-react-native no longer ships Instagram/Facebook/LinkedIn marks. */

export function InstagramIcon({ size = 24, color = "#000", strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={2} width={20} height={20} rx={5} ry={5} />
      <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <Line x1={17.5} y1={6.5} x2={17.51} y2={6.5} />
    </Svg>
  );
}

export function FacebookIcon({ size = 24, color = "#000", strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Svg>
  );
}

export function LinkedInIcon({ size = 24, color = "#000", strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <Rect x={2} y={9} width={4} height={12} />
      <Circle cx={4} cy={4} r={2} />
    </Svg>
  );
}
