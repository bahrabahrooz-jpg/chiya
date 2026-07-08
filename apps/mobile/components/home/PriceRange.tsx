import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { IQD_PER_USD, type PriceFilter } from "./data";
import { RangeSlider, RangeInput, clamp } from "./RangeSlider";

type Cur = "USD" | "IQD";
const BOUND: Record<Cur, number> = { USD: 2_000_000, IQD: 2_000_000 * IQD_PER_USD };
const STEP: Record<Cur, number> = { USD: 10_000, IQD: 10_000 * IQD_PER_USD };

function abbr(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(v % 1e9 ? 1 : 0)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 ? 1 : 0)}M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}K`;
  return `${v}`;
}
function fmt(v: number, currency: Cur): string {
  return currency === "USD" ? `$${abbr(v)}` : `${abbr(v)} IQD`;
}
export function priceRangeLabel(p: PriceFilter): string {
  const atMax = p.max >= BOUND[p.currency];
  return `${fmt(p.min, p.currency)} – ${fmt(p.max, p.currency)}${atMax ? "+" : ""}`;
}

/** PriceRange — a currency toggle (Dollar/Dinar) + a min/max range slider and inputs. */
export function PriceRange({ value, onChange }: { value: PriceFilter | null; onChange: (v: PriceFilter | null) => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const [currency, setCurrency] = useState<Cur>(value?.currency ?? "USD");
  const bound = BOUND[currency];
  const lo = value && value.currency === currency ? value.min : 0;
  const hi = value && value.currency === currency ? value.max : bound;

  const switchCur = (c: Cur) => {
    setCurrency(c);
    onChange(null);
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.seg, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control }]}>
        {(["IQD", "USD"] as Cur[]).map((c) => {
          const on = currency === c;
          return (
            <Pressable key={c} onPress={() => switchCur(c)} style={[styles.segItem, on && { backgroundColor: colors.surfaceCard, borderRadius: radius.md }]}>
              <Text style={[type.bodySm, { color: on ? colors.brandForeground : colors.textSecondary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>
                {c === "USD" ? "Dollar ($)" : "Dinar (IQD)"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <RangeSlider key={currency} max={bound} step={STEP[currency]} lo={lo} hi={hi} onChange={(l, h) => onChange({ min: l, max: h, currency })} />

      <View style={styles.minmax}>
        <RangeInput label="Min" value={lo} prefix={currency === "USD" ? "$" : "IQD"} onCommit={(v) => onChange({ min: clamp(v, 0, hi), max: hi, currency })} />
        <View style={styles.dash}>
          <Text style={{ color: colors.textTertiary }}>–</Text>
        </View>
        <RangeInput label="Max" value={hi} prefix={currency === "USD" ? "$" : "IQD"} onCommit={(v) => onChange({ min: lo, max: clamp(v, lo, bound), currency })} />
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
