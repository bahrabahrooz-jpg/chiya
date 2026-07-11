import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** Segmented — a compact two/few-option toggle (currency, unit). Lighter than a
 *  full-width control: sized to its content so it can sit on a section title row.
 *  Row layout mirrors automatically in RTL. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control }]}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.item, on && { backgroundColor: colors.surfaceCard, borderRadius: radius.md }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text
              style={[
                type.bodySm,
                {
                  color: on ? colors.brandForeground : colors.textSecondary,
                  fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium,
                },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", padding: 3, gap: 2 },
  item: { minWidth: 46, height: 28, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
});
