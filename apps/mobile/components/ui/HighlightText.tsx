import { Text, type StyleProp, type TextStyle } from "react-native";
import { useTheme } from "@/theme";

/** HighlightText — renders `text` with every case-insensitive occurrence of
 *  `query` tinted in the brand colour (used in search suggestions). */
export function HighlightText({
  text,
  query,
  style,
  numberOfLines,
}: {
  text: string;
  query: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { colors, fontFamily } = useTheme();
  const q = query.trim();

  if (!q) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: { t: string; hl: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      parts.push({ t: text.slice(i), hl: false });
      break;
    }
    if (idx > i) parts.push({ t: text.slice(i, idx), hl: false });
    parts.push({ t: text.slice(idx, idx + q.length), hl: true });
    i = idx + q.length;
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((p, k) =>
        p.hl ? (
          <Text key={k} style={{ color: colors.brandForeground, fontFamily: fontFamily.sansSemibold }}>
            {p.t}
          </Text>
        ) : (
          p.t
        ),
      )}
    </Text>
  );
}
