import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet, Platform, KeyboardAvoidingView, Modal, Animated, Easing, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { X, Minus, Plus, Star, ImagePlus, CircleCheck, MapPin, ChevronDown, Video, Trash2, Save } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { Button, ActionSheet, type SheetAction } from "@/components/ui";
import { SelectField, MultiSelectField } from "@/components/home/SelectField";
import { AgentPicker } from "@/components/listing/AgentPicker";
import { confirm } from "@/lib/confirm";
import { useProfile } from "@/lib/profile";
import { addMyListing, updateMyListing, getMyListing } from "@/lib/my-listings";
import { labelFor, dealCategories, agents, areasByCity, projectsByCity, type Opt } from "@/components/home/data";
import {
  LISTING_STEPS,
  PROPERTY_TYPES,
  CITIES,
  CURRENCIES,
  CONDITIONS,
  FURNISHING,
  ORIENTATIONS,
  AMENITIES,
  EMPTY_LISTING_FORM,
  listingLabel,
  formatPrice,
  formatArea,
  type ListingForm,
} from "@/components/listing/data";

const CITY_CENTER: Record<string, { latitude: number; longitude: number }> = {
  Erbil: { latitude: 36.1911, longitude: 43.993 },
  Sulaymaniyah: { latitude: 35.5556, longitude: 45.4329 },
  Duhok: { latitude: 36.8669, longitude: 42.9503 },
};
const DEFAULT_CENTER = { latitude: 36.19, longitude: 44.0 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WINDOW_H = Dimensions.get("window").height;

/* ---------------- small building blocks ---------------- */

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  const { colors, type } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[type.label, { color: colors.textSecondary }]}>
        {label}
        {optional ? <Text style={{ color: colors.textTertiary }}>{"  "}{t("listingForm.optional")}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function SubHead({ title, desc, optional }: { title: string; desc?: string; optional?: boolean }) {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: 3 }}>
      <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
        {title}
        {optional ? <Text style={[type.bodySm, { color: colors.textTertiary }]}>{"  "}{t("listingForm.optional")}</Text> : null}
      </Text>
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
  leading,
  trailing,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  prefix?: string;
  suffix?: string;
  /** Leading adornment (e.g. an in-input currency dropdown). */
  leading?: React.ReactNode;
  /** Trailing adornment (e.g. an in-input unit dropdown). */
  trailing?: React.ReactNode;
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
      {leading ? leading : null}
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
      {trailing ? trailing : suffix ? <Text style={[type.body, { color: colors.textSecondary }]}>{suffix}</Text> : null}
    </View>
  );
}

/** InlineSelect — a compact dropdown embedded inside a TextBox (currency / unit),
 *  mirroring the website's in-field select. Opens a bottom-sheet menu on tap.
 *  `side` places the divider so it separates the dropdown from the input. */
function InlineSelect({ label, onPress, side = "trailing" }: { label: string; onPress: () => void; side?: "leading" | "trailing" }) {
  const { colors, type, fontFamily } = useTheme();
  const divider = <View style={[styles.inlineDivider, { backgroundColor: colors.borderSubtle }]} />;
  return (
    <Pressable onPress={onPress} hitSlop={6} style={side === "leading" ? styles.inlineSelLeading : styles.inlineSel} accessibilityRole="button">
      {side === "trailing" ? divider : null}
      <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{label}</Text>
      <ChevronDown size={16} color={colors.textTertiary} strokeWidth={2} />
      {side === "leading" ? divider : null}
    </Pressable>
  );
}

function Segmented({ value, onChange }: { value: string; onChange: (v: "sale" | "rent") => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const opts: { value: "sale" | "rent"; label: string }[] = [
    { value: "sale", label: labelFor(dealCategories, "buy") },
    { value: "rent", label: labelFor(dealCategories, "rent") },
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
  const { t } = useTranslation();
  return (
    <View style={styles.stepperRow}>
      <Text style={[type.body, { color: colors.textPrimary }]}>
        {label}
        {optional ? <Text style={[type.bodySm, { color: colors.textTertiary }]}>{"  "}{t("listingForm.optional")}</Text> : null}
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
        legalLabelInsets={{ bottom: -9999, left: -9999, top: 0, right: 0 }}
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
  const { t: tr } = useTranslation();
  const [text, setText] = useState("");
  const [dupe, setDupe] = useState("");
  // Reject a custom amenity that duplicates a preset (English label or localized
  // display) or an existing custom tag — mirrors the web admin form.
  const findMatch = (raw: string) => {
    const q = raw.trim().toLowerCase();
    const preset = AMENITIES.find((a) => a.label.toLowerCase() === q || listingLabel(a.label).toLowerCase() === q);
    if (preset) return listingLabel(preset.label);
    return items.find((it) => it.toLowerCase() === q) ?? "";
  };
  const add = () => {
    const v = text.trim();
    if (!v) return;
    const match = findMatch(v);
    if (match) {
      setDupe(tr("listingForm.amDupeHint", { name: match }));
      return;
    }
    onAdd(v);
    setText("");
    setDupe("");
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.customRow}>
        <View style={{ flex: 1 }}>
          <TextBox
            value={text}
            onChangeText={(v) => {
              setText(v);
              if (dupe) setDupe("");
            }}
            placeholder={tr("listingForm.customPlaceholder")}
          />
        </View>
        <Pressable
          onPress={add}
          disabled={!text.trim()}
          style={[styles.addAmen, { backgroundColor: colors.brandPrimary, borderRadius: radius.control, opacity: text.trim() ? 1 : 0.5 }]}
        >
          <Plus size={20} color={colors.textOnBrand} strokeWidth={2.5} />
        </Pressable>
      </View>
      {dupe ? <Text style={[type.bodySm, { color: colors.textError }]}>{dupe}</Text> : null}
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
  const { t, isRTL } = useTranslation();
  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
      <View style={styles.revHead}>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>{t("listingForm.edit")}</Text>
        </Pressable>
      </View>
      {rows.map(([k, v], i) => (
        <View key={k} style={[styles.revRow, i === 0 && { borderTopWidth: 0 }, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[type.bodySm, { color: colors.textTertiary }]}>{k}</Text>
          <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium, flexShrink: 1, textAlign: isRTL ? "left" : "right" }]}>{v || "—"}</Text>
        </View>
      ))}
    </View>
  );
}

/** Success drawer shown after submitting (mirrors the book-a-viewing success). */
function SubmitSuccessSheet({ open, editing, onDone }: { open: boolean; editing: boolean; onDone: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
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
              {editing ? t("listingForm.changesSaved") : t("listingForm.propertySubmitted")}
            </Text>
            <Text style={[type.body, { color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }]}>
              {editing ? t("listingForm.editedPending") : t("listingForm.newPending")}
            </Text>
          </View>
          <Button title={t("listingForm.viewMyListings")} onPress={onDone} />
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------------- screen ---------------- */

export default function AddListingScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useProfile();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getMyListing(id) : undefined;
  const editing = !!existing;

  const initialForm: ListingForm =
    existing?.form ?? {
      ...EMPTY_LISTING_FORM,
      ownerName: profile.fullName,
      ownerPhone: profile.phone,
      ownerEmail: profile.email,
    };
  const [f, setF] = useState<ListingForm>(initialForm);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const goTo = (n: number) => setStep(n);

  // Snapshot the starting form so closing can warn about unsaved changes.
  const initialSnapshot = useRef(JSON.stringify(initialForm)).current;
  const close = () => {
    if (submitted || JSON.stringify(f) === initialSnapshot) {
      router.back();
      return;
    }
    confirm({
      title: t("listingForm.discardTitle"),
      message: t("listingForm.discardMessage"),
      confirmLabel: t("listingForm.discard"),
      cancelLabel: t("listingForm.keepEditing"),
      warning: true,
      icon: Save,
      onConfirm: () => router.back(),
    });
  };

  // Dropdown options (rebuilt each render so labels follow the active locale).
  const opts = (arr: string[]): Opt[] => arr.map((v) => ({ value: v, label: listingLabel(v) }));
  const noneOpt: Opt = { value: "", label: t("listingForm.none") };
  const typeOpts = opts(PROPERTY_TYPES);
  const cityOpts = opts(CITIES);
  // Areas / projects are scoped to the selected city, mirroring the web form
  // (add-property-app.tsx) and the home filter — both derive from the shared
  // catalog (areasByCity / projectsByCity). Their Opts already carry ar/ku.
  const districtOpts = [noneOpt, ...(areasByCity[f.city] ?? [])];
  const projectOpts = [noneOpt, ...(projectsByCity[f.city] ?? [])];
  const orientationOpts = [noneOpt, ...opts(ORIENTATIONS)];
  const conditionOpts = [noneOpt, ...opts(CONDITIONS)];
  const furnishingOpts = [noneOpt, ...opts(FURNISHING)];
  const groupKey = {
    comfort: "listingForm.amGroup.comfort",
    security: "listingForm.amGroup.security",
    outdoor: "listingForm.amGroup.outdoor",
    building: "listingForm.amGroup.building",
  } as const;
  const amenityOpts: Opt[] = AMENITIES.map((a) => ({ value: a.label, label: listingLabel(a.label), Icon: a.Icon, group: t(groupKey[a.group]) }));
  const assignedAgentName = agents.find((a) => a.id === f.assignedAgent)?.name ?? "";

  // In-input currency / unit dropdowns open a compact bottom-sheet menu.
  const [menu, setMenu] = useState<{ title?: string; actions: SheetAction[] } | null>(null);
  const openCurrency = () =>
    setMenu({ title: t("listingForm.currency"), actions: CURRENCIES.map((c) => ({ label: c, onPress: () => set("currency", c) })) });
  const openUnit = () =>
    setMenu({
      title: t("listingForm.areaUnit"),
      actions: [
        { label: "m²", onPress: () => set("areaUnit", "sqm") },
        { label: "ft²", onPress: () => set("areaUnit", "sqft") },
      ],
    });

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

  const pickVideos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], allowsMultipleSelection: true, quality: 0.7 });
    if (res.canceled) return;
    const uris = res.assets.map((a) => a.uri);
    setF((s) => ({ ...s, videos: [...s.videos, ...uris.filter((u) => !s.videos.includes(u))] }));
  };
  const removeVideo = (uri: string) => setF((s) => ({ ...s, videos: s.videos.filter((v) => v !== uri) }));

  const canNext =
    step === 0 ? !!f.type && f.title.trim().length > 0 && f.price.trim().length > 0 && f.area.trim().length > 0 : step === 1 ? !!f.city : true;

  const goNext = () => {
    if (step < LISTING_STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const fields = {
      title: f.title.trim() || t("listingForm.untitled"),
      location: [f.district, f.city].filter(Boolean).join(", ") || f.city || "Kurdistan",
      deal: f.listing,
      price: formatPrice(f) || t("listingForm.priceOnRequest"),
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
        <Pressable onPress={close} hitSlop={8} style={[styles.hbtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle }]}>
          <X size={20} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
          {editing ? t("listingForm.editProperty") : t("listingForm.submitProperty")}
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
          {t("listingForm.stepOf", { n: step + 1, total: LISTING_STEPS.length, name: listingLabel(LISTING_STEPS[step]) })}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* STEP 0 — Property details */}
          {step === 0 ? (
            <View style={{ gap: 20 }}>
              <Field label={t("listingForm.listingType")}>
                <Segmented value={f.listing} onChange={(v) => set("listing", v)} />
              </Field>
              <Field label={t("listingForm.propertyType")}>
                <SelectField
                  placeholder={t("listingForm.selectType")}
                  sheetTitle={t("listingForm.propertyType")}
                  options={typeOpts}
                  value={f.type}
                  onChange={(v) => set("type", v)}
                />
              </Field>
              <Field label={t("listingForm.propertyTitle")}>
                <TextBox value={f.title} onChangeText={(v) => set("title", v)} placeholder={t("listingForm.titlePlaceholder")} />
              </Field>
              <Field label={t("listingForm.propertyDescription")} optional>
                <TextBox value={f.description} onChangeText={(v) => set("description", v)} placeholder={t("listingForm.descPlaceholder")} multiline />
              </Field>
              <Field label={f.listing === "rent" ? t("listingForm.monthlyRent") : t("listingForm.price")}>
                <TextBox
                  value={f.price}
                  onChangeText={(v) => set("price", v.replace(/[^0-9]/g, ""))}
                  placeholder={t("listingForm.enterPrice")}
                  keyboardType="numeric"
                  leading={<InlineSelect label={f.currency} onPress={openCurrency} side="leading" />}
                />
              </Field>
              <Field label={t("listingForm.areaSize")}>
                <TextBox
                  value={f.area}
                  onChangeText={(v) => set("area", v.replace(/[^0-9]/g, ""))}
                  placeholder={t("listingForm.enterArea")}
                  keyboardType="numeric"
                  trailing={<InlineSelect label={f.areaUnit === "sqft" ? "ft²" : "m²"} onPress={openUnit} />}
                />
              </Field>
            </View>
          ) : null}

          {/* STEP 1 — Location */}
          {step === 1 ? (
            <View style={{ gap: 20 }}>
              <Field label={t("listingForm.city")}>
                <SelectField
                  placeholder={t("listingForm.selectCity")}
                  sheetTitle={t("listingForm.city")}
                  searchable
                  options={cityOpts}
                  value={f.city}
                  onChange={(v) => { set("city", v); set("district", ""); set("project", ""); }}
                />
              </Field>
              <Field label={t("listingForm.district")} optional>
                <SelectField
                  placeholder={t("listingForm.selectDistrict")}
                  sheetTitle={t("listingForm.district")}
                  searchable
                  options={districtOpts}
                  value={f.district}
                  onChange={(v) => set("district", v)}
                />
              </Field>
              <Field label={t("listingForm.project")} optional>
                <SelectField
                  placeholder={t("listingForm.selectProject")}
                  sheetTitle={t("listingForm.project")}
                  searchable
                  options={projectOpts}
                  value={f.project}
                  onChange={(v) => set("project", v)}
                />
              </Field>
              <Field label={t("listingForm.street")} optional>
                <TextBox value={f.street} onChangeText={(v) => set("street", v)} placeholder={t("listingForm.streetPlaceholder")} />
              </Field>
              <Field label={t("listingForm.building")} optional>
                <TextBox value={f.building} onChangeText={(v) => set("building", v)} placeholder={t("listingForm.buildingPlaceholder")} />
              </Field>
              <Field label={t("listingForm.mapLocation")} optional>
                <MapPicker city={f.city} lat={f.lat} lng={f.lng} onMove={(la, ln) => { set("lat", la.toFixed(5)); set("lng", ln.toFixed(5)); }} />
                <View style={styles.coordRow}>
                  <MapPin size={13} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={[type.bodySm, { color: colors.textTertiary }]}>
                    {f.lat && f.lng ? `${f.lat}, ${f.lng}` : t("listingForm.mapHint")}
                  </Text>
                </View>
              </Field>
              <Field label={t("listingForm.locationNotes")} optional>
                <TextBox value={f.locNotes} onChangeText={(v) => set("locNotes", v)} placeholder={t("listingForm.locNotesPlaceholder")} multiline />
              </Field>
            </View>
          ) : null}

          {/* STEP 2 — Media */}
          {step === 2 ? (
            <View style={{ gap: 24 }}>
              <View style={{ gap: 12 }}>
                <SubHead title={t("listingForm.photosTitle")} desc={t("listingForm.mediaHint")} />
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
                    <Text style={[type.caption, { color: colors.textSecondary, marginTop: 4 }]}>{f.photos.length ? t("listingForm.addMore") : t("listingForm.addPhotos")}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <SubHead title={t("listingForm.videoTitle")} desc={t("listingForm.videoDesc")} optional />
                {f.videos.map((uri, i) => (
                  <View key={uri} style={[styles.videoRow, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.control }]}>
                    <View style={[styles.videoIcon, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder, borderRadius: radius.md }]}>
                      <Video size={18} color={colors.brandForeground} strokeWidth={2} />
                    </View>
                    <Text style={[type.bodySm, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium, flex: 1 }]} numberOfLines={1}>
                      {t("listingForm.videoFile", { n: i + 1 })}
                    </Text>
                    <Pressable onPress={() => removeVideo(uri)} hitSlop={8}>
                      <Trash2 size={18} color={colors.error} strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={pickVideos} style={[styles.videoAdd, { borderColor: colors.borderDefault, borderRadius: radius.control }]}>
                  <Video size={19} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansMedium }]}>
                    {f.videos.length ? t("listingForm.addMoreVideos") : t("listingForm.uploadVideo")}
                  </Text>
                </Pressable>

                <Field label={t("listingForm.videoUrl")} optional>
                  <TextBox value={f.videoUrl} onChangeText={(v) => set("videoUrl", v)} placeholder={t("listingForm.videoUrlPlaceholder")} />
                </Field>
              </View>
            </View>
          ) : null}

          {/* STEP 3 — Amenities & features */}
          {step === 3 ? (
            <View style={{ gap: 24 }}>
              <View style={{ gap: 12 }}>
                <SubHead title={t("listingForm.featuresTitle")} desc={t("listingForm.featuresDesc")} />
                <View style={{ gap: 4 }}>
                  <Stepper label={t("listingForm.bedrooms")} value={f.beds} onChange={(v) => set("beds", v)} />
                  <Stepper label={t("listingForm.bathrooms")} value={f.baths} onChange={(v) => set("baths", v)} />
                  <Stepper label={t("listingForm.parkingSpaces")} value={f.parking} onChange={(v) => set("parking", v)} optional />
                  <Stepper label={t("listingForm.levelsFloors")} value={f.floors} onChange={(v) => set("floors", v)} optional />
                </View>
                <Field label={t("listingForm.yearBuilt")} optional>
                  <TextBox value={f.year} onChangeText={(v) => set("year", v.replace(/[^0-9]/g, "").slice(0, 4))} placeholder={t("listingForm.yearPlaceholder")} keyboardType="numeric" />
                </Field>
                <Field label={t("listingForm.orientation")} optional>
                  <SelectField placeholder={t("listingForm.selectOption")} sheetTitle={t("listingForm.orientation")} options={orientationOpts} value={f.orientation} onChange={(v) => set("orientation", v)} />
                </Field>
                <Field label={t("listingForm.condition")} optional>
                  <SelectField placeholder={t("listingForm.selectOption")} sheetTitle={t("listingForm.condition")} options={conditionOpts} value={f.condition} onChange={(v) => set("condition", v)} />
                </Field>
                <Field label={t("listingForm.furnishing")} optional>
                  <SelectField placeholder={t("listingForm.selectOption")} sheetTitle={t("listingForm.furnishing")} options={furnishingOpts} value={f.furnishing} onChange={(v) => set("furnishing", v)} />
                </Field>
              </View>

              <View style={{ gap: 12 }}>
                <SubHead title={t("listingForm.amenitiesTitle")} desc={t("listingForm.amenitiesDesc")} />
                <MultiSelectField
                  placeholder={t("listingForm.selectAmenities")}
                  sheetTitle={t("listingForm.amenitiesTitle")}
                  options={amenityOpts}
                  value={f.amenities}
                  onChange={(v) => set("amenities", v)}
                />
                <Field label={t("listingForm.customAmenities")} optional>
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
              <SubHead title={t("listingForm.ownerDetails")} desc={t("listingForm.ownerDetailsDesc")} />
              <Field label={t("listingForm.ownerName")}>
                <TextBox value={f.ownerName} onChangeText={(v) => set("ownerName", v)} placeholder={t("listingForm.ownerNamePlaceholder")} />
              </Field>
              <Field label={t("listingForm.phone")}>
                <TextBox value={f.ownerPhone} onChangeText={(v) => set("ownerPhone", v)} placeholder={t("listingForm.phonePlaceholder")} keyboardType="phone-pad" />
              </Field>
              <Field label={t("listingForm.email")}>
                <TextBox value={f.ownerEmail} onChangeText={(v) => set("ownerEmail", v)} placeholder={t("listingForm.emailPlaceholder")} keyboardType="email-address" />
              </Field>

              <View style={{ gap: 12, marginTop: 4 }}>
                <SubHead title={t("listingForm.assignmentTitle")} desc={t("listingForm.assignmentDesc")} optional />
                <AgentPicker value={f.assignedAgent} onChange={(v) => set("assignedAgent", v)} />
              </View>
            </View>
          ) : null}

          {/* STEP 5 — Review */}
          {step === 5 ? (
            <View style={{ gap: 14 }}>
              {f.cover ? <Image source={{ uri: f.cover }} style={[styles.reviewCover, { borderRadius: radius.card }]} /> : null}
              <ReviewSection
                title={listingLabel("Property details")}
                onEdit={() => goTo(0)}
                rows={[
                  [t("listingForm.listingType"), labelFor(dealCategories, f.listing === "rent" ? "rent" : "buy")],
                  [t("listingForm.propertyType"), listingLabel(f.type)],
                  [t("listingForm.review.title"), f.title],
                  [t("listingForm.price"), formatPrice(f)],
                  [t("listingForm.review.areaSize"), formatArea(f)],
                ]}
              />
              <ReviewSection
                title={listingLabel("Location")}
                onEdit={() => goTo(1)}
                rows={[
                  [t("listingForm.city"), listingLabel(f.city)],
                  [t("listingForm.review.areaDistrict"), listingLabel(f.district)],
                  [t("listingForm.review.project"), listingLabel(f.project)],
                  [t("listingForm.review.street"), f.street],
                  [t("listingForm.review.coordinates"), f.lat && f.lng ? `${f.lat}, ${f.lng}` : ""],
                ]}
              />
              <ReviewSection
                title={listingLabel("Media")}
                onEdit={() => goTo(2)}
                rows={[
                  [t("listingForm.review.photos"), t("listingForm.photosUploaded", { count: f.photos.length })],
                  [t("listingForm.review.videos"), t("listingForm.videosUploaded", { count: f.videos.length })],
                  [t("listingForm.review.videoUrl"), f.videoUrl],
                ]}
              />
              <ReviewSection
                title={listingLabel("Amenities & features")}
                onEdit={() => goTo(3)}
                rows={[
                  [t("listingForm.review.bedBathParking"), `${f.beds} · ${f.baths} · ${f.parking}`],
                  [t("listingForm.review.floors"), f.floors ? `${f.floors}` : ""],
                  [t("listingForm.review.yearBuilt"), f.year],
                  [t("listingForm.review.condition"), listingLabel(f.condition)],
                  [t("listingForm.review.furnishing"), listingLabel(f.furnishing)],
                  [t("listingForm.review.amenities"), t("listingForm.selectedCount", { count: f.amenities.length + f.customAmenities.length })],
                ]}
              />
              <ReviewSection
                title={t("listingForm.review.owner")}
                onEdit={() => goTo(4)}
                rows={[
                  [t("listingForm.review.name"), f.ownerName],
                  [t("listingForm.review.phone"), f.ownerPhone],
                  [t("listingForm.review.email"), f.ownerEmail],
                  [t("listingForm.assignedAgent"), assignedAgentName],
                ]}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flex: 1 }}>
          <Button
            title={step > 0 ? t("listingForm.back") : t("listingForm.cancel")}
            variant="secondary"
            onPress={() => (step > 0 ? setStep((s) => s - 1) : close())}
          />
        </View>
        <View style={{ flex: 1.4 }}>
          <Button
            title={step === LISTING_STEPS.length - 1 ? (editing ? t("listingForm.saveChanges") : t("listingForm.submitProperty")) : t("listingForm.continue")}
            onPress={goNext}
            disabled={!canNext}
          />
        </View>
      </View>

      <ActionSheet open={!!menu} onClose={() => setMenu(null)} title={menu?.title} actions={menu?.actions ?? []} />
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
  inlineSel: { flexDirection: "row", alignItems: "center", gap: 6, paddingStart: 10, height: "100%" },
  inlineSelLeading: { flexDirection: "row", alignItems: "center", gap: 6, paddingEnd: 10, height: "100%" },
  inlineDivider: { width: StyleSheet.hairlineWidth, height: 26 },
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
  photoX: { position: "absolute", top: 5, end: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  photoStar: { position: "absolute", bottom: 5, start: 5, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  photoAdd: { width: 104, height: 104, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  videoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  videoIcon: { width: 36, height: 36, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  videoAdd: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderWidth: 1, borderStyle: "dashed" },
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
