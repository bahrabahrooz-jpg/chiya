import { type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";

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
  icon: LucideIcon;
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
  onPress,
}: MenuRowProps) {
  const { colors, type, fontFamily, radius } = useTheme();
  const tint = danger ? colors.error : colors.textPrimary;
  const iconTint = danger ? colors.error : colors.brandForeground;
  const iconBg = danger ? "rgba(192,57,43,0.10)" : colors.brandSubtle;
  const showChevron = chevron ?? (!trailing && !!onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
        pressed && onPress ? { backgroundColor: colors.surfaceSunken } : null,
      ]}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <View style={[styles.iconTile, { backgroundColor: iconBg, borderRadius: radius.md }]}>
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
      {showChevron ? <ChevronRight size={19} color={colors.textTertiary} strokeWidth={2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  groupTitle: { marginLeft: 4, letterSpacing: 0.6 },
  card: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  iconTile: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  labelWrap: { flex: 1, gap: 2 },
});
