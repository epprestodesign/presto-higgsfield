// HOTEL DETAILS / Price Details — the breakdown modal opened from a reserve room
// card's "Price Details ›" link. DES-453: it now renders up to three secondary
// custom fees between Taxes and the total.
import { ref } from 'vue'
import PriceDetailsDialog from '../../components/details/PriceDetailsDialog.vue'
import { ONE_FEE, TWO_FEES, THREE_FEES, FOUR_FEES, UNNAMED_FEES } from '../secondaryFeesFixture'

// The four-night, $100/night stay from the design request's screenshots.
const room = {
  roomCount: 1,
  pricePerNight: 100,
  hotelFee: 0,
  taxes: 0,
  nights: [
    { date: 'Mon, 5/31/2027' },
    { date: 'Tue, 6/1/2027' },
    { date: 'Wed, 6/2/2027' },
    { date: 'Thu, 6/3/2027' },
  ],
}

export default {
  title: 'Hotel Details/Components/Book Reservation/Price Details',
  component: PriceDetailsDialog,
  tags: ['autodocs', 'new'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Price Details

The breakdown modal behind **Price Details ›** on a Book Reservation room card:
per-night line items → hotel fee → taxes → **secondary custom fees** → total, and
a Reserve Room CTA.

### Secondary custom fees (DES-453)
Organizers configure up to **three** fees, at the event level or the event hotel
level. Each has a custom name, a dollar amount, a basis (*per room night* or
*per reservation*), and a custom description.

Guests see the **calculated charge only** — matching the live booking site. The
rate and the description live on the ⓘ tooltip, so a $5/night fee on a four-night
stay reads simply as **$20.00**.

The three-fee cap is enforced in \`src/lib/secondaryFees.js\`, not in this
template, so every surface that shows fees agrees. See *Four Configured* below:
the fourth fee never renders.
` } },
  },
}

const render = (fees) => () => ({
  components: { PriceDetailsDialog },
  setup: () => ({ open: ref(true), room, fees }),
  template: `<div style="min-height:640px"><price-details-dialog v-model="open" :room="room" :secondary-fees="fees" /></div>`,
})

/** No secondary fees configured — the breakdown as it was before DES-453. */
export const NoFees = { name: 'No Fees', render: render(null) }

/** One fee — today's production behaviour ($5 × 4 nights = $20). */
export const OneFee = { name: 'One Fee', render: render(ONE_FEE) }

/** Two fees — one per-night, one flat per-reservation. */
export const TwoFees = { name: 'Two Fees', render: render(TWO_FEES) }

/** Three fees — the maximum the design request allows. */
export const ThreeFees = { name: 'Three Fees (Max)', render: render(THREE_FEES) }

/** Four configured: the cap holds and only the first three render. */
export const FourConfigured = { name: 'Four Configured (Capped at 3)', render: render(FOUR_FEES) }

/** Blank custom name → the "Custom Fee N" fallback label. */
export const UnnamedFee = { name: 'Unnamed Fee (Fallback Label)', render: render(UNNAMED_FEES) }
