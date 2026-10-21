// BROWSE HOTELS / Components / Filter Rail — the composed left-rail filter module.
import FilterRail from '../../components/browse/FilterRail.vue'

export default {
  title: 'Browse Hotels/Components/Left Rail/Filter Rail',
  component: FilterRail,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
The Browse Hotels **left-rail filter module** — one composed bar that stacks every
filter section in order:

1. **View Map**
2. **Exact Matches Only** — toggle (hide hotels that don't match all filters)
3. **Search by Property Name**
4. **Parent Brand** — + Apply Brand Filter
5. **Amenities** — + More amenity options + Apply Amenity Filters
6. **Search Radius** — slider + miles + Apply Radius Filter
7. **Your Budget** — Per Night / Total Stay + Apply Budget Filter
8. **Minimum Star Rating**
9. **Room Type** — + Apply Room Type Filters
10. **Clear All Filters**

Reuses Quasar primitives + the amenities data lib. Emits \`view-map\` when the
View Map button is pressed.
` } } },
}

/** The full filter rail (rendered at rail width). */
export const Default = {
  render: () => ({ components: { FilterRail }, template: '<div style="max-width:280px"><filter-rail /></div>' }),
}
