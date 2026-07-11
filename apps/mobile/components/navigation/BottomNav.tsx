import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, Search, Building2, Users, CalendarCheck, User, type LucideIcon } from "lucide-react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/theme";
import { useTranslation, type TKey } from "@/lib/i18n";

/** Per-route label key + icon. Order in the bar comes from the Tabs.Screen order. */
const TABS: Record<string, { labelKey: TKey; Icon: LucideIcon }> = {
  home: { labelKey: "nav.home", Icon: House },
  search: { labelKey: "nav.search", Icon: Search },
  agents: { labelKey: "nav.agents", Icon: Users },
  "my-listings": { labelKey: "nav.listings", Icon: Building2 },
  viewings: { labelKey: "nav.viewings", Icon: CalendarCheck },
  profile: { labelKey: "nav.profile", Icon: User },
};

/** BottomNav — the app's bottom tab bar (flat, evenly-weighted tabs). */
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const { colors, fontFamily } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.borderSubtle,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const cfg = TABS[route.name];
        if (!cfg) return null;
        const focused = state.index === index;
        const { Icon, labelKey } = cfg;
        const label = t(labelKey);
        const color = focused ? colors.brandForeground : colors.textTertiary;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            style={styles.slot}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
          >
            <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
            <Text numberOfLines={1} style={[styles.label, { fontFamily: fontFamily.sansMedium, color }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    minHeight: 46,
    paddingHorizontal: 2,
  },
  label: { fontSize: 11, letterSpacing: 0.1 },
});
