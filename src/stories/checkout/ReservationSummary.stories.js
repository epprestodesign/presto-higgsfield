// CHECKOUT / Reservation Summary — the shared summary body (CartReview in its
// read-only "rail" configuration). This is the component the design request calls
// the *reservation summary*: it is reused by the checkout right rail, the nav
// cart fly-out, and the Review-order step, so a fee change here carries
// everywhere at once (DES-456).
import CartReview from '../../components/CartReview.vue'
import { ONE_FEE, TWO_FEES, THREE_FEES, FOUR_FEES, THREE_FEES_TOTAL } from '../secondaryFeesFixture'

// The four-night, $100/night single reservation from the design request.
// `lines` selects CartReview's itemized layout — the same rows the live
// reservation summary shows (check-in/out → nights → taxes).
const ROOM_COST = 420
const baseCart = {
  hotelName: 'Quality Suites Hotel',
  imageCategories: ['suites', 'rooms'],
  seed: 3,
  roomType: 'Two Queen Beds — Accessible, Non Smoking',
  bedConfig: '2 Queen Beds',
  sleeps: 4,
  checkIn: { date: '05/31/2027', time: '3:00pm' },
  checkOut: { date: '06/04/2027', time: '11:00am' },
  nights: 4,
}

/** Build a cart whose Due Today already includes the fees — they're charged at
 *  booking, so the summary's arithmetic has to reflect that. */
const cartWith = (fees) => {
  const feesTotal = (fees || []).slice(0, 3).reduce((s, f) => s + f.total, 0)
  return {
    ...baseCart,
    priceDetails: {
      nights: 4,
      rooms: 1,
      rate: 100,
      subtotal: ROOM_COST,
      lines: [
        { label: 'Check In', value: 'Mon, 5/31/2027', text: true },
        { label: 'Check Out', value: 'Fri, 6/4/2027', text: true },
        { label: 'Mon, 5/31/2027', value: 100 },
        { label: 'Tue, 6/1/2027', value: 100 },
        { label: 'Wed, 6/2/2027', value: 100 },
        { label: 'Thu, 6/3/2027', value: 100 },
        { label: 'Taxes', value: 0 },
      ],
      secondaryFees: fees,
      subtotals: [
        { label: 'Room Cost', value: ROOM_COST },
        { label: 'Due Today', value: feesTotal },
      ],
      balanceDue: ROOM_COST,
    },
  }
}

export default {
  title: 'Checkout Experience/Components/Reservation Summary',
  component: CartReview,
  tags: ['autodocs', 'new'],
  parameters: { docs: { description: { component: `
## Reservation Summary

The shared summary body — hotel, room, stay dates, then the itemized price
breakdown. Rendered read-only here, exactly as the checkout right rail and the
cart fly-out render it, which is why DES-456 fixes the fee display **once** and
every consumer inherits it.

### Secondary custom fees (DES-456)
Up to **three** named fees sit below the nightly rows and Taxes. Each shows its
calculated charge; the rate (*per room night* / *per reservation*) and the
organizer's description are on the ⓘ.

Fees are **charged at booking**, so they land in **Due Today** while the room cost
becomes **Balance due** — the three-fee example bills $${THREE_FEES_TOTAL}.00 now
and leaves $${ROOM_COST}.00 owed at the property.

> **Arithmetic is caller-owned.** The component renders \`subtotals\` as given; it
> never re-adds the fees. Use \`secondaryFeesTotal()\` from
> \`src/lib/secondaryFees.js\` when building them so the two can't drift.
` } } },
}

const render = (fees) => () => ({
  components: { CartReview },
  setup: () => ({ cart: cartWith(fees) }),
  template: `<div style="max-width:420px"><cart-review mode="reserve" :cart="cart" readonly cards :show-requests="false" /></div>`,
})

/** No fees configured — the summary as it was before DES-456. */
export const NoFees = { name: 'No Fees', render: render(null) }

/** One fee — today's production behaviour. */
export const OneFee = { name: 'One Fee', render: render(ONE_FEE) }

/** Two fees. */
export const TwoFees = { name: 'Two Fees', render: render(TWO_FEES) }

/** Three fees — the maximum, and the case the request is really about. */
export const ThreeFees = { name: 'Three Fees (Max)', render: render(THREE_FEES) }

/** Four configured: only the first three render. */
export const FourConfigured = { name: 'Four Configured (Capped at 3)', render: render(FOUR_FEES) }
