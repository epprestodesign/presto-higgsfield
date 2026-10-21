// CHECKOUT EXPERIENCE / Steps / Contact Info / Group Block / Teams Block —
// every edge case / instance of the group teams-block widget broken out.
import { ref } from 'vue'
import GroupTeamsBlock from '../../components/checkout/GroupTeamsBlock.vue'

export default {
  title: 'Checkout Experience/Components/Group Block/Contact Info/Teams Block',
  component: GroupTeamsBlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Teams Block — states
The group-block **Contact & Group Information** widget: primary contact + a
two-step teams flow (how many teams → select & add teams / add unlisted), plus
the "not holding for a team" path and validation. Each edge case is broken out
below.
` } } },
}

// Render the widget with a given set of initial-state props.
const state = (attrs) => () => ({
  components: { GroupTeamsBlock },
  setup: () => ({ m: ref({}), attrs }),
  template: `<div style="max-width:640px;margin:0 auto;padding:32px"><group-teams-block v-model="m" v-bind="attrs" /></div>`,
})

const SAMPLE_TEAMS = ['Arsenal U12 Boys', 'Chelsea U14 Girls']

/** Step 1 of 2 — how many teams might share the block (stepper + "not holding"). */
export const Step1HowManyTeams = { name: 'Step 1 · How Many Teams', render: state({ initialView: 'count', initialExpected: 1 }) }

/** Step 2 of 2 — select & add teams (search + list), nothing added yet. */
export const Step2SelectTeams = { name: 'Step 2 · Select & Add Teams', render: state({ initialView: 'list', initialExpected: 3 }) }

/** Step 2 with teams already added — chips + status + Group Block Name field. */
export const TeamsAdded = { name: 'Step 2 · Teams Added', render: state({ initialView: 'list', initialExpected: 3, initialTeams: SAMPLE_TEAMS }) }

/** Multiple teams expected (checkbox multi-select with a remaining-count limit). */
export const MultipleTeams = { name: 'Multiple Teams (limit)', render: state({ initialView: 'list', initialExpected: 4, initialTeams: ['Arsenal U12 Boys'] }) }

/** Add an unlisted team — Org/Team name + Age division + Gender. */
export const AddUnlistedTeam = { name: 'Add Unlisted Team', render: state({ initialView: 'add', initialExpected: 2 }) }

/** "I am not holding for a team" after-state. */
export const NotHoldingForTeam = { name: 'Not Holding For A Team', render: state({ initialNotHolding: true }) }

/** Validation — required contact fields + "add at least one team" surfaced. */
export const ValidationErrors = { name: 'Validation Errors', render: state({ initialView: 'list', initialExpected: 2, showErrors: true }) }
