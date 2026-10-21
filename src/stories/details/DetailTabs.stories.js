// HOTEL DETAILS / Detail Tabs — the section navigation for the hotel detail
// screen (Overview / Rooms / Property / Amenities / Policies).
import { ref } from 'vue'
import DetailTabs from '../../components/details/DetailTabs.vue'

export default {
  title: 'Hotel Details/Components/Detail Tabs',
  component: DetailTabs,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
**Detail Tabs** is the underline-style section nav at the top of the hotel
detail screen. It's controlled (\`v-model\`) and emits \`select\`; on the full
[Hotel Detail Page](/?path=/docs/hotel-details-hotel-detail-page--docs) each tab
scrolls to its section anchor. The component itself is purely presentational.
` } } },
}

/** The default five-tab detail nav. */
export const Default = {
  render: () => ({
    components: { DetailTabs },
    setup: () => ({ tab: ref('overview') }),
    template: `<div style="max-width:1180px"><detail-tabs v-model="tab" /><p style="margin-top:16px;color:var(--ds-color-text-subtle)">Active: <strong>{{ tab }}</strong></p></div>`,
  }),
}

/** A reduced tab set (e.g. a property with no separate policies page). */
export const CustomTabs = {
  render: () => ({
    components: { DetailTabs },
    setup: () => ({
      tab: ref('overview'),
      tabs: [
        { name: 'overview', label: 'Overview' },
        { name: 'rooms', label: 'Rooms' },
        { name: 'amenities', label: 'Amenities' },
      ],
    }),
    template: `<div style="max-width:1180px"><detail-tabs v-model="tab" :tabs="tabs" /></div>`,
  }),
}
