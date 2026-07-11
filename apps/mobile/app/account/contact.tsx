import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Linking, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Phone, MessageCircle, Clock, CircleCheck } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { MenuRow, Group } from "@/components/account/MenuRow";
import { Button, TextField } from "@/components/ui";
import { confirm } from "@/lib/confirm";

const emailish = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const open = (url: string) => Linking.openURL(url).catch(() => {});

interface Errors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const phone = t("contact.phoneValue");
  const supportEmail = t("contact.emailValue");

  const submit = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = t("contact.errName");
    if (!emailish(email.trim())) next.email = t("contact.errEmail");
    if (!subject.trim()) next.subject = t("contact.errSubject");
    if (!message.trim()) next.message = t("contact.errMessage");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setErrors({});
    confirm({
      title: t("contact.successTitle"),
      message: t("contact.successBody"),
      confirmLabel: t("common.done"),
      icon: CircleCheck,
      onConfirm: () => {},
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={t("contact.title")} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Text style={[type.bodyLg, styles.subtitle, { color: colors.textSecondary }]}>{t("contact.subtitle")}</Text>

          <View style={styles.form}>
            <TextField label={t("contact.name")} value={name} onChangeText={setName} placeholder={t("contact.namePlaceholder")} autoCapitalize="words" error={errors.name} />
            <TextField
              label={t("contact.email")}
              value={email}
              onChangeText={setEmail}
              placeholder={t("contact.emailPlaceholder")}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              error={errors.email}
            />
            <TextField label={t("contact.subject")} value={subject} onChangeText={setSubject} placeholder={t("contact.subjectPlaceholder")} autoCapitalize="sentences" error={errors.subject} />
            <TextField
              label={t("contact.message")}
              value={message}
              onChangeText={setMessage}
              placeholder={t("contact.messagePlaceholder")}
              autoCapitalize="sentences"
              multiline
              minHeight={128}
              error={errors.message}
            />
            <Button title={t("contact.send")} onPress={submit} />
          </View>

          <Group>
            <MenuRow icon={Mail} label={t("contact.emailLabel")} sublabel={supportEmail} onPress={() => open(`mailto:${supportEmail}`)} />
            <MenuRow icon={Phone} label={t("contact.phoneLabel")} sublabel={phone} divider onPress={() => open(`tel:${phone.replace(/\s/g, "")}`)} />
            <MenuRow
              icon={MessageCircle}
              label={t("contact.whatsappLabel")}
              sublabel={t("contact.whatsappValue")}
              divider
              onPress={() => open(`https://wa.me/${phone.replace(/\D/g, "")}`)}
            />
          </Group>

          <Group>
            <View style={styles.hours}>
              <View style={[styles.hoursIcon, { backgroundColor: colors.iconTileBg, borderColor: colors.iconTileBorder, borderRadius: radius.md }]}>
                <Clock size={19} color={colors.brandForeground} strokeWidth={2} />
              </View>
              <View style={styles.hoursBody}>
                <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{t("contact.hoursLabel")}</Text>
                <Text style={[type.bodySm, { color: colors.textSecondary }]}>{t("contact.hoursDays")}</Text>
                <Text style={[type.bodySm, { color: colors.textSecondary }]}>{t("contact.hoursTime")}</Text>
              </View>
            </View>
          </Group>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 44, gap: 18 },
  subtitle: { marginTop: -2 },
  form: { gap: 6 },
  hours: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  hoursIcon: { width: 36, height: 36, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  hoursBody: { flex: 1, gap: 2 },
});
