import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, PanResponder, StyleSheet, type LayoutChangeEvent } from "react-native";
import { useTheme } from "@/theme";

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const THUMB = 24;

/** RangeSlider — dual-thumb min/max slider (custom PanResponder, no deps). */
export function RangeSlider({
  max,
  step,
  lo,
  hi,
  onChange,
}: {
  max: number;
  step: number;
  lo: number;
  hi: number;
  onChange: (lo: number, hi: number) => void;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const trackWRef = useRef(1);
  const trackW = Math.max(1, w - THUMB);
  const toX = (v: number) => (v / max) * trackW;

  const loRef = useRef(lo);
  const hiRef = useRef(hi);
  loRef.current = lo;
  hiRef.current = hi;
  const startX = useRef(0);

  const mkPan = (which: "lo" | "hi") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startX.current = ((which === "lo" ? loRef.current : hiRef.current) / max) * trackWRef.current;
      },
      onPanResponderMove: (_, g) => {
        const tw = trackWRef.current;
        const x = Math.max(0, Math.min(tw, startX.current + g.dx));
        const v = Math.min(max, Math.max(0, Math.round(((x / tw) * max) / step) * step));
        if (which === "lo") onChange(Math.min(v, hiRef.current - step), hiRef.current);
        else onChange(loRef.current, Math.max(v, loRef.current + step));
      },
    });
  const loPan = useRef(mkPan("lo")).current;
  const hiPan = useRef(mkPan("hi")).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setW(width);
    trackWRef.current = Math.max(1, width - THUMB);
  };

  const loX = toX(lo);
  const hiX = toX(hi);
  return (
    <View style={styles.sliderWrap} onLayout={onLayout}>
      <View style={[styles.track, { backgroundColor: colors.borderDefault }]} />
      <View style={[styles.fill, { left: THUMB / 2 + loX, width: Math.max(0, hiX - loX), backgroundColor: colors.brandForeground }]} />
      <View {...loPan.panHandlers} style={[styles.thumb, { left: loX, borderColor: colors.brandForeground, backgroundColor: colors.surfaceCard }]} />
      <View {...hiPan.panHandlers} style={[styles.thumb, { left: hiX, borderColor: colors.brandForeground, backgroundColor: colors.surfaceCard }]} />
    </View>
  );
}

/** RangeInput — a labelled numeric box (Min / Max) with an optional unit prefix/suffix. */
export function RangeInput({
  label,
  value,
  prefix,
  suffix,
  onCommit,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  onCommit: (v: number) => void;
}) {
  const { colors, type, fontFamily, radius } = useTheme();
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);
  const commit = () => onCommit(Number(text.replace(/[^0-9]/g, "")) || 0);
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={[type.caption, { color: colors.textTertiary }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: focused ? colors.borderFocus : colors.borderSubtle,
            borderWidth: focused ? 1.5 : 1,
            borderRadius: radius.control,
          },
          focused && { boxShadow: `0 0 0 4px ${colors.ringBrand}` },
        ]}
      >
        {prefix ? <Text style={[type.bodySm, { color: colors.textTertiary }]}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, { color: colors.textPrimary, fontFamily: fontFamily.sans }]}
          value={text}
          onChangeText={(t) => setText(t.replace(/[^0-9]/g, ""))}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
          onSubmitEditing={commit}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.brandForeground}
        />
        {suffix ? <Text style={[type.bodySm, { color: colors.textTertiary }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrap: { height: 40, justifyContent: "center" },
  track: { position: "absolute", left: THUMB / 2, right: THUMB / 2, top: 18, height: 4, borderRadius: 2 },
  fill: { position: "absolute", top: 18, height: 4, borderRadius: 2 },
  thumb: { position: "absolute", top: 8, width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2 },
  box: { flexDirection: "row", alignItems: "center", gap: 6, height: 46, paddingHorizontal: 12 },
  input: { flex: 1, padding: 0, fontSize: 15 },
});
