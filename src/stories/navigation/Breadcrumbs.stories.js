/** NAVIGATION / Breadcrumbs → Quasar: QBreadcrumbs + QBreadcrumbsEl (native) */
export default {
  title: 'Browse Hotels/Components/Top Bar/Breadcrumbs',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
Shows the user's location in a hierarchy and lets them jump back up levels.

## When to use
- Deep hierarchies (Home → New York → The Grand Plaza → Deluxe King).

## When not to use
- Flat apps with ≤2 levels.

## Quasar mapping
\`Breadcrumbs → QBreadcrumbs + QBreadcrumbsEl\` (native).
` } } },
}
export const Basic = {
  render: () => ({ template: `
    <q-breadcrumbs active-color="primary">
      <q-breadcrumbs-el label="Home" icon="home" />
      <q-breadcrumbs-el label="New York" icon="place" />
      <q-breadcrumbs-el label="The Grand Plaza" icon="hotel" />
      <q-breadcrumbs-el label="Deluxe King" />
    </q-breadcrumbs>` }),
}
