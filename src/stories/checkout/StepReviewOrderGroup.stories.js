// CHECKOUT EXPERIENCE / Steps / Review Order / Group Block — step 1.
import StepReviewOrder from '../../components/checkout/steps/StepReviewOrder.vue'
import { holdCart } from './_fixtures'

export default {
  title: 'Checkout Experience/Components/Group Block/Review Order',
  component: StepReviewOrder,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Step 1 — recycles the cart body: the group-block cart (collapsible hotels → rooms → day steppers).' } } },
}

const wrap = (inner, data) => ({ components: { StepReviewOrder }, setup: () => data, template: `<div style="max-width:640px;margin:0 auto;padding:32px">${inner}</div>` })

export const GroupBlock = { name: 'Group Block', render: () => wrap(`<step-review-order mode="hold" :cart="cart" />`, { cart: holdCart }) }
