import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { IQD_PER_USD, type PriceFilter } from "./data";
import { RangeInput, clamp } from "./RangeSlider";
import { Segmented } from "./Segmented";

type Cur = "USD" | "IQD";
const BOUND: Record<Cur, number> = { USD: 2_000_000, IQD: 2_000_000 * IQD_PER_USD };

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

/** PriceRange — section title with an inline currency toggle (USD/IQD) on the
 *  same row, plus side-by-side min/max price inputs. Switching currency resets
 *  both inputs to the new currency's bounds. */
export function PriceRange({
  title,
  value,
  onChange,
}: {
  title: string;
  value: PriceFilter | null;
  onChange: (v: PriceFilter | null) => void;
}) {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  const [currency, setCurrency] = useState<Cur>(value?.currency ?? "USD");
  const bound = BOUND[currency];
  const lo = value && value.currency === currency ? value.min : 0;
  const hi = value && value.currency === currency ? value.max : bound;

  const switchCur = (c: Cur) => {
    setCurrency(c);
    onChange(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
        <Segmented
          options={[
            { value: "USD", label: t("range.usd") },
            { value: "IQD", label: t("range.iqd") },
          ]}
          value={currency}
          onChange={switchCur}
        />
      </View>

      <View style={styles.minmax}>
        <RangeInput label={t("range.minPrice")} value={lo} prefix={currency === "USD" ? "$" : "IQD"} onCommit={(v) => onChange({ min: clamp(v, 0, hi), max: hi, currency })} />
        <View style={styles.dash}>
          <Text style={{ color: colors.textTertiary }}>–</Text>
        </View>
        <RangeInput label={t("range.maxPrice")} value={hi} prefix={currency === "USD" ? "$" : "IQD"} onCommit={(v) => onChange({ min: lo, max: clamp(v, lo, bound), currency })} />
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
