/** Agent Profile — Daban Ali (ported from profile/data.js). */

const img = (id: string, w = 1000, h = 750) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;
const por = (id: string) => `https://images.unsplash.com/photo-${id}?w=120&h=120&fit=crop&crop=faces`;

export const agent = {
  id: "daban-ali",
  name: "Daban Ali",
  verified: true,
  agency: "Chiya Premier",
  city: "Erbil, Kurdistan",
  title: "Senior luxury property advisor",
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&h=720&fit=crop&crop=faces",
  languages: ["English", "Kurdish", "Arabic"],
  experience: 9,
  rating: 4.8,
  reviews: 96,
  listings: 42,
  sold: 210,
  phone: "+964 750 118 4042",
  whatsapp: "9647501184042",
  email: "daban.ali@chiyaestate.com",
};

export interface Metric {
  icon: string;
  value: string;
  label: string;
  desc: string;
}
export const metrics: Metric[] = [
  { icon: "building-2", value: "42", label: "Active listings", desc: "Premium properties currently on the market" },
  { icon: "key", value: "210", label: "Properties sold", desc: "Successfully closed for happy clients" },
  { icon: "calendar-check", value: "9", label: "Years experience", desc: "Deep market expertise and proven track record" },
  { icon: "star", value: "4.8", label: "Client rating", desc: "Based on 96 reviews from satisfied clients" },
];

export const about = [
  "Daban Ali is a senior advisor at Chiya Premier, specialising in luxury villas and high-yield investment property across Erbil and the wider Kurdistan Region. Over the past nine years he has guided more than two hundred families and investors through confident, well-informed moves — from first viewings to handover of keys.",
  "His approach is unhurried and precise: he leads with the home and the lifestyle, then backs every recommendation with hard local market data. Clients return to Daban for his discretion, his deep knowledge of Erbil's premier communities, and a standard of service that treats every brief as the only brief.",
];

export const intro =
  "Daban Ali specialises in luxury villas, premium residences, and investment opportunities across Erbil and the Kurdistan Region. Over the past nine years he has guided more than 200 families and investors through confident moves — backed by an intimate knowledge of the local market.";

export const specialties = ["Luxury villas", "Apartments", "Commercial properties", "Investment properties", "New developments"];

export interface Area {
  name: string;
  note: string;
}
export const areas: Area[] = [
  { name: "Erbil", note: "City centre & premier districts" },
  { name: "Ankawa", note: "Villas & family residences" },
  { name: "Dream City", note: "Gated luxury community" },
  { name: "Empire World", note: "Landmark residential towers" },
  { name: "Italian Village", note: "Boutique villa enclave" },
  { name: "Shaqlawa", note: "Hillside retreats & estates" },
];

export interface ProListing {
  id: string;
  title: string;
  address: string;
  deal: "buy" | "rent";
  price: number;
  status: string;
  featured?: boolean;
  beds: number;
  baths: number;
  area: number;
  photoCount: number;
  since: number;
  cover: string;
}
export const listings: ProListing[] = [
  { id: "olive-grove", title: "Olive Grove Estate", address: "Shaqlawa Hills, Erbil", deal: "buy", price: 1240000, status: "For Sale", featured: true, beds: 6, baths: 5, area: 680, photoCount: 32, since: 8, cover: img("1613490493576-7fde63acd811") },
  { id: "marble-hill", title: "Marble Hill Villa", address: "Ankawa, Erbil", deal: "buy", price: 620000, status: "For Sale", featured: true, beds: 4, baths: 3, area: 420, photoCount: 28, since: 22, cover: img("1613977257363-707ba9348227") },
  { id: "rowanberry-villa", title: "Rowanberry Villa", address: "Italian Village, Erbil", deal: "buy", price: 560000, status: "For Sale", featured: true, beds: 3, baths: 3, area: 240, photoCount: 21, since: 3, cover: img("1605276374104-dee2a0ed3cd6") },
  { id: "cedarwood-villa", title: "Cedarwood Villa", address: "Dream City, Erbil", deal: "buy", price: 485000, status: "For Sale", beds: 4, baths: 3, area: 265, photoCount: 24, since: 14, cover: img("1580587771525-78b9dba3b914") },
  { id: "skyline-pent", title: "Skyline Penthouse", address: "Downtown, Erbil", deal: "rent", price: 2800, status: "For Rent", beds: 3, baths: 3, area: 210, photoCount: 24, since: 1, cover: img("1600607687939-ce8a6c25118c") },
  { id: "empire-world", title: "Empire World Residence", address: "Empire World, Erbil", deal: "buy", price: 295000, status: "New", beds: 2, baths: 2, area: 135, photoCount: 19, since: 2, cover: img("1545324418-cc1a3fa10c00") },
  { id: "garden-townhouse", title: "Garden Townhouse", address: "Empire City, Erbil", deal: "buy", price: 430000, status: "For Sale", featured: true, beds: 3, baths: 3, area: 240, photoCount: 20, since: 18, cover: img("1568605114967-8130f3a36994") },
  { id: "park-residence", title: "Park Residence 12", address: "Italian Village, Erbil", deal: "buy", price: 410000, status: "For Sale", beds: 3, baths: 2, area: 160, photoCount: 14, since: 30, cover: img("1522708323590-d24dbb6b0267") },
  { id: "cedar-court", title: "Cedar Court 4B", address: "Dream City, Erbil", deal: "buy", price: 285000, status: "For Sale", beds: 2, baths: 2, area: 130, photoCount: 16, since: 11, cover: img("1502672260266-1c1ef2d93688") },
];

export interface Sold {
  id: string;
  title: string;
  address: string;
  price: number;
  deal: string;
  beds: number;
  baths: number;
  area: number;
  when: string;
  cover: string;
}
export const sold: Sold[] = [
  { id: "azadi-villa", title: "Azadi Heights Villa", address: "Azadi, Erbil", price: 760000, deal: "Sold", beds: 5, baths: 4, area: 520, when: "Apr 2026", cover: img("1600585154340-be6161a56a0c", 800, 600) },
  { id: "sarsang-house", title: "Cypress Family House", address: "Dream City, Erbil", price: 540000, deal: "Sold", beds: 4, baths: 4, area: 360, when: "Feb 2026", cover: img("1564013799919-ab600027ffc6", 800, 600) },
  { id: "italian-apt", title: "Italian Village Apartment", address: "Italian Village, Erbil", price: 1850, deal: "Rented", beds: 2, baths: 2, area: 115, when: "Jan 2026", cover: img("1493809842364-78817add7ffb", 800, 600) },
];

export interface Review {
  id: number;
  name: string;
  avatar: string;
  stars: number;
  when: string;
  deal: string;
  text: string;
}
export const reviews: Review[] = [
  { id: 1, name: "Rawa Othman", avatar: por("1573496359142-b8d87734a5a2"), stars: 5, when: "2 weeks ago", deal: "Bought a villa in Ankawa", text: "Excellent communication and remarkably fast responses. Daban understood exactly what our family needed and never pushed us toward anything that did not fit. The whole purchase felt calm and well-managed." },
  { id: 2, name: "Hemin Tahir", avatar: por("1500648767791-00dcc994a43e"), stars: 5, when: "1 month ago", deal: "Sold an apartment in Empire World", text: "Sold my apartment well above what I expected, and faster than I thought possible. His read on the Erbil market is genuinely impressive — every recommendation was backed by real figures." },
  { id: 3, name: "Lina Aziz", avatar: por("1544005313-94ddf0286df2"), stars: 5, when: "2 months ago", deal: "Rented in Dream City", text: "Professional, patient, and completely transparent from the first viewing to signing. He arranged everything around my schedule and confirmed within the hour, every time." },
  { id: 4, name: "Karwan Sabir", avatar: por("1506794778202-cad84cf45f1d"), stars: 4, when: "3 months ago", deal: "Investment purchase, Italian Village", text: "A trustworthy advisor for investment property. Honest about the trade-offs on each option and clearly focused on long-term value rather than a quick sale." },
];

export interface SortOpt {
  value: string;
  label: string;
  icon: string;
}
export const sortOptions: SortOpt[] = [
  { value: "newest", label: "Newest", icon: "sparkles" },
  { value: "price-desc", label: "Price: high to low", icon: "arrow-down-wide-narrow" },
  { value: "price-asc", label: "Price: low to high", icon: "arrow-up-wide-narrow" },
];
