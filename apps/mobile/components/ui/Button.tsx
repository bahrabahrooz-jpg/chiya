import { type ReactNode } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/theme";

type Variant = "primary" | "secondary" | "social";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Leading element (icon). */
  left?: ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Button — the app's primary action control, mirroring the web `cx-btn`
 * hierarchies (green primary, bordered secondary/social) with a loading state
 * and a subtle press-down. Native press feedback via Pressable.
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  left,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { colors, radius, type, elevation } = useTheme();
  const isDisabled = disabled || loading;

  const label =
    variant === "primary" ? colors.textOnBrand : variant === "social" ? colors.textPrimary : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={
        variant === "primary"
          ? { color: "rgba(255,255,255,0.18)" }
          : { color: colors.surfaceSunken }
      }
      style={({ pressed }) => [
        styles.base,
        { borderRadius: radius.control },
        variant === "primary" && [
          { backgroundColor: pressed ? colors.brandPrimaryPressed : colors.brandPrimary },
          elevation.button,
        ],
        variant === "secondary" && {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
          borderWidth: 1,
          borderColor: colors.borderDefault,
        },
        variant === "social" && {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
          borderWidth: 1,
          borderColor: colors.borderDefault,
        },
        fullWidth && styles.full,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="small" color={label} />
          <Text style={[type.button, { color: label }]}>{title}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {left}
          <Text style={[type.button, { color: label }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  full: { alignSelf: "stretch" },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pressed: { transform: [{ translateY: 0.5 }] },
  disabled: { opacity: 0.5 },
});
