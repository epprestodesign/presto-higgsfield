// TEAM NAME QUALIFIERS / Group Block / Contact & Teams — the group hold contact
// step: primary contact + the teams block. Covers Josh's Group Block feedback:
//   DES-466 typeable team count · DES-464 collapse once every team is added ·
//   DES-467 hidden team list (type each team) · DES-465 confirm before
//   skipping the team list. Step 2 follows the Group Block design doc: one
//   team at a time — dropdown or type it in (list shown), type it (hidden).
//   10/13: the shared team dropdown (DES-477), "Team will be saved as" preview
//   (DES-475), and no Add button for a single typed-in team (DES-476).
import { ref } from 'vue'
import TeamGroupContactBlock from '../../components/teamname/TeamGroupContactBlock.vue'

export default {
  title: 'Team Name Qualifiers/Group Block/Contact & Teams',
  component: TeamGroupContactBlock,
  tags: ['autodocs'],
  argTypes: {
    listHidden: { control: 'boolean', description: 'Registration Settings → Hidden/No Team List: no dropdown, type each team name.' },
    askAgeDivision: { control: 'boolean', description: 'Event setup: organizer requires Age division.' },
    askGender: { control: 'boolean', description: 'Event setup: organizer requires Gender.' },
  },
  args: { listHidden: false, askAgeDivision: true, askGender: true },
  parameters: { layout: 'fullscreen', docs: { description: { component: `
## Contact & Teams — Group Block

The Group Block (hold) contact step: the primary organizer contact beside the
**teams block**.

1. **How many teams?** — type the number or use the arrows (DES-466). Starts
   blank; **Next** waits for a number.
2. **Add the teams, one at a time** — *Team 1 of N*, with **Add & Continue →**
   / **Add & Confirm ✓**. Per the design doc:
   - **Team list shown** — the shared team **dropdown** (type in the Team name
     field to search — DES-477), or *My team isn't listed — type it in*.
   - **Hidden/No Team List** — no dropdown; type each team's name + the
     organizer's qualifiers (DES-467).
   - A typed-in team shows the **Team will be saved as** preview (DES-475).
     With just **1 team**, there's no Add button — it's saved with the block
     (DES-476).
3. Once every team is in, the step **collapses** to *N teams confirmed* with
   **Change count** and **Edit team list** (DES-464).

**I am not holding for a team** asks once more before skipping (DES-465).
Flip the event setup with the **Event Setup Playground** controls (the
prototype's floating *Admin settings* panel).
` } } },
}

const render = (props = {}) => (args) => ({
  components: { TeamGroupContactBlock },
  setup: () => ({ args, props, m: ref({}) }),
  template: `<div style="max-width:720px;margin:0 auto;padding:32px">
    <team-group-contact-block v-bind="{ ...args, ...props }" v-model="m" />
  </div>`,
})

/** Flip the event setup with the controls (list hidden · age · gender). */
export const Playground = {
  name: 'Event Setup Playground',
  render: render(),
}

/** DES-466 — step 1: a typeable count (blank until the organizer enters one). */
export const TeamCount = {
  name: 'Step 1 — Team Count',
  render: render(),
}

/** Team list shown — pick each team from the dropdown (or type it in). */
export const ListShown = {
  name: 'Step 2 — Team List Shown',
  render: render({ initialView: 'seq', initialExpected: 3, initialTeams: ['Arsenal U12 Boys'] }),
}

/** DES-464 — every team added, so the step collapses to a confirmed summary. */
export const Confirmed = {
  name: 'Teams Confirmed',
  render: render({
    initialView: 'confirmed', initialExpected: 3,
    initialTeams: ['Arsenal U12 Boys', 'Arsenal U12 Girls', { name: 'Augusta Arsenal VBC', ageDivision: 'U17', gender: 'Girls', custom: true }],
  }),
}

/** DES-467 — Hidden/No Team List: type each team, one at a time. */
export const ListHidden = {
  name: 'Step 2 — Team List Hidden',
  args: { listHidden: true },
  render: render({ initialView: 'seq', initialExpected: 2 }),
}

/** DES-467 — the last team in the hidden-list flow ("Last one!"). */
export const ListHiddenLast = {
  name: 'Team List Hidden — Last Team',
  args: { listHidden: true },
  render: render({ initialView: 'seq', initialExpected: 2, initialTeams: [{ name: 'Test', ageDivision: 'U17', gender: 'Girls', custom: true }] }),
}

/** DES-476 — 1 team, typed in: no Add button; saved with the group block. */
export const OneTeamTyped = {
  name: 'One Team — Typed In (No Button)',
  args: { listHidden: true },
  render: render({ initialView: 'seq', initialExpected: 1 }),
}

/** DES-465 — "I am not holding for a team" asks once more. */
export const SkipConfirm = {
  name: 'Not Holding — Confirm Step',
  render: render({ initialConfirmSkip: true }),
}

/** DES-465 — skipped: no team list, guests won't pick a team. */
export const NotHolding = {
  name: 'Not Holding — No Team List',
  render: render({ initialNotHolding: true }),
}
