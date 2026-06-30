/** Agent Directory — demo content (ported from agents/data.js). */

const portrait = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=240&h=240&fit=crop&crop=faces`;

export interface DirAgent {
  id: string;
  name: string;
  agency: string;
  city: string;
  photo: string;
  verified: boolean;
  rating: number;
  reviews: number;
  listings: number;
  sold: number;
  experience: number;
  since: number;
  phone: string;
  whatsapp: string;
}

export const agents: DirAgent[] = [
  { id: "lana-hassan", name: "Lana Hassan", agency: "Chiya Premier", city: "Erbil", photo: portrait("1573496359142-b8d87734a5a2"), verified: true, rating: 4.9, reviews: 128, listings: 42, sold: 210, experience: 9, since: 2017, phone: "+964 750 118 4421", whatsapp: "9647501184421" },
  { id: "avan-mahmood", name: "Avan Mahmood", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1544005313-94ddf0286df2"), verified: true, rating: 4.9, reviews: 112, listings: 37, sold: 188, experience: 8, since: 2018, phone: "+964 770 204 9930", whatsapp: "9647702049930" },
  { id: "daban-ali", name: "Daban Ali", agency: "Chiya Premier", city: "Erbil", photo: portrait("1500648767791-00dcc994a43e"), verified: true, rating: 4.8, reviews: 96, listings: 31, sold: 175, experience: 7, since: 2019, phone: "+964 751 330 7782", whatsapp: "9647513307782" },
  { id: "nyan-salih", name: "Nyan Salih", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1573497019940-1c28c88b4f3e"), verified: true, rating: 4.9, reviews: 88, listings: 29, sold: 152, experience: 7, since: 2019, phone: "+964 773 661 2048", whatsapp: "9647736612048" },
  { id: "dilan-aziz", name: "Dilan Aziz", agency: "Erbil Estates", city: "Erbil", photo: portrait("1487412720507-e7ab37603c6f"), verified: true, rating: 4.8, reviews: 77, listings: 26, sold: 133, experience: 6, since: 2020, phone: "+964 750 882 1190", whatsapp: "9647508821190" },
  { id: "aram-botani", name: "Aram Botani", agency: "Chiya Premier", city: "Erbil", photo: portrait("1507003211169-0a1dd7228f2d"), verified: true, rating: 4.7, reviews: 73, listings: 24, sold: 140, experience: 6, since: 2020, phone: "+964 751 447 6603", whatsapp: "9647514476603" },
  { id: "sipan-rashid", name: "Sipan Rashid", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1519085360753-af0119f7cbe7"), verified: true, rating: 4.8, reviews: 66, listings: 23, sold: 109, experience: 6, since: 2021, phone: "+964 770 915 3374", whatsapp: "9647709153374" },
  { id: "rebin-tofiq", name: "Rebin Tofiq", agency: "Duhok Homes", city: "Duhok", photo: portrait("1633332755192-727a05c4013d"), verified: true, rating: 4.8, reviews: 58, listings: 21, sold: 96, experience: 5, since: 2021, phone: "+964 751 029 8845", whatsapp: "9647510298845" },
  { id: "shene-karim", name: "Shene Karim", agency: "Erbil Estates", city: "Erbil", photo: portrait("1438761681033-6461ffad8d80"), verified: true, rating: 5.0, reviews: 64, listings: 18, sold: 120, experience: 5, since: 2021, phone: "+964 750 773 5512", whatsapp: "9647507735512" },
  { id: "karwan-jamal", name: "Karwan Jamal", agency: "Empire Realty", city: "Erbil", photo: portrait("1506794778202-cad84cf45f1d"), verified: true, rating: 4.6, reviews: 51, listings: 19, sold: 84, experience: 4, since: 2022, phone: "+964 771 540 2267", whatsapp: "9647715402267" },
  { id: "hawre-sabir", name: "Hawre Sabir", agency: "Duhok Homes", city: "Duhok", photo: portrait("1472099645785-5658abf4ff4e"), verified: true, rating: 4.7, reviews: 44, listings: 15, sold: 70, experience: 4, since: 2023, phone: "+964 751 906 4418", whatsapp: "9647519064418" },
  { id: "tara-qadir", name: "Tara Qadir", agency: "Ankawa Properties", city: "Erbil", photo: portrait("1534528741775-53994a69daeb"), verified: true, rating: 5.0, reviews: 39, listings: 12, sold: 58, experience: 3, since: 2024, phone: "+964 750 612 7790", whatsapp: "9647506127790" },
  { id: "zhin-faraj", name: "Zhin Faraj", agency: "Chiya Premier", city: "Erbil", photo: portrait("1544723795-3fb6469f5b39"), verified: true, rating: 4.9, reviews: 84, listings: 28, sold: 144, experience: 7, since: 2019, phone: "+964 750 441 2093", whatsapp: "9647504412093" },
  { id: "karzan-wali", name: "Karzan Wali", agency: "Duhok Homes", city: "Duhok", photo: portrait("1500917293891-ef795e70e1f6"), verified: true, rating: 4.7, reviews: 47, listings: 17, sold: 78, experience: 5, since: 2021, phone: "+964 751 778 6620", whatsapp: "9647517786620" },
  { id: "lava-sirwan", name: "Lava Sirwan", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1517841905240-472988babdf9"), verified: true, rating: 4.8, reviews: 69, listings: 22, sold: 101, experience: 6, since: 2020, phone: "+964 770 330 1185", whatsapp: "9647703301185" },
  { id: "diyar-hama", name: "Diyar Hama", agency: "Empire Realty", city: "Erbil", photo: portrait("1489424731084-a5d8b219a5bb"), verified: true, rating: 4.6, reviews: 41, listings: 16, sold: 66, experience: 4, since: 2022, phone: "+964 771 264 9907", whatsapp: "9647712649907" },
  { id: "solin-najib", name: "Solin Najib", agency: "Ankawa Properties", city: "Erbil", photo: portrait("1524504388940-b1c1722653e1"), verified: true, rating: 4.9, reviews: 56, listings: 20, sold: 92, experience: 5, since: 2021, phone: "+964 750 905 7731", whatsapp: "9647509057731" },
  { id: "hemin-star", name: "Hemin Star", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1535713875002-d1d0cf377fde"), verified: true, rating: 4.7, reviews: 38, listings: 14, sold: 61, experience: 4, since: 2023, phone: "+964 773 118 4402", whatsapp: "9647731184402" },
  { id: "roj-aram", name: "Roj Aram", agency: "Duhok Homes", city: "Duhok", photo: portrait("1463453091185-61582044d556"), verified: true, rating: 4.8, reviews: 52, listings: 18, sold: 88, experience: 5, since: 2020, phone: "+964 751 552 3318", whatsapp: "9647515523318" },
  { id: "niga-salar", name: "Niga Salar", agency: "Erbil Estates", city: "Erbil", photo: portrait("1547425260-76bcadfb4f2c"), verified: true, rating: 5.0, reviews: 33, listings: 11, sold: 49, experience: 3, since: 2024, phone: "+964 750 770 2245", whatsapp: "9647507702245" },
  { id: "berivan-kani", name: "Berivan Kani", agency: "Chiya Premier", city: "Erbil", photo: portrait("1531123897727-8f129e1688ce"), verified: true, rating: 4.8, reviews: 61, listings: 25, sold: 118, experience: 6, since: 2020, phone: "+964 750 338 9914", whatsapp: "9647503389914" },
  { id: "diyari-khalid", name: "Diyari Khalid", agency: "Empire Realty", city: "Erbil", photo: portrait("1502685104226-ee32379fefbe"), verified: true, rating: 4.6, reviews: 36, listings: 13, sold: 54, experience: 4, since: 2023, phone: "+964 771 902 5560", whatsapp: "9647719025560" },
];

export const cities = ["Erbil", "Sulaymaniyah", "Duhok"];
export const agencies = ["Chiya Premier", "Erbil Estates", "Suli Signature", "Duhok Homes", "Empire Realty", "Ankawa Properties"];

export interface SortOpt {
  value: string;
  label: string;
  icon: string;
}
export const sortOptions: SortOpt[] = [
  { value: "listings", label: "Most listings", icon: "building-2" },
  { value: "rating", label: "Highest rating", icon: "star" },
  { value: "newest", label: "Newest agents", icon: "sparkles" },
];
