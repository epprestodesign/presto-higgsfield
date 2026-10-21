// CHECKOUT EXPERIENCE / Steps / Review Order / Book Reservation — step 1.
import StepReviewOrder from '../../components/checkout/steps/StepReviewOrder.vue'
import { reserveCart } from './_fixtures'

export default {
  title: 'Checkout Experience/Components/Book Reservation/Review Order',
  component: StepReviewOrder,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Step 1 — recycles the cart body: the single-stay reservation summary.' } } },
}

const wrap = (inner, data) => ({ components: { StepReviewOrder }, setup: () => data, template: `<div style="max-width:640px;margin:0 auto;padding:32px">${inner}</div>` })

export const Reservation = { render: () => wrap(`<step-review-order mode="reserve" :cart="cart" />`, { cart: reserveCart }) }
