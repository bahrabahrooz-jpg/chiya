import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

/** Divider — a hairline, optionally with a centered label ("or"). */
export function Divider({ label }: { label?: string }) {
  const { colors, type, space } = useTheme();
  if (!label) {
    return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle }} />;
  }
  return (
    <View style={[styles.row, { gap: space[3] }]}>
      <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
      <Text style={[type.caption, { color: colors.textTertiary }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
