// LANDING PAGE / Components / Teams Booking Widget / Explorations — alternate mode-selector
// layouts for the Booking Widget. These show different ways to switch between
// "Book Reservations" and "Hold Rooms for Group or Team". Not the default;
// kept here to compare layouts.
import BookingWidget from '../../components/BookingWidget.vue'

export default {
  title: 'Landing Page/Components/Teams Booking Widget/Explorations',
  component: BookingWidget,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Explorations
Alternate ways to present the flow selector (**Book Reservations** vs **Hold
Rooms for Group or Team**), for layout comparison. The default widget (tabs-less)
lives one level up under **Landing Page / Components / Teams Booking Widget**.

- **Tabs** — the two flows as underlined tabs above the fields.
- **Radio Buttons** — the two flows as a radio-button pair above the fields.
` } } },
}

/** Tabs — the two flows as underlined tabs (click to switch). */
export const Tabs = {
  render: () => ({ components: { BookingWidget }, template: `<div style="max-width:1000px"><booking-widget mode="reservations" /></div>` }),
}

/** Radio buttons — the two flows as a radio-button pair above the fields. */
export const RadioButtons = {
  name: 'Radio Buttons',
  render: () => ({ components: { BookingWidget }, template: `<div style="max-width:1000px"><booking-widget mode="reservations" :tabs="false" :mode-radio="true" /></div>` }),
}
