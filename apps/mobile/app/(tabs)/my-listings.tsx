import { useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Clock, Building2, MapPin, BedDouble, Bath, Maximize, Pencil, Trash2, MoreVertical, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "@/lib/i18n";
import { ActionSheet } from "@/components/ui";
import { labelFor, dealCategories } from "@/components/home/data";
import { useMyListings, removeMyListing, type MyListing } from "@/lib/my-listings";
import { confirm } from "@/lib/confirm";

function Spec({ Icon, label }: { Icon: LucideIcon; label: string }) {
  const { colors, type } = useTheme();
  return (
    <View style={styles.spec}>
      <Icon size={15} color={colors.textTertiary} strokeWidth={2} />
      <Text style={[type.bodySm, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ListingRow({ listing: l }: { listing: MyListing }) {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const dealLabel = labelFor(dealCategories, l.deal === "rent" ? "rent" : "buy");

  const edit = () => router.push({ pathname: "/my-listings/new", params: { id: l.id } });
  const confirmDelete = () =>
    confirm({
      title: t("myListings.deleteListing"),
      message: t("myListings.deleteMessage", { title: l.title }),
      confirmLabel: t("myListings.deleteListing"),
      destructive: true,
      icon: Trash2,
      onConfirm: () => removeMyListing(l.id),
    });

  return (
    <>
      <Pressable
        onPress={() => setMenuOpen(true)}
        style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
        accessibilityRole="button"
        accessibilityLabel={t("myListings.rowA11y", { title: l.title })}
      >
        <View style={[styles.media, { borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }]}>
          {l.cover ? (
            <Image source={{ uri: l.cover }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Building2 size={28} color={colors.textTertiary} strokeWidth={2} />
            </View>
          )}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={[styles.badgeTxt, { color: colors.brandPrimary, fontFamily: fontFamily.sansSemibold }]}>{dealLabel}</Text>
            </View>
            <View style={[styles.status, { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder }]}>
              <Clock size={11} color={colors.warningText} strokeWidth={2.5} />
              <Text style={[styles.statusTxt, { color: colors.warningText, fontFamily: fontFamily.sansSemibold }]}>{t("myListings.pending")}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
            style={styles.kebab}
            accessibilityRole="button"
            accessibilityLabel={t("myListings.optionsA11y")}
          >
            <MoreVertical size={20} color="#33383F" strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[type.body, styles.flex, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>
              {l.title}
            </Text>
            {l.price ? <Text style={[type.body, { color: colors.brandForeground, fontFamily: fontFamily.sansBold }]}>{l.price}</Text> : null}
          </View>

          <View style={styles.loc}>
            <MapPin size={14} color={colors.textTertiary} strokeWidth={2} />
            <Text numberOfLines={1} style={[type.bodySm, styles.flex, { color: colors.textSecondary }]}>
              {l.location}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.specs}>
            <Spec Icon={BedDouble} label={t("myListings.bed", { count: l.beds })} />
            <Spec Icon={Bath} label={t("myListings.bath", { count: l.baths })} />
            {l.area ? <Spec Icon={Maximize} label={l.area} /> : null}
          </View>
        </View>
      </Pressable>

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={l.title}
        actions={[
          { label: t("myListings.editListing"), icon: Pencil, onPress: edit },
          { label: t("myListings.deleteListing"), icon: Trash2, destructive: true, onPress: confirmDelete },
        ]}
      />
    </>
  );
}

export default function MyListingsScreen() {
  const { colors, type, fontFamily, radius } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const listings = useMyListings();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surfacePage }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[type.displaySm, { color: colors.textPrimary, fontSize: 26 }]}>{t("myListings.title")}</Text>
        <Pressable
          onPress={() => router.push("/my-listings/new")}
          style={styles.addBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("myListings.addA11y")}
        >
          <Plus size={26} color={colors.textPrimary} strokeWidth={2.5} />
        </Pressable>
      </View>

      {listings.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {listings.map((l) => (
            <View key={l.id} style={styles.item}>
              <ListingRow listing={l} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.brandSubtle }]}>
            <Building2 size={26} color={colors.brandForeground} strokeWidth={2} />
          </View>
          <Text style={[type.bodyLg, styles.emptyTitle, { color: colors.textPrimary, fontFamily: fontFamily.sansSemibold }]}>{t("myListings.emptyTitle")}</Text>
          <Text style={[type.body, styles.emptyText, { color: colors.textSecondary }]}>{t("myListings.emptyBody")}</Text>
          <View style={{ alignSelf: "stretch", marginTop: 24, paddingHorizontal: 24 }}>
            <Pressable onPress={() => router.push("/my-listings/new")} style={[styles.cta, { backgroundColor: colors.brandPrimary, borderRadius: radius.control }]}>
              <Plus size={19} color={colors.textOnBrand} strokeWidth={2.5} />
              <Text style={[type.button, { color: colors.textOnBrand }]}>{t("myListings.listCta")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  addBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: 40, paddingTop: 8 },
  item: { paddingHorizontal: 20, marginTop: 12 },
  card: { borderWidth: 1, overflow: "hidden" },
  media: { height: 160, overflow: "hidden", backgroundColor: "#e9edf0" },
  img: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  badgeRow: { position: "absolute", top: 12, start: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeTxt: { fontSize: 12 },
  kebab: {
    position: "absolute",
    top: 10,
    end: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTxt: { fontSize: 12 },
  body: { padding: 14, gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  loc: { flexDirection: "row", alignItems: "center", gap: 5 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  specs: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 2 },
  spec: { flexDirection: "row", alignItems: "center", gap: 5 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: -40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 16 },
  emptyText: { textAlign: "center", marginTop: 6, maxWidth: 320 },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 54 },
});
