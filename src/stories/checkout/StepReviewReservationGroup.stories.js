// CHECKOUT EXPERIENCE / Components / Group Block / Review Reservation — step 4.
import StepReviewReservation from '../../components/checkout/steps/StepReviewReservation.vue'

export default {
  title: 'Checkout Experience/Components/Group Block/Review Reservation',
  component: StepReviewReservation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Step 4 — recap for a group block: no booking protection (held, not charged), cancellation policy, and a single policies agreement checkbox.' } } },
}

const wrap = (inner) => ({ components: { StepReviewReservation }, template: `<div style="max-width:640px;margin:0 auto;padding:32px">${inner}</div>` })

export const GroupHold = { name: 'Group Hold', render: () => wrap(`<step-review-reservation flow="group" contact-summary="3 teams · Sam Girard" :total="2578.56" />`) }
