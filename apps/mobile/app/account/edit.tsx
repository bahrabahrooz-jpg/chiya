import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { User, Mail, Phone, MapPin, Pencil, SquarePen, Images, Camera, Trash2 } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button, TextField, ActionSheet, type SheetAction } from "@/components/ui";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { confirm } from "@/lib/confirm";
import { useProfile, updateProfile } from "@/lib/profile";

const emailish = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Top success toast — same pattern as the register screen. */
function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  const { colors, type, radius, elevation, space } = useTheme();
  const y = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(y, { toValue: -24, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(onHide);
    }, 1600);
    return () => clearTimeout(t);
  }, [y, opacity, onHide]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        elevation.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderSubtle,
          borderRadius: radius.lg,
          paddingVertical: space[3],
          paddingHorizontal: space[4],
          transform: [{ translateY: y }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toastDot, { backgroundColor: colors.success }]} />
      <Text style={[type.bodySm, { color: colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

export default function EditProfileScreen() {
  const { colors, type, fontFamily } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useProfile();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [avatar, setAvatar] = useState<string | null>(profile.avatar);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [toast, setToast] = useState<string | null>(null);
  const [photoMenu, setPhotoMenu] = useState(false);

  const cancel = () => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setLocation(profile.location);
    setAvatar(profile.avatar);
    setErrors({});
    setEditing(false);
  };

  const chooseFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    setAvatar(res.assets[0]?.uri ?? null);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (res.canceled) return;
    setAvatar(res.assets[0]?.uri ?? null);
  };

  const photoActions: SheetAction[] = [
    { label: "Select existing photo", icon: Images, onPress: chooseFromLibrary },
    { label: "Take a new photo", icon: Camera, onPress: takePhoto },
    ...(avatar ? [{ label: "Delete photo", icon: Trash2, destructive: true, onPress: () => setAvatar(null) } as SheetAction] : []),
  ];

  const save = () => {
    const next: typeof errors = {};
    if (fullName.trim().length < 2) next.fullName = "Enter your name";
    if (!emailish(email)) next.email = "Enter a valid email";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({
      fullName: fullName.trim(),
      firstName: fullName.trim().split(" ")[0],
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      avatar,
    });
    setToast("Profile updated");
    setEditing(false);
  };

  const deleteAccount = () =>
    confirm({
      title: "Delete account",
      message: "This permanently deletes your account and data. This can't be undone.",
      confirmLabel: "Delete account",
      destructive: true,
      icon: Trash2,
      onConfirm: () => router.replace("/login"),
    });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader
        title="My profile"
        right={
          editing ? (
            <Pressable onPress={cancel} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={[type.body, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>Cancel</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setEditing(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit profile">
              <SquarePen size={20} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          )
        }
      />
      {toast ? <Toast message={toast} onHide={() => setToast(null)} /> : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.avatarBlock}>
            <Pressable onPress={editing ? () => setPhotoMenu(true) : undefined} disabled={!editing} accessibilityRole="button" accessibilityLabel="Edit photo">
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.brandPrimary }]}>
                  <Text style={[styles.avatarTxt, { color: colors.textOnBrand, fontFamily: fontFamily.sansSemibold }]}>
                    {initialsOf(fullName || profile.fullName)}
                  </Text>
                </View>
              )}
              {editing ? (
                <View style={styles.badgeRow}>
                  <View style={[styles.cameraBadge, { backgroundColor: colors.brandPrimary, borderColor: colors.surfacePage }]}>
                    <Pencil size={14} color={colors.textOnBrand} strokeWidth={2} />
                  </View>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.form}>
            <TextField
              label="Full name"
              value={fullName}
              onChangeText={(v) => {
                setFullName(v);
                if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              icon={User}
              placeholder="Your name"
              autoCapitalize="words"
              textContentType="name"
              editable={editing}
              error={errors.fullName}
            />
            <TextField
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              icon={Mail}
              placeholder="you@email.com"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={editing}
              error={errors.email}
            />
            <TextField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              icon={Phone}
              placeholder="+964 …"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              editable={editing}
            />
            <TextField
              label="Location"
              value={location}
              onChangeText={setLocation}
              icon={MapPin}
              placeholder="City, region"
              autoCapitalize="words"
              editable={editing}
            />
          </View>

          {!editing ? (
            <View style={styles.deleteBtn}>
              <Button
                title="Delete account"
                variant="destructive"
                onPress={deleteAccount}
                left={<Trash2 size={18} color={colors.error} strokeWidth={2} />}
              />
            </View>
          ) : null}
        </ScrollView>

        {editing ? (
          <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Button title="Save changes" onPress={save} />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <ActionSheet open={photoMenu} onClose={() => setPhotoMenu(false)} actions={photoActions} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingTop: 24, gap: 24 },
  avatarBlock: { alignItems: "center", gap: 10 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  avatarImg: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#e9edf0" },
  avatarTxt: { fontSize: 30, letterSpacing: 0.5 },
  badgeRow: { position: "absolute", left: 0, right: 0, bottom: -15, alignItems: "center" },
  cameraBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: 12 },
  deleteBtn: { marginTop: 48 },
  foot: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    zIndex: 10,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
});
