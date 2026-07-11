import { useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, X, ChevronDown, LifeBuoy } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/account/ScreenHeader";
import { Group } from "@/components/account/MenuRow";
import { Button } from "@/components/ui";

// LayoutAnimation on old-architecture Android needs this opt-in (no-op on Fabric).
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Faq {
  id: string;
  q: string;
  a: string;
}

function FaqRow({ item, expanded, divider, onToggle }: { item: Faq; expanded: boolean; divider: boolean; onToggle: () => void }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <View style={divider ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle } : undefined}>
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
          onToggle();
        }}
        style={({ pressed }) => [styles.qRow, pressed && { backgroundColor: colors.surfaceSunken }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={[type.body, styles.qText, { color: colors.textPrimary, fontFamily: fontFamily.sansMedium }]}>{item.q}</Text>
        <ChevronDown
          size={18}
          color={colors.textTertiary}
          strokeWidth={2}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {expanded ? (
        <Text style={[type.bodySm, styles.aText, { color: colors.textSecondary }]}>{item.a}</Text>
      ) : null}
    </View>
  );
}

export default function HelpCenterScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const groups = useMemo(
    () => [
      {
        title: t("helpCenter.catBuying"),
        items: [
          { id: "q1", q: t("helpCenter.q1"), a: t("helpCenter.a1") },
          { id: "q2", q: t("helpCenter.q2"), a: t("helpCenter.a2") },
          { id: "q3", q: t("helpCenter.q3"), a: t("helpCenter.a3") },
        ],
      },
      {
        title: t("helpCenter.catSelling"),
        items: [
          { id: "q4", q: t("helpCenter.q4"), a: t("helpCenter.a4") },
          { id: "q5", q: t("helpCenter.q5"), a: t("helpCenter.a5") },
          { id: "q6", q: t("helpCenter.q6"), a: t("helpCenter.a6") },
        ],
      },
      {
        title: t("helpCenter.catAccount"),
        items: [
          { id: "q7", q: t("helpCenter.q7"), a: t("helpCenter.a7") },
          { id: "q8", q: t("helpCenter.q8"), a: t("helpCenter.a8") },
          { id: "q9", q: t("helpCenter.q9"), a: t("helpCenter.a9") },
        ],
      },
    ],
    [t],
  );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? groups.map((g) => ({ ...g, items: g.items.filter((it) => `${it.q} ${it.a}`.toLowerCase().includes(q)) })).filter((g) => g.items.length > 0)
    : groups;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <ScreenHeader title={t("helpCenter.title")} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={[type.bodyLg, styles.subtitle, { color: colors.textSecondary }]}>{t("helpCenter.subtitle")}</Text>

        <View style={[styles.search, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.control }]}>
          <Search size={18} color={colors.textTertiary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { fontSize: type.body.fontSize, fontFamily: type.body.fontFamily, color: colors.textPrimary }]}
            value={query}
            onChangeText={setQuery}
            placeholder={t("helpCenter.searchPlaceholder")}
            placeholderTextColor={colors.textPlaceholder}
            autoCorrect={false}
            selectionColor={colors.brandForeground}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={16} color={colors.textTertiary} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        {filtered.length > 0 ? (
          filtered.map((g) => (
            <Group key={g.title} title={g.title}>
              {g.items.map((it, i) => (
                <FaqRow key={it.id} item={it} expanded={open.has(it.id)} divider={i > 0} onToggle={() => toggle(it.id)} />
              ))}
            </Group>
          ))
        ) : (
          <Text style={[type.body, styles.noResults, { color: colors.textSecondary }]}>{t("helpCenter.noResults", { query: query.trim() })}</Text>
        )}

        <View style={[styles.help, { backgroundColor: colors.brandSubtle, borderRadius: radius.card }]}>
          <View style={[styles.helpIcon, { backgroundColor: colors.surfaceCard }]}>
            <LifeBuoy size={22} color={colors.brandForeground} strokeWidth={2} />
          </View>
          <Text style={[type.bodyLg, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("helpCenter.stillNeedHelp")}</Text>
          <Text style={[type.bodySm, styles.helpBody, { color: colors.textSecondary }]}>{t("helpCenter.stillNeedHelpBody")}</Text>
          <View style={styles.helpBtn}>
            <Button title={t("helpCenter.contactSupport")} onPress={() => router.push("/account/contact")} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 44, gap: 16 },
  subtitle: { marginTop: -2 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 48, borderWidth: 1 },
  searchInput: { flex: 1, height: "100%", padding: 0, includeFontPadding: false },
  qRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 15 },
  qText: { flex: 1 },
  aText: { paddingHorizontal: 14, paddingBottom: 15, marginTop: -4, lineHeight: 21 },
  noResults: { textAlign: "center", paddingVertical: 24 },
  help: { alignItems: "center", padding: 22, marginTop: 4, gap: 6 },
  helpIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  helpBody: { textAlign: "center" },
  helpBtn: { alignSelf: "stretch", marginTop: 10 },
});
