// HOTEL DETAILS / Amenities — the categorized amenities block on the detail
// screen (Internet, Dining, Pool, Spa, Fitness, …).
import AmenitiesSection from '../../components/details/AmenitiesSection.vue'
import { amenityGroups, getAmenities } from '../../lib/amenities.js'

// Full catalog grouped by category — items are amenity objects (icon + label),
// rendered as Amenity components inside the section.
const groups = amenityGroups()

// A curated subset, to show a property that offers only some amenities.
const subset = amenityGroups([
  'wifi', 'breakfast', 'pool', 'hot_tub', 'spa', 'fitness', 'parking', 'shuttle',
  'restaurant', 'bar', 'room_service', 'air_conditioning', 'pet_friendly', 'non_smoking',
])

// Legacy shape — plain-string bullet items still supported for back-compat.
const bulletGroups = [
  { icon: 'spa', title: 'Spa', items: ['Sauna', 'Yoga sessions', 'Whirlpool spa', 'Massage service'] },
  { icon: 'local_bar', title: 'Restaurants', items: ['Sanctuary', 'Sottovento', 'Dracarys'] },
]

export default {
  title: 'Hotel Details/Components/Amenities',
  component: AmenitiesSection,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
The **Amenities** section lists a property's amenities grouped by category. It
draws from the shared **amenities catalog** (\`src/lib/amenities.js\`) via
\`amenityGroups()\`, rendering each item as an **Amenity** (icon + label). The
section heading reuses **DsSectionHeader**; \`columns\` controls the grid.

Items can also be plain strings (rendered as bullets) for back-compat — see the
**Bullet List (Legacy)** story.
` } } },
}

/** The full catalog — every category, itemized, in two columns. */
export const Default = {
  render: () => ({
    components: { AmenitiesSection },
    setup: () => ({ groups }),
    template: `<div style="max-width:1180px"><amenities-section :groups="groups" /></div>`,
  }),
}

/** A property that offers only a curated subset of the catalog. */
export const PropertySubset = {
  render: () => ({
    components: { AmenitiesSection },
    setup: () => ({ groups: subset }),
    template: `<div style="max-width:1180px"><amenities-section :groups="groups" subtitle="Everything available during your stay." /></div>`,
  }),
}

/** Three-column layout (full catalog). */
export const ThreeColumn = {
  render: () => ({
    components: { AmenitiesSection },
    setup: () => ({ groups }),
    template: `<div style="max-width:1180px"><amenities-section :groups="groups" :columns="3" /></div>`,
  }),
}

/** Single-column layout (narrow container). */
export const SingleColumn = {
  render: () => ({
    components: { AmenitiesSection },
    setup: () => ({ groups: subset }),
    template: `<div style="max-width:520px"><amenities-section :groups="groups" :columns="1" /></div>`,
  }),
}

/** Back-compat — plain-string items render as bullet lists. */
export const BulletListLegacy = {
  name: 'Bullet List (Legacy)',
  render: () => ({
    components: { AmenitiesSection },
    setup: () => ({ groups: bulletGroups }),
    template: `<div style="max-width:1180px"><amenities-section :groups="groups" /></div>`,
  }),
}
