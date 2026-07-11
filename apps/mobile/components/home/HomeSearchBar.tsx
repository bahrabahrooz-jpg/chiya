import { useState, type RefObject } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";

export interface HomeSearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  onOpenFilters: () => void;
  activeCount?: number;
  placeholder?: string;
  onFocusChange?: (focused: boolean) => void;
  /** Ref to the input, so a screen can focus it programmatically (e.g. deep link). */
  inputRef?: RefObject<TextInput | null>;
}

/**
 * HomeSearchBar — a single search field with the filter control integrated on the
 * right edge (a leading search icon, the input, an optional clear button, then a
 * neutral filter button that opens the filter drawer).
 */
export function HomeSearchBar({ value, onChangeText, onOpenFilters, activeCount = 0, placeholder, onFocusChange, inputRef }: HomeSearchBarProps) {
  const { colors, type, radius, fontFamily } = useTheme();
  const { t } = useTranslation();
  const ph = placeholder ?? t("searchBar.placeholder");
  const [focused, setFocused] = useState(false);
  const setFocus = (v: boolean) => {
    setFocused(v);
    onFocusChange?.(v);
  };

  return (
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
        ref={inputRef}
        style={[styles.input, { color: colors.textPrimary, fontFamily: fontFamily.sans, fontSize: type.body.fontSize }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={ph}
        placeholderTextColor={colors.textPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={colors.brandForeground}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("searchBar.clear")}>
          <X size={18} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      <Pressable onPress={onOpenFilters} hitSlop={8} style={styles.filter} accessibilityRole="button" accessibilityLabel={t("searchBar.filters")}>
        <SlidersHorizontal size={20} color={colors.textPrimary} strokeWidth={2} />
        {activeCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.brandPrimary, borderColor: colors.surfaceCard }]}>
            <Text style={[styles.badgeTxt, { color: colors.textOnBrand }]}>{activeCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 52,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  input: { flex: 1, height: "100%", padding: 0 },
  divider: { width: StyleSheet.hairlineWidth, height: 24 },
  filter: { alignItems: "center", justifyContent: "center", paddingLeft: 2 },
  badge: {
    position: "absolute",
    top: -8,
    end: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeTxt: { fontSize: 10, fontWeight: "700" },
});
