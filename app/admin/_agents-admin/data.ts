import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

export const AGENTS_PER_PAGE = 10;
export const TOTAL_AGENTS = 128;

export interface KpiCard {
  key: string;
  label: string;
  icon: IconName;
  tone: StatTone;
  value: string;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", label: "Total agents", icon: "badge-check", tone: "brand", value: "128", sub: "Across all cities" },
  { key: "verified", label: "Verified agents", icon: "shield-check", tone: "success", value: "104", sub: "ID-checked · active" },
  { key: "pending", label: "Pending verification", icon: "clock", tone: "gold", value: "18", sub: "Awaiting document review" },
];

export const VERIFICATION: Record<string, { variant: BadgeVariant; icon: IconName; label: string }> = {
  Verified: { variant: "brand", icon: "badge-check", label: "Verified" },
  Pending: { variant: "warning", icon: "clock", label: "Pending" },
};
export const VERIFICATION_TABS = [
  { id: "", label: "View all" },
  { id: "Verified", label: "Verified" },
  { id: "Pending", label: "Pending" },
];

export const AGENT_STATUS: Record<string, { variant: BadgeVariant; dot: boolean }> = {
  Active: { variant: "success", dot: true },
  Suspended: { variant: "error", dot: true },
};
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Zakho"];

export interface AgentRecord {
  id: string;
  name: string;
  agency: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  verification: string;
  listings: number;
  sold: number;
  rented: number;
  members: number;
  status: string;
  img: string | null;
  experience?: string;
  languages?: string[];
  areas?: string[];
}

const SEED: AgentRecord[] = [
  { id: "A-2041", name: "Lana Aziz", agency: "Chiya Prime", phone: "+964 770 552 1190", email: "lana.aziz@chiya.estate", city: "Erbil", area: "Ankawa", verification: "Verified", listings: 14, sold: 32, rented: 19, members: 28, status: "Active", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=70" },
  { id: "A-2038", name: "Karwan Mahmoud", agency: "Erbil Realty", phone: "+964 750 118 4420", email: "karwan.m@chiya.estate", city: "Erbil", area: "Downtown", verification: "Verified", listings: 11, sold: 41, rented: 12, members: 22, status: "Active", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70" },
  { id: "A-2032", name: "Dashne Salar", agency: "Sulay Homes", phone: "+964 773 220 5567", email: "dashne.salar@chiya.estate", city: "Sulaymaniyah", area: "Bakhtiari", verification: "Verified", listings: 9, sold: 27, rented: 24, members: 19, status: "Active", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70" },
  { id: "A-2027", name: "Shilan Aram", agency: "Chiya Prime", phone: "+964 751 209 3341", email: "shilan.aram@chiya.estate", city: "Erbil", area: "Italian Village", verification: "Pending", listings: 4, sold: 6, rented: 8, members: 7, status: "Active", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=70" },
  { id: "A-2021", name: "Diyar Salih", agency: "Duhok Estate", phone: "+964 770 118 5540", email: "diyar.salih@chiya.estate", city: "Duhok", area: "Masike", verification: "Verified", listings: 16, sold: 22, rented: 15, members: 31, status: "Active", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" },
  { id: "A-2017", name: "Berivan Khalid", agency: "Chiya Prime", phone: "+964 773 884 2210", email: "berivan.k@chiya.estate", city: "Erbil", area: "Dream City", verification: "Verified", listings: 21, sold: 38, rented: 9, members: 44, status: "Active", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=160&q=70" },
  { id: "A-2009", name: "Hewa Botan", agency: "Zagros Living", phone: "+964 751 778 9012", email: "hewa.botan@chiya.estate", city: "Sulaymaniyah", area: "Ranya", verification: "Pending", listings: 2, sold: 0, rented: 3, members: 4, status: "Active", img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=70" },
  { id: "A-2003", name: "Nyan Faraj", agency: "Erbil Realty", phone: "+964 770 415 6688", email: "nyan.faraj@chiya.estate", city: "Erbil", area: "Gulan", verification: "Verified", listings: 7, sold: 18, rented: 27, members: 16, status: "Suspended", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=70" },
  { id: "A-1998", name: "Rebwar Aziz", agency: "Duhok Estate", phone: "+964 751 660 1925", email: "rebwar.aziz@chiya.estate", city: "Duhok", area: "Zakho Road", verification: "Verified", listings: 12, sold: 14, rented: 21, members: 13, status: "Active", img: null },
  { id: "A-1991", name: "Tara Jamal", agency: "Halabja Homes", phone: "+964 750 332 7799", email: "tara.jamal@chiya.estate", city: "Halabja", area: "Center", verification: "Pending", listings: 3, sold: 1, rented: 5, members: 6, status: "Active", img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=70" },
  { id: "A-1985", name: "Sirwan Tofiq", agency: "Zagros Living", phone: "+964 751 904 7782", email: "sirwan.t@chiya.estate", city: "Sulaymaniyah", area: "Salim St", verification: "Verified", listings: 18, sold: 29, rented: 11, members: 25, status: "Active", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=160&q=70" },
  { id: "A-1979", name: "Awat Rashid", agency: "Zakho Realty", phone: "+964 750 600 1234", email: "awat.rashid@chiya.estate", city: "Zakho", area: "Center", verification: "Verified", listings: 6, sold: 9, rented: 17, members: 10, status: "Active", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=70" },
];

/* Deterministic roster expansion to the full 128 agents (stable across renders). */
function buildRoster(): AgentRecord[] {
  const AGENTS = SEED.map((a) => ({ ...a }));
  const FIRST = ["Aland", "Avan", "Baban", "Chiman", "Darya", "Evar", "Hawre", "Jiyan", "Kani", "Lavin", "Media", "Nali", "Peshraw", "Rojan", "Sazan", "Twana", "Zhino", "Aram", "Bawar", "Choman", "Delan", "Ezel", "Fenk", "Goran", "Helin", "Karox", "Midya", "Newroz", "Payam", "Rezan", "Soran", "Tania", "Viyan", "Warya", "Yad", "Zana", "Hana", "Shad", "Bahar", "Kosrat"];
  const LAST = ["Ahmad", "Barzani", "Hama", "Hassan", "Ibrahim", "Karim", "Mustafa", "Omar", "Qadir", "Rasul", "Salih", "Tahir", "Wali", "Xoshnaw", "Yusuf", "Zebari", "Amin", "Faraj", "Hawrami", "Mohammed"];
  const AGENCIES = ["Chiya Prime", "Erbil Realty", "Sulay Homes", "Duhok Estate", "Halabja Homes", "Zagros Living", "Zakho Realty"];
  const CITY_AREAS: Record<string, string[]> = {
    Erbil: ["Ankawa", "Downtown", "Italian Village", "Dream City", "Gulan", "Empire"],
    Sulaymaniyah: ["Bakhtiari", "Ranya", "Salim St", "Sarchnar", " Azadi"],
    Duhok: ["Masike", "Zakho Road", "Nizarke", "Malta"],
    Halabja: ["Center", "Kani Ashqan"],
    Zakho: ["Center", "Bedar"],
  };
  const CITY_LIST = Object.keys(CITY_AREAS);
  const PORTRAITS: (string | null)[] = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=70",
    null,
  ];
  let idNum = 1973;
  let i = 0;
  while (AGENTS.length < TOTAL_AGENTS) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7 + 3) % LAST.length];
    const city = CITY_LIST[(i * 3) % CITY_LIST.length];
    const areas = CITY_AREAS[city];
    const area = areas[(i * 5) % areas.length];
    const verified = i % 4 !== 0;
    const suspended = i % 11 === 0;
    const listings = verified ? ((i * 13) % 24) + 1 : (i * 3) % 5;
    AGENTS.push({
      id: "A-" + idNum,
      name: first + " " + last,
      agency: AGENCIES[(i * 2) % AGENCIES.length],
      phone: "+964 7" + (50 + (i % 3) * 20) + " " + (100 + ((i * 37) % 900)) + " " + (1000 + ((i * 53) % 9000)),
      email: (first + "." + last[0]).toLowerCase() + "@chiya.estate",
      city,
      area,
      verification: verified ? "Verified" : "Pending",
      listings,
      sold: (i * 17) % 46,
      rented: (i * 11) % 30,
      members: ((i * 7) % 40) + 2,
      status: suspended ? "Suspended" : "Active",
      img: PORTRAITS[i % PORTRAITS.length],
    });
    idNum -= 6;
    i++;
  }
  return AGENTS;
}

export const AGENTS: AgentRecord[] = buildRoster();

export const EXPERIENCE_OPTIONS = [
  { value: "<1", label: "Less than 1 year" },
  { value: "1-2", label: "1–2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "10+", label: "10+ years" },
];
export const LANGUAGE_OPTIONS = ["English", "Kurdish", "Arabic", "Turkish", "Persian"];
export const SERVICE_AREA_OPTIONS = ["Erbil", "Ankawa", "Dream City", "Italian Village", "Gulan", "Empire", "Sulaymaniyah", "Duhok", "Halabja", "Zakho"];

export const EMPTY_FILTERS = { q: "", verification: "", city: "", listings: "", status: "" };
export type AgentFilters = typeof EMPTY_FILTERS;

export function deriveAreas(a: AgentRecord): string[] {
  const set: string[] = [];
  [a.area, a.city].forEach((x) => {
    if (SERVICE_AREA_OPTIONS.includes(x) && !set.includes(x)) set.push(x);
  });
  if (set.length === 0) set.push("Erbil");
  return set;
}
