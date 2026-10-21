// Shared rich data for the fully-rendered Hotel Detail Page examples
// (Book Reservation + Group Block). Gallery images load from the imagery library
// by category at runtime; room cards are text-only with detailed features.
import { popularAmenities, amenityGroups } from '../../lib/amenities.js'

const feat = (extra = []) => [
  { label: 'Entertainment', value: '55" Smart TV, Netflix, Apple TV, Premium Channels' },
  { label: 'Food & Drink', value: 'Coffee Maker, Mini Fridge, Bottled Water' },
  { label: 'Bathroom', value: 'Walk-in shower, Premium toiletries, Hair dryer' },
  ...extra,
  { label: 'Non-smoking', value: 'Yes' },
]

const NIGHTS = ['Thu, 7/9/2026', 'Fri, 7/10/2026', 'Sat, 7/11/2026']
const rNights = (a, b, c) => NIGHTS.map((date, i) => ({ date, roomsLeft: [a, b, c][i] }))
const gNights = (a, b, c, price) => NIGHTS.map((date, i) => ({ date, roomsLeft: [a, b, c][i], price }))

// Book Reservation — per-night rooms-left + per-room/night + stay total.
export const reserveRooms = [
  { roomType: 'Urban King', bedConfig: '1 King Bed', maxOccupancy: 2, imageCategories: ['rooms'], seed: 0, features: feat(), pricePerNight: 179, total: 573.0, roomCount: 1, availability: 'available', nights: rNights(5, 6, 5) },
  { roomType: 'Double Queen', bedConfig: '2 Queen Beds', maxOccupancy: 4, imageCategories: ['rooms'], seed: 1, features: feat([{ label: 'Need to know', value: 'Rollaway beds available on request' }]), pricePerNight: 199, total: 637.0, roomCount: 1, availability: 'limited', nights: rNights(3, 2, 1) },
  { roomType: 'Two-Room Suite King', bedConfig: '1 King Bed, Separate Living Room', maxOccupancy: 4, imageCategories: ['suites'], seed: 0, features: feat([{ label: 'Space', value: '620 sq ft, Sofa bed, Dining area' }, { label: 'Need to know', value: 'Complimentary evening reception' }]), pricePerNight: 269, total: 861.0, roomCount: 1, availability: 'available', nights: rNights(4, 4, 3) },
  { roomType: 'Deluxe King', bedConfig: '1 King Bed', maxOccupancy: 3, imageCategories: ['rooms'], seed: 6, features: feat([{ label: 'View', value: 'Pool or courtyard view' }]), pricePerNight: 209, total: 669.0, roomCount: 1, availability: 'available', nights: rNights(4, 5, 4) },
  { roomType: 'Accessible King', bedConfig: '1 King Bed', maxOccupancy: 2, imageCategories: ['rooms'], seed: 2, features: feat([{ label: 'Accessibility', value: 'Roll-in shower, Grab bars, Lowered fixtures' }]), pricePerNight: 189, total: 605.0, roomCount: 1, availability: 'soldout', nights: rNights(0, 0, 0) },
]

// Group Block — per-night rooms-left + price, quantity steppers.
export const groupRooms = [
  { roomType: 'Urban King', bedConfig: '1 King Bed', maxOccupancy: 2, imageCategories: ['rooms'], seed: 3, features: feat(), availability: 'available', nights: gNights(8, 10, 6, 179) },
  { roomType: 'Double Queen', bedConfig: '2 Queen Beds', maxOccupancy: 4, imageCategories: ['rooms'], seed: 4, features: feat([{ label: 'Need to know', value: 'Rollaway beds available on request' }]), availability: 'available', nights: gNights(6, 5, 7, 199) },
  { roomType: 'Two-Room Suite King', bedConfig: '1 King Bed, Separate Living Room', maxOccupancy: 4, imageCategories: ['suites'], seed: 1, features: feat([{ label: 'Space', value: '620 sq ft, Sofa bed, Dining area' }]), availability: 'limited', nights: gNights(2, 1, 3, 269) },
  { roomType: 'Deluxe King', bedConfig: '1 King Bed', maxOccupancy: 3, imageCategories: ['rooms'], seed: 6, features: feat([{ label: 'View', value: 'Pool or courtyard view' }]), availability: 'available', nights: gNights(5, 4, 6, 209) },
  { roomType: 'Accessible Queen', bedConfig: '1 Queen Bed', maxOccupancy: 2, imageCategories: ['rooms'], seed: 5, features: feat([{ label: 'Accessibility', value: 'Roll-in shower, Grab bars' }]), availability: 'soldout', nights: gNights(0, 0, 0, 189) },
]

export const policies = [
  // Property policies
  { title: 'Check-in', body: 'Check-in from 3:00 PM – 2:00 AM. Front desk staffed 24 hours. Photo ID and the credit card used for booking are required at check-in.' },
  { title: 'Check-out', body: 'Check-out before 11:00 AM. Late check-out may be available for a fee, subject to availability.' },
  { title: 'Children and extra beds', body: 'All children are welcome. Extra beds depend on the room you choose. When booking more than 5 rooms, different policies and additional supplements may apply.' },
  { title: 'Pets', body: 'Pets are welcome for a $50 per-stay fee (2 pets max, 50 lb limit). Service animals are exempt and always welcome.' },
  // Booking policies (GrandStay + hotel) — same set shown at checkout.
  { title: 'GrandStay Refund Policy', body: "All refunds are subject to GrandStay's standard refund terms. Approved refunds will be processed within 5–10 business days to the original form of payment. Refunds will not be issued for no-shows or early departures unless otherwise stated at the time of booking." },
  { title: 'GrandStay Cancellation Policy', body: "Reservations may be cancelled in accordance with GrandStay's cancellation guidelines. Standard cancellations must be submitted no later than 72 hours prior to the scheduled arrival date. Cancellations submitted after this window may be subject to a penalty equal to one night's room rate plus applicable taxes." },
  { title: 'Hotel Cancellation Policy', body: "Individual hotel cancellation policies apply and may supersede GrandStay's standard guidelines where more restrictive. Please review the property's specific cancellation terms, which are confirmed in your booking confirmation email." },
  { title: 'Deposit', body: "A deposit equal to the first night's room rate plus taxes will be charged to the credit card on file at the time of booking. The remaining balance will be charged upon check-in or as otherwise specified in your booking confirmation." },
  { title: 'Additional Policies & Amenities', body: 'Additional policies may apply based on the specific property, including but not limited to minimum night stay requirements, age restrictions, and occupancy limits. Amenity availability may vary by property and is subject to change without notice.' },
  { title: 'Amenities Notice', body: 'Amenities listed are subject to availability and may not be accessible at all times during your stay. Scheduled maintenance or seasonal closures may temporarily affect access to certain facilities. The hotel reserves the right to substitute comparable amenities when necessary.' },
  { title: 'Incidental Fees', body: "Hotels may require a credit card authorization hold for incidental charges upon check-in. The hold amount varies by property and will be released within 3–5 business days after check-out, provided no charges are incurred. GrandStay is not responsible for incidental charges assessed directly by the hotel." },
]

export const hotelBase = {
  name: 'Hilton Orlando Lake Buena Vista',
  stars: 4,
  address: '1751 Hotel Plaza Blvd, Lake Buena Vista, FL',
  distance: '2.4 mi from Main Arena',
  score: 4.5,
  reviews: 1284,
  ratingLabel: 'Excellent',
  preferred: true,
  lowRateGuarantee: true,
  checkInTime: '3:00 PM',
  checkOutTime: '11:00 AM',
  popularAmenities: popularAmenities(),
  galleryCategories: ['exterior', 'rooms', 'suites', 'pool', 'dining', 'bar', 'lobby', 'spa', 'bathroom'],
  seed: 0,
  about: [
    'In the heart of Lake Buena Vista, this resort is an ideal base for tournament weekends — minutes from the pitch, with top attractions, dining, and shopping just steps away. Relax in a newly renovated room after match day, unwind at the heated pool and full-service spa, or refuel at one of three on-site restaurants. Complimentary premium Wi-Fi, a 24-hour fitness centre, and free scheduled shuttle service round out a stay built for teams and families alike.',
    'Each of the 388 guest rooms and suites features a pillow-top bed, blackout curtains, a mini-fridge, and a dedicated work desk — with connecting rooms and quiet floors available on request for larger travelling parties. Rooms are refreshed daily, and rollaway beds and cribs can be added at no extra charge.',
    'Families and teams appreciate the flexible dining options, from a grab-and-go marketplace open around the clock to a full-service sports bar with big-screen coverage of the day\'s matches. The lobby lounge serves a complimentary hot breakfast each morning, and the concierge team can arrange group transportation, boxed lunches, and early check-in for teams arriving ahead of schedule.',
    'Outside, a resort-style pool deck, splash pad, and shaded cabanas give players and siblings space to recharge between games. On-site parking, EV charging, and a business centre are all available, and the property sits within a 15-minute drive of two regional airports, three championship-grade sports complexes, and a dozen family-friendly attractions.',
    'Pet-friendly rooms, ADA-accessible accommodations, and a 24-hour front desk ensure every member of your travelling party is comfortable from arrival to checkout.',
  ],
  amenityGroups: amenityGroups(),
  policies,
}
