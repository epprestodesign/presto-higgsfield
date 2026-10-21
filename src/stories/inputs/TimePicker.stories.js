/** INPUTS / Time Picker → a simple 30-minute-interval dropdown (QSelect).
 *  Replaces the clock UI (QTime) with a scannable list of times — the pattern
 *  people expect for arrival time / pickup / reservation slots. */
import { ref } from 'vue'

// 30-minute interval options across the day, 12-hour AM/PM labels.
const buildTimes = (startHour = 0, endHour = 24) => {
  const out = []
  for (let h = startHour; h < endHour; h++) {
    for (const m of [0, 30]) {
      const ampm = h < 12 ? 'AM' : 'PM'
      const hr = h % 12 === 0 ? 12 : h % 12
      out.push(`${hr}:${String(m).padStart(2, '0')} ${ampm}`)
    }
  }
  return out
}
const allTimes = buildTimes()
const windowTimes = buildTimes(15, 22).concat('10:00 PM') // 3:00 PM – 10:00 PM

export default {
  title: 'Components/Forms/Time Picker',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Overview
Pick a time of day from a **30-minute-interval dropdown** — a simple, scannable
list instead of a clock face. Used for estimated **arrival time**, transfer
pickup, or a reservation slot.

## Why a dropdown
A list of half-hour slots is faster and less error-prone than a clock UI for the
coarse times booking flows need. Built on **QSelect** with a clock-icon field.

## When not to use
- A date → **Date Picker**.
- Precise to-the-minute entry → a plain **Text Field** with validation.

## Variants
Arrival time (in a field) · Basic (bare dropdown) · Check-in window (restricted range).
` } } },
}

/** Estimated arrival time — dropdown of 30-min slots inside a field. */
export const ArrivalTime = {
  render: () => ({
    setup: () => ({ time: ref('3:00 PM'), allTimes }),
    template: `
      <q-select v-model="time" :options="allTimes" outlined label="Estimated arrival"
        hint="Check-in from 3:00 PM" style="max-width:320px" behavior="menu">
        <template #prepend><q-icon name="schedule" /></template>
      </q-select>`,
  }),
}

/** Basic — bare 30-minute dropdown. */
export const Basic = {
  render: () => ({
    setup: () => ({ time: ref('9:00 AM'), allTimes }),
    template: `
      <q-select v-model="time" :options="allTimes" outlined label="Time"
        style="max-width:240px" behavior="menu">
        <template #prepend><q-icon name="schedule" /></template>
      </q-select>`,
  }),
}

/** Check-in window only (3:00 PM – 10:00 PM) — restricted slot list (edge case). */
export const CheckInWindow = {
  render: () => ({
    setup: () => ({ time: ref('3:00 PM'), windowTimes }),
    template: `
      <q-select v-model="time" :options="windowTimes" outlined label="Check-in time"
        hint="Front desk staffed 3:00 PM – 10:00 PM" style="max-width:320px" behavior="menu">
        <template #prepend><q-icon name="schedule" /></template>
      </q-select>`,
  }),
}
