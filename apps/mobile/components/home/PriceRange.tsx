import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { type PriceFilter } from "./data";
import { abbreviatePrice, currencyMarker, type CurrencyCode } from "@/lib/money";
import { RangeInput, clamp } from "./RangeSlider";
import { Segmented } from "./Segmented";

type Cur = CurrencyCode;

/* Upper bound of the range PER CURRENCY, chosen as a round figure in each rather
   than converted. $2M and 2.5 billion dinars are both numbers someone would
   recognise as "the top of the market"; 2,620,000,000 — which is what $2M comes
   to at 1,310 — is not a bound any person would pick. */
const BOUND: Record<Cur, number> = { USD: 2_000_000, IQD: 2_500_000_000 };

/* Abbreviated and currency-aware. The marker and its placement come from
   lib/money, so the filter can never disagree with the cards behind it. */
const fmt = (v: number, currency: Cur) => abbreviatePrice(v, currency);

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
        <RangeInput label={t("range.minPrice")} value={lo} prefix={currencyMarker(currency)} onCommit={(v) => onChange({ min: clamp(v, 0, hi), max: hi, currency })} />
        <View style={styles.dash}>
          <Text style={{ color: colors.textTertiary }}>–</Text>
        </View>
        <RangeInput label={t("range.maxPrice")} value={hi} prefix={currencyMarker(currency)} onCommit={(v) => onChange({ min: lo, max: clamp(v, lo, bound), currency })} />
      </View>

      {/* Said once, quietly — the same line the website shows under its price
          filter. A listing quoted in the other currency is matched at the
          current rate, so one near the edge of the range can move in or out.
          Without this it reads as a broken filter. */}
      <Text style={[type.bodySm, { color: colors.textTertiary }]}>{t("range.fxNote")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  minmax: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  dash: { height: 46, justifyContent: "center" },
});
