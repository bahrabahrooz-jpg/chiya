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
import { User, Mail, Phone, MapPin, Camera } from "lucide-react-native";
import { useTheme } from "@/theme";
import { Button, TextField } from "@/components/ui";
import { ScreenHeader } from "@/components/account/ScreenHeader";
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

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [avatar, setAvatar] = useState<string | null>(profile.avatar);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [toast, setToast] = useState<string | null>(null);

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    setAvatar(res.assets[0]?.uri ?? null);
  };

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
    setTimeout(() => router.back(), 700);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title="Edit profile" />
      {toast ? <Toast message={toast} onHide={() => setToast(null)} /> : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.avatarBlock}>
            <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change photo">
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.brandPrimary }]}>
                  <Text style={[styles.avatarTxt, { color: colors.textOnBrand, fontFamily: fontFamily.sansSemibold }]}>
                    {initialsOf(fullName || profile.fullName)}
                  </Text>
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.brandPrimary, borderColor: colors.surfacePage }]}>
                <Camera size={15} color={colors.textOnBrand} strokeWidth={2} />
              </View>
            </Pressable>
            <Pressable onPress={pickAvatar} hitSlop={6}>
              <Text style={[type.bodySm, { color: colors.textBrand, fontFamily: fontFamily.sansSemibold }]}>Change photo</Text>
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
            />
            <TextField
              label="Location"
              value={location}
              onChangeText={setLocation}
              icon={MapPin}
              placeholder="City, region"
              autoCapitalize="words"
            />
          </View>
        </ScrollView>

        <View style={[styles.foot, { borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button title="Save changes" onPress={save} />
        </View>
      </KeyboardAvoidingView>
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
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: 16 },
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
