// Secondary custom fees (DES-451…456) — the one place the "up to three" rule and
// the guest-facing formatting live, so every surface that shows fees agrees:
//
//   • Price details pop-up   → PriceDetailsDialog
//   • Reservation summary    → CartReview (checkout rail + cart fly-out)
//   • Checkout order summary → OrderSummary
//   • Confirmation totals    → ConfirmationPage
//
// Organizers configure these at the event level and the event hotel level (that
// admin UI is a different app — see DES-451/452). Here we only care about the
// shape that reaches the booking site:
//
//   { name, basis, amount, total, description }
//
//   name        custom label; blank falls back to "Custom Fee N"
//   basis       'night' (per room night) | 'reservation' (flat, once)
//   amount      the configured rate — $5/night, or $15 per reservation
//   total       the calculated charge the guest actually sees
//   description custom copy; shown in the policies list and the row tooltip
//
// Guests see the calculated `total` only — never the rate — matching the live
// booking site. The rate lives in the tooltip alongside the description.

/** Hard cap from the design request. Three fees, no more. */
export const MAX_SECONDARY_FEES = 3

const round2 = (n) => Math.round(n * 100) / 100

/**
 * Derive a fee's charge when the caller didn't precompute it.
 * 'night' fees multiply by room-nights; 'reservation' fees are charged once.
 */
export function feeTotal(fee, { nights = 1, rooms = 1 } = {}) {
  if (fee?.total != null) return round2(fee.total)
  const amount = Number(fee?.amount ?? 0)
  return round2(fee?.basis === 'night' ? amount * nights * rooms : amount)
}

/**
 * Normalize whatever the caller passed into at most three display-ready fees.
 * Anything past the third is dropped — the cap is enforced here rather than in
 * each template, so no surface can drift out of sync with the others.
 */
export function normalizeSecondaryFees(fees, ctx = {}) {
  if (!Array.isArray(fees)) return []
  return fees.slice(0, MAX_SECONDARY_FEES).map((f, i) => ({
    // Blank custom name → the positional label. "Custom Fee N" is the agreed
    // terminology across design, Linear, and the booking site — keep it exact.
    name: (f?.name || '').trim() || `Custom Fee ${i + 1}`,
    basis: f?.basis === 'reservation' ? 'reservation' : 'night',
    amount: Number(f?.amount ?? 0),
    total: feeTotal(f, ctx),
    description: f?.description || '',
  }))
}

/** Sum of the (capped) fees — what rolls into Due Today. */
export function secondaryFeesTotal(fees, ctx = {}) {
  return round2(normalizeSecondaryFees(fees, ctx).reduce((sum, f) => sum + f.total, 0))
}

/**
 * Tooltip copy for a fee row: how the charge was calculated, then the organizer's
 * own description. Returns '' when there is nothing worth hovering for.
 */
export function feeTooltip(fee, { currency = '$' } = {}) {
  if (!fee) return ''
  const parts = []
  const amount = Number(fee.amount ?? 0)
  if (amount > 0) {
    const money = currency + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    parts.push(fee.basis === 'night' ? `${money} per room night` : `${money} per reservation`)
  }
  if (fee.description) parts.push(fee.description)
  return parts.join(' — ')
}

/**
 * Fee descriptions as policy items ({ title, body }), for the Reservation
 * Policies list and the confirmation Policies card — where the live booking site
 * surfaces them today. Fees with no description are skipped.
 */
export function feePolicyItems(fees, ctx = {}) {
  return normalizeSecondaryFees(fees, ctx)
    .filter((f) => f.description)
    .map((f) => ({ title: f.name, body: f.description }))
}
