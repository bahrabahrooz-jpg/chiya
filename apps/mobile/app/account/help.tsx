import { View, Text, ScrollView, Linking, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone, Mail, MessageCircle, FileText, ShieldCheck } from "lucide-react-native";
import { useTheme } from "@/theme";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { MenuRow, Group } from "@/components/account/MenuRow";

const SUPPORT_PHONE = "+9647500000000";
const SUPPORT_EMAIL = "support@chiya.estate";

const open = (url: string) => Linking.openURL(url).catch(() => {});

export default function HelpScreen() {
  const { colors, type, fontFamily } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title="Help & support" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Group title="Get in touch">
          <MenuRow icon={Phone} label="Call us" sublabel={SUPPORT_PHONE} onPress={() => open(`tel:${SUPPORT_PHONE}`)} />
          <MenuRow icon={Mail} label="Email support" sublabel={SUPPORT_EMAIL} divider onPress={() => open(`mailto:${SUPPORT_EMAIL}`)} />
          <MenuRow
            icon={MessageCircle}
            label="WhatsApp"
            sublabel="Chat with our team"
            divider
            onPress={() => open(`https://wa.me/${SUPPORT_PHONE.replace(/\D/g, "")}`)}
          />
        </Group>

        <View style={styles.about}>
          <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>About Chiya</Text>
          <Text style={[type.body, styles.aboutTxt, { color: colors.textSecondary }]}>
            Chiya Estate is Kurdistan's home for buying, renting, and listing property — connecting members with verified
            agents and premium homes across Erbil, Sulaymaniyah, and Duhok.
          </Text>
        </View>

        <Group title="Legal">
          <MenuRow icon={FileText} label="Terms of service" onPress={() => open("https://chiya.estate/terms")} />
          <MenuRow icon={ShieldCheck} label="Privacy policy" divider onPress={() => open("https://chiya.estate/privacy")} />
        </Group>

        <Text style={[type.bodySm, styles.footer, { color: colors.textTertiary }]}>Chiya Estate · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 18 },
  about: { gap: 8 },
  aboutTxt: { lineHeight: 22 },
  footer: { textAlign: "center", marginTop: 4 },
});
