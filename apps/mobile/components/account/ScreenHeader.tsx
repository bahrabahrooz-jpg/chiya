import { type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/theme";

/** ScreenHeader — a plain back button + centered title for account sub-screens.
 *  An optional `right` node renders as a trailing action. */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { colors, type, fontFamily } = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.row, { borderBottomColor: colors.borderSubtle }]}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.side} accessibilityRole="button" accessibilityLabel="Back">
        <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
      <Text style={[type.body, styles.title, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { minWidth: 40, height: 40, alignItems: "center", justifyContent: "center" },
  right: { alignItems: "flex-end" },
  title: { flex: 1, textAlign: "center", fontSize: 17 },
});
