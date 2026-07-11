import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "./ScreenHeader";

export interface LegalSection {
  heading: string;
  body: string;
}

/** LegalDocument — a clean, document-style reading layout shared by the Privacy
 *  Policy and Terms & Conditions screens: title header, "Last updated" line, and
 *  comfortably-spaced heading + body sections. RTL-aware via the app's layout
 *  direction (text alignment follows the writing direction automatically). */
export function LegalDocument({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={title} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.updated, { backgroundColor: colors.surfaceSunken, borderRadius: 999 }]}>
          <Text style={[type.caption, { color: colors.textSecondary, fontFamily: fontFamily.sansMedium }]}>
            {t("legal.lastUpdated", { date: lastUpdated })}
          </Text>
        </View>

        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
              {`${i + 1}. ${s.heading}`}
            </Text>
            <Text style={[type.body, styles.bodyTxt, { color: colors.textSecondary }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 44, gap: 22 },
  updated: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, marginBottom: 2 },
  section: { gap: 7 },
  bodyTxt: { lineHeight: 25 },
});
