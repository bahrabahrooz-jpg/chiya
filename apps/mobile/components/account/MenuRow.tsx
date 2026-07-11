import { type ComponentType, type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { rtlFlip } from "@/lib/rtl";

/** Any icon component that takes size/color/strokeWidth — lucide icons and the
 *  app's custom SVG brand marks (WhatsApp, Instagram, …) both satisfy this. */
type IconCmp = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Group — a labelled section wrapping rows in a single bordered card. */
export function Group({ title, children }: { title?: string; children: ReactNode }) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <View style={styles.group}>
      {title ? (
        <Text style={[type.label, styles.groupTitle, { color: colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
        {children}
      </View>
    </View>
  );
}

export interface MenuRowProps {
  icon: IconCmp;
  label: string;
  /** Small caption under the label. */
  sublabel?: string;
  /** Trailing value text (e.g. current language). Ignored when `trailing` is set. */
  value?: string;
  /** Custom trailing node (e.g. a Switch). Replaces the chevron/value. */
  trailing?: ReactNode;
  /** Show the chevron affordance (default true unless `trailing` is provided). */
  chevron?: boolean;
  /** Hairline divider above this row (for stacking rows in a Group). */
  divider?: boolean;
  danger?: boolean;
  /** Render the icon on its own, without the tile frame (e.g. Log out). */
  bareIcon?: boolean;
  /** Dim the row and make it non-interactive (e.g. a not-yet-built screen). */
  disabled?: boolean;
  onPress?: () => void;
}

/** MenuRow — one settings/account row: icon tile · label · trailing (value/switch/chevron). */
export function MenuRow({
  icon: Icon,
  label,
  sublabel,
  value,
  trailing,
  chevron,
  divider,
  danger,
  bareIcon,
  disabled,
  onPress,
}: MenuRowProps) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { isRTL } = useTranslation();
  const tint = danger ? colors.error : colors.textPrimary;
  const iconTint = danger ? colors.error : colors.brandForeground;
  const pressable = !!onPress && !disabled;
  const showChevron = !disabled && (chevron ?? (!trailing && !!onPress));

  return (
    <Pressable
      onPress={onPress}
      disabled={!pressable}
      style={({ pressed }) => [
        styles.row,
        disabled && { opacity: 0.4 },
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
        pressed && pressable ? { backgroundColor: colors.surfaceSunken } : null,
      ]}
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityState={{ disabled: !!disabled }}
    >
      <View
        style={[
          styles.iconTile,
          !bareIcon && {
            backgroundColor: colors.iconTileBg,
            borderColor: colors.iconTileBorder,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.md,
          },
        ]}
      >
        <Icon size={19} color={iconTint} strokeWidth={2} />
      </View>

      <View style={styles.labelWrap}>
        <Text style={[type.body, { color: tint, fontFamily: fontFamily.sansMedium }]} numberOfLines={1}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[type.bodySm, { color: colors.textTertiary }]} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      {trailing ? (
        trailing
      ) : value ? (
        <Text style={[type.bodySm, { color: colors.textTertiary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {showChevron ? <ChevronRight size={19} color={colors.textTertiary} strokeWidth={2} style={rtlFlip(isRTL)} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  groupTitle: { marginStart: 4, letterSpacing: 0.6 },
  card: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  iconTile: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  labelWrap: { flex: 1, gap: 2 },
});
