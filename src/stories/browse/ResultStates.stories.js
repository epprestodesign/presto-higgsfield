// BROWSE HOTELS / Components / Results / Result States — Book Reservation.
// The hotel-list results column across its edge-case states: full list (all
// availability blocks), partial (few matches), no results (empty), error, and
// loading (skeleton).
import HotelListPage from '../../components/browse/HotelListPage.vue'
import PageFrame from '../../components/PageFrame.vue'

export default {
  title: 'Browse Hotels/Components/Results/Result States/Book Reservation',
  component: HotelListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Result States — Book Reservation
The Book Reservation hotel-list results in each state, driven by the
\`state\` prop on \`HotelListPage\`:

- **Full Results** — every availability block (matches · doesn't match filters · no availability) with firm line breaks.
- **Partial Results** — a few matches, then the fallback blocks dominate.
- **No Results** — empty state with guidance to adjust filters / dates.
- **Error** — results failed to load, with a retry action.
- **Loading** — skeleton placeholders that mirror the card layout.
` } } },
}

const page = (state) => () => ({
  components: { PageFrame, HotelListPage },
  setup: () => ({ state }),
  template: `<page-frame cart-mode="reserve"><hotel-list-page flow="reserve" :state="state" /></page-frame>`,
})

/** All availability blocks with firm line breaks. */
export const FullResults = { name: 'Full Results', render: page('full') }

/** A few matches, then mostly the "don't match" / "no availability" blocks. */
export const PartialResults = { name: 'Partial Results', render: page('partial') }

/** Empty state — nothing matches the search. */
export const NoResults = { name: 'No Results', render: page('empty') }

/** Results failed to load. */
export const Error = { name: 'Error', render: page('error') }

/** Skeleton placeholders while results load. */
export const Loading = { name: 'Loading', render: page('loading') }
