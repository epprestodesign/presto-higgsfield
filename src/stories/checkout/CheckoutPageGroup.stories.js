// CHECKOUT EXPERIENCE / Checkout Page / Group Block — the group/team hold
// checkout (includes the group-details step). Two variants: with the teams block
// widget, and a plain block held without team assignment.
import { ref, computed } from 'vue'
import { loadImagery } from '../../lib/imagery'
import CheckoutPage from '../../components/checkout/CheckoutPage.vue'
import PageFrame from '../../components/PageFrame.vue'

const useHero = (category, seed) => {
  const img = ref('')
  loadImagery().then((lib) => { const arr = lib[category] || lib.rooms || []; if (arr[seed]) img.value = arr[seed].url })
  return img
}

export default {
  title: 'Checkout Experience/Group Block',
  component: CheckoutPage,
  // 'Mobile' is relocated to Checkout Experience/Mobile (CheckoutMobile.stories.js).
  excludeStories: ['Mobile'],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
The **Checkout Page** (Group Block) is the "Confirm and pay" flow with the
group-details step: a left stepped accordion beside a sticky **Order Summary**.
Group blocks are held (not charged): no payment step, booking protection, taxes,
fees, or totals — just the nightly rate per room. \`show-teams\` toggles the teams
block widget in the contact step.
` } } },
}

// Shared hold cart + summary for both variants.
const build = (showTeams) => () => ({
  components: { CheckoutPage, PageFrame },
  setup() {
    const img = useHero('suites', 1)
    const cart = {
      heldSeconds: 372,
      hotels: [
        { name: 'Embassy Suites Chicago Downtown', imageCategories: ['suites', 'rooms'], seed: 0, rooms: [
          // DES-90: nights held at differing nightly rates (weekend uplift) — the
          // rail breaks the cost out per night instead of a single "/nt" rate.
          { type: 'Two-Room Suite King', summary: '1 King Bed · Sleeps 4', nights: [{ date: 'Tue, Jun 23', qty: 4, roomsLeft: 6, price: 269 }, { date: 'Wed, Jun 24', qty: 1, roomsLeft: 5, price: 299 }] },
          { type: 'Two-Room Suite Double', summary: '2 Queen Beds · Sleeps 4', price: 289, nights: [{ date: 'Tue, Jun 23', qty: 1, roomsLeft: 5 }, { date: 'Wed, Jun 24', qty: 1, roomsLeft: 4 }] },
        ] },
        { name: 'The Concord Hotel', imageCategories: ['lobby', 'rooms'], seed: 2, rooms: [
          { type: 'King Studio', summary: '1 King Bed · Sleeps 2', price: 165, nights: [{ date: 'Tue, Jun 23', qty: 1, roomsLeft: 6 }] },
        ] },
      ],
    }
    const summary = computed(() => ({
      image: img.value,
      title: 'Group hold',
      subtitle: 'Embassy Suites + The Concord',
      rrow1: '8 rooms · 2 hotels',
      rows: [
        { label: 'Dates', value: 'Jun 23 – 25, 2026', change: true },
        { label: 'Rooms', value: '8 rooms · 2 hotels', change: true },
      ],
      note: 'Rooms held — finish before the timer ends',
    }))
    return { cart, summary, showTeams }
  },
  template: `<page-frame cart-mode="hold" brand="Secure Checkout" minimal-nav><checkout-page mode="group" :cart="cart" :summary="summary" :show-teams="showTeams" timer-top /></page-frame>`,
})

/** Group / team hold checkout — includes the teams block widget in the
 *  contact & group information step. */
export const Page = { name: 'Group Block w/ Team Block', render: build(true) }

/** A group block held without team assignment — the teams block widget is hidden
 *  (just the group block name + primary contact). */
export const NoTeamBlock = { name: 'Group Block', render: build(false) }

/** Mobile (390px) — single column: the stepped accordion, then the order summary
 *  below (rail no longer sticky); form fields stack; header actions wrap. */
export const Mobile = {
  name: 'Mobile (390)',
  tags: ['mobile'],
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: build(true),
}
