import { Share } from "react-native";
import { translate } from "@/lib/i18n";
import { getActiveLocale } from "@/lib/locale-state";
import { priceLabel, type Listing, type Agent } from "@/components/home/data";

/**
 * Share — opens the native share sheet for a property or agent. Shares the
 * message plus a canonical `https://` link (a universal link once the site + app
 * links ship: opens the app if installed, the website otherwise).
 */
const CHIYA_WEB = "https://chiya.estate";

async function open(message: string) {
  try {
    await Share.share({ message });
  } catch {
    // user cancelled or share failed — no-op
  }
}

export function shareProperty(l: Listing) {
  const url = `${CHIYA_WEB}/property/${l.id}`;
  return open(translate(getActiveLocale(), "share.property", { title: l.title, price: priceLabel(l), address: l.address, url }));
}

export function shareAgent(a: Agent) {
  const url = `${CHIYA_WEB}/agents/${a.id}`;
  return open(translate(getActiveLocale(), a.verified ? "share.agentVerified" : "share.agent", { name: a.name, url }));
}
