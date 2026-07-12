import { Linking, Platform } from "react-native";

/**
 * openDirections — opens Google Maps with a route from the user's current
 * location to the property. The origin is intentionally omitted so Google Maps
 * fills it in with the device's current location (prompting for permission if
 * needed). Prefers the Google Maps app via its native scheme, and falls back to
 * the universal web URL (which also deep-links into the app when installed).
 */
export async function openDirections({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const dest = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
  const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  // comgooglemaps:// opens the Google Maps app directly; daddr = destination,
  // no saddr = start from current location.
  const app = Platform.select({
    ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
    android: `google.navigation:q=${dest}`,
    default: web,
  });
  try {
    const canApp = app ? await Linking.canOpenURL(app) : false;
    await Linking.openURL(canApp && app ? app : web);
  } catch {
    // no maps app / user cancelled — no-op
  }
}
