import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Tag, Globe } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { MenuRow, Group } from "@/components/account/MenuRow";
import { BrandLockup, InstagramIcon, FacebookIcon, LinkedInIcon } from "@/components/ui";

const open = (url: string) => Linking.openURL(url).catch(() => {});

export default function AboutScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={t("about.title")} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <BrandLockup size={48} />
        </View>

        <Text style={[type.body, styles.description, { color: colors.textSecondary }]}>{t("about.description")}</Text>

        <View style={[styles.mission, { backgroundColor: colors.brandSubtle, borderRadius: radius.card }]}>
          <Text style={[type.label, { color: colors.brandForeground, fontFamily: fontFamily.sansSemibold }]}>{t("about.missionLabel")}</Text>
          <Text style={[type.bodyLg, styles.missionTxt, { color: colors.textPrimary }]}>{t("about.mission")}</Text>
        </View>

        <Group>
          <MenuRow icon={Tag} label={t("about.versionLabel")} value={t("about.version")} chevron={false} />
          <MenuRow icon={Globe} label={t("about.websiteLabel")} value={t("about.website")} divider onPress={() => open("https://www.chiyaestate.com")} />
        </Group>

        <Group title={t("about.followUs")}>
          <MenuRow icon={InstagramIcon} label={t("about.instagram")} onPress={() => open("https://instagram.com/chiyaestate")} />
          <MenuRow icon={FacebookIcon} label={t("about.facebook")} divider onPress={() => open("https://facebook.com/chiyaestate")} />
          <MenuRow icon={LinkedInIcon} label={t("about.linkedin")} divider onPress={() => open("https://linkedin.com/company/chiyaestate")} />
        </Group>

        <Text style={[type.bodySm, styles.copyright, { color: colors.textTertiary }]}>{t("about.copyright")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 44, gap: 18 },
  hero: { alignItems: "center", paddingVertical: 12 },
  description: { textAlign: "center", lineHeight: 24, paddingHorizontal: 4 },
  mission: { padding: 18, gap: 8 },
  missionTxt: { lineHeight: 27 },
  copyright: { textAlign: "center", marginTop: 4 },
});
