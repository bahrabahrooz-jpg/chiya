import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { useTheme } from "@/theme";

export interface HomeSearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  onOpenFilters: () => void;
  activeCount?: number;
}

/**
 * HomeSearchBar — an inline search field (filters listings on the Home screen)
 * plus a neutral filter button that opens the filter drawer.
 */
export function HomeSearchBar({ value, onChangeText, onOpenFilters, activeCount = 0 }: HomeSearchBarProps) {
  const { colors, type, radius, fontFamily } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: focused ? colors.borderFocus : colors.borderSubtle,
            borderWidth: focused ? 1.5 : 1,
            borderRadius: radius.control,
          },
          // Brand-green focus ring, matching the login/admin inputs.
          focused && { boxShadow: `0 0 0 4px ${colors.ringBrand}` },
        ]}
      >
        <Search size={19} color={colors.textTertiary} strokeWidth={2} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary, fontFamily: fontFamily.sans, fontSize: type.body.fontSize }]}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search homes, areas…"
          placeholderTextColor={colors.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          selectionColor={colors.brandForeground}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <X size={18} color={colors.textTertiary} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        style={[styles.filter, { backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault, borderRadius: radius.control }]}
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel="Filters"
      >
        <SlidersHorizontal size={20} color={colors.textPrimary} strokeWidth={2} />
        {activeCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.brandPrimary, borderColor: colors.surfacePage }]}>
            <Text style={[styles.badgeTxt, { color: colors.textOnBrand }]}>{activeCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  field: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  input: { flex: 1, height: "100%", padding: 0 },
  filter: { width: 52, height: 52, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
});
