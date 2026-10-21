<script setup>
// PaymentForm — the inline "Payment Method" form used in the checkout Payment
// step (replaces the tile selector + Add-payment dialogs). Two sections: Credit
// Card Information (accepted-card logos, cardholder name, card number, expiration
// month/year, security code) and Billing Information. Built from DS field styles;
// credit card only. `reassurance` shows the "$0 due now" hold note. Required-field
// errors surface on blur or when showErrors is set.
import { reactive, computed, watch } from 'vue'
import { paymentLogo } from '../../lib/paymentLogos'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  // Optional reassurance line above the card fields (hidden by default). Pass a
  // string (e.g. a hold "$0 due now" note) to show it.
  reassurance: { type: String, default: '' },
  showErrors: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const form = reactive({
  cardholderName: '', cardNumber: '', expMonth: '', expYear: '', cvc: '',
  address1: '', address2: '', address3: '', country: 'United States', city: '', state: '', postal: '',
  ...props.modelValue,
})
watch(form, () => emit('update:modelValue', { ...form }), { deep: true })

// Accepted credit cards (logo imagery).
const CARDS = ['Visa', 'Mastercard', 'Discover', 'Amex']
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const YEARS = ['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035']
const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Mexico', 'Germany', 'France']
const STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
const CVC_HINT = 'The 3- or 4-digit security code printed on your card (on the back for Visa/Mastercard/Discover, on the front for American Express).'

const REQUIRED = ['cardholderName', 'cardNumber', 'expMonth', 'expYear', 'cvc', 'address1', 'city', 'state', 'postal']
const touched = reactive({})
const show = (f) => props.showErrors || touched[f]
const err = (f) => (show(f) && REQUIRED.includes(f) && !String(form[f]).trim() ? 'Required' : '')
</script>

<template>
  <section class="pmf">
    <p v-if="reassurance" class="pmf__reassure"><q-icon name="check_circle" size="18px" /> {{ reassurance }}</p>

    <!-- CREDIT CARD INFORMATION -->
    <h4 class="pmf__h">Credit Card Information</h4>
    <div class="pmf__cards">
      <img v-for="c in CARDS" :key="c" :src="paymentLogo(c)" :alt="c" class="pmf__cardlogo" />
      <span class="pmf__cardstext">Credit Cards Accepted</span>
    </div>

    <div class="pmf__grid">
      <label class="pmf__field">
        <span>Cardholder Name <i class="pmf__req">*</i></span>
        <input v-model="form.cardholderName" placeholder="Cardholder Name" :class="{ 'is-error': err('cardholderName') }" @blur="touched.cardholderName = true" />
        <small v-if="err('cardholderName')" class="pmf__err">{{ err('cardholderName') }}</small>
      </label>
      <label class="pmf__field">
        <span>Card Number <i class="pmf__req">*</i></span>
        <input v-model="form.cardNumber" inputmode="numeric" placeholder="Card Number" :class="{ 'is-error': err('cardNumber') }" @blur="touched.cardNumber = true" />
        <small v-if="err('cardNumber')" class="pmf__err">{{ err('cardNumber') }}</small>
      </label>

      <div class="pmf__field">
        <span>Expiration Date <i class="pmf__req">*</i></span>
        <div class="pmf__exp">
          <span class="pmf__selectwrap"><select v-model="form.expMonth" :class="{ 'is-error': err('expMonth') }" @blur="touched.expMonth = true"><option value="" disabled>Month</option><option v-for="m in MONTHS" :key="m" :value="m">{{ m }}</option></select><q-icon name="expand_more" size="18px" /></span>
          <span class="pmf__selectwrap"><select v-model="form.expYear" :class="{ 'is-error': err('expYear') }" @blur="touched.expYear = true"><option value="" disabled>Year</option><option v-for="y in YEARS" :key="y" :value="y">{{ y }}</option></select><q-icon name="expand_more" size="18px" /></span>
        </div>
        <small v-if="err('expMonth') || err('expYear')" class="pmf__err">Required</small>
      </div>
      <label class="pmf__field">
        <span>Security Code <i class="pmf__req">*</i>
          <button type="button" class="pmf__info" aria-label="About the security code"><q-icon name="info" size="15px" /><q-tooltip class="pmf__tooltip" anchor="top middle" self="bottom middle" :offset="[0, 8]" max-width="300px">{{ CVC_HINT }}</q-tooltip></button>
        </span>
        <input v-model="form.cvc" inputmode="numeric" placeholder="Security Code" :class="{ 'is-error': err('cvc') }" @blur="touched.cvc = true" />
        <small v-if="err('cvc')" class="pmf__err">{{ err('cvc') }}</small>
      </label>
    </div>

    <hr class="pmf__rule" />

    <!-- BILLING INFORMATION -->
    <h4 class="pmf__h">Billing Information</h4>
    <div class="pmf__grid">
      <label class="pmf__field pmf__field--full">
        <span>Address Line 1 <i class="pmf__req">*</i></span>
        <input v-model="form.address1" placeholder="Address Line 1" :class="{ 'is-error': err('address1') }" @blur="touched.address1 = true" />
        <small v-if="err('address1')" class="pmf__err">{{ err('address1') }}</small>
      </label>
      <label class="pmf__field pmf__field--full"><span>Address Line 2</span><input v-model="form.address2" placeholder="Address Line 2" /></label>
      <label class="pmf__field pmf__field--full"><span>Address Line 3</span><input v-model="form.address3" placeholder="Address Line 3" /></label>

      <label class="pmf__field pmf__field--full">
        <span>Country</span>
        <span class="pmf__selectwrap"><select v-model="form.country"><option v-for="c in COUNTRIES" :key="c" :value="c">{{ c }}</option></select><q-icon name="expand_more" size="18px" /></span>
      </label>

      <!-- City / State / Postal Code — one row -->
      <div class="pmf__field--full pmf__citygrid">
        <label class="pmf__field">
          <span>City <i class="pmf__req">*</i></span>
          <input v-model="form.city" placeholder="City" :class="{ 'is-error': err('city') }" @blur="touched.city = true" />
          <small v-if="err('city')" class="pmf__err">{{ err('city') }}</small>
        </label>
        <label class="pmf__field">
          <span>State <i class="pmf__req">*</i></span>
          <span class="pmf__selectwrap"><select v-model="form.state" :class="{ 'is-error': err('state') }" @blur="touched.state = true"><option value="" disabled>Select</option><option v-for="s in STATES" :key="s" :value="s">{{ s }}</option></select><q-icon name="expand_more" size="18px" /></span>
          <small v-if="err('state')" class="pmf__err">{{ err('state') }}</small>
        </label>
        <label class="pmf__field">
          <span>Postal Code <i class="pmf__req">*</i></span>
          <input v-model="form.postal" placeholder="Postal Code" :class="{ 'is-error': err('postal') }" @blur="touched.postal = true" />
          <small v-if="err('postal')" class="pmf__err">{{ err('postal') }}</small>
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pmf__reassure { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; color: var(--ds-color-text-success); font-weight: 600; font-size: 0.9375rem; }

.pmf__h { font-size: 1rem; font-weight: 700; color: var(--ds-color-text); margin: 0 0 12px; }
.pmf__rule { border: 0; border-top: 1px solid var(--ds-color-border); margin: 24px 0; }

/* Accepted-card logos row */
.pmf__cards { display: flex; align-items: center; gap: 8px; margin: 0 0 18px; }
.pmf__cardlogo { height: 26px; width: auto; display: block; }
.pmf__cardstext { margin-left: 6px; color: var(--ds-color-text-subtle); font-size: 0.9375rem; }

.pmf__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.pmf__field { display: flex; flex-direction: column; gap: 6px; }
.pmf__field--full { grid-column: 1 / -1; }
.pmf__field span { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8125rem; font-weight: 600; color: var(--ds-color-text); }
.pmf__req { color: var(--ds-color-text-danger); font-style: normal; }
.pmf__err { color: var(--ds-color-text-danger); font-size: 0.75rem; font-weight: 500; }

.pmf__field > input,
.pmf__selectwrap select {
  height: 46px; width: 100%; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md);
  padding: 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); background: var(--ds-color-surface);
  outline: none; transition: border-color var(--ds-duration-fast) var(--ds-ease-standard);
}
.pmf__field > input:focus, .pmf__selectwrap select:focus { border-color: var(--ds-color-border-focused); }
.pmf__field > input::placeholder { color: var(--ds-color-text-subtlest); }
.pmf__field > input.is-error, .pmf__selectwrap select.is-error { border-color: var(--ds-color-text-danger); }

.pmf__selectwrap { position: relative; display: flex; align-items: center; }
.pmf__selectwrap select { padding-right: 38px; appearance: none; -webkit-appearance: none; cursor: pointer; }
.pmf__selectwrap .q-icon { position: absolute; right: 12px; color: var(--ds-color-text-subtle); pointer-events: none; }

/* Expiration — Month + Year selects side by side */
.pmf__exp { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* City / State / Postal Code — one row */
.pmf__citygrid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px 16px; }

/* Security-code info tooltip trigger */
.pmf__info { display: inline-flex; align-items: center; padding: 0; border: 0; background: none; color: var(--ds-color-text-subtle); cursor: pointer; }
.pmf__info:hover { color: var(--ds-color-text); }

@media (max-width: 560px) { .pmf__grid, .pmf__citygrid { grid-template-columns: 1fr; } }
</style>

<!-- Unscoped: q-tooltip content is teleported outside this component. -->
<style>
.pmf__tooltip { max-width: 300px; font-size: 0.8125rem; line-height: 1.5; padding: 10px 12px; }
</style>
