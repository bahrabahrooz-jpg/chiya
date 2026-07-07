import { Pressable, View, Text, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { useTheme } from "@/theme";

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

/** Checkbox — a tappable box + optional label, filled with the brand color when checked. */
export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const { colors, radius, type } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          {
            borderRadius: radius.sm,
            borderColor: checked ? colors.brandPrimary : colors.borderStrong,
            backgroundColor: checked ? colors.brandPrimary : "transparent",
          },
        ]}
      >
        {checked ? <Check size={13} color={colors.textOnBrand} strokeWidth={3} /> : null}
      </View>
      {label ? <Text style={[type.bodySm, { color: colors.textSecondary }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  box: { width: 20, height: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
