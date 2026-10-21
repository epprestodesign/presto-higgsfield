// CHECKOUT EXPERIENCE / Payment dialogs — Instacart-style payment surfaces.
import { ref } from 'vue'
import PaymentMethodDialog from '../../components/checkout/PaymentMethodDialog.vue'
import AddPaymentDialog from '../../components/checkout/AddPaymentDialog.vue'

export default {
  title: 'Checkout Experience/Old Designs/Payment Dialogs',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
> **Old design.** The checkout Payment step now uses the inline
> **Payment Method** form (Components → Payment Method) — no dialogs. Kept here
> for reference.

Instacart-style payment surfaces:
- **Payment Method** — saved methods (single-select) + an "Add payment method" list.
- **Add Payment** — card form with a Save that enables once valid.
Logos come from the local \`creditCards\` SVG set.
` } } },
}

/** The payment-method selector. Choose "Debit/Credit" to open Add Payment. */
export const PaymentMethod = {
  render: () => ({
    components: { PaymentMethodDialog },
    setup() { const open = ref(false); const chosen = ref(null); return { open, chosen } },
    template: `<div style="padding:40px;min-height:640px">
      <q-btn no-caps unelevated color="primary" label="Open payment method" @click="open = true" />
      <div v-if="chosen" style="margin-top:16px">Selected: {{ chosen.label }}</div>
      <payment-method-dialog v-model="open" @confirm="chosen = $event" />
    </div>`,
  }),
}

/** The add-payment card form. */
export const AddPayment = {
  render: () => ({
    components: { AddPaymentDialog },
    setup() { const open = ref(false); const card = ref(null); return { open, card } },
    template: `<div style="padding:40px;min-height:640px">
      <q-btn no-caps unelevated color="primary" label="Open add payment" @click="open = true" />
      <div v-if="card" style="margin-top:16px">Saved: {{ card.brand }} *{{ card.last4 }}</div>
      <add-payment-dialog v-model="open" @save="card = $event" />
    </div>`,
  }),
}
