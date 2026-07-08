import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { X, Minus, Plus, Star, Check, ImagePlus, CircleCheck, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { addMyListing, updateMyListing, getMyListing } from "@/lib/my-listings";
import {
  LISTING_STEPS,
  PROPERTY_TYPES,
  CITIES,
  DISTRICTS,
  CURRENCIES,
  AMENITIES,
  EMPTY_LISTING_FORM,
  formatPrice,
  formatArea,
  type ListingForm,
} from "@/components/listing/data";

/* ---------------- small building blocks ---------------- */

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[type.label, { color: colors.textSecondary }]}>
        {label}
        {optional ? <Text style={{ color: colors.textTertiary }}>  (optional)</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function TextBox({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  prefix,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  prefix?: string;
}) {
  const { colors, type, fontFamily, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.input,
        multiline && styles.inputMulti,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: focused ? colors.borderFocus : colors.borderSubtle,
          borderWidth: focused ? 1.5 : 1,
          borderRadius: radius.control,
        },
        focused && { boxShadow: `0 0 0 4px ${colors.ringBrand}` },
      ]}
    >
      {prefix ? <Text style={[type.body, { color: colors.textSecondary }]}>{prefix}</Text> : null}
      <TextInput
        style={[styles.inputText, { color: colors.textPrimary, fontFamily: fontFamily.sans, fontSize: type.body.fontSize }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        keyboardType={keyboardType}
        multiline={multiline}
        selectionColor={colors.brandForeground}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function Chip({ label, Icon, selected, onPress }: { label: string; Icon?: LucideIcon; selected: boolean; onPress: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const fg = selected ? colors.brandForeground : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          borderColor: selected ? colors.brandForeground : colors.borderDefault,
          backgroundColor: selected ? colors.brandSubtle : colors.surfaceCard,
        },
      ]}
    >
      {Icon ? <Icon size={15} color={fg} strokeWidth={2} /> : null}
      <Text style={[type.bodySm, { color: fg, fontFamily: selected ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>{label}</Text>
    </Pressable>
  );
}

function Segmented({ value, onChange }: { value: string; onChange: (v: "sale" | "rent") => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const opts: { value: "sale" | "rent"; label: string }[] = [
    { value: "sale", label: "For Sale" },
    { value: "rent", label: "For Rent" },
  ];
  return (
    <View style={[styles.seg, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control }]}>
      {opts.map((o) => {
        const on = value === o.value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segItem, on && { backgroundColor: colors.surfaceCard, borderRadius: radius.md }]}>
            <Text style={[type.bodySm, { color: on ? colors.brandForeground : colors.textSecondary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Text style={[type.body, { color: colors.textPrimary }]}>{label}</Text>
      <View style={[styles.stepper, { borderColor: colors.borderDefault, borderRadius: radius.control }]}>
        <Pressable onPress={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} style={styles.stepBtn}>
          <Minus size={18} color={value <= 0 ? colors.textTertiary : colors.textPrimary} strokeWidth={2.25} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold, minWidth: 24, textAlign: "center" }]}>{value}</Text>
        <Pressable onPress={() => onChange(value + 1)} style={styles.stepBtn}>
          <Plus size={18} color={colors.textPrimary} strokeWidth={2.25} />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------------- screen ---------------- */

export default function AddListingScreen() {
  const { colors, type, fontFamily, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getMyListing(id) : undefined;
  const editing = !!existing;
  const [f, setF] = useState<ListingForm>(existing?.form ?? EMPTY_LISTING_FORM);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => setF((s) => ({ ...s, [k]: v }));

  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.7 });
    if (res.canceled) return;
    const uris = res.assets.map((a) => a.uri);
    setF((s) => ({ ...s, photos: [...s.photos, ...uris], cover: s.cover ?? uris[0] ?? null }));
  };
  const removePhoto = (uri: string) =>
    setF((s) => {
      const photos = s.photos.filter((p) => p !== uri);
      return { ...s, photos, cover: s.cover === uri ? photos[0] ?? null : s.cover };
    });

  const canNext =
    step === 0 ? !!f.type && f.title.trim().length > 0 && f.price.trim().length > 0 : step === 1 ? !!f.city : true;

  const goNext = () => {
    if (step < LISTING_STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    // submit
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const fields = {
      title: f.title.trim() || "Untitled property",
      location: [f.district, f.city].filter(Boolean).join(", ") || f.city || "Kurdistan",
      deal: f.listing,
      price: formatPrice(f) || "Price on request",
      beds: f.beds,
      baths: f.baths,
      area: formatArea(f),
      cover: f.cover ?? f.photos[0] ?? null,
      form: f,
    };
    if (editing && existing) {
      updateMyListing({ ...existing, ...fields });
    } else {
      addMyListing({ id: `ml-${Date.now().toString(36)}`, ...fields, status: "pending", createdAt: Date.now() });
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: colors.surfacePage, padding: 28 }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.brandSubtle }]}>
          <CircleCheck size={40} color={colors.brandForeground} strokeWidth={2} />
        </View>
        <Text style={[type.displaySm, { color: colors.textPrimary, textAlign: "center", marginTop: 20 }]}>
          {editing ? "Changes saved" : "Property submitted"}
        </Text>
        <Text style={[type.body, { color: colors.textSecondary, textAlign: "center", marginTop: 8, maxWidth: 320 }]}>
          {editing
            ? "Your listing has been updated and is pending review before it's republished."
            : "Your listing is pending review. Our team will verify the details and publish it shortly."}
        </Text>
        <View style={{ alignSelf: "stretch", marginTop: 28 }}>
          <Button title="View my listings" onPress={() => router.replace("/my-listings")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.hbtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}>
          <X size={20} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{editing ? "Edit listing" : "Add listing"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          {LISTING_STEPS.map((_, i) => (
            <View key={i} style={[styles.progressSeg, { backgroundColor: i <= step ? colors.brandForeground : colors.borderSubtle }]} />
          ))}
        </View>
        <Text style={[type.bodySm, { color: colors.textSecondary, marginTop: 8, fontFamily: fontFamily.sansMedium }]}>
          Step {step + 1} of {LISTING_STEPS.length} · {LISTING_STEPS[step]}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* STEP 0 — Details */}
          {step === 0 ? (
            <View style={{ gap: 20 }}>
              <Field label="Listing type">
                <Segmented value={f.listing} onChange={(v) => set("listing", v)} />
              </Field>
              <Field label="Property type">
                <View style={styles.wrap}>
                  {PROPERTY_TYPES.map((t) => (
                    <Chip key={t} label={t} selected={f.type === t} onPress={() => set("type", t)} />
                  ))}
                </View>
              </Field>
              <Field label="Title">
                <TextBox value={f.title} onChangeText={(v) => set("title", v)} placeholder="e.g. Modern villa in Ankawa" />
              </Field>
              <Field label={f.listing === "rent" ? "Monthly rent" : "Price"}>
                <TextBox value={f.price} onChangeText={(v) => set("price", v)} placeholder="0" keyboardType="numeric" prefix={f.currency} />
                <View style={[styles.wrap, { marginTop: 8 }]}>
                  {CURRENCIES.map((c) => (
                    <Chip key={c} label={c} selected={f.currency === c} onPress={() => set("currency", c)} />
                  ))}
                </View>
              </Field>
              <Field label="Area" optional>
                <TextBox value={f.area} onChangeText={(v) => set("area", v)} placeholder="0" keyboardType="numeric" prefix="m²" />
              </Field>
              <View style={{ gap: 4 }}>
                <Stepper label="Bedrooms" value={f.beds} onChange={(v) => set("beds", v)} />
                <Stepper label="Bathrooms" value={f.baths} onChange={(v) => set("baths", v)} />
                <Stepper label="Parking" value={f.parking} onChange={(v) => set("parking", v)} />
              </View>
              <Field label="Description" optional>
                <TextBox value={f.description} onChangeText={(v) => set("description", v)} placeholder="Describe the property…" multiline />
              </Field>
            </View>
          ) : null}

          {/* STEP 1 — Location */}
          {step === 1 ? (
            <View style={{ gap: 20 }}>
              <Field label="City">
                <View style={styles.wrap}>
                  {CITIES.map((c) => (
                    <Chip key={c} label={c} selected={f.city === c} onPress={() => set("city", c)} />
                  ))}
                </View>
              </Field>
              <Field label="District" optional>
                <View style={styles.wrap}>
                  {DISTRICTS.map((d) => (
                    <Chip key={d} label={d} selected={f.district === d} onPress={() => set("district", f.district === d ? "" : d)} />
                  ))}
                </View>
              </Field>
              <Field label="Street / address" optional>
                <TextBox value={f.street} onChangeText={(v) => set("street", v)} placeholder="Street name, building…" />
              </Field>
            </View>
          ) : null}

          {/* STEP 2 — Photos */}
          {step === 2 ? (
            <View style={{ gap: 14 }}>
              <Text style={[type.body, { color: colors.textSecondary }]}>Add photos of your property. The first (or starred) photo is the cover.</Text>
              <View style={styles.photoGrid}>
                {f.photos.map((uri) => {
                  const isCover = f.cover === uri;
                  return (
                    <View key={uri} style={[styles.photo, { borderRadius: radius.md }]}>
                      <Image source={{ uri }} style={styles.photoImg} />
                      <Pressable onPress={() => removePhoto(uri)} style={styles.photoX}>
                        <X size={14} color="#fff" strokeWidth={2.5} />
                      </Pressable>
                      <Pressable onPress={() => set("cover", uri)} style={[styles.photoStar, isCover && { backgroundColor: colors.brandPrimary }]}>
                        <Star size={13} color="#fff" fill={isCover ? "#fff" : "transparent"} strokeWidth={2} />
                      </Pressable>
                    </View>
                  );
                })}
                <Pressable onPress={pickPhotos} style={[styles.photoAdd, { borderColor: colors.borderDefault, borderRadius: radius.md }]}>
                  <ImagePlus size={22} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[type.caption, { color: colors.textSecondary, marginTop: 4 }]}>{f.photos.length ? "Add more" : "Add photos"}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* STEP 3 — Amenities */}
          {step === 3 ? (
            <View style={{ gap: 12 }}>
              <Text style={[type.body, { color: colors.textSecondary }]}>Select the amenities this property offers.</Text>
              <View style={styles.wrap}>
                {AMENITIES.map((a) => (
                  <Chip
                    key={a.label}
                    label={a.label}
                    Icon={a.Icon}
                    selected={f.amenities.includes(a.label)}
                    onPress={() => set("amenities", f.amenities.includes(a.label) ? f.amenities.filter((x) => x !== a.label) : [...f.amenities, a.label])}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* STEP 4 — Review */}
          {step === 4 ? (
            <View style={{ gap: 16 }}>
              {f.cover ? <Image source={{ uri: f.cover }} style={[styles.reviewCover, { borderRadius: radius.card }]} /> : null}
              <View style={[styles.reviewCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
                {[
                  ["Listing", f.listing === "rent" ? "For Rent" : "For Sale"],
                  ["Type", f.type || "—"],
                  ["Title", f.title || "—"],
                  ["Price", formatPrice(f) || "—"],
                  ["Area", formatArea(f) || "—"],
                  ["Bed · Bath · Parking", `${f.beds} · ${f.baths} · ${f.parking}`],
                  ["Location", [f.district, f.city].filter(Boolean).join(", ") || "—"],
                  ["Amenities", f.amenities.length ? `${f.amenities.length} selected` : "—"],
                  ["Photos", `${f.photos.length}`],
                ].map(([k, v], i) => (
                  <View key={k} style={[styles.revRow, i > 0 && { borderTopColor: colors.borderSubtle, borderTopWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[type.bodySm, { color: colors.textTertiary }]}>{k}</Text>
                    <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium, flexShrink: 1, textAlign: "right" }]}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <Button title="Back" variant="secondary" onPress={() => setStep((s) => s - 1)} />
          </View>
        ) : null}
        <View style={{ flex: 1.4 }}>
          <Button
            title={step === LISTING_STEPS.length - 1 ? (editing ? "Save changes" : "Submit property") : "Continue"}
            onPress={goNext}
            disabled={!canNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 8 },
  hbtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  progressWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  progressBar: { flexDirection: "row", gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { minHeight: 52, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14 },
  inputMulti: { minHeight: 110, alignItems: "flex-start", paddingVertical: 12 },
  inputText: { flex: 1, padding: 0 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 14, borderWidth: 1 },
  seg: { flexDirection: "row", padding: 4, gap: 4 },
  segItem: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 4 },
  stepBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photo: { width: 104, height: 104, overflow: "hidden", backgroundColor: "#e9edf0" },
  photoImg: { width: "100%", height: "100%" },
  photoX: { position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  photoStar: { position: "absolute", bottom: 5, left: 5, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  photoAdd: { width: 104, height: 104, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  reviewCover: { width: "100%", height: 180, backgroundColor: "#e9edf0" },
  reviewCard: { borderWidth: 1, paddingHorizontal: 14 },
  revRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingVertical: 12 },
  successIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
