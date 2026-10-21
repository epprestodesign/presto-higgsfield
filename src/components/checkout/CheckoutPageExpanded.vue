<script setup>
// CheckoutPageExpanded — a fully-unfolded variant of CheckoutPage. Instead of
// the stepped accordion (one step open, "Next" advances), EVERY step is shown
// open at once with all of its fields in their input state, and the whole flow
// ends in ONE giant submit button (no per-step "Next"). Same data + rail as
// CheckoutPage; used for the "Checkout Experience Expanded" stories so the full
// set of checkout fields can be reviewed on a single page.
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import CartReview from '../CartReview.vue'
import HoldTimerPill from '../HoldTimerPill.vue'
import StepReviewOrder from './steps/StepReviewOrder.vue'
import StepContactInfo from './steps/StepContactInfo.vue'
import StepPayment from './steps/StepPayment.vue'
import StepReviewReservation from './steps/StepReviewReservation.vue'
import PoliciesAgreement from './PoliciesAgreement.vue'

const props = defineProps({
  mode: { type: String, default: 'group' },
  cart: { type: Object, default: () => ({}) },
  summary: { type: Object, default: () => ({}) },
  currency: { type: String, default: '$' },
  showTeams: { type: Boolean, default: true },
})

// "Time left to book" countdown, shown in the top strip and the floating pill.
const heldSecs = ref(props.cart.heldSeconds ?? 895)
const timerText = computed(() => `${Math.floor(heldSecs.value / 60)} min : ${String(heldSecs.value % 60).padStart(2, '0')} sec`)
let heldTimer = null

// The floating HoldTimerPill appears only once the top timer strip scrolls out
// of view, so the countdown stays visible down the long expanded form.
const topbar = ref(null)
const showPill = ref(false)
let observer = null

onMounted(() => {
  heldTimer = setInterval(() => { if (heldSecs.value > 0) heldSecs.value-- }, 1000)
  if (topbar.value && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { showPill.value = !entry.isIntersecting }, { threshold: 0 })
    observer.observe(topbar.value)
  }
})
onBeforeUnmount(() => { clearInterval(heldTimer); observer?.disconnect() })
const $q = useQuasar()

const isGroup = computed(() => props.mode === 'group')
const isMulti = computed(() => props.mode === 'reservations')
const cartMode = computed(() => (isGroup.value ? 'hold' : isMulti.value ? 'reservations' : 'reserve'))
const liveCart = reactive(JSON.parse(JSON.stringify(props.cart || {})))

// Contact step inputs derived from the cart (same as CheckoutPage).
const contactRooms = computed(() => {
  const n = liveCart.priceDetails?.rooms || 1
  const adults = liveCart.sleeps || 2
  return Array.from({ length: n }, () => ({ adults, children: 0 }))
})
const contactReservations = computed(() => (liveCart.hotels || []).map((h) => ({
  name: h.name,
  rooms: (h.rooms || []).map((r) => ({ adults: r.adults ?? 2, children: r.children ?? 0 })),
})))

const policyFlow = computed(() => (isGroup.value ? 'group' : 'reserve'))
const policyHotels = computed(() => {
  const hs = liveCart.hotels
  return (hs && hs.length) ? hs.map((h) => ({ name: h.name })) : [{}]
})

// Same step set as CheckoutPage — group drops payment, reservation drops the
// standalone Review-order step (the rail already shows the order).
const steps = computed(() => {
  const contact = { key: 'contact', label: isGroup.value ? 'Enter contact & group information' : 'Enter contact information' }
  const policies = { key: 'policies', label: 'Policies' }
  // Group blocks aren't charged (no "Protect your stay"), so Policies is the 3rd
  // step. Book Reservation keeps "Review your reservation" (protect) then Policies
  // as a distinct 4th step.
  return isGroup.value
    ? [{ key: 'review', label: 'Review order' }, contact, policies]
    : [contact, { key: 'payment', label: 'Add a payment method' }, { key: 'protect', label: 'Review your reservation' }, policies]
})

// Captured field state (kept so the components stay controlled).
const contact = ref({})
const payment = ref({})
const paymentLabel = computed(() => {
  const digits = (payment.value.cardNumber || '').replace(/\D/g, '')
  return digits.length >= 4 ? `Card ending ${digits.slice(-4)}` : 'Card details'
})
const contactSummary = computed(() => 'Contact details')

// DES-421: on phones the single column used to put the hotel preview + costs
// BELOW the whole form (after "Book Now"), so nothing could be reviewed before
// booking. The order rail now leads the page on phones for the individual flows.
// DES-424: the group flow already opens with a "Review order" STEP, so repeating
// the rail's order summary at the bottom is redundant — drop it on phones there.
const isPhone = computed(() => $q.screen.lt.sm)
const showRailOrder = computed(() => !(isGroup.value && isPhone.value))

const submitLabel = computed(() => (isGroup.value ? 'Hold Group Block Now' : 'Book Now'))
const confirm = () => $q.notify({ message: 'Reservation confirmed — a confirmation has been emailed.', icon: 'check_circle', color: 'grey-9', position: 'bottom', timeout: 3000 })
</script>

<template>
  <div class="ck">
    <!-- Time left to book — appended directly under the app bar as a full-width
         strip (instead of inside the rail), so the countdown reads as part of the
         "Secure Checkout" header. -->
    <div ref="topbar" class="ck__topbar">
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
      <!-- DES-410: reservation actions moved to the top of the page.
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
      <!-- LEFT: every step expanded, all fields in input state, no per-step Next -->
      <div class="ck__steps">
        <section v-for="(s, i) in steps" :key="s.key" class="ck__step is-open">
          <header class="ck__stephead">
            <span class="ck__num">{{ i + 1 }}</span>
            <span class="ck__steptitle">{{ s.label }}</span>
          </header>

          <div class="ck__body">
            <step-review-order v-if="s.key === 'review'" :mode="cartMode" :cart="liveCart" :currency="currency" bind flat room-delete />
            <step-contact-info v-else-if="s.key === 'contact'" :mode="mode" :show-teams="showTeams" :rooms="contactRooms" :reservations="isMulti ? contactReservations : null" v-model="contact" flat />
            <step-payment v-else-if="s.key === 'payment'" v-model="payment" flat />
            <step-review-reservation v-else-if="s.key === 'protect'" :contact-summary="contactSummary" :payment-label="paymentLabel" :total="summary.total" :currency="currency" :flow="policyFlow" :hotels="policyHotels" flat hide-policies />
            <policies-agreement v-else-if="s.key === 'policies'" :flow="policyFlow" :hotels="policyHotels" hide-cta />
          </div>
        </section>

        <!-- ONE giant submit for the whole flow -->
        <button type="button" class="ck__submit" @click="confirm">{{ submitLabel }}</button>
      </div>

      <!-- RIGHT: sticky order summary (same as CheckoutPage). On phones this
           leads the page for the individual flows (DES-421) and is dropped for
           group blocks, whose step 1 already reviews the order (DES-424). -->
      <aside v-if="showRailOrder" class="ck__railwrap" :class="{ 'ck__railwrap--lead': !isGroup }">
        <cart-review :mode="cartMode" :cart="liveCart" :currency="currency" readonly bind :show-requests="false" cards :order-title="(isGroup || isMulti) ? 'Review your order' : ''" />
      </aside>
    </div>
    </div>

    <!-- Floating countdown — appears once the top strip scrolls out of view. -->
    <hold-timer-pill v-if="showPill" :seconds="heldSecs" position="bottom-right" />
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

/* Time left to book — full-width strip appended under the app bar. Negative
   margins cancel the .ck padding so it bleeds edge-to-edge and sits flush to the
   "Secure Checkout" app bar; inner content aligns to the checkout column. */
.ck__topbar { margin: -12px -24px 16px; background: var(--ds-palette-blue-100); border-bottom: 1px solid var(--ds-palette-blue-200, #BFDBFE); color: var(--ds-palette-blue-800); }
/* max-width = the content column (--col where set, else 1040) + 24px padding each
   side, so the label and note line up exactly with "Confirm and pay" (.ck__inner)
   despite the full-bleed. --col lets the prototype (which widens .ck__inner to
   --col) stay aligned too. */
.ck__topbar-inner { max-width: calc(var(--col, 1040px) + 48px); margin: 0 auto; padding: 12px 24px; }
.ck__topbar-main { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ck__timer-label { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1rem; }
.ck__timer-clock { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 1.0625rem; }
.ck__timer-note { margin: 4px 0 0; font-size: 0.875rem; line-height: 1.4; }

/* Reservation actions — Edit / Start over (now in the page header, DES-410) */
.ck__railbtn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 46px; border: 1px solid var(--ds-color-border-brand); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: var(--ds-color-text-brand); font-family: inherit; font-weight: 700; font-size: 0.9375rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.ck__railbtn:hover { background: var(--ds-palette-navy-50); }
.ck__railbtn--ghost { border-color: var(--ds-color-border-bold); color: var(--ds-color-text); }
.ck__railbtn--ghost:hover { background: var(--ds-palette-slate-100); }
.ck__railwrap { position: sticky; top: 20px; }

.ck__step { background: var(--ds-color-surface); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); padding: 18px 20px; margin-bottom: 16px; }
.ck__stephead { display: flex; align-items: center; gap: 12px; }
.ck__num { width: 26px; height: 26px; border-radius: 50%; background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; flex: none; }
.ck__steptitle { flex: 1; font-weight: 700; color: var(--ds-color-text); }
.ck__body { margin-top: 18px; }

/* One giant submit for the whole expanded flow. */
.ck__submit { width: 100%; height: 60px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-size: 1.125rem; font-weight: 700; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.ck__submit:hover { background: var(--ds-palette-navy-800); }

/* Collapse to one column below 880. minmax(0,1fr) + min-width:0 let the column
   shrink to the viewport instead of stretching to a child's min-content (which
   caused horizontal scroll on phones). */
@media (max-width: 880px) {
  .ck__grid { grid-template-columns: minmax(0, 1fr); }
  .ck__steps, .ck__railwrap { min-width: 0; }
}
/* Phones: tighter gutters; the order-summary rail LEADS the page (DES-421) so the
   hotel preview and costs are reviewable before the form, not stranded after the
   submit button. */
@media (max-width: 600px) {
  .ck { padding: 12px 16px 32px; }
  .ck__railwrap { position: static; }
  .ck__railwrap--lead { order: -1; }
  .ck__headeractions { width: 100%; }
  .ck__headeractions .ck__railbtn { flex: 1; }
  .ck__step { padding: 16px; }
  .ck__grid { gap: 20px; }
  /* Match the 16px mobile gutter so the bleeding top bar doesn't overflow. */
  .ck__topbar { margin-inline: -16px; }
  .ck__topbar-inner { padding: 12px 16px; }
}
</style>
