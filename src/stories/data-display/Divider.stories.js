/** DATA DISPLAY / Divider → Quasar: QSeparator (native alias) */
export default {
  title: 'Components/Layout & Structure/Divider',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
A thin rule that separates content groups. Quasar calls it **QSeparator**.

## When to use
- Between list sections, toolbar groups, card regions.

## Quasar mapping
\`Divider → QSeparator\` (native; we alias the name in the DS).
` } } },
}
export const Horizontal = {
  render: () => ({ template: `
    <div style="max-width:320px">
      <div>Above</div>
      <q-separator class="q-my-md" />
      <div>Below</div>
      <q-separator class="q-my-md" color="primary" />
      <div>After colored divider</div>
    </div>` }),
}
export const Vertical = {
  render: () => ({ template: `
    <div class="row items-center" style="height:40px">
      <span>Left</span>
      <q-separator vertical class="q-mx-md" />
      <span>Middle</span>
      <q-separator vertical class="q-mx-md" />
      <span>Right</span>
    </div>` }),
}
