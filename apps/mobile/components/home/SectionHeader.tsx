import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";

/** SectionHeader — a section title with an optional "See all" link on the right. */
export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { colors, type, fontFamily } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button">
          <Text style={[type.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.sansSemibold }]}>{t("home.seeAll")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
