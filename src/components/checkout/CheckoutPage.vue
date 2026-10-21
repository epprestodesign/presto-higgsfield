<script setup>
// CheckoutPage — Airbnb-style "Confirm and pay": a left stepped accordion (one
// step open at a time; Next advances, completed steps collapse with an Edit)
// beside a sticky OrderSummary rail. Four steps:
//   1 Review order  2 Contact & group info  3 Payment  4 Review reservation
// `mode` ('group' | 'reservation' | 'reservations') toggles the group-details
// step, the cart body, and the contact form (single vs grouped-by-hotel guests).
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import CartReview from '../CartReview.vue'
import HoldTimerPill from '../HoldTimerPill.vue'
import StepReviewOrder from './steps/StepReviewOrder.vue'
import StepContactInfo from './steps/StepContactInfo.vue'
import StepPayment from './steps/StepPayment.vue'
import StepReviewReservation from './steps/StepReviewReservation.vue'

const props = defineProps({
  mode: { type: String, default: 'group' },
  cart: { type: Object, default: () => ({}) },
  summary: { type: Object, default: () => ({}) },
  currency: { type: String, default: '$' },
  // Group flow: render the teams block widget in the contact step.
  showTeams: { type: Boolean, default: true },
  // Opt-in: show "Time left to book" as a full-width strip under the app bar
  // (plus a floating pill on scroll) instead of inside the rail. Off by default
  // so the live checkout keeps the rail timer.
  timerTop: { type: Boolean, default: false },
})

// "Time left to book" countdown — rail timer by default, or the top strip +
// floating pill when `timerTop`.
const heldSecs = ref(props.cart.heldSeconds ?? 895)
const timerText = computed(() => `${Math.floor(heldSecs.value / 60)} min : ${String(heldSecs.value % 60).padStart(2, '0')} sec`)
let heldTimer = null

// `timerTop` only: the floating pill appears once the top strip scrolls away.
const topbar = ref(null)
const showPill = ref(false)
let observer = null

onMounted(() => {
  heldTimer = setInterval(() => { if (heldSecs.value > 0) heldSecs.value-- }, 1000)
  if (props.timerTop && topbar.value && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { showPill.value = !entry.isIntersecting }, { threshold: 0 })
    observer.observe(topbar.value)
  }
})
onBeforeUnmount(() => { clearInterval(heldTimer); observer?.disconnect() })
const $q = useQuasar()
const isGroup = computed(() => props.mode === 'group')
const isMulti = computed(() => props.mode === 'reservations') // multiple room reservations
// The cart fly-out modes; reuse the same CartReview body here.
const cartMode = computed(() => (isGroup.value ? 'hold' : isMulti.value ? 'reservations' : 'reserve'))
// One shared, editable copy so the Review-order step and the rail's Price
// details stay in sync as quantities change.
const liveCart = reactive(JSON.parse(JSON.stringify(props.cart || {})))

// Contact step inputs derived from the cart:
//  - single reservation → a flat list of rooms (occupancy from the cart)
//  - multiple reservations → grouped by reservation/hotel
const contactRooms = computed(() => {
  const n = liveCart.priceDetails?.rooms || 1
  const adults = liveCart.sleeps || 2
  return Array.from({ length: n }, () => ({ adults, children: 0 }))
})
const contactReservations = computed(() => (liveCart.hotels || []).map((h) => ({
  name: h.name,
  rooms: (h.rooms || []).map((r) => ({ adults: r.adults ?? 2, children: r.children ?? 0 })),
})))

// Policies step: group/multi → per-hotel accordion; single reservation → one
// generic card. Group flow → "Hold Group Block Now"; else "Book Now".
const policyFlow = computed(() => (isGroup.value ? 'group' : 'reserve'))
// DES-454: carry each hotel's secondary custom fees through so their descriptions
// land in the policies list. Single reservations keep their fees on
// `cart.priceDetails`, multi-hotel carts on each hotel.
const policyHotels = computed(() => {
  const hs = liveCart.hotels
  return (hs && hs.length)
    ? hs.map((h) => ({ name: h.name, secondaryFees: h.secondaryFees ?? liveCart.secondaryFees }))
    : [{ secondaryFees: liveCart.priceDetails?.secondaryFees ?? liveCart.secondaryFees }]
})

// Group blocks are held, not charged — no payment step. Reservation flows keep
// payment but drop the "Review order" step (the rail already shows the order).
const steps = computed(() => {
  const contact = { key: 'contact', label: isGroup.value ? 'Enter contact & group information' : 'Enter contact information' }
  const final = { key: 'final', label: 'Review your reservation' }
  return isGroup.value
    ? [{ key: 'review', label: 'Review order' }, contact, final]
    : [contact, { key: 'payment', label: 'Add a payment method' }, final]
})

const current = ref(1)
const furthest = ref(1)
const stepState = (n) => (n === current.value ? 'open' : n <= furthest.value ? 'done' : 'upcoming')
const goEdit = (n) => { if (n <= furthest.value) current.value = n }
const next = () => { furthest.value = Math.max(furthest.value, current.value + 1); current.value = Math.min(current.value + 1, steps.value.length) }

// State captured across steps.
const contact = ref({})
// Payment is the inline card + billing form (credit card only; no dialogs).
const payment = ref({})
const paymentLabel = computed(() => {
  const digits = (payment.value.cardNumber || '').replace(/\D/g, '')
  return digits.length >= 4 ? `Card ending ${digits.slice(-4)}` : 'Card details'
})
const contactSummary = computed(() => {
  const c = contact.value || {}
  if (isGroup.value) {
    const n = c.teams?.length || 0
    const lead = [c.contact?.firstName, c.contact?.lastName].filter(Boolean).join(' ')
    return `${n} team${n === 1 ? '' : 's'}${lead ? ` · ${lead}` : ''}`
  }
  // reservation / reservations: ReservationGuests emits an array of room guests.
  const arr = Array.isArray(c) ? c : []
  const lead = arr[0] ? [arr[0].firstName, arr[0].lastName].filter(Boolean).join(' ') : ''
  const n = arr.length
  return lead ? `${lead}${n > 1 ? ` · ${n} guests` : ''}` : 'Contact details'
})

// DES-421: on phones the single column used to strand the hotel preview + costs
// below the whole form, so the order rail now leads the page for the individual
// flows. DES-424: the group flow opens with a "Review order" STEP, so repeating
// the order summary further down is redundant — drop it on phones there.
const isPhone = computed(() => $q.screen.lt.sm)
const showRailOrder = computed(() => !(isGroup.value && isPhone.value))
// The rail also carries the countdown when it isn't shown as the top strip; keep
// the aside mounted in that case even when its order summary is hidden.
const showRail = computed(() => showRailOrder.value || !props.timerTop)

const confirm = () => $q.notify({ message: 'Reservation confirmed — a confirmation has been emailed.', icon: 'check_circle', color: 'grey-9', position: 'bottom', timeout: 3000 })
</script>

<template>
  <div class="ck">
    <!-- Opt-in: "Time left to book" appended under the app bar as a full-width strip. -->
    <div v-if="timerTop" ref="topbar" class="ck__topbar">
      <div class="ck__topbar-inner">
        <div class="ck__topbar-main">
          <span class="ck__timer-label"><q-icon name="timer" size="18px" /> Time left to book</span>
          <span class="ck__timer-clock">{{ timerText }}</span>
        </div>
        <p class="ck__timer-note">Book before the timer runs out to secure this rate. If the timer expires, you'll need to run your search again.</p>
      </div>
    </div>

    <div class="ck__inner">
    <div class="ck__header">
      <h1 class="ck__h1">Confirm and pay</h1>
      <!-- DES-410: reservation actions moved to the top of the page so the user
           can jump back to earlier workflow steps easily.
           DES-424: the group block's "View Additional Hotels" joins them here,
           matching where the individual flow puts its workflow actions. -->
      <div class="ck__headeractions">
        <template v-if="!isGroup">
          <button type="button" class="ck__railbtn"><q-icon name="edit" size="18px" /> Edit reservation</button>
          <button type="button" class="ck__railbtn ck__railbtn--ghost"><q-icon name="restart_alt" size="18px" /> Start over</button>
        </template>
        <button v-else type="button" class="ck__railbtn"><q-icon name="add" size="18px" /> View Additional Hotels</button>
      </div>
    </div>

    <div class="ck__grid">
      <!-- LEFT: stepped accordion -->
      <div class="ck__steps">
        <section v-for="(s, i) in steps" :key="s.key" class="ck__step" :class="`is-${stepState(i + 1)}`">
          <header class="ck__stephead" @click="stepState(i + 1) === 'done' && goEdit(i + 1)">
            <span class="ck__num"><q-icon v-if="stepState(i + 1) === 'done'" name="check" size="16px" /><template v-else>{{ i + 1 }}</template></span>
            <span class="ck__steptitle">{{ s.label }}</span>
            <button v-if="stepState(i + 1) === 'done'" class="ck__edit" @click.stop="goEdit(i + 1)">Edit</button>
          </header>

          <!-- collapsed summary -->
          <div v-if="stepState(i + 1) === 'done'" class="ck__summary">
            <template v-if="s.key === 'review'">{{ summary.rrow1 || 'Order reviewed' }}</template>
            <template v-else-if="s.key === 'contact'">{{ contactSummary }}</template>
            <template v-else-if="s.key === 'payment'">{{ paymentLabel }}</template>
          </div>

          <!-- open content — each step is its own component -->
          <div v-if="stepState(i + 1) === 'open'" class="ck__body">
            <step-review-order v-if="s.key === 'review'" :mode="cartMode" :cart="liveCart" :currency="currency" bind room-delete @next="next" />
            <step-contact-info v-else-if="s.key === 'contact'" :mode="mode" :show-teams="showTeams" :rooms="contactRooms" :reservations="isMulti ? contactReservations : null" v-model="contact" @next="next" />
            <step-payment v-else-if="s.key === 'payment'" v-model="payment" @next="next" />
            <step-review-reservation v-else :contact-summary="contactSummary" :payment-label="paymentLabel" :total="summary.total" :currency="currency" :flow="policyFlow" :hotels="policyHotels" @confirm="confirm" />
          </div>
        </section>
      </div>

      <!-- RIGHT: sticky order summary — recycles the cart body; price details
           split into its own card. The order is always fully expanded. -->
      <aside v-if="showRail" class="ck__railwrap" :class="{ 'ck__railwrap--lead': !isGroup }">
        <cart-review v-if="showRailOrder" :mode="cartMode" :cart="liveCart" :currency="currency" readonly bind :show-requests="false" cards :order-title="(isGroup || isMulti) ? 'Review your order' : ''" />

        <!-- Time left to book — the held-rooms countdown, under the price details
             (hidden when the timer is shown as the top strip instead). -->
        <div v-if="!timerTop" class="ck__timer">
          <div class="ck__timer-row">
            <span class="ck__timer-label"><q-icon name="timer" size="18px" /> Time left to book</span>
            <span class="ck__timer-clock">{{ timerText }}</span>
          </div>
          <p class="ck__timer-note">Book before the timer runs out to secure this rate. If the timer expires, you'll need to run your search again.</p>
        </div>

      </aside>
    </div>
    </div>

    <!-- `timerTop` only: floating countdown once the top strip scrolls out of view. -->
    <hold-timer-pill v-if="timerTop && showPill" :seconds="heldSecs" position="bottom-right" />
  </div>
</template>

<style scoped>
.ck { background: var(--ds-palette-neutral-100); min-height: 100vh; padding: 12px 24px 40px; }
.ck__inner { max-width: 1040px; margin: 0 auto; }
.ck__header { display: flex; align-items: center; justify-content: space-between; gap: 12px 16px; flex-wrap: wrap; margin-bottom: 14px; }
.ck__h1 { font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--ds-color-text); }
/* DES-410: reservation actions in the page header (auto-width, right-aligned). */
.ck__headeractions { display: flex; gap: 10px; }
.ck__headeractions .ck__railbtn { flex: none; padding: 0 18px; }
.ck__grid { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }

/* Opt-in (timerTop): full-width strip appended under the app bar. Negative
   margins cancel the .ck padding so it bleeds edge-to-edge; inner content aligns
   to the checkout column. */
.ck__topbar { margin: -12px -24px 16px; background: var(--ds-palette-blue-100); border-bottom: 1px solid var(--ds-palette-blue-200, #BFDBFE); color: var(--ds-palette-blue-800); }
/* max-width = the content column (--col where set, else 1040) + 24px padding each
   side, so the label and note line up with "Confirm and pay" (.ck__inner) despite
   the full-bleed — and the prototype (which widens .ck__inner to --col) too. */
.ck__topbar-inner { max-width: calc(var(--col, 1040px) + 48px); margin: 0 auto; padding: 12px 24px; }
.ck__topbar-main { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ck__topbar .ck__timer-label { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1rem; }
.ck__topbar .ck__timer-clock { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 1.0625rem; }
.ck__topbar .ck__timer-note { margin: 4px 0 0; font-size: 0.875rem; line-height: 1.4; }

/* Time left to book — held-rooms countdown under the rail's price details. */
.ck__timer { margin-top: 16px; background: var(--ds-palette-blue-100); border: 1px solid var(--ds-palette-blue-200, #BFDBFE); border-radius: var(--ds-radius-lg); padding: 16px 20px; color: var(--ds-palette-blue-800); }
.ck__timer-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ck__timer-label { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1rem; }
.ck__timer-clock { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 1.0625rem; }
.ck__timer-note { margin: 8px 0 0; font-size: 0.9375rem; line-height: 1.45; }

/* Reservation actions — Edit / Start over (now in the page header, DES-410) */
.ck__railbtn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 46px; border: 1px solid var(--ds-color-border-brand); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: var(--ds-color-text-brand); font-family: inherit; font-weight: 700; font-size: 0.9375rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.ck__railbtn:hover { background: var(--ds-palette-navy-50); }
.ck__railbtn--ghost { border-color: var(--ds-color-border-bold); color: var(--ds-color-text); }
.ck__railbtn--ghost:hover { background: var(--ds-palette-slate-100); }
/* DES-411: group-block "View Additional Hotels" — sits above the order rail. */
.ck__rail { position: sticky; top: 20px; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); overflow: hidden; box-shadow: var(--ds-shadow-1); background: var(--ds-color-surface); }
.ck__railwrap { position: sticky; top: 20px; }

.ck__step { background: var(--ds-color-surface); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); padding: 18px 20px; margin-bottom: 16px; }
.ck__step.is-upcoming { opacity: 0.5; }
.ck__stephead { display: flex; align-items: center; gap: 12px; }
.ck__step.is-done .ck__stephead { cursor: pointer; }
.ck__num { width: 26px; height: 26px; border-radius: 50%; background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; flex: none; }
.ck__step.is-upcoming .ck__num { background: var(--ds-palette-slate-300); }
.ck__steptitle { flex: 1; font-weight: 700; color: var(--ds-color-text); }
.ck__edit { background: none; border: 0; padding: 0; color: var(--ds-color-text); font-weight: 600; text-decoration: underline; cursor: pointer; }
.ck__summary { color: var(--ds-color-text-subtle); font-size: 0.9375rem; margin: 8px 0 0 38px; }
.ck__body { margin-top: 18px; }

@media (max-width: 880px) {
  .ck__grid { grid-template-columns: minmax(0, 1fr); }
  .ck__steps, .ck__railwrap { min-width: 0; }
}
/* Phones: tighter gutters; the order-summary rail flows below the steps (not
   sticky) once stacked. */
@media (max-width: 600px) {
  .ck { padding: 12px 16px 32px; }
  .ck__railwrap { position: static; }
  /* DES-421: the order summary leads the page so the hotel preview and costs can
     be reviewed before the form rather than after the submit button. */
  .ck__railwrap--lead { order: -1; }
  .ck__headeractions { width: 100%; }
  .ck__headeractions .ck__railbtn { flex: 1; }
  .ck__step { padding: 16px; }
  .ck__grid { gap: 20px; }
  /* The timer top bar bleeds to the page edge; match the 16px mobile gutter so
     it doesn't overflow the viewport (was -24px, causing horizontal scroll). */
  .ck__topbar { margin-inline: -16px; }
  .ck__topbar-inner { padding: 12px 16px; }
}
</style>
