import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { useTheme } from "@/theme";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { useProfile, updateProfile, LANGUAGES } from "@/lib/profile";

export default function LanguageScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const profile = useProfile();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title="Language" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[type.bodySm, styles.intro, { color: colors.textSecondary }]}>
          English is fully supported. Kurdish and Arabic are coming soon.
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
          {LANGUAGES.map((l, i) => {
            const on = profile.language === l.value;
            return (
              <Pressable
                key={l.value}
                onPress={() => updateProfile({ language: l.value })}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
                  pressed && { backgroundColor: colors.surfaceSunken },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <View style={styles.labelWrap}>
                  <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{l.native}</Text>
                  {l.native !== l.label ? (
                    <Text style={[type.bodySm, { color: colors.textTertiary }]}>{l.label}</Text>
                  ) : null}
                </View>
                {on ? <Check size={20} color={colors.brandForeground} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  intro: { marginBottom: 2 },
  card: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15 },
  labelWrap: { flex: 1, gap: 2 },
});
