/** LAYOUT / Section Header → custom DsSectionHeader (no Quasar equivalent) */
import DsSectionHeader from '../../components/DsSectionHeader.vue'
export default {
  title: 'Components/Layout & Structure/Section Header',
  component: DsSectionHeader,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
A consistent title row for page/section tops — title, optional subtitle, and an
actions slot. Keeps headers uniform across every screen.

## When to use
- Top of a page section, card group, or settings block.

## Quasar mapping
\`Section Header → custom (DsSectionHeader)\`.
` } } },
  argTypes: { title: { control: 'text' }, subtitle: { control: 'text' } },
  args: { title: 'Reservations', subtitle: 'Today · 24 bookings' },
}
export const Basic = {
  render: (args) => ({ components: { DsSectionHeader }, setup: () => ({ args }), template: `
    <div style="max-width:560px">
      <ds-section-header :title="args.title" :subtitle="args.subtitle">
        <template #actions>
          <q-btn outline color="primary" label="Export" class="q-mr-sm" />
          <q-btn color="primary" icon="add" label="New" />
        </template>
      </ds-section-header>
      <div class="bg-grey-2 q-pa-md rounded-borders text-grey-7">Section content…</div>
    </div>` }),
}
