import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { SQFT_PER_SQM, type SizeFilter } from "./data";
import { RangeInput, clamp } from "./RangeSlider";
import { Segmented } from "./Segmented";

type Unit = "sqm" | "sqft";
const BOUND: Record<Unit, number> = { sqm: 1000, sqft: Math.round(1000 * SQFT_PER_SQM) };
const UNIT_LABEL: Record<Unit, string> = { sqm: "m²", sqft: "ft²" };

const commas = (v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function fmt(v: number, unit: Unit): string {
  return `${commas(v)} ${UNIT_LABEL[unit]}`;
}
export function areaRangeLabel(s: SizeFilter): string {
  const atMax = s.max >= BOUND[s.unit];
  return `${fmt(s.min, s.unit)} – ${fmt(s.max, s.unit)}${atMax ? "+" : ""}`;
}

/** AreaRange — section title with an inline unit toggle (m²/ft²) on the same
 *  row, plus side-by-side min/max area inputs. Switching unit resets both
 *  inputs to the new unit's bounds. */
export function AreaRange({
  title,
  value,
  onChange,
}: {
  title: string;
  value: SizeFilter | null;
  onChange: (v: SizeFilter | null) => void;
}) {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  const [unit, setUnit] = useState<Unit>(value?.unit ?? "sqm");
  const bound = BOUND[unit];
  const lo = value && value.unit === unit ? value.min : 0;
  const hi = value && value.unit === unit ? value.max : bound;

  const switchUnit = (u: Unit) => {
    setUnit(u);
    onChange(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
        <Segmented
          options={[
            { value: "sqm", label: UNIT_LABEL.sqm },
            { value: "sqft", label: UNIT_LABEL.sqft },
          ]}
          value={unit}
          onChange={switchUnit}
        />
      </View>

      <View style={styles.minmax}>
        <RangeInput label={t("range.minArea")} value={lo} suffix={UNIT_LABEL[unit]} onCommit={(v) => onChange({ min: clamp(v, 0, hi), max: hi, unit })} />
        <View style={styles.dash}>
          <Text style={{ color: colors.textTertiary }}>–</Text>
        </View>
        <RangeInput label={t("range.maxArea")} value={hi} suffix={UNIT_LABEL[unit]} onCommit={(v) => onChange({ min: lo, max: clamp(v, lo, bound), unit })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  minmax: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  dash: { height: 46, justifyContent: "center" },
});
