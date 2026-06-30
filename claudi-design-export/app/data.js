// Chiya Estate homepage — demo content
window.CX_DATA = (function () {
  const img = (id, w = 1000, h = 750) =>
    `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

  const agents = {
    lana: { name: "Lana Hassan", agency: "Chiya Premier", verified: true,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      rating: 4.9, reviews: 128, listings: 42, sales: 210, experience: 9 },
    daban: { name: "Daban Ali", agency: "Chiya Premier", verified: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      rating: 4.8, reviews: 96, listings: 31, sales: 175, experience: 7 },
    shene: { name: "Shene Karim", agency: "Erbil Estates", verified: true,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      rating: 5.0, reviews: 64, listings: 18, sales: 120, experience: 5 },
    aram: { name: "Aram Botani", agency: "Chiya Premier", verified: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      rating: 4.7, reviews: 73, listings: 24, sales: 140, experience: 6 },
    avan: { name: "Avan Mahmood", agency: "Suli Signature", verified: true,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
      rating: 4.9, reviews: 112, listings: 37, sales: 188, experience: 8 },
    rebin: { name: "Rebin Tofiq", agency: "Duhok Homes", verified: true,
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop",
      rating: 4.8, reviews: 58, listings: 21, sales: 96, experience: 5 },
  };

  // The signature featured listing (two-pane hero card)
  const featured = {
    id: "olive-grove", title: "Olive Grove Estate", address: "Shaqlawa Hills, Erbil",
    price: "$1,240,000", status: "For Sale", beds: 6, baths: 5, area: 680, type: "Villa",
    agent: agents.daban,
    cover: img("1613490493576-7fde63acd811", 1200, 900),
    gallery: ["1600596542815-ffad4c1539a9","1600585154340-be6161a56a0c","1600210492493-0946911123ea",
      "1600607687939-ce8a6c25118c","1600566753086-00f18fb6b3ea"].map((i) => img(i, 400, 300)),
    desc: "Set above Shaqlawa's olive terraces — a stone-clad estate with sweeping mountain panoramas, an infinity pool, private orchard, and interiors finished in Iraqi marble.",
  };

  const listings = [
    { id: "marble-hill", title: "Marble Hill Villa", address: "Ankawa, Erbil",
      price: "$620,000", status: "For Sale", featured: true, beds: 4, baths: 3, area: 420,
      type: "Villa", photoCount: 28, cover: img("1613977257363-707ba9348227") },
    { id: "cedar-court", title: "Cedar Court 4B", address: "Dream City, Erbil",
      price: "$285,000", status: "For Sale", beds: 2, baths: 2, area: 130,
      type: "Apartment", photoCount: 16, cover: img("1545324418-cc1a3fa10c00") },
    { id: "skyline-penthouse", title: "Skyline Penthouse", address: "Downtown, Erbil",
      price: "$2,800", period: "mo", status: "For Rent", beds: 3, baths: 3, area: 210,
      type: "Penthouse", photoCount: 24, cover: img("1600607687939-ce8a6c25118c") },
    { id: "garden-townhouse", title: "Garden Townhouse", address: "Empire City, Erbil",
      price: "$430,000", status: "For Sale", featured: true, beds: 3, baths: 3, area: 240,
      type: "Townhouse", photoCount: 20, cover: img("1568605114967-8130f3a36994") },
    { id: "park-residence", title: "Park Residence 12", address: "Italian Village, Erbil",
      price: "$1,850", period: "mo", status: "For Rent", beds: 2, baths: 2, area: 115,
      type: "Apartment", photoCount: 12, cover: img("1502672260266-1c1ef2d93688") },
    { id: "cliff-house", title: "Cliffside House", address: "Sarsang, Duhok",
      price: "$540,000", status: "For Sale", beds: 4, baths: 4, area: 360,
      type: "House", photoCount: 22, cover: img("1564013799919-ab600027ffc6") },
  ];

  const categories = [
    { name: "Villas", count: 184, icon: "home", image: img("1613490493576-7fde63acd811", 700, 900) },
    { name: "Apartments", count: 320, icon: "building-2", image: img("1545324418-cc1a3fa10c00", 700, 900) },
    { name: "Houses", count: 146, icon: "house", image: img("1564013799919-ab600027ffc6", 700, 900) },
    { name: "Commercial", count: 58, icon: "store", image: img("1486406146926-c627a92ad1ab", 700, 900) },
    { name: "Land", count: 71, icon: "trees", image: img("1500382017468-9049fed747ef", 700, 900) },
  ];

  const locations = [
    { city: "Erbil", count: 642, blurb: "The capital's gated communities, Dream City villas, and downtown penthouses.",
      image: img("1599423300746-b62533397364", 900, 700) },
    { city: "Duhok", count: 218, blurb: "Mountain-framed homes and tranquil retreats above the Sarsang valley.",
      image: img("1570168007204-dfb528c6958f", 900, 700) },
    { city: "Sulaymaniyah", count: 394, blurb: "Cultural heart of Kurdistan — leafy boulevards and modern residences.",
      image: img("1518684079-3c830dcef090", 900, 700) },
  ];

  const pillars = [
    { key: "0", icon: "badge-check", title: "Verified agents", desc: "Every agent is ID-checked and licence-verified before they can list with Chiya." },
    { key: "1", icon: "shield-check", title: "Admin-approved listings", desc: "Each property is reviewed and approved by our team — no duplicates, no ghost listings." },
    { key: "2", icon: "sparkles", title: "Luxury properties", desc: "A hand-curated collection of Kurdistan's most exceptional homes and estates." },
    { key: "3", icon: "lock", title: "Secure platform", desc: "Encrypted messaging, protected viewings, and no-obligation enquiries throughout." },
  ];

  const insights = [
    { label: "Average villa price", value: "$648K", delta: "8.2%", deltaDir: "up", sub: "vs last year", icon: "home", tone: "brand",
      spark: [38, 42, 40, 46, 49, 52, 55, 58, 62, 66] },
    { label: "Average apartment price", value: "$214K", delta: "5.4%", deltaDir: "up", sub: "vs last year", icon: "building-2", tone: "gold",
      spark: [30, 31, 33, 34, 36, 35, 38, 40, 42, 44] },
    { label: "Active listings", value: "1,254", delta: "12%", deltaDir: "up", sub: "this quarter", icon: "trending-up", tone: "success",
      spark: [60, 64, 62, 70, 74, 78, 82, 88, 92, 98] },
    { label: "Avg. days to sell", value: "47", delta: "9 days", deltaDir: "down", sub: "faster than 2024", icon: "calendar-check", tone: "info",
      spark: [80, 74, 70, 66, 62, 58, 55, 52, 49, 47] },
  ];

  const testimonials = [
    { key: "0", name: "Hawar & Nyan", location: "Bought in Dream City, Erbil", rating: 5,
      avatar: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=160&h=160&fit=crop",
      quote: "Our Chiya agent understood exactly what we wanted. Every viewing was a home we genuinely loved — we signed within three weeks." },
    { key: "1", name: "Sara Aziz", location: "Rented in Italian Village, Erbil", rating: 5,
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=160&h=160&fit=crop",
      quote: "As someone relocating from abroad, the verified listings gave me real confidence. No surprises, no wasted trips." },
    { key: "2", name: "Karwan Jamal", location: "Sold a villa in Sarsang, Duhok", rating: 5,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop",
      quote: "Listing with Chiya brought serious, pre-qualified buyers only. The whole process felt premium from start to finish." },
  ];

  return { agents, featured, listings, categories, locations, pillars, insights, testimonials };
})();
