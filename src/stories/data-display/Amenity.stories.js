// DATA DISPLAY / Amenity — the atomic icon + label amenity item, plus the
// shared amenities catalog it draws from (src/lib/amenities.js).
import Amenity from '../../components/Amenity.vue'
import { AMENITIES, AMENITY_CATEGORIES, popularAmenities } from '../../lib/amenities.js'

export default {
  title: 'Components/Typography & Content/Amenity',
  component: Amenity,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['inline', 'chip'] },
    icon: { control: 'text' },
    label: { control: 'text' },
  },
  args: { amenity: null, icon: 'pool', label: 'Swimming Pool', size: 'md', variant: 'inline' },
  parameters: { docs: { description: { component: `
## Overview
**Amenity** is the atomic icon + label unit used everywhere amenities appear —
the Hotel Summary Header's popular row, the Amenities section, listing/room
cards, and filters. Pass an \`amenity\` object from the shared **catalog**
(\`src/lib/amenities.js\`) or an explicit \`icon\` + \`label\`.

The catalog is the single source of truth: ~${AMENITIES.length} itemized
amenities across ${AMENITY_CATEGORIES.length} categories, with helpers
(\`getAmenities\`, \`popularAmenities\`, \`amenityGroups\`) so the header,
section, cards, and filters all stay in sync.

- **size** — \`sm\` / \`md\` / \`lg\`
- **variant** — \`inline\` (icon + text) or \`chip\` (bordered pill, for filters)
` } } },
}

/** Single amenity — tweak via controls. */
export const Default = {
  render: (args) => ({
    components: { Amenity },
    setup: () => ({ args }),
    template: `<amenity v-bind="args" />`,
  }),
}

/** Sizes. */
export const Sizes = {
  render: () => ({
    components: { Amenity },
    template: `<div style="display:flex;align-items:center;gap:24px"><amenity icon="pool" label="Pool" size="sm" /><amenity icon="pool" label="Pool" size="md" /><amenity icon="pool" label="Pool" size="lg" /></div>`,
  }),
}

/** Chip variant — bordered pills (the filter treatment). */
export const Chips = {
  render: () => ({
    components: { Amenity },
    setup: () => ({ items: popularAmenities() }),
    template: `<div style="display:flex;flex-wrap:wrap;gap:10px"><amenity v-for="a in items" :key="a.key" :amenity="a" variant="chip" /></div>`,
  }),
}

/** The full catalog, grouped by category. */
export const Catalog = {
  render: () => ({
    components: { Amenity },
    setup: () => ({ categories: AMENITY_CATEGORIES, all: AMENITIES }),
    template: `
      <div style="display:flex;flex-direction:column;gap:20px;max-width:900px">
        <div v-for="cat in categories" :key="cat">
          <div style="font-weight:700;color:var(--ds-color-text);margin-bottom:10px">{{ cat }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px 24px">
            <amenity v-for="a in all.filter(x => x.category === cat)" :key="a.key" :amenity="a" size="sm" />
          </div>
        </div>
      </div>`,
  }),
}
