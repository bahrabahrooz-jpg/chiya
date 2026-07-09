import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet, Platform, KeyboardAvoidingView, Modal, Animated, Easing, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { X, Minus, Plus, Star, Check, ImagePlus, CircleCheck, MapPin, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { useProfile } from "@/lib/profile";
import { addMyListing, updateMyListing, getMyListing } from "@/lib/my-listings";
import {
  LISTING_STEPS,
  PROPERTY_TYPES,
  CITIES,
  DISTRICTS,
  CURRENCIES,
  CONDITIONS,
  FURNISHING,
  ORIENTATIONS,
  AMENITIES,
  EMPTY_LISTING_FORM,
  formatPrice,
  formatArea,
  type ListingForm,
} from "@/components/listing/data";

const CITY_CENTER: Record<string, { latitude: number; longitude: number }> = {
  Erbil: { latitude: 36.1911, longitude: 43.993 },
  Sulaymaniyah: { latitude: 35.5556, longitude: 45.4329 },
  Duhok: { latitude: 36.8669, longitude: 42.9503 },
  Halabja: { latitude: 35.1778, longitude: 45.9864 },
  Kirkuk: { latitude: 35.4681, longitude: 44.3922 },
  Zakho: { latitude: 37.1436, longitude: 42.6872 },
};
const DEFAULT_CENTER = { latitude: 36.19, longitude: 44.0 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

/* ---------------- small building blocks ---------------- */

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  const { colors, type } = useTheme();
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

function SubHead({ title, desc }: { title: string; desc?: string }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View style={{ gap: 3 }}>
      <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
      {desc ? <Text style={[type.bodySm, { color: colors.textSecondary }]}>{desc}</Text> : null}
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
  suffix,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  prefix?: string;
  suffix?: string;
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
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        selectionColor={colors.brandForeground}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {suffix ? <Text style={[type.body, { color: colors.textSecondary }]}>{suffix}</Text> : null}
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

/** Single-select chip group (clears when tapping the active one). */
function ChipSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip key={o} label={o} selected={value === o} onPress={() => onChange(value === o ? "" : o)} />
      ))}
    </View>
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

function Stepper({ label, value, onChange, optional }: { label: string; value: number; onChange: (v: number) => void; optional?: boolean }) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Text style={[type.body, { color: colors.textPrimary }]}>
        {label}
        {optional ? <Text style={[type.bodySm, { color: colors.textTertiary }]}>  (optional)</Text> : null}
      </Text>
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

function MapPicker({ city, lat, lng, onMove }: { city: string; lat: string; lng: string; onMove: (la: number, ln: number) => void }) {
  const { colors, radius } = useTheme();
  const center = CITY_CENTER[city] ?? DEFAULT_CENTER;
  const marker = lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : center;
  return (
    <View style={[styles.mapWrap, { borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
      <MapView
        key={city || "default"}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        onPress={(e) => onMove(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
      >
        <Marker
          draggable
          coordinate={marker}
          pinColor={colors.brandPrimary}
          onDragEnd={(e) => onMove(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        />
      </MapView>
    </View>
  );
}

function CustomAmenities({ items, onAdd, onRemove }: { items: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.customRow}>
        <View style={{ flex: 1 }}>
          <TextBox value={text} onChangeText={setText} placeholder="e.g. Rooftop terrace" />
        </View>
        <Pressable
          onPress={add}
          disabled={!text.trim()}
          style={[styles.addAmen, { backgroundColor: colors.brandPrimary, borderRadius: radius.control, opacity: text.trim() ? 1 : 0.5 }]}
        >
          <Plus size={20} color={colors.textOnBrand} strokeWidth={2.5} />
        </Pressable>
      </View>
      {items.length ? (
        <View style={styles.wrap}>
          {items.map((it, i) => (
            <Pressable
              key={`${it}-${i}`}
              onPress={() => onRemove(i)}
              style={[styles.chip, { borderRadius: radius.pill, borderColor: colors.brandForeground, backgroundColor: colors.brandSubtle }]}
            >
              <Text style={[type.bodySm, { color: colors.brandForeground, fontFamily: fontFamily.sansMedium }]}>{it}</Text>
              <X size={13} color={colors.brandForeground} strokeWidth={2.5} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ReviewSection({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
      <View style={styles.revHead}>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>Edit</Text>
        </Pressable>
      </View>
      {rows.map(([k, v], i) => (
        <View key={k} style={[styles.revRow, i === 0 && { borderTopWidth: 0 }, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[type.bodySm, { color: colors.textTertiary }]}>{k}</Text>
          <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium, flexShrink: 1, textAlign: "right" }]}>{v || "—"}</Text>
        </View>
      ))}
    </View>
  );
}

/** Success drawer shown after submitting (mirrors the book-a-viewing success). */
function SubmitSuccessSheet({ open, editing, onDone }: { open: boolean; editing: boolean; onDone: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const ty = useRef(new Animated.Value(WINDOW_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(ty, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(ty, { toValue: WINDOW_H, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onDone}>
      <View style={styles.sheetFill}>
        <AnimatedPressable onPress={onDone} style={[styles.scrim, { opacity: scrim, backgroundColor: colors.overlay }]} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfacePage,
              borderTopLeftRadius: radius.card,
              borderTopRightRadius: radius.card,
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY: ty }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <View style={styles.sheetBody}>
            <View style={[styles.successIcon, { backgroundColor: colors.brandSubtle }]}>
              <CircleCheck size={38} color={colors.brandForeground} strokeWidth={2} />
            </View>
            <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 22, textAlign: "center", marginTop: 16 }]}>
              {editing ? "Changes saved" : "Property submitted"}
            </Text>
            <Text style={[type.body, { color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }]}>
              {editing
                ? "Your listing has been updated and is pending review before it's republished."
                : "Your listing is pending review. Our team will verify the details and publish it shortly."}
            </Text>
          </View>
          <Button title="View my listings" onPress={onDone} />
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------------- screen ---------------- */

export default function AddListingScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useProfile();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getMyListing(id) : undefined;
  const editing = !!existing;

  const [f, setF] = useState<ListingForm>(
    existing?.form ?? {
      ...EMPTY_LISTING_FORM,
      ownerName: profile.fullName,
      ownerPhone: profile.phone,
      ownerEmail: profile.email,
    },
  );
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const goTo = (n: number) => setStep(n);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.hbtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}>
          <X size={20} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
          {editing ? "Edit property" : "Submit property"}
        </Text>
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
          {/* STEP 0 — Property details */}
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
              <Field label="Property title">
                <TextBox value={f.title} onChangeText={(v) => set("title", v)} placeholder="e.g. Olive Grove Estate — Ankawa, Erbil" />
              </Field>
              <Field label="Property description" optional>
                <TextBox value={f.description} onChangeText={(v) => set("description", v)} placeholder="Describe the home, finishes, location, views…" multiline />
              </Field>
              <Field label={f.listing === "rent" ? "Monthly rent" : "Price"}>
                <TextBox value={f.price} onChangeText={(v) => set("price", v.replace(/[^0-9]/g, ""))} placeholder="Enter price" keyboardType="numeric" prefix={f.currency} />
                <View style={[styles.wrap, { marginTop: 8 }]}>
                  {CURRENCIES.map((c) => (
                    <Chip key={c} label={c} selected={f.currency === c} onPress={() => set("currency", c)} />
                  ))}
                </View>
              </Field>
              <Field label="Area size" optional>
                <TextBox value={f.area} onChangeText={(v) => set("area", v.replace(/[^0-9]/g, ""))} placeholder="Enter area size" keyboardType="numeric" suffix={f.areaUnit === "sqft" ? "ft²" : "m²"} />
                <View style={[styles.wrap, { marginTop: 8 }]}>
                  <Chip label="m²" selected={f.areaUnit === "sqm"} onPress={() => set("areaUnit", "sqm")} />
                  <Chip label="ft²" selected={f.areaUnit === "sqft"} onPress={() => set("areaUnit", "sqft")} />
                </View>
              </Field>
            </View>
          ) : null}

          {/* STEP 1 — Location */}
          {step === 1 ? (
            <View style={{ gap: 20 }}>
              <Field label="City">
                <View style={styles.wrap}>
                  {CITIES.map((c) => (
                    <Chip key={c} label={c} selected={f.city === c} onPress={() => { set("city", c); set("district", ""); }} />
                  ))}
                </View>
              </Field>
              <Field label="Area / district" optional>
                <View style={styles.wrap}>
                  {DISTRICTS.map((d) => (
                    <Chip key={d} label={d} selected={f.district === d} onPress={() => set("district", f.district === d ? "" : d)} />
                  ))}
                </View>
              </Field>
              <Field label="Project / community" optional>
                <TextBox value={f.project} onChangeText={(v) => set("project", v)} placeholder="e.g. Empire World" />
              </Field>
              <Field label="Street address" optional>
                <TextBox value={f.street} onChangeText={(v) => set("street", v)} placeholder="e.g. 60 Meter Street, Block 4" />
              </Field>
              <Field label="Building number" optional>
                <TextBox value={f.building} onChangeText={(v) => set("building", v)} placeholder="e.g. Villa 128 / Tower B" />
              </Field>
              <Field label="Map location" optional>
                <MapPicker city={f.city} lat={f.lat} lng={f.lng} onMove={(la, ln) => { set("lat", la.toFixed(5)); set("lng", ln.toFixed(5)); }} />
                <View style={styles.coordRow}>
                  <MapPin size={13} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={[type.bodySm, { color: colors.textTertiary }]}>
                    {f.lat && f.lng ? `${f.lat}, ${f.lng}` : "Tap the map or drag the pin to set the location"}
                  </Text>
                </View>
              </Field>
              <Field label="Location notes" optional>
                <TextBox value={f.locNotes} onChangeText={(v) => set("locNotes", v)} placeholder="Landmarks, access instructions, directions…" multiline />
              </Field>
            </View>
          ) : null}

          {/* STEP 2 — Media */}
          {step === 2 ? (
            <View style={{ gap: 14 }}>
              <Text style={[type.body, { color: colors.textSecondary }]}>Upload property photos. The first (or starred) photo is the cover shown across search and the listing.</Text>
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

          {/* STEP 3 — Amenities & features */}
          {step === 3 ? (
            <View style={{ gap: 24 }}>
              <View style={{ gap: 12 }}>
                <SubHead title="Property features" desc="The property's specifications and characteristics." />
                <View style={{ gap: 4 }}>
                  <Stepper label="Bedrooms" value={f.beds} onChange={(v) => set("beds", v)} />
                  <Stepper label="Bathrooms" value={f.baths} onChange={(v) => set("baths", v)} />
                  <Stepper label="Parking spaces" value={f.parking} onChange={(v) => set("parking", v)} optional />
                  <Stepper label="Levels / floors" value={f.floors} onChange={(v) => set("floors", v)} optional />
                </View>
                <Field label="Year built" optional>
                  <TextBox value={f.year} onChangeText={(v) => set("year", v.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="e.g. 2022" keyboardType="numeric" />
                </Field>
                <Field label="Orientation" optional>
                  <ChipSelect options={ORIENTATIONS} value={f.orientation} onChange={(v) => set("orientation", v)} />
                </Field>
                <Field label="Property condition" optional>
                  <ChipSelect options={CONDITIONS} value={f.condition} onChange={(v) => set("condition", v)} />
                </Field>
                <Field label="Furnishing" optional>
                  <ChipSelect options={FURNISHING} value={f.furnishing} onChange={(v) => set("furnishing", v)} />
                </Field>
              </View>

              <View style={{ gap: 12 }}>
                <SubHead title="Amenities" desc="Select all amenities available for this property." />
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
                <Field label="Custom amenities" optional>
                  <CustomAmenities
                    items={f.customAmenities}
                    onAdd={(t) => set("customAmenities", f.customAmenities.includes(t) ? f.customAmenities : [...f.customAmenities, t])}
                    onRemove={(i) => set("customAmenities", f.customAmenities.filter((_, idx) => idx !== i))}
                  />
                </Field>
              </View>
            </View>
          ) : null}

          {/* STEP 4 — Ownership & assignment */}
          {step === 4 ? (
            <View style={{ gap: 20 }}>
              <SubHead title="Owner details" desc="How our team can reach you about this listing." />
              <Field label="Owner full name">
                <TextBox value={f.ownerName} onChangeText={(v) => set("ownerName", v)} placeholder="e.g. Hêmin Abdullah" />
              </Field>
              <Field label="Phone number">
                <TextBox value={f.ownerPhone} onChangeText={(v) => set("ownerPhone", v)} placeholder="+964 750 000 0000" keyboardType="phone-pad" />
              </Field>
              <Field label="Email address">
                <TextBox value={f.ownerEmail} onChangeText={(v) => set("ownerEmail", v)} placeholder="owner@email.com" keyboardType="email-address" />
              </Field>
            </View>
          ) : null}

          {/* STEP 5 — Review */}
          {step === 5 ? (
            <View style={{ gap: 14 }}>
              {f.cover ? <Image source={{ uri: f.cover }} style={[styles.reviewCover, { borderRadius: radius.card }]} /> : null}
              <ReviewSection
                title="Property details"
                onEdit={() => goTo(0)}
                rows={[
                  ["Listing type", f.listing === "rent" ? "For Rent" : "For Sale"],
                  ["Property type", f.type],
                  ["Title", f.title],
                  ["Price", formatPrice(f)],
                  ["Area size", formatArea(f)],
                ]}
              />
              <ReviewSection
                title="Location"
                onEdit={() => goTo(1)}
                rows={[
                  ["City", f.city],
                  ["Area / district", f.district],
                  ["Project", f.project],
                  ["Street", f.street],
                  ["Coordinates", f.lat && f.lng ? `${f.lat}, ${f.lng}` : ""],
                ]}
              />
              <ReviewSection title="Media" onEdit={() => goTo(2)} rows={[["Photos", `${f.photos.length} uploaded`]]} />
              <ReviewSection
                title="Amenities & features"
                onEdit={() => goTo(3)}
                rows={[
                  ["Bed · Bath · Parking", `${f.beds} · ${f.baths} · ${f.parking}`],
                  ["Floors", f.floors ? `${f.floors}` : ""],
                  ["Year built", f.year],
                  ["Condition", f.condition],
                  ["Furnishing", f.furnishing],
                  ["Amenities", `${f.amenities.length + f.customAmenities.length} selected`],
                ]}
              />
              <ReviewSection
                title="Owner"
                onEdit={() => goTo(4)}
                rows={[
                  ["Name", f.ownerName],
                  ["Phone", f.ownerPhone],
                  ["Email", f.ownerEmail],
                ]}
              />
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

      <SubmitSuccessSheet open={submitted} editing={editing} onDone={() => router.replace("/my-listings")} />
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
  mapWrap: { height: 200, borderWidth: 1, overflow: "hidden" },
  coordRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  customRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addAmen: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photo: { width: 104, height: 104, overflow: "hidden", backgroundColor: "#e9edf0" },
  photoImg: { width: "100%", height: "100%" },
  photoX: { position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  photoStar: { position: "absolute", bottom: 5, left: 5, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  photoAdd: { width: 104, height: 104, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  reviewCover: { width: "100%", height: 180, backgroundColor: "#e9edf0" },
  reviewCard: { borderWidth: 1, paddingHorizontal: 14, paddingBottom: 4 },
  revHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  revRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  sheetFill: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { paddingTop: 8, paddingHorizontal: 20 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 8, opacity: 0.5 },
  sheetBody: { alignItems: "center", paddingTop: 12, paddingBottom: 24 },
});
