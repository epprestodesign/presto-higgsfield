// CHECKOUT EXPERIENCE / Steps / Contact Info / Group Block — step 2.
import { ref } from 'vue'
import StepContactInfo from '../../components/checkout/steps/StepContactInfo.vue'

export default {
  title: 'Checkout Experience/Components/Group Block/Contact Info',
  component: StepContactInfo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Step 2 — Group Block: the teams block (search / add teams + primary contact).' } } },
}

const wrap = (inner, data) => ({ components: { StepContactInfo }, setup: () => data, template: `<div style="max-width:640px;margin:0 auto;padding:32px">${inner}</div>` })

export const GroupBlock = { name: 'Group Block', render: () => wrap(`<step-contact-info mode="group" v-model="m" />`, { m: ref({}) }) }
