import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Users } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { useFavoriteIds } from "@/lib/favorites";
import { listings, agents } from "@/components/home/data";
import { PropertyCard } from "@/components/home/PropertyCard";
import { AgentCard } from "@/components/home/AgentCard";

type Tab = "properties" | "agents";

export default function SavedScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const favIds = useFavoriteIds();
  const [tab, setTab] = useState<Tab>("properties");

  const savedProps = listings.filter((l) => favIds.has(l.id));
  const savedAgents = agents.filter((a) => favIds.has(a.id));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "properties", label: t("saved.properties"), count: savedProps.length },
    { key: "agents", label: t("saved.agents"), count: savedAgents.length },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={t("profile.saved")} />

      <View style={[styles.segment, styles.segmentTop, { backgroundColor: colors.surfaceSunken, borderRadius: radius.control }]}>
        {tabs.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.segBtn, { borderRadius: radius.control - 3 }, on && { backgroundColor: colors.surfaceCard }]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text
                style={[
                  type.bodySm,
                  { color: on ? colors.textPrimary : colors.textSecondary, fontFamily: on ? fontFamily.sansSemibold : fontFamily.sansMedium },
                ]}
              >
                {t.label}
              </Text>
              <View style={[styles.badge, { backgroundColor: on ? colors.brandSubtle : colors.surfaceCard }]}>
                <Text style={[styles.badgeTxt, { color: on ? colors.brandForeground : colors.textTertiary, fontFamily: fontFamily.sansSemibold }]}>
                  {t.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {tab === "properties" ? (
        savedProps.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {savedProps.map((p) => (
              <View key={p.id} style={styles.item}>
                <PropertyCard property={p} fullWidth />
              </View>
            ))}
          </ScrollView>
        ) : (
          <EmptyState Icon={Heart} title={t("saved.noHomesTitle")} text={t("saved.noHomesText")} />
        )
      ) : savedAgents.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {savedAgents.map((a) => (
            <View key={a.id} style={styles.item}>
              <AgentCard agent={a} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyState Icon={Users} title={t("saved.noAgentsTitle")} text={t("saved.noAgentsText")} />
      )}
    </SafeAreaView>
  );
}

function EmptyState({ Icon, title, text }: { Icon: typeof Heart; title: string; text: string }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.brandSubtle }]}>
        <Icon size={26} color={colors.brandForeground} strokeWidth={2} />
      </View>
      <Text style={[type.bodyLg, styles.emptyTitle, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{title}</Text>
      <Text style={[type.body, styles.emptyText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  segment: { flexDirection: "row", marginHorizontal: 20, padding: 3, gap: 3 },
  segmentTop: { marginTop: 16 },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 40 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontSize: 12 },
  scroll: { paddingBottom: 40 },
  item: { paddingHorizontal: 20, marginTop: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: -60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 16 },
  emptyText: { textAlign: "center", marginTop: 6 },
});
