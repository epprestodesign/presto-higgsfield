<script setup>
// Checkout step 4 — Review your reservation. Recap + "Protect your stay"
// selection + cancellation policy, then Confirm and pay (gated on choosing a
// protection option, mirroring the Expedia flow).
import { ref } from 'vue'
import PoliciesAgreement from '../PoliciesAgreement.vue'

const props = defineProps({
  contactSummary: { type: String, default: '' },
  paymentLabel: { type: String, default: '' },
  total: { type: Number, default: 0 },
  currency: { type: String, default: '$' },
  // Policies agreement (final gate + CTA). flow: 'reserve' | 'group'.
  flow: { type: String, default: 'reserve' },
  hotels: { type: Array, default: () => [{}] },
  // Expanded layout: hide the Policies CTA (the page uses one submit at the end).
  flat: { type: Boolean, default: false },
  // Expanded layout: render only "Protect your stay" (Policies moves to its own step).
  hidePolicies: { type: Boolean, default: false },
  // Enhanced Booking Protection (Vertical Insure): the coverage price + the
  // covered-reason tiles shown above the accept/decline options.
  protectionPrice: { type: Number, default: 20.66 },
  coveredReasons: { type: Array, default: () => ([
    { icon: 'monitor_heart', label: 'Injury or Illness' },
    { icon: 'work', label: 'Job Loss' },
    { icon: 'thunderstorm', label: 'Severe Weather' },
    { icon: 'directions_car', label: 'Car Breakdown' },
    { icon: 'groups', label: 'Family Emergency' },
    { icon: 'emergency', label: 'Emergency Service Duty' },
  ]) },
})
const emit = defineEmits(['confirm'])
const money = (n, c = '$') => c + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// null until the guest accepts (refundable) or declines coverage.
const protection = ref(null)
</script>

<template>
  <div class="srr">
    <!-- Protect your stay — reservations only; group blocks aren't charged so
         no booking protection is offered. -->
    <section v-if="flow !== 'group'" class="srr__sec srr__sec--first">
      <h4 class="srr__h">Protect your stay</h4>
      <p class="srr__sub">Select an option to continue.</p>
      <div class="bp">
        <h5 class="bp__title">Enhanced Booking Protection</h5>
        <p class="bp__desc">Life is unpredictable. Get back up to 100% of your {{ money(total, currency) }} payment if you're forced to cancel or unable to attend due to unexpected events.</p>

        <div class="bp__reasons">
          <div v-for="r in coveredReasons" :key="r.label" class="bp__reason">
            <span class="bp__reason-icon"><q-icon :name="r.icon" size="22px" /></span>
            <span class="bp__reason-label">{{ r.label }}</span>
          </div>
        </div>

        <button type="button" class="bp__opt" :class="{ 'is-sel': protection === 'yes' }" @click="protection = 'yes'">
          <span class="bp__radio"><span v-if="protection === 'yes'" class="bp__dot" /></span>
          <span class="bp__opt-main">Yes, make my booking refundable <span class="bp__rec">Recommended</span></span>
          <span class="bp__opt-price">{{ money(protectionPrice, currency) }}</span>
        </button>
        <button type="button" class="bp__opt bp__opt--no" :class="{ 'is-sel': protection === 'no' }" @click="protection = 'no'">
          <span class="bp__radio"><span v-if="protection === 'no'" class="bp__dot" /></span>
          <span class="bp__opt-main">No, I prefer no refunds or exchanges for any reason</span>
        </button>

        <div class="bp__rule" />
        <p class="bp__fine">Accepting coverage constitutes my electronic signature. I confirm that I have read, understand, and agree to the <a class="bp__link" href="#" @click.prevent>insurance notices and disclosures.</a></p>
      </div>
    </section>

    <!-- DES-92: the standalone "Cancellation policy" + "Special check-in
         instructions" block was removed — it duplicated the Policies section
         below. (For group blocks, Protect-your-stay is hidden, so Policies is the
         first section and drops its top border via srr__sec--first.) -->

    <!-- Policies + agreement + completion CTA -->
    <section v-if="!hidePolicies" class="srr__sec" :class="{ 'srr__sec--first': flow === 'group' }">
      <h4 class="srr__h">Policies</h4>
      <p class="srr__sub">Review and agree to the policies to complete your booking.</p>
      <policies-agreement :flow="flow" :hotels="hotels" :hide-cta="flat" @submit="emit('confirm')" />
    </section>
  </div>
</template>

<style scoped>
.srr__recap { list-style: none; margin: 0; padding: 0; }
.srr__recap li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--ds-color-border); }
.srr__recap li span { color: var(--ds-color-text-subtle); }
.srr__recap li strong { color: var(--ds-color-text); }

.srr__sec { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--ds-color-border); }
.srr__sec--first { margin-top: 0; padding-top: 0; border-top: 0; }
.srr__h { font-size: 1.0625rem; font-weight: 700; color: var(--ds-color-text); margin: 0; }
.srr__sub { color: var(--ds-color-text-subtle); font-size: 0.875rem; margin: 4px 0 14px; }

/* Enhanced Booking Protection (Vertical Insure) */
.bp { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); padding: 22px 24px; }
.bp__title { margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text); }
.bp__desc { margin: 10px 0 18px; color: var(--ds-color-text-subtle); font-size: 0.9375rem; line-height: 1.5; }

.bp__reasons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.bp__reason { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 12px; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); }
.bp__reason-icon { width: 48px; height: 48px; border-radius: 50%; background: var(--ds-palette-neutral-900, #18181B); color: #fff; display: flex; align-items: center; justify-content: center; flex: none; }
.bp__reason-label { font-weight: 700; font-size: 0.9375rem; color: var(--ds-color-text); text-align: center; line-height: 1.3; }

.bp__opt { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; padding: 16px 16px; border: 0; border-radius: var(--ds-radius-md); background: var(--ds-color-surface); cursor: pointer; }
.bp__opt:first-of-type { margin-top: 22px; }
.bp__opt--no { background: var(--ds-palette-slate-50, #F8FAFC); margin-top: 6px; }
.bp__opt.is-sel { box-shadow: inset 0 0 0 2px var(--ds-color-background-brand-bold); }
.bp__radio { width: 22px; height: 22px; flex: none; border: 2px solid var(--ds-color-border-bold); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.bp__opt.is-sel .bp__radio { border-color: var(--ds-color-background-brand-bold); }
.bp__dot { width: 12px; height: 12px; border-radius: 50%; background: var(--ds-color-background-brand-bold); }
.bp__opt-main { flex: 1; display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; font-weight: 700; color: var(--ds-color-text); font-size: 1rem; }
.bp__opt-price { font-weight: 800; font-size: 1.125rem; color: var(--ds-color-text); white-space: nowrap; }
.bp__rec { display: inline-block; background: var(--ds-palette-green-600); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: var(--ds-radius-pill); }

.bp__rule { height: 1px; background: var(--ds-color-border); margin: 18px 0 16px; }
.bp__fine { margin: 0; color: var(--ds-color-text-subtle); font-size: 0.875rem; line-height: 1.5; }
.bp__link { color: var(--ds-color-text-info); text-decoration: underline; }

/* Phones: smaller type throughout, and the covered-reasons cards become a
   single-row swipeable carousel instead of a wrapping grid. */
@media (max-width: 600px) {
  .srr__sec { margin-top: 20px; padding-top: 20px; }
  .srr__h { font-size: 0.9375rem; }
  .srr__sub { font-size: 0.8125rem; margin: 4px 0 12px; }
  .bp { padding: 16px; }
  .bp__title { font-size: 1rem; }
  .bp__desc { font-size: 0.8125rem; line-height: 1.45; margin: 8px 0 14px; }
  .bp__reasons {
    display: flex; grid-template-columns: none; gap: 10px;
    overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
    margin-inline: -4px; padding: 2px 4px 6px;
  }
  .bp__reason { flex: 0 0 42%; min-width: 118px; scroll-snap-align: start; padding: 14px 10px; gap: 8px; }
  .bp__reason-icon { width: 40px; height: 40px; }
  .bp__reason-label { font-size: 0.8125rem; }
  .bp__opt { padding: 14px 12px; gap: 12px; }
  .bp__opt:first-of-type { margin-top: 16px; }
  .bp__opt-main { font-size: 0.875rem; }
  .bp__opt-price { font-size: 1rem; }
  .bp__rec { font-size: 0.6875rem; padding: 2px 8px; }
  .bp__fine { font-size: 0.75rem; line-height: 1.45; }
}
</style>
