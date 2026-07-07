import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, Search, Heart, User, Plus, type LucideIcon } from "lucide-react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/theme";

/** Per-route label + icon. Order in the bar comes from the Tabs.Screen order. */
const TABS: Record<string, { label: string; Icon: LucideIcon }> = {
  home: { label: "Home", Icon: House },
  search: { label: "Search", Icon: Search },
  "my-listings": { label: "My listings", Icon: Plus },
  saved: { label: "Saved", Icon: Heart },
  profile: { label: "Profile", Icon: User },
};

const CENTER = "my-listings";

/**
 * BottomNav — the app's bottom tab bar. Four flat tabs plus an elevated brand
 * "＋" in the middle for the primary create/list action. Used as the custom
 * `tabBar` for the (tabs) navigator.
 */
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const { colors, fontFamily, elevation } = useTheme();
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
        const { Icon, label } = cfg;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (route.name === CENTER) {
          return (
            <Pressable
              key={route.key}
              style={styles.slot}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
            >
              <View style={styles.fabWrap}>
                <View style={[styles.fab, elevation.button, { backgroundColor: colors.brandPrimary }]}>
                  <Icon size={26} color={colors.textOnBrand} strokeWidth={2.4} />
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.label, { fontFamily: fontFamily.sansMedium, color: focused ? colors.brandPrimary : colors.textTertiary }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        }

        const color = focused ? colors.brandPrimary : colors.textTertiary;
        return (
          <Pressable
            key={route.key}
            style={styles.slot}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
          >
            <Icon size={23} color={color} strokeWidth={focused ? 2.4 : 2} />
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
  },
  label: { fontSize: 11, letterSpacing: 0.1 },
  fabWrap: {
    position: "absolute",
    top: -24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
});
