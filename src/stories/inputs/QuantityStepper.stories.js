// INPUTS / Quantity Stepper — compact − / value / + numeric control with an
// optional "remove" affordance: when `removable`, hitting the floor swaps the
// − for a trash can that clears the value and emits `remove`.
import { ref } from 'vue'
import QuantityStepper from '../../components/QuantityStepper.vue'

export default {
  title: 'Components/Forms/Quantity Stepper',
  component: QuantityStepper,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    removable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  parameters: { docs: { description: { component: `
## Overview
A small numeric stepper for quantities (rooms, guests, cart items).

- **Bounds** — clamps between \`min\` and \`max\`; the − / + disable at the edges.
- **Removable** — when \`removable\` is set, reaching \`min\` turns the − into a
  **trash can**. Pressing it sets the value to **0** and emits \`remove\`, so the
  parent can drop the line (used in the cart fly-out).
- **Sizes** — \`sm\` and \`md\`.

\`\`\`html
<quantity-stepper v-model="qty" :min="1" :max="roomsLeft" removable @remove="dropItem" />
\`\`\`
` } } },
}

/** Standard stepper — disables − at min and + at max. */
export const Default = {
  render: () => ({
    components: { QuantityStepper },
    setup: () => ({ qty: ref(2) }),
    template: `<quantity-stepper v-model="qty" :min="0" :max="10" />`,
  }),
}

/** Removable — decrease to 1, the − becomes a trash can; tap it to remove. */
export const Removable = {
  render: () => ({
    components: { QuantityStepper },
    setup() {
      const qty = ref(3)
      const removed = ref(false)
      const addBack = () => { removed.value = false; qty.value = 1 }
      return { qty, removed, addBack }
    },
    template: `
      <div style="display:flex;align-items:center;gap:16px;min-height:40px">
        <template v-if="!removed">
          <quantity-stepper v-model="qty" :min="1" :max="6" removable @remove="removed = true" />
          <span style="color:var(--ds-color-text-subtle);font-size:0.875rem">Decrease to 1 → the − becomes a trash can; tap it to remove.</span>
        </template>
        <template v-else>
          <span style="color:var(--ds-color-text-danger);font-weight:600">Removed from cart</span>
          <button @click="addBack" style="border:1px solid var(--ds-color-border-bold);background:none;border-radius:var(--ds-radius-md);padding:6px 14px;font-weight:600;cursor:pointer">Add back</button>
        </template>
      </div>`,
  }),
}

/** Both sizes. */
export const Sizes = {
  render: () => ({
    components: { QuantityStepper },
    setup: () => ({ a: ref(2), b: ref(2) }),
    template: `
      <div style="display:flex;align-items:center;gap:24px">
        <div style="display:flex;flex-direction:column;gap:6px;align-items:center"><quantity-stepper v-model="a" size="sm" :min="0" :max="9" /><small style="color:var(--ds-color-text-subtle)">sm</small></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:center"><quantity-stepper v-model="b" size="md" :min="0" :max="9" /><small style="color:var(--ds-color-text-subtle)">md</small></div>
      </div>`,
  }),
}
