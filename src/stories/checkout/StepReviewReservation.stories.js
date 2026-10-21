// CHECKOUT EXPERIENCE / Components / Book Reservation / Review Reservation — step 4.
import StepReviewReservation from '../../components/checkout/steps/StepReviewReservation.vue'

export default {
  title: 'Checkout Experience/Components/Book Reservation/Review Reservation',
  component: StepReviewReservation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Step 4 — recap + Confirm and pay for the single reservation: booking protection, cancellation policy, and the policies agreement.' } } },
}

const wrap = (inner) => ({ components: { StepReviewReservation }, template: `<div style="max-width:640px;margin:0 auto;padding:32px">${inner}</div>` })

export const Reservation = { render: () => wrap(`<step-review-reservation contact-summary="Sam Girard · 2 guests" payment-label="Amex ····1009" :total="322.31" />`) }
