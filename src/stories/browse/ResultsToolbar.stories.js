// BROWSE HOTELS / Components / Results Toolbar — the header row at the top of the
// results (hotel-card) column: a live property count on the left, Sort By on the
// right. Two states: Book Reservation (count only) and Group Block (count + the
// "— searching for N rooms" hint).
import { ref } from 'vue'
import ResultsToolbar from '../../components/browse/ResultsToolbar.vue'

export default {
  title: 'Browse Hotels/Components/Top Bar/Results Toolbar',
  component: ResultsToolbar,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Results Toolbar
The header row that sits at the top of the **results column** (aligned to the
hotel cards, not spanning the filter rail). Left: a live **property count**.
Right: the **Sort By** control (\`box\` variant — a bordered dropdown showing the
active option).

### States
- **Book Reservation** — \`N properties available\`.
- **Group Block** — \`N properties available — searching for R rooms\`. The
  "searching for R rooms" clause is the group-block hint: a block is trying to
  hold **R rooms** across the selected nights, so results are scoped to
  properties that can (or nearly can) cover that request. It renders in the link
  accent to signal it reflects the active room search.

### Applied-filters messaging
When one or more filters are active, a \`(N filters applied)\` accent clause is
appended after the count (clicking it emits \`clear-filters\`). In the filtered
**0-matches** state it commonly appears alongside the group rooms clause:
\`0 properties available (1 filter applied) — searching for 2 rooms\`, with the
results collapsing to the "…do not match your selected filters" fallback section.
` } } },
}

/** Book Reservation — property count only. */
export const BookReservation = {
  name: 'Book Reservation',
  render: () => ({
    components: { ResultsToolbar },
    setup: () => ({ sort: ref('distance') }),
    template: `<div style="max-width:900px"><results-toolbar :count="13" v-model="sort" /></div>`,
  }),
}

/** Group Block — property count with the "searching for N rooms" hint. */
export const GroupBlock = {
  name: 'Group Block',
  render: () => ({
    components: { ResultsToolbar },
    setup: () => ({ sort: ref('distance') }),
    template: `<div style="max-width:900px"><results-toolbar :count="11" :rooms="2" v-model="sort" /></div>`,
  }),
}

/** Book Reservation, filtered — 0 matches with the "(N filter applied)" clause. */
export const BookReservationFiltered = {
  name: 'Book Reservation (Filtered)',
  render: () => ({
    components: { ResultsToolbar },
    setup: () => ({ sort: ref('distance') }),
    template: `<div style="max-width:900px"><results-toolbar :count="0" :filters-applied="1" v-model="sort" /></div>`,
  }),
}

/** Group Block, filtered — 0 matches with both the filter and rooms clauses. */
export const GroupBlockFiltered = {
  name: 'Group Block (Filtered)',
  render: () => ({
    components: { ResultsToolbar },
    setup: () => ({ sort: ref('distance') }),
    template: `<div style="max-width:900px"><results-toolbar :count="0" :filters-applied="1" :rooms="2" v-model="sort" /></div>`,
  }),
}
