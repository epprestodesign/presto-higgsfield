// Fake hotel database (60) + pure filter/sort logic for the prototype Browse.
// Deterministic (index-derived) so the list is stable across reloads. Shared by
// both the Book Reservation (reserve) and Group Block (group) flows; each hotel
// links to its own Details page. No library changes — this only feeds the real
// library cards / filter controls with data + logic.

// Amenity keys the library's amenity FILTER actually shows (FILTER_AMENITY_KEYS,
// from lib/amenities.js) — so a selection in the filter can match a hotel.
const AMENITY_KEYS = [
  'non_smoking', 'breakfast_fee', 'ev_charging', 'exterior_corridors', 'shuttle',
  'breakfast', 'parking', 'accessible', 'in_room_fridge', 'indoor_pool',
  'interior_corridors', 'kitchenette', 'laundry', 'outdoor_pool', 'restaurant',
  'pet_friendly', 'front_desk_24h', 'room_service', 'bar', 'beach_access',
  'bike_rental', 'business_center', 'casino', 'concierge', 'connecting_rooms',
  'currency_exchange', 'dry_cleaning', 'express_checkin', 'gift_shop', 'golf',
  'hot_tub', 'kids_club', 'luggage_storage', 'microwave', 'rollaway_beds',
  'rooftop_bar', 'safe_deposit_box', 'ski_storage', 'spa', 'tennis', 'valet',
]
// Common amenities most hotels carry (all within the filterable set above).
const POPULAR = ['breakfast', 'parking', 'non_smoking', 'restaurant', 'bar', 'room_service']

// Parent brands (match the library's Parent Brand filter) + an Independent bucket.
const BRANDS = [
  { parent: 'Marriott International', names: ['Courtyard by Marriott', 'Residence Inn', 'Fairfield Inn', 'SpringHill Suites', 'AC Hotel', 'Marriott Marquis'] },
  { parent: 'Hilton Worldwide', names: ['Hampton Inn', 'DoubleTree', 'Embassy Suites', 'Hilton Garden Inn', 'Homewood Suites', 'Hilton'] },
  { parent: 'Hyatt Hotels', names: ['Hyatt Place', 'Hyatt House', 'Grand Hyatt', 'Hyatt Regency', 'Park Hyatt'] },
  { parent: 'IHG Hotels & Resorts', names: ['Holiday Inn', 'Holiday Inn Express', 'Crowne Plaza', 'Staybridge Suites', 'Candlewood Suites'] },
  { parent: 'Independent', names: ['The Grand Riverside Hotel', 'The Concord Hotel', 'Riverside Suites', 'The Metropolitan', 'Lakeview Lodge', 'Overland Boutique Inn'] },
]
const SUFFIXES = ['Downtown', 'Convention Center', 'Arena District', 'Riverfront', 'Midtown', 'Airport', 'West End', 'North', 'Old Town', 'Stadium']
const CITIES = ['Overland Park', 'Chicago', 'Aurora', 'Naperville', 'Evanston', 'Oak Brook', 'Schaumburg', 'Rosemont', 'Skokie', 'Joliet', 'Lombard', 'Elgin']
const STAR_STEPS = [2, 2.5, 3, 3.5, 4, 4, 4.5, 5]
const IMG_SETS = [
  ['exterior', 'rooms', 'lobby'], ['exterior', 'suites', 'pool'], ['lobby', 'rooms', 'dining'],
  ['exterior', 'pool', 'bar'], ['rooms', 'suites', 'spa'], ['exterior', 'lobby', 'bathroom'],
]
const NIGHTS = ['Wed, 6/16/2027', 'Thu, 6/17/2027', 'Fri, 6/18/2027']

// The event venue (map center) — hotels are spread around it by their distance.
export const VENUE = { lat: 38.982, lng: -94.670, label: 'Main Arena' }
const COS_LAT = Math.cos((VENUE.lat * Math.PI) / 180)
function coordsFor(i, distanceMi) {
  const ang = (i * 137.5 * Math.PI) / 180 // golden-angle spread
  return {
    lat: VENUE.lat + (distanceMi / 69) * Math.cos(ang),
    lng: VENUE.lng + (distanceMi / (69 * COS_LAT)) * Math.sin(ang),
  }
}

const money = (n) => n
const round1 = (n) => Math.round(n * 10) / 10

// Deterministic per-hotel amenity set (varied but always includes a few popular).
function amenitiesFor(i) {
  const set = new Set()
  // seed with 2-4 popular amenities
  POPULAR.forEach((k, ki) => { if ((i + ki) % 2 === 0) set.add(k) })
  set.add(POPULAR[i % POPULAR.length])
  // sprinkle non-popular amenities deterministically
  AMENITY_KEYS.forEach((k, ki) => { if ((i * 3 + ki * 7) % 5 === 0) set.add(k) })
  return [...set]
}

// A per-night rooms-left list for the card's Availability panel.
function availRooms(i) {
  const types = ['King Bed - 1 King', 'Double Queen - 2 Queen', 'Two-Room Suite', 'Deluxe King', 'Accessible Queen']
  return types.slice(0, 3 + (i % 3)).map((type, r) => ({
    type,
    nightly: 120 + ((i + r * 40) % 220),
    nights: NIGHTS.map((date, n) => ({ date, roomsLeft: Math.max(0, ((i + r * 2 + n) % 12)) })),
  }))
}

function buildHotels() {
  const list = []
  for (let i = 0; i < 60; i++) {
    const brand = BRANDS[i % BRANDS.length]
    const k = Math.floor(i / BRANDS.length)          // 0..11 within a brand
    const base = brand.names[k % brand.names.length]
    const suffix = SUFFIXES[k % SUFFIXES.length]      // unique (base,suffix) per brand
    const city = CITIES[i % CITIES.length]
    const name = `${base} ${suffix}`
    const stars = STAR_STEPS[i % STAR_STEPS.length]
    const rating = round1(3.5 + ((i * 7) % 15) / 10)   // 3.5 – 4.9
    const reviews = 180 + (i * 137) % 1900
    const fromNightly = 89 + (i * 23) % 311             // 89 – 399
    const startingPrice = fromNightly + 10 + (i % 5) * 12
    const distanceMi = round1(0.2 + ((i * 13) % 58) / 10) // 0.2 – 5.9
    // Availability spread: ~1/9 unavailable, ~1/5 doesn't-match, rest available.
    const avail = i % 9 === 4 ? 'unavailable' : i % 5 === 0 ? 'unmatched' : 'available'
    const roomsAvailable = 3 + (i % 12)
    // Real coordinates spread around the venue by the hotel's distance — REQUIRED
    // by HotelMap (AdvancedMarkerElement throws on a non-number lat/lng, which the
    // map's try/catch otherwise swallows as a misleading "API key needed" state).
    const { lat, lng } = coordsFor(i, distanceMi)
    list.push({
      id: `h${i}`,
      name, city, lat, lng,
      brand: brand.parent,
      stars, rating, reviews,
      fromNightly, startingPrice, total: fromNightly * 3,
      distanceMi, distance: `${distanceMi} mi from Main Arena`,
      amenities: amenitiesFor(i),
      preferred: i % 6 === 0,
      refundable: i % 3 !== 2,
      lowRateGuarantee: i % 2 === 0,
      availability: avail,          // reserve vocabulary
      roomsAvailable,
      roomsMax: 2 + (i % 6),
      seed: i,
      imageCategories: IMG_SETS[i % IMG_SETS.length],
      rooms: availRooms(i),
    })
  }
  return list
}

export const HOTELS = buildHotels()
export const getHotel = (id) => HOTELS.find((h) => h.id === id) || null
export const getHotelByName = (name) => HOTELS.find((h) => h.name === name) || null

// Map reserve availability → group card vocabulary.
export const groupAvailability = (a) => (a === 'available' ? 'matches' : a === 'unmatched' ? 'partial' : 'unavailable')

// ── Filtering ──
// filters = { priceMin, priceMax, minStars, guestRating, brands:[], amenities:[keys],
//             propertySearch, distanceMax }
// `flow` selects the price field (reserve: fromNightly, group: startingPrice).
// The default "show all" radius (covers every hotel) — a smaller radius filters.
export const FULL_RADIUS = 6

export function filterHotels(hotels, filters = {}, flow = 'reserve') {
  const f = filters
  const priceOf = (h) => (flow === 'group' ? h.startingPrice : h.fromNightly)
  return hotels.filter((h) => {
    if (f.exactOnly && h.availability !== 'available') return false
    if (f.priceMin != null && priceOf(h) < f.priceMin) return false
    if (f.priceMax != null && priceOf(h) > f.priceMax) return false
    if (f.minStars && h.stars < f.minStars) return false
    if (f.guestRating && h.rating < f.guestRating) return false
    if (f.brands && f.brands.length && !f.brands.includes(h.brand)) return false
    if (f.amenities && f.amenities.length && !f.amenities.every((a) => h.amenities.includes(a))) return false
    if (f.propertySearch && f.propertySearch.trim() && !h.name.toLowerCase().includes(f.propertySearch.trim().toLowerCase())) return false
    if (f.distanceMax != null && f.distanceMax < FULL_RADIUS && h.distanceMi > f.distanceMax) return false
    if (f.roomTypes && f.roomTypes.length &&
        !f.roomTypes.some((rt) => h.rooms.some((r) => r.type.toLowerCase().includes(String(rt).toLowerCase())))) return false
    return true
  })
}

// Count of active (non-default) filters, for the "N filters applied" toolbar line.
export function countFilters(f = {}) {
  let n = 0
  if (f.exactOnly) n++
  if (f.propertySearch && f.propertySearch.trim()) n++
  if (f.brands && f.brands.length) n++
  if (f.amenities && f.amenities.length) n++
  if (f.priceMax != null) n++
  if (f.minStars) n++
  if (f.roomTypes && f.roomTypes.length) n++
  if (f.distanceMax != null && f.distanceMax < FULL_RADIUS) n++
  return n
}

// ── Sorting ──
export function sortHotels(hotels, sortKey = 'distance', flow = 'reserve') {
  const priceOf = (h) => (flow === 'group' ? h.startingPrice : h.fromNightly)
  const arr = [...hotels]
  switch (sortKey) {
    case 'price_asc': return arr.sort((a, b) => priceOf(a) - priceOf(b))
    case 'price_desc': return arr.sort((a, b) => priceOf(b) - priceOf(a))
    case 'guest_rating': return arr.sort((a, b) => b.rating - a.rating)
    case 'distance':
    default: return arr.sort((a, b) => a.distanceMi - b.distanceMi)
  }
}

// The full price band across the dataset (for the budget slider bounds).
export const PRICE_MIN = Math.min(...HOTELS.map((h) => h.fromNightly))
export const PRICE_MAX = Math.max(...HOTELS.map((h) => h.startingPrice))
