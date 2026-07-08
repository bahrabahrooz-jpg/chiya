import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { dealCategories } from "./data";

/** DealChips — horizontal quick filters (All / For Sale / For Rent / New). */
export function DealChips({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const { colors, fontFamily, radius } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {dealCategories.map(({ value, label }) => {
        const on = active === value;
        const fg = on ? colors.brandForeground : colors.textSecondary;
        return (
          <Pressable
            key={value}
            onPress={() => onChange(value)}
            style={[
              styles.chip,
              {
                borderRadius: radius.pill,
                backgroundColor: on ? colors.brandSubtle : colors.surfaceCard,
                borderColor: on ? colors.brandForeground : colors.borderSubtle,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.label, { color: fg, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  label: { fontSize: 14 },
});
