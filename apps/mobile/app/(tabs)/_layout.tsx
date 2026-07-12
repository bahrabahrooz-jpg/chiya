import { Tabs } from "expo-router";
import { BottomNav } from "@/components/navigation/BottomNav";

/** Authenticated app shell: bottom-tab navigator with the custom BottomNav bar. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      // Smoothly cross-shift between tabs so programmatic jumps (home quick actions →
      // Search / My listings) and bottom-nav taps animate instead of switching abruptly.
      screenOptions={{ headerShown: false, animation: "shift" }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="agents" options={{ title: "Agents" }} />
      <Tabs.Screen name="my-listings" options={{ title: "My listings" }} />
      <Tabs.Screen name="viewings" options={{ title: "Viewings" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
