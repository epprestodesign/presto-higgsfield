// LANDING PAGE / Components / Core Booking Widget / Explorations — alternate
// mode-selector layouts (tabs, radio) for the Core Booking Widget (no team field).
import BookingWidget from '../../components/BookingWidget.vue'

export default {
  title: 'Landing Page/Components/Core Booking Widget/Explorations',
  component: BookingWidget,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Explorations
Alternate ways to present the flow selector for the **Core Booking Widget**
(no Registered Team(s) field). The default (tabs-less) lives one level up under
**Landing Page / Components / Core Booking Widget**.

- **Tabs** — the two flows as underlined tabs above the fields.
- **Radio Buttons** — the two flows as a radio-button pair above the fields.
` } } },
}

/** Tabs — the two flows as underlined tabs (click to switch). */
export const Tabs = {
  render: () => ({ components: { BookingWidget }, template: `<div style="max-width:1000px"><booking-widget mode="reservations" :show-teams="false" /></div>` }),
}

/** Radio buttons — the two flows as a radio-button pair above the fields. */
export const RadioButtons = {
  name: 'Radio Buttons',
  render: () => ({ components: { BookingWidget }, template: `<div style="max-width:1000px"><booking-widget mode="reservations" :tabs="false" :mode-radio="true" :show-teams="false" /></div>` }),
}
