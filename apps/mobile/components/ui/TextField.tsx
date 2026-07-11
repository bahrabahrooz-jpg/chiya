import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  StyleSheet,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
} from "react-native";
import { Eye, EyeOff, CircleAlert, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";

/** Blinking text caret — used in the masked password field, where the native
 * caret is hidden (it would drift from the custom dot overlay). */
function Caret({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    // Approximate the native iOS caret cadence: hold solid, fade out, brief pause,
    // fade in — rather than a symmetric continuous blink.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.caret, { backgroundColor: color, opacity }]} />;
}

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  icon?: LucideIcon;
  placeholder?: string;
  error?: string;
  /** Don't reserve the error-message row below the field (e.g. when a meter follows). */
  hideError?: boolean;
  /** Password field: masks input and shows an eye peek toggle. */
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  /** When false, the field is read-only (not focusable/editable). */
  editable?: boolean;
  /** Multi-line textarea mode (e.g. a message field). */
  multiline?: boolean;
  /** Min height (points) for multiline mode. */
  minHeight?: number;
}

/**
 * TextField — labelled input with a leading icon, focus-driven border, inline
 * error, and (for passwords) an eye peek toggle. Carries the correct native
 * keyboard / autofill hints so it behaves like a first-class mobile input.
 */
export function TextField({
  label,
  value,
  onChangeText,
  icon: Icon,
  placeholder,
  error,
  hideError = false,
  secure = false,
  keyboardType,
  autoCapitalize = "none",
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  editable = true,
  multiline = false,
  minHeight = 120,
}: TextFieldProps) {
  const { colors, radius, type, space } = useTheme();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.borderFocus : colors.borderSubtle;
  // Leading icon stays neutral (even on focus); only errors tint it.
  const iconColor = error ? colors.error : colors.textTertiary;

  const masked = secure && !show;
  // Password fields: we draw the mask dots ourselves as an overlay and keep the
  // real TextInput text transparent (caret hidden). This avoids iOS's native
  // last-character reveal AND lets the empty placeholder dots and the typed dots
  // share the exact same glyph + size (they're the same overlay, just recolored).
  const showDots = secure && (masked || value.length === 0);
  const dotCount = value.length > 0 ? value.length : PLACEHOLDER_DOTS;

  return (
    <View style={{ gap: space[1.5] }}>
      <Text style={[type.label, { color: colors.textSecondary }]}>{label}</Text>

      <View
        style={[
          styles.wrap,
          {
            backgroundColor: colors.surfaceCard,
            borderColor,
            borderRadius: radius.control,
            borderWidth: error ? 1.5 : 1,
          },
          // Multiline grows from a min height and aligns content to the top.
          multiline && { height: undefined, minHeight, alignItems: "flex-start", paddingVertical: 12 },
          // Soft ring (halo): on focus, and always in the error state (destructive ring).
          (focused || error) && { boxShadow: `0 0 0 4px ${error ? colors.ringError : colors.ringBrand}` },
        ]}
      >
        {Icon ? (
          <View style={[styles.leading, multiline && { marginTop: 2 }]}>
            <Icon size={19} color={iconColor} strokeWidth={2} />
          </View>
        ) : null}

        <View style={[styles.field, multiline && { height: undefined, alignSelf: "stretch" }]}>
          <TextInput
            style={[
              styles.input,
              {
                fontSize: type.body.fontSize,
                fontFamily: type.body.fontFamily,
                // Hide the real text while masked; the dot overlay stands in for it.
                color: masked ? "transparent" : colors.textPrimary,
              },
              multiline && { height: undefined, minHeight: minHeight - 24, textAlignVertical: "top", lineHeight: 22 },
            ]}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            multiline={multiline}
            placeholder={secure ? undefined : placeholder}
            placeholderTextColor={colors.textPlaceholder}
            secureTextEntry={false}
            caretHidden={masked}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            spellCheck={false}
            autoComplete={autoComplete}
            textContentType={textContentType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            selectionColor={colors.brandForeground}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {showDots ? (
            <View style={styles.dotsRow} pointerEvents="none">
              {focused && value.length === 0 ? <Caret color={colors.brandForeground} /> : null}
              <Text
                numberOfLines={1}
                style={[styles.dots, { color: value.length > 0 ? colors.textPrimary : colors.textPlaceholder }]}
              >
                {DOT.repeat(dotCount)}
              </Text>
              {focused && value.length > 0 ? <Caret color={colors.brandForeground} /> : null}
            </View>
          ) : null}
        </View>

        {error ? (
          // Destructive state: a "!" indicator on the right, replacing the eye toggle.
          <View style={styles.peek} pointerEvents="none">
            <CircleAlert size={19} color={colors.error} strokeWidth={2} />
          </View>
        ) : secure ? (
          <Pressable
            onPress={() => setShow((s) => !s)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={show ? t("field.hidePassword") : t("field.showPassword")}
            style={styles.peek}
          >
            {show ? (
              <EyeOff size={19} color={colors.textTertiary} strokeWidth={2} />
            ) : (
              <Eye size={19} color={colors.textTertiary} strokeWidth={2} />
            )}
          </Pressable>
        ) : null}
      </View>

      {!hideError ? (
        <View style={styles.errorRow}>
          {error ? <Text style={[type.caption, { color: colors.textError }]}>{error}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const FIELD_H = 54;
const DOT = "●";
// Filled mask dot; one constant drives BOTH the placeholder and typed dots so they match.
const DOT_SIZE = 8;
const PLACEHOLDER_DOTS = 8;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    height: FIELD_H,
    paddingHorizontal: 14,
  },
  leading: { marginEnd: 10 },
  field: { flex: 1, height: "100%", justifyContent: "center" },
  input: {
    width: "100%",
    height: "100%",
    padding: 0,
    // Center the text vertically within the field on both platforms.
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  dotsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  dots: {
    fontSize: DOT_SIZE,
    letterSpacing: 2,
    includeFontPadding: false,
  },
  caret: {
    width: 2,
    height: 22,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  peek: { paddingStart: 10, height: "100%", justifyContent: "center" },
  errorRow: { minHeight: 16, justifyContent: "center" },
});
