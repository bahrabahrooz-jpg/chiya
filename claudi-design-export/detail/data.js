// Chiya Estate — Property Detail Page content (continues the Olive Grove Estate listing)
window.PDP_DATA = (function () {
  const img = (id, w = 1400, h = 1000) =>
    `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

  const property = {
    id: "olive-grove",
    title: "Olive Grove Estate",
    neighborhood: "Shaqlawa Hills",
    city: "Erbil",
    address: "Shaqlawa Hills, Erbil, Kurdistan Region",
    deal: "buy",
    price: 1240000,
    status: "For Sale",
    pstatusLabel: "Ready to move",
    featured: true,
    type: "Villa",
    beds: 6,
    baths: 5,
    area: 680,
    plot: 950,
    parking: 3,
    floors: 3,
    yearBuilt: 2023,
    furnishing: "Semi-furnished",
    reference: "CE-ERB-1042",
    photoCount: 32,
    hasTour: true,
  };

  // Gallery — exterior, interiors, pool, grounds
  const baseShots = [
    img("1613490493576-7fde63acd811"), // pool / exterior
    img("1600596542815-ffad4c1539a9"), // modern facade
    img("1600607687939-ce8a6c25118c"), // living room
    img("1600566753086-00f18fb6b3ea"), // bright living
    img("1556912173-3bb406ef7e77"),    // kitchen
    img("1505693416388-ac5ce068fe85"), // bedroom
    img("1584622650111-993a426fbf0a"), // bathroom
    img("1582268611958-ebfd161ef9cf"), // terrace
    img("1600210492486-724fe5c67fb0"), // dining
    img("1600573472550-8090b5e0745e"), // suite
  ];

  // Expand to the full photo set (cycles the curated shots up to photoCount)
  const gallery = Array.from({ length: property.photoCount }, (_, i) => baseShots[i % baseShots.length]);

  const description = [
    "Set high above Shaqlawa's olive terraces, Olive Grove Estate is a statement of restrained modern luxury — a stone-clad villa where floor-to-ceiling glass frames uninterrupted mountain panoramas from every principal room. The architecture balances warm Iraqi marble, walnut joinery, and bronze detailing across three considered levels.",
    "The ground floor opens to a double-height reception that flows onto a covered terrace and a 22-metre infinity pool, with a private orchard beyond. A separate chef's kitchen, formal dining room, and a glass-walled study complete the entertaining level. Upstairs, six en-suite bedrooms include a primary suite with a dressing room, spa bathroom, and a south-facing private balcony.",
    "Below, a wellness floor houses a home gym, hammam, cinema room, and staff quarters. The estate is fully smart-home enabled, with a backup generator, central heating and cooling, and 24/7 gated security — delivered move-in ready and finished to the highest specification in the region.",
  ];

  const features = [
    { icon: "home", label: "Property type", value: "Villa" },
    { icon: "bed-double", label: "Bedrooms", value: "6 en-suite" },
    { icon: "bath", label: "Bathrooms", value: "5 full · 2 WC" },
    { icon: "maximize-2", label: "Built-up area", value: "680 m²" },
    { icon: "ruler", label: "Plot size", value: "950 m²" },
    { icon: "layers", label: "Levels", value: "3 floors" },
    { icon: "car", label: "Parking", value: "3 covered" },
    { icon: "calendar", label: "Year built", value: "2023" },
    { icon: "sofa", label: "Furnishing", value: "Semi-furnished" },
    { icon: "compass", label: "Orientation", value: "South-facing" },
    { icon: "circle-check", label: "Status", value: "Ready to move" },
    { icon: "hash", label: "Reference", value: "CE-ERB-1042" },
  ];

  const amenities = [
    { icon: "waves", label: "Infinity pool" },
    { icon: "trees", label: "Private orchard & garden" },
    { icon: "shield-check", label: "24/7 gated security" },
    { icon: "sun", label: "Terraces & balconies" },
    { icon: "chevrons-up", label: "Private elevator" },
    { icon: "cpu", label: "Smart-home system" },
    { icon: "dumbbell", label: "Home gym & hammam" },
    { icon: "thermometer-sun", label: "Central heating & cooling" },
    { icon: "square-parking", label: "Covered parking" },
    { icon: "cctv", label: "CCTV surveillance" },
    { icon: "zap", label: "Backup generator" },
    { icon: "clapperboard", label: "Cinema room" },
  ];

  const nearby = [
    { icon: "building-2", name: "Empire World", time: "5 min drive" },
    { icon: "shopping-bag", name: "Family Mall", time: "10 min drive" },
    { icon: "church", name: "Ankawa", time: "12 min drive" },
    { icon: "plane", name: "Erbil International Airport", time: "20 min drive" },
  ];

  const agent = {
    name: "Daban Ali",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    agency: "Chiya Premier",
    verified: true,
    rating: 4.8,
    reviews: 96,
    listings: 31,
    sales: 175,
    experience: 7,
    phone: "+964 750 118 4042",
    responds: "Typically responds within 1 hour",
  };

  const apptDates = [
    { dow: "Fri", day: "13" },
    { dow: "Sat", day: "14" },
    { dow: "Sun", day: "15" },
    { dow: "Mon", day: "16" },
  ];
  const apptTimes = [
    { label: "10:00" }, { label: "11:30" }, { label: "13:00", off: true },
    { label: "15:00" }, { label: "16:30" }, { label: "18:00" },
  ];

  // Similar properties — reuse Search Results card style & content
  const similar = [
    { id: "marble-hill", title: "Marble Hill Villa", address: "Ankawa, Erbil", price: 620000,
      status: "For Sale", featured: true, type: "villa", beds: 4, baths: 3, area: 420, photoCount: 28,
      cover: img("1613977257363-707ba9348227", 1000, 750) },
    { id: "azadi-villa", title: "Azadi Heights Villa", address: "Azadi, Duhok", price: 760000,
      status: "For Sale", type: "villa", beds: 5, baths: 4, area: 520, photoCount: 26,
      cover: img("1600585154340-be6161a56a0c", 1000, 750) },
    { id: "rowanberry-villa", title: "Rowanberry Villa", address: "Italian Village, Erbil", price: 560000,
      status: "For Sale", featured: true, type: "villa", beds: 3, baths: 3, area: 240, photoCount: 21,
      cover: img("1605276374104-dee2a0ed3cd6", 1000, 750) },
  ];

  return { property, gallery, description, features, amenities, nearby, agent, apptDates, apptTimes, similar };
})();
