// LANDING PAGE / Components / Core Booking Widget — the booking search WITHOUT
// the Registered Team(s) field: a generic hotel search (booking type + dates +
// travelers). Same component as the Teams Booking Widget, with `showTeams` off.
import BookingWidget from '../../components/BookingWidget.vue'

export default {
  title: 'Landing Page/Components/Core Booking Widget',
  component: BookingWidget,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'inline-radio', options: ['reservations', 'group'] },
    tabs: { control: 'boolean' },
    modeDropdown: { control: 'boolean' },
    modeRadio: { control: 'boolean' },
    showTeams: { control: 'boolean' },
  },
  parameters: { docs: { description: { component: `
## Overview
The **Core Booking Widget** — the same search as the **Teams Booking Widget** but
with the **Registered Team(s) field removed**: a generic hotel search of
**Booking type + dates + travelers**. It renders \`BookingWidget\` with
\`show-teams="false"\`; toggle \`showTeams\` in Controls to compare.

See **Explorations** for the alternate mode-selector layouts (tabs, radio).
` } } },
}

/** Book Reservations — tabs-less layout, no team field. */
export const Default = {
  name: 'Book Reservations (No Tabs)',
  render: () => ({ components: { BookingWidget }, template: `<div style="max-width:1000px"><booking-widget mode="reservations" :tabs="false" :show-teams="false" /></div>` }),
}

/** Group Block Booking — dropdown-selector layout, no team field. */
export const DropdownSelector = {
  name: 'Group Block Booking (Dropdown)',
  render: () => ({ components: { BookingWidget }, template: `<div style="max-width:1040px"><booking-widget mode="group" :tabs="false" :mode-dropdown="true" :show-teams="false" /></div>` }),
}
