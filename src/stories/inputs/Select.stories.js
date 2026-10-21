/** INPUTS / Select → Quasar: QSelect (native) */
import { ref } from 'vue'
const roomTypes = ['Standard Queen', 'Deluxe King', 'Twin/Double', 'Ocean View Suite', 'Family Room', 'Executive Suite']
export default {
  title: 'Components/Forms/Select',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
Choose one or several values from a list. In booking flows: room type, bed
preference, number of rooms, or property filters.

## When to use
- 6+ options; multi-select with chips; grouped/option-rich data.

## When not to use
- 2–5 visible choices → **Radio Group**. Free text + suggestions → **Autocomplete**.

## Quasar mapping
\`Select → QSelect\` (native).
` } } },
}

export const Basic = {
  render: () => ({ setup: () => ({ v: ref('Deluxe King'), roomTypes }), template: `<q-select v-model="v" :options="roomTypes" outlined label="Room type" style="max-width:320px" />` }),
}

export const Multiple = {
  render: () => ({ setup: () => ({ v: ref(['Free WiFi', 'Breakfast included']), opts: ['Free WiFi','Breakfast included','Pool','Pet friendly','Free parking','Spa'] }), template: `<q-select v-model="v" :options="opts" outlined multiple use-chips label="Amenities" style="max-width:340px" />` }),
}

export const Rooms = {
  parameters: { docs: { description: { story: 'A compact occupancy selector — number of rooms.' } } },
  render: () => ({ setup: () => ({ v: ref(1), opts: [1,2,3,4,5] }), template: `<q-select v-model="v" :options="opts" outlined label="Rooms" style="max-width:200px" />` }),
}
