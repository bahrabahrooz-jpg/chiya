import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { optLabel, type Opt } from "./data";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

/** How many selected chips a multi-select field shows before collapsing to "+X more". */
const VISIBLE_CHIPS = 2;

/** Shared bottom-sheet shell: scrim + slide-up animation + handle, mirroring SortSheet. */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const { colors, radius } = useTheme();
  const [mounted, setMounted] = useState(open);
  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(ty, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(ty, { toValue: WINDOW_H, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <AnimatedPressable onPress={onClose} style={[styles.scrim, { opacity: scrim, backgroundColor: colors.overlay }]} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfacePage,
              borderTopLeftRadius: radius.card,
              borderTopRightRadius: radius.card,
              transform: [{ translateY: ty }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Search field shown at the top of searchable sheets. */
export function SheetSearch({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  const { colors, type, radius } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.search, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.control }]}>
      <Search size={18} color={colors.textTertiary} strokeWidth={2} />
      <TextInput
        style={[styles.searchInput, { fontSize: type.body.fontSize, fontFamily: type.body.fontFamily, color: colors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={t("filters.searchPlaceholder")}
        placeholderTextColor={colors.textPlaceholder}
        autoCorrect={false}
        spellCheck={false}
        selectionColor={colors.brandForeground}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <X size={16} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** One selectable row inside a sheet (checkbox for multi, check for single). */
function OptionRow({ opt, selected, multi, onPress }: { opt: Opt; selected: boolean; multi: boolean; onPress: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const Icon = opt.Icon;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSunken }]}
      accessibilityRole={multi ? "checkbox" : "button"}
      accessibilityState={multi ? { checked: selected } : { selected }}
    >
      {multi ? (
        <View
          style={[
            styles.box,
            {
              borderRadius: radius.sm,
              borderColor: selected ? colors.brandPrimary : colors.borderStrong,
              backgroundColor: selected ? colors.brandPrimary : "transparent",
            },
          ]}
        >
          {selected ? <Check size={13} color={colors.textOnBrand} strokeWidth={3} /> : null}
        </View>
      ) : null}
      {Icon ? <Icon size={18} color={selected ? colors.brandForeground : colors.textTertiary} strokeWidth={2} /> : null}
      <Text
        style={[
          type.body,
          styles.rowLabel,
          {
            color: selected ? colors.brandForeground : colors.textPrimary,
            fontFamily: selected ? fontFamily.sansSemibold : fontFamily.sans,
          },
        ]}
        numberOfLines={1}
      >
        {optLabel(opt)}
      </Text>
      {!multi && selected ? <Check size={18} color={colors.brandForeground} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

/** Locale-aware option filter for the sheet search field. */
function matchOptions(options: Opt[], query: string): Opt[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q) || (o.ar ?? "").includes(query.trim()));
}

interface SheetBodyProps {
  title: string;
  options: Opt[];
  searchable?: boolean;
}

/** The trigger control both fields share: a field-like box that opens the sheet. */
function Trigger({ onPress, children, minHeight }: { onPress: () => void; children: ReactNode; minHeight?: number }) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.trigger,
        { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.control, minHeight: minHeight ?? FIELD_H },
      ]}
      accessibilityRole="button"
    >
      {children}
      <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

function FieldLabel({ text }: { text: string }) {
  const { colors, type } = useTheme();
  return <Text style={[type.label, { color: colors.textSecondary }]}>{text}</Text>;
}

export interface SelectFieldProps {
  /** Label above the field; omit when the enclosing section title already names it. */
  label?: string;
  placeholder: string;
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
  searchable?: boolean;
  /** Sheet title; defaults to `label`. */
  sheetTitle?: string;
}

/** SelectField — single-select dropdown: a field that opens a bottom sheet of options.
 *  Selecting an option applies it and closes the sheet. */
export function SelectField({ label, placeholder, options, value, onChange, searchable = false, sheetTitle }: SelectFieldProps) {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);
  const shown = useMemo(() => matchOptions(options, query), [options, query]);

  const openSheet = () => {
    setQuery("");
    setOpen(true);
  };

  return (
    <View style={styles.field}>
      {label ? <FieldLabel text={label} /> : null}
      <Trigger onPress={openSheet}>
        <Text
          style={[
            type.body,
            styles.triggerValue,
            selected
              ? { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }
              : { color: colors.textPlaceholder },
          ]}
          numberOfLines={1}
        >
          {selected ? optLabel(selected) : placeholder}
        </Text>
      </Trigger>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <SheetHeader title={sheetTitle ?? label ?? ""} onClose={() => setOpen(false)} />
        {searchable ? <SheetSearch value={query} onChangeText={setQuery} /> : null}
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {shown.map((o) => (
            <OptionRow
              key={o.value || "any"}
              opt={o}
              selected={o.value === value}
              multi={false}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
            />
          ))}
          {shown.length === 0 ? (
            <Text style={[type.body, styles.noMatch, { color: colors.textSecondary }]}>{t("filters.noMatches", { query: query.trim() })}</Text>
          ) : null}
        </ScrollView>
        <SheetFooter onDone={() => setOpen(false)} />
      </Sheet>
    </View>
  );
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View style={styles.head}>
      <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
      <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.surfaceSunken }]} accessibilityRole="button">
        <X size={16} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function SheetFooter({ onClear, onDone }: { onClear?: () => void; onDone: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
      {onClear ? (
        <View style={styles.footClear}>
          <Button title={t("search.clearAll")} variant="secondary" onPress={onClear} />
        </View>
      ) : null}
      <View style={styles.footDone}>
        <Button title={t("common.done")} onPress={onDone} />
      </View>
    </View>
  );
}

export interface MultiSelectFieldProps {
  /** Label above the field; omit when the enclosing section title already names it. */
  label?: string;
  placeholder: string;
  options: Opt[];
  value: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
  sheetTitle?: string;
}

/** MultiSelectField — multi-select dropdown: selected options render inside the
 *  field as removable chips (collapsed to "+X more"), and the bottom sheet offers
 *  search + checkbox selection with Clear all / Done. */
export function MultiSelectField({ label, placeholder, options, value, onChange, searchable = true, sheetTitle }: MultiSelectFieldProps) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const shown = useMemo(() => matchOptions(options, query), [options, query]);

  const selected = value
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is Opt => Boolean(o));
  const visible = selected.slice(0, VISIBLE_CHIPS);
  const hidden = selected.length - visible.length;

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const openSheet = () => {
    setQuery("");
    setOpen(true);
  };

  return (
    <View style={styles.field}>
      {label ? <FieldLabel text={label} /> : null}
      <Trigger onPress={openSheet} minHeight={FIELD_H}>
        {selected.length === 0 ? (
          <Text style={[type.body, styles.triggerValue, { color: colors.textPlaceholder }]} numberOfLines={1}>
            {placeholder}
          </Text>
        ) : (
          <View style={styles.chipRow}>
            {visible.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => toggle(o.value)}
                style={[styles.chip, { backgroundColor: colors.brandSubtle, borderRadius: radius.pill }]}
                accessibilityRole="button"
                accessibilityLabel={`${t("search.clear")} ${optLabel(o)}`}
              >
                <Text style={[styles.chipTxt, { color: colors.brandForeground, fontFamily: fontFamily.sansMedium }]} numberOfLines={1}>
                  {optLabel(o)}
                </Text>
                <X size={13} color={colors.brandForeground} strokeWidth={2.5} />
              </Pressable>
            ))}
            {hidden > 0 ? (
              <View style={[styles.chip, { backgroundColor: colors.brandSubtle, borderRadius: radius.pill }]}>
                <Text style={[styles.chipTxt, { color: colors.brandForeground, fontFamily: fontFamily.sansMedium }]}>
                  {t("filters.nMore", { count: hidden })}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Trigger>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <SheetHeader title={sheetTitle ?? label ?? ""} onClose={() => setOpen(false)} />
        {searchable ? <SheetSearch value={query} onChangeText={setQuery} /> : null}
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {(() => {
            // Group headers only make sense in the full list — hide them while searching,
            // where filtered results can jump across groups.
            const searching = query.trim().length > 0;
            const rows: ReactNode[] = [];
            let lastGroup: string | undefined;
            shown.forEach((o) => {
              if (!searching && o.group && o.group !== lastGroup) {
                lastGroup = o.group;
                rows.push(
                  <Text key={`grp-${o.group}`} style={[type.label, styles.groupHd, { color: colors.textTertiary }]}>
                    {o.group}
                  </Text>,
                );
              }
              rows.push(<OptionRow key={o.value} opt={o} selected={value.includes(o.value)} multi onPress={() => toggle(o.value)} />);
            });
            return rows;
          })()}
          {shown.length === 0 ? (
            <Text style={[type.body, styles.noMatch, { color: colors.textSecondary }]}>{t("filters.noMatches", { query: query.trim() })}</Text>
          ) : null}
        </ScrollView>
        <SheetFooter onClear={value.length ? () => onChange([]) : undefined} onDone={() => setOpen(false)} />
      </Sheet>
    </View>
  );
}

const FIELD_H = 54;

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { maxHeight: "78%", paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 8, opacity: 0.5 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  close: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  searchInput: { flex: 1, height: "100%", padding: 0, textAlignVertical: "center", includeFontPadding: false },
  list: { paddingHorizontal: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 10,
  },
  rowLabel: { flex: 1 },
  box: { width: 20, height: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  groupHd: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  noMatch: { textAlign: "center", paddingVertical: 24 },
  foot: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footClear: { flex: 1 },
  footDone: { flex: 1.5 },
  field: { gap: 6 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  triggerValue: { flex: 1 },
  chipRow: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    maxWidth: 150,
  },
  chipTxt: { fontSize: 13, flexShrink: 1 },
});
