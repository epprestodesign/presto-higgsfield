// Sample room-type availability data for the Hotel Card availability carousel.
// Deliberately spans a range of states: plenty, moderate, only-N-left, partial
// sold-out (some nights 0), fully sold out, and one-left.
export const sampleRooms = [
  { type: 'King Bed - Room, 1 King Bed', nightly: 100, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 100 }, { date: 'Wed, 6/16/2027', roomsLeft: 100 },
    { date: 'Thu, 6/17/2027', roomsLeft: 85 }, { date: 'Fri, 6/18/2027', roomsLeft: 60 },
  ] },
  { type: 'Double Queen - Room, 2 Queen Beds', nightly: 120, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 12 }, { date: 'Wed, 6/16/2027', roomsLeft: 8 },
    { date: 'Thu, 6/17/2027', roomsLeft: 15 }, { date: 'Fri, 6/18/2027', roomsLeft: 6 },
  ] },
  { type: 'Junior Suite - 1 King Bed, Sofa', nightly: 175, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 3 }, { date: 'Wed, 6/16/2027', roomsLeft: 2 },
    { date: 'Thu, 6/17/2027', roomsLeft: 1 }, { date: 'Fri, 6/18/2027', roomsLeft: 4 },
  ] },
  { type: 'Accessible King - Room, 1 King Bed', nightly: 105, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 5 }, { date: 'Wed, 6/16/2027', roomsLeft: 0 },
    { date: 'Thu, 6/17/2027', roomsLeft: 3 }, { date: 'Fri, 6/18/2027', roomsLeft: 0 },
  ] },
  { type: 'Standard Twin - Room, 2 Twin Beds', nightly: 95, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 0 }, { date: 'Wed, 6/16/2027', roomsLeft: 0 },
    { date: 'Thu, 6/17/2027', roomsLeft: 0 }, { date: 'Fri, 6/18/2027', roomsLeft: 0 },
  ] },
  { type: 'Executive Suite - 1 King Bed', nightly: 260, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 1 }, { date: 'Wed, 6/16/2027', roomsLeft: 1 },
    { date: 'Thu, 6/17/2027', roomsLeft: 1 }, { date: 'Fri, 6/18/2027', roomsLeft: 2 },
  ] },
  { type: 'Deluxe King - Room, 1 King Bed', nightly: 140, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 22 }, { date: 'Wed, 6/16/2027', roomsLeft: 18 },
    { date: 'Thu, 6/17/2027', roomsLeft: 25 }, { date: 'Fri, 6/18/2027', roomsLeft: 14 },
  ] },
  { type: 'Family Suite - 2 Queen Beds, Bunk', nightly: 210, nights: [
    { date: 'Tue, 6/15/2027', roomsLeft: 9 }, { date: 'Wed, 6/16/2027', roomsLeft: 4 },
    { date: 'Thu, 6/17/2027', roomsLeft: 7 }, { date: 'Fri, 6/18/2027', roomsLeft: 5 },
  ] },
]
