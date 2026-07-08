import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { SQFT_PER_SQM, type SizeFilter } from "./data";
import { RangeSlider, RangeInput, clamp } from "./RangeSlider";

type Unit = "sqm" | "sqft";
const BOUND: Record<Unit, number> = { sqm: 1000, sqft: Math.round(1000 * SQFT_PER_SQM) };
const STEP: Record<Unit, number> = { sqm: 10, sqft: 100 };
const UNIT_LABEL: Record<Unit, string> = { sqm: "m²", sqft: "ft²" };

const commas = (v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function fmt(v: number, unit: Unit): string {
  return `${commas(v)} ${UNIT_LABEL[unit]}`;
}
export function areaRangeLabel(s: SizeFilter): string {
  const atMax = s.max >= BOUND[s.unit];
  return `${fmt(s.min, s.unit)} – ${fmt(s.max, s.unit)}${atMax ? "+" : ""}`;
}

/** AreaRange — a unit toggle (m²/ft²) + a min/max range slider and inputs. */
export function AreaRange({ value, onChange }: { value: SizeFilter | null; onChange: (v: SizeFilter | null) => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const [unit, setUnit] = useState<Unit>(value?.unit ?? "sqm");
  const bound = BOUND[unit];
  const lo = value && value.unit === unit ? value.min : 0;
  const hi = value && value.unit === unit ? value.max : bound;

  const switchUnit = (u: Unit) => {
    setUnit(u);
    onChange(null);
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.seg, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control }]}>
        {(["sqm", "sqft"] as Unit[]).map((u) => {
          const on = unit === u;
          return (
            <Pressable key={u} onPress={() => switchUnit(u)} style={[styles.segItem, on && { backgroundColor: colors.surfaceCard, borderRadius: radius.md }]}>
              <Text style={[type.bodySm, { color: on ? colors.brandForeground : colors.textSecondary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>
                {u === "sqm" ? "Sq. metres (m²)" : "Sq. feet (ft²)"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <RangeSlider key={unit} max={bound} step={STEP[unit]} lo={lo} hi={hi} onChange={(l, h) => onChange({ min: l, max: h, unit })} />

      <View style={styles.minmax}>
        <RangeInput label="Min" value={lo} suffix={UNIT_LABEL[unit]} onCommit={(v) => onChange({ min: clamp(v, 0, hi), max: hi, unit })} />
        <View style={styles.dash}>
          <Text style={{ color: colors.textTertiary }}>–</Text>
        </View>
        <RangeInput label="Max" value={hi} suffix={UNIT_LABEL[unit]} onCommit={(v) => onChange({ min: lo, max: clamp(v, lo, bound), unit })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: "row", padding: 4, gap: 4 },
  segItem: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" },
  minmax: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  dash: { height: 46, justifyContent: "center" },
});
