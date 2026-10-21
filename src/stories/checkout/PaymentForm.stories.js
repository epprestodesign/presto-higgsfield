// CHECKOUT EXPERIENCE / Components / Payment Method — the inline card + billing
// form used in the Payment step (replaces the tile selector + dialogs).
import { ref } from 'vue'
import PaymentForm from '../../components/checkout/PaymentForm.vue'

export default {
  title: 'Checkout Experience/Components/Book Reservation/Payment',
  component: PaymentForm,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
The inline **Payment Method** form: **Card Information** (cardholder name, card
number, expiration, security code) + **Billing Information** (address, country,
city/state, postal code), built from DS field styles. Credit card only — no dialogs.
` } } },
}

const wrap = (inner, data) => ({ components: { PaymentForm }, setup: () => data, template: `<div style="max-width:720px;margin:0 auto;padding:32px">${inner}</div>` })

/** Default — empty form with the hold reassurance line. */
export const Default = { render: () => wrap(`<payment-form v-model="form" />`, { form: ref({}) }) }

/** Validation — required-field errors surfaced. */
export const ValidationErrors = { render: () => wrap(`<payment-form v-model="form" show-errors />`, { form: ref({}) }) }
