import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { SectionHeader } from "./SectionHeader";
import { propertyTypes, optLabel } from "./data";

/** BrowseByType — a horizontal row of property-type tiles. Tapping one opens the
 *  Search tab with that property type filter applied. No "See all" (per spec). */
export function BrowseByType() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const open = (value: string) =>
    router.push({ pathname: "/search", params: { type: value, ts: String(Date.now()) } });

  return (
    <View>
      <View style={styles.head}>
        <SectionHeader title={t("home.browseByType")} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {propertyTypes.map((pt) => {
          const Icon = pt.Icon;
          return (
            <Pressable
              key={pt.value}
              onPress={() => open(pt.value)}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: pressed ? colors.brandSubtle : colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              accessibilityRole="button"
            >
              {Icon ? <Icon size={24} color={colors.brandForeground} strokeWidth={2} /> : null}
              <Text style={[type.bodySm, { color: colors.brandForeground, fontFamily: fontFamily.sansSemibold }]} numberOfLines={1}>
                {optLabel(pt)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, marginBottom: 14 },
  scroll: { paddingHorizontal: 20, paddingVertical: 8, gap: 12 },
  tile: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    // Subtle lift — much lighter than the shared card/button elevation presets.
    shadowColor: "#0B2018",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
});

