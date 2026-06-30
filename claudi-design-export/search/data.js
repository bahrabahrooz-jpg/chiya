// Chiya Estate — Search Results demo content & filter config
window.SRP_DATA = (function () {
  const img = (id, w = 1000, h = 750) =>
    `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

  // ---- Listings (curated Kurdistan set) ----
  // price = numeric (USD); for rentals it is the monthly figure.
  const listings = [
    { id: "olive-grove", title: "Olive Grove Estate", address: "Shaqlawa Hills, Erbil", city: "Erbil",
      deal: "buy", price: 1240000, status: "For Sale", featured: true, type: "villa",
      beds: 6, baths: 5, area: 680, photoCount: 32, pstatus: "ready",
      amenities: ["pool", "garden", "parking", "security"], cover: img("1613490493576-7fde63acd811") },
    { id: "marble-hill", title: "Marble Hill Villa", address: "Ankawa, Erbil", city: "Erbil",
      deal: "buy", price: 620000, status: "For Sale", featured: true, type: "villa",
      beds: 4, baths: 3, area: 420, photoCount: 28, pstatus: "ready",
      amenities: ["pool", "garden", "parking"], cover: img("1613977257363-707ba9348227") },
    { id: "cedarwood-villa", title: "Cedarwood Villa", address: "Dream City, Erbil", city: "Erbil",
      deal: "buy", price: 485000, status: "For Sale", type: "villa",
      beds: 4, baths: 3, area: 265, photoCount: 24, pstatus: "ready",
      amenities: ["garden", "parking", "security"], cover: img("1580587771525-78b9dba3b914") },
    { id: "rowanberry-villa", title: "Rowanberry Villa", address: "Italian Village, Erbil", city: "Erbil",
      deal: "buy", price: 560000, status: "For Sale", featured: true, type: "villa",
      beds: 3, baths: 3, area: 240, photoCount: 21, pstatus: "ready",
      amenities: ["pool", "garden", "parking"], cover: img("1605276374104-dee2a0ed3cd6") },
    { id: "empire-world", title: "Empire World Residence", address: "Empire World, Erbil", city: "Erbil",
      deal: "buy", price: 295000, status: "New", type: "apartment",
      beds: 2, baths: 2, area: 135, photoCount: 19, pstatus: "new",
      amenities: ["balcony", "elevator", "parking", "security"], cover: img("1545324418-cc1a3fa10c00") },
    { id: "cedar-court", title: "Cedar Court 4B", address: "Dream City, Erbil", city: "Erbil",
      deal: "buy", price: 285000, status: "For Sale", type: "apartment",
      beds: 2, baths: 2, area: 130, photoCount: 16, pstatus: "ready",
      amenities: ["elevator", "parking"], cover: img("1502672260266-1c1ef2d93688") },
    { id: "skyline-pent", title: "Skyline Penthouse", address: "Downtown, Erbil", city: "Erbil",
      deal: "rent", price: 2800, status: "For Rent", type: "apartment",
      beds: 3, baths: 3, area: 210, photoCount: 24, pstatus: "ready",
      amenities: ["balcony", "elevator", "parking", "furnished", "security"], cover: img("1600607687939-ce8a6c25118c") },
    { id: "park-residence", title: "Park Residence 12", address: "Italian Village, Erbil", city: "Erbil",
      deal: "buy", price: 410000, status: "For Sale", type: "apartment",
      beds: 3, baths: 2, area: 160, photoCount: 14, pstatus: "construction",
      amenities: ["balcony", "elevator", "parking", "security"], cover: img("1522708323590-d24dbb6b0267") },
    { id: "garden-townhouse", title: "Garden Townhouse", address: "Empire City, Erbil", city: "Erbil",
      deal: "buy", price: 430000, status: "For Sale", featured: true, type: "house",
      beds: 3, baths: 3, area: 240, photoCount: 20, pstatus: "ready",
      amenities: ["garden", "parking", "balcony"], cover: img("1568605114967-8130f3a36994") },
    { id: "italian-village", title: "Italian Village Apartment", address: "Italian Village, Erbil", city: "Erbil",
      deal: "rent", price: 1850, status: "For Rent", type: "apartment",
      beds: 2, baths: 2, area: 115, photoCount: 12, pstatus: "ready",
      amenities: ["balcony", "elevator", "parking"], cover: img("1493809842364-78817add7ffb") },
    { id: "shaqlawa-land", title: "Shaqlawa Hillside Land", address: "Shaqlawa, Erbil", city: "Erbil",
      deal: "buy", price: 180000, status: "New", type: "land",
      area: 950, photoCount: 8, pstatus: "new",
      amenities: [], cover: img("1500382017468-9049fed747ef") },
    { id: "sarsang-house", title: "Sarsang Family House", address: "Sarsang, Duhok", city: "Duhok",
      deal: "buy", price: 540000, status: "For Sale", type: "house",
      beds: 4, baths: 4, area: 360, photoCount: 22, pstatus: "ready",
      amenities: ["garden", "parking", "security"], cover: img("1564013799919-ab600027ffc6") },
    { id: "azadi-villa", title: "Azadi Heights Villa", address: "Azadi, Duhok", city: "Duhok",
      deal: "buy", price: 760000, status: "For Sale", type: "villa",
      beds: 5, baths: 4, area: 520, photoCount: 26, pstatus: "construction",
      amenities: ["pool", "garden", "parking", "security"], cover: img("1600585154340-be6161a56a0c") },
    { id: "masike-house", title: "Masike Garden House", address: "Masike, Duhok", city: "Duhok",
      deal: "rent", price: 1650, status: "For Rent", type: "house",
      beds: 3, baths: 2, area: 240, photoCount: 15, pstatus: "ready",
      amenities: ["garden", "parking", "furnished"], cover: img("1576941089067-2de3c901e126") },
    { id: "suli-commercial", title: "Salim Street Commercial Unit", address: "Salim St, Sulaymaniyah", city: "Sulaymaniyah",
      deal: "rent", price: 4200, status: "For Rent", type: "commercial",
      area: 320, photoCount: 11, pstatus: "ready",
      amenities: ["parking", "elevator", "security"], cover: img("1486406146926-c627a92ad1ab") },
    { id: "goizha-apt", title: "Goizha View Apartment", address: "Goizha, Sulaymaniyah", city: "Sulaymaniyah",
      deal: "buy", price: 230000, status: "New", type: "apartment",
      beds: 2, baths: 1, area: 105, photoCount: 13, pstatus: "new",
      amenities: ["balcony", "elevator"], cover: img("1567496898669-ee935f5f647a") },
  ];

  // ---- Filter option configs ----
  const propertyTypes = [
    { value: "villa", label: "Villa", tkey: "type.villa", icon: "home" },
    { value: "apartment", label: "Apartment", tkey: "type.apartment", icon: "building-2" },
    { value: "house", label: "House", tkey: "type.house", icon: "house" },
    { value: "land", label: "Land", tkey: "type.land", icon: "trees" },
    { value: "commercial", label: "Commercial", tkey: "type.commercial", icon: "store" },
  ];
  const buyPresets = [
    { value: "0-150000", label: "Up to $150K", tkey: "preset.buy.0" },
    { value: "150000-400000", label: "$150K – $400K", tkey: "preset.buy.1" },
    { value: "300000-600000", label: "$300K – $600K", tkey: "preset.buy.2" },
    { value: "600000-1000000", label: "$600K – $1M", tkey: "preset.buy.3" },
    { value: "1000000-", label: "$1M and above", tkey: "preset.buy.4" },
  ];
  const rentPresets = [
    { value: "0-1000", label: "Up to $1,000/mo", tkey: "preset.rent.0" },
    { value: "1000-2500", label: "$1,000 – $2,500/mo", tkey: "preset.rent.1" },
    { value: "2500-5000", label: "$2,500 – $5,000/mo", tkey: "preset.rent.2" },
    { value: "5000-", label: "$5,000/mo and above", tkey: "preset.rent.3" },
  ];
  const sizePresets = [
    { value: "0-100", label: "Up to 100 m²", tkey: "preset.size.0" },
    { value: "100-200", label: "100 – 200 m²", tkey: "preset.size.1" },
    { value: "200-300", label: "200 – 300 m²", tkey: "preset.size.2" },
    { value: "300-500", label: "300 – 500 m²", tkey: "preset.size.3" },
    { value: "500-", label: "500 m² and above", tkey: "preset.size.4" },
  ];
  const beds = [
    { value: "0", label: "Studio", tkey: "srp.studio" },
    { value: "1", label: "1+" },
    { value: "2", label: "2+" },
    { value: "3", label: "3+" },
    { value: "4", label: "4+" },
    { value: "5", label: "5+" },
  ];
  const baths = [
    { value: "1", label: "1+" },
    { value: "2", label: "2+" },
    { value: "3", label: "3+" },
    { value: "4", label: "4+" },
  ];
  const amenities = [
    { value: "parking", label: "Parking", tkey: "amen.parking", icon: "square-parking" },
    { value: "garden", label: "Garden", tkey: "amen.garden", icon: "trees" },
    { value: "pool", label: "Pool", tkey: "amen.pool", icon: "waves" },
    { value: "balcony", label: "Balcony", tkey: "amen.balcony", icon: "sun" },
    { value: "elevator", label: "Elevator", tkey: "amen.elevator", icon: "chevrons-up" },
    { value: "security", label: "Security", tkey: "amen.security", icon: "shield-check" },
    { value: "furnished", label: "Furnished", tkey: "amen.furnished", icon: "sofa" },
  ];
  const propertyStatus = [
    { value: "ready", label: "Ready", tkey: "pstatus.ready", icon: "circle-check" },
    { value: "construction", label: "Under construction", tkey: "pstatus.construction", icon: "construction" },
    { value: "new", label: "New listing", tkey: "pstatus.new", icon: "sparkles" },
  ];
  const sortOptions = [
    { value: "recommended", label: "Featured", tkey: "sort.recommended" },
    { value: "newest", label: "Newest", tkey: "sort.newest" },
    { value: "price-asc", label: "Price: low to high", tkey: "sort.price-asc" },
    { value: "price-desc", label: "Price: high to low", tkey: "sort.price-desc" },
    { value: "most-viewed", label: "Most viewed", tkey: "sort.most-viewed" },
  ];

  return {
    listings, propertyTypes, buyPresets, rentPresets, sizePresets,
    beds, baths, amenities, propertyStatus, sortOptions,
  };
})();
