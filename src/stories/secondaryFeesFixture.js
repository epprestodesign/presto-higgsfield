// Shared secondary-custom-fee fixtures (DES-451…456) so every surface —
// Price Details, Reservation Summary, Checkout, Confirmation — demos the SAME
// three fees. Reusing one set is the point: it makes an inconsistency between
// two surfaces obvious in Storybook instead of only in production.
//
// Shape matches src/lib/secondaryFees.js: { name, basis, amount, total, description }
//
// Naming is deliberately literal — **Custom Fee 1 / 2 / 3**, the agreed
// terminology from the design request. Real organizers type their own labels
// ("Resort Fee", "Parking"), but the demo data stays positional so a reviewer
// can tell at a glance which fee slot they're looking at on every surface.
//
// Amounts mirror the design request: a $5/room-night fee on a four-night stay
// totalling $20, a flat per-reservation fee, and a second nightly fee.

export const CUSTOM_FEE_1 = {
  name: 'Custom Fee 1',
  basis: 'night',
  amount: 5,
  total: 20,
  description: 'Custom description for Custom Fee 1 — the organizer’s own copy explaining what this fee covers. Charged per room, per night, and collected at the time of booking.',
}

export const CUSTOM_FEE_2 = {
  name: 'Custom Fee 2',
  basis: 'reservation',
  amount: 15,
  total: 15,
  description: 'Custom description for Custom Fee 2. Charged once per reservation, regardless of the length of stay.',
}

export const CUSTOM_FEE_3 = {
  name: 'Custom Fee 3',
  basis: 'night',
  amount: 2,
  total: 8,
  description: 'Custom description for Custom Fee 3. Charged per room, per night.',
}

/** The design request's cap: exactly three. */
export const THREE_FEES = [CUSTOM_FEE_1, CUSTOM_FEE_2, CUSTOM_FEE_3]
/** Today's production behaviour — a single secondary fee. */
export const ONE_FEE = [CUSTOM_FEE_1]
export const TWO_FEES = [CUSTOM_FEE_1, CUSTOM_FEE_2]
/** Four configured fees; every surface must render only the first three. */
export const FOUR_FEES = [...THREE_FEES, { name: 'Custom Fee 4', basis: 'reservation', amount: 25, total: 25, description: 'Should never render — past the three-fee cap.' }]
/** Fees whose custom names were left blank → the "Custom Fee N" fallback label. */
export const UNNAMED_FEES = [
  { basis: 'night', amount: 5, total: 20, description: 'Organizer left the custom name blank.' },
  { basis: 'reservation', amount: 15, total: 15, description: 'Also unnamed — falls back to its position.' },
]

export const THREE_FEES_TOTAL = THREE_FEES.reduce((s, f) => s + f.total, 0) // 43
