// CHECKOUT EXPERIENCE / Group Block / Hold Timer Pill — the floating countdown
// that keeps the group-block hold time visible across the whole workflow.
import HoldTimerPill from '../../components/HoldTimerPill.vue'

export default {
  title: 'Checkout Experience/Group Block/Hold Timer Pill',
  component: HoldTimerPill,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
The **Hold Timer Pill** is the group-block hold countdown. Group rooms are held
temporarily the moment the first room is added to the cart, so this pill floats
in a screen corner and stays visible for the rest of the booking workflow
(browse → details → checkout) — the guest always knows how long the hold lasts.
It's controlled by a single shared timer (the parent owns the countdown so it
survives screen changes); pass \`running\` for a self-contained demo. Under a
minute it turns amber (\`urgent-at\`).
` } } },
  argTypes: {
    position: { control: 'select', options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'] },
    seconds: { control: 'number' },
    running: { control: 'boolean' },
  },
}

/** Live countdown, bottom-right — self-running from 8 minutes. */
export const Default = {
  name: 'Hold Timer Pill',
  args: { seconds: 480, position: 'bottom-right', running: true },
}

/** Under a minute — the urgent (amber) treatment. */
export const Urgent = {
  name: 'Urgent (under a minute)',
  args: { seconds: 45, position: 'bottom-right', running: false },
}

/** Anchored bottom-left. */
export const BottomLeft = {
  name: 'Bottom Left',
  args: { seconds: 372, position: 'bottom-left', running: false },
}
