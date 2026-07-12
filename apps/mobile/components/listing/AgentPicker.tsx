import { useMemo, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { BadgeCheck, Check, ChevronDown, UserRoundX, X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { agents, type Agent } from "@/components/home/data";
import { Sheet, SheetHeader, SheetSearch } from "@/components/home/SelectField";

/** Circular agent avatar with an optional verified check overlay. */
function Avatar({ agent, size }: { agent: Agent; size: number }) {
  const { colors } = useTheme();
  const ring = Math.round(size * 0.42);
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri: agent.photo }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceSunken }}
        resizeMode="cover"
      />
      {agent.verified ? (
        <View
          style={[
            styles.tick,
            { width: ring, height: ring, borderRadius: ring / 2, backgroundColor: colors.brandPrimary, borderColor: colors.surfaceCard },
          ]}
        >
          <BadgeCheck size={Math.round(ring * 0.66)} color={colors.textOnBrand} strokeWidth={2.5} />
        </View>
      ) : null}
    </View>
  );
}

/** One agent row inside the picker sheet: avatar + name + city + check. */
function AgentRow({ agent, selected, onPress }: { agent: Agent; selected: boolean; onPress: () => void }) {
  const { colors, type, fontFamily } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSunken }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Avatar agent={agent} size={44} />
      <View style={styles.rowBody}>
        <Text
          style={[type.body, { color: selected ? colors.brandForeground : colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}
          numberOfLines={1}
        >
          {agent.name}
        </Text>
        <Text style={[type.bodySm, { color: colors.textSecondary }]} numberOfLines={1}>
          {agent.city}
        </Text>
      </View>
      {selected ? <Check size={18} color={colors.brandForeground} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

/** Selected-state card mirroring the website/admin AgentSummary. */
function AgentSummary({ agent, onClear }: { agent: Agent; onClear: () => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
      <Avatar agent={agent} size={52} />
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={[type.body, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]} numberOfLines={1}>
            {agent.name}
          </Text>
          {agent.verified ? (
            <View style={[styles.badge, { backgroundColor: colors.brandSubtle, borderRadius: radius.pill }]}>
              <BadgeCheck size={12} color={colors.brandForeground} strokeWidth={2.5} />
              <Text style={[styles.badgeTxt, { color: colors.brandForeground, fontFamily: fontFamily.sansSemibold }]}>{t("card.verified")}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[type.bodySm, { color: colors.textSecondary }]} numberOfLines={1}>
          {agent.city}
        </Text>
      </View>
      <Pressable onPress={onClear} hitSlop={8} style={[styles.remove, { backgroundColor: colors.surfaceSunken }]} accessibilityRole="button">
        <X size={16} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

/** AgentPicker — assign a verified agent. Shows a summary card once selected,
 *  otherwise a trigger that opens an avatar-rich search sheet. Mirrors the
 *  website/admin "Assigned agent" control. */
export function AgentPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const verified = useMemo(() => agents.filter((a) => a.verified), []);
  const selected = verified.find((a) => a.id === value) ?? null;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return verified;
    return verified.filter(
      (a) => a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q),
    );
  }, [verified, query]);

  const openSheet = () => {
    setQuery("");
    setOpen(true);
  };

  return (
    <View>
      {selected ? (
        <AgentSummary agent={selected} onClear={() => onChange("")} />
      ) : (
        <Pressable
          onPress={openSheet}
          style={[styles.trigger, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.control }]}
          accessibilityRole="button"
        >
          <Text style={[type.body, { flex: 1, color: colors.textPlaceholder }]} numberOfLines={1}>
            {t("listingForm.selectAgent")}
          </Text>
          <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2} />
        </Pressable>
      )}

      <Sheet open={open} onClose={() => setOpen(false)}>
        <SheetHeader title={t("listingForm.assignedAgent")} onClose={() => setOpen(false)} />
        <SheetSearch value={query} onChangeText={setQuery} />
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {shown.map((a) => (
            <AgentRow
              key={a.id}
              agent={a}
              selected={a.id === value}
              onPress={() => {
                onChange(value === a.id ? "" : a.id);
                setOpen(false);
              }}
            />
          ))}
          {shown.length === 0 ? (
            <View style={styles.empty}>
              <UserRoundX size={22} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[type.body, { color: colors.textSecondary, textAlign: "center" }]}>
                {t("filters.noMatches", { query: query.trim() })}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 54,
    paddingVertical: 8,
  },
  tick: { position: "absolute", right: -1, bottom: -1, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  rowBody: { flex: 1, gap: 2 },
  list: { paddingHorizontal: 8, paddingBottom: 8 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, padding: 12 },
  cardBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11 },
  remove: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 28 },
});
