// TEAM NAME QUALIFIERS / Book Reservation / Team Name Select — the Team name
// field on the Book Reservation contact step, covering both event setups:
//   • team list SHOWN  → the shared team dropdown (DES-461 scenario 1)
//   • team list HIDDEN → inline add-team form     (DES-461 scenario 2)
// plus the qualifiers still asked for a listed team (DES-462) or no team
// (DES-469), and the extra confirmation step on "I'm not with a team" (DES-463).
// Josh's 10/13 feedback: DES-468, 470–474.
import { ref } from 'vue'
import TeamSelectField from '../../components/teamname/TeamSelectField.vue'

export default {
  title: 'Team Name Qualifiers/Book Reservation/Team Name Select',
  component: TeamSelectField,
  tags: ['autodocs'],
  argTypes: {
    listHidden: { control: 'boolean', description: 'Event setup: hide the registered-team list (scenario 2).' },
    askAgeDivision: { control: 'boolean', description: 'Event setup: organizer requires Age division.' },
    askGender: { control: 'boolean', description: 'Event setup: organizer requires Gender.' },
  },
  args: { listHidden: false, askAgeDivision: true, askGender: true },
  parameters: { docs: { description: { component: `
## Team Name Select — Book Reservation

The **Team name** field on the Book Reservation contact step. The event's setup
decides which workflow the guest sees:

- **Team list shown** — the shared team dropdown (same as Group Block): type
  right in the field to search, ✓ on the chosen team, no radio buttons
  (DES-470/471). Footer: **My team isn't listed** and **I'm not with a team**.
- **My team isn't listed** — the dropdown is swapped for the add form
  (DES-472), with **Pick from the team list instead** to go back (DES-468).
- **Team list hidden** — no dropdown; the add form *is* the field.

The add form has **no Add Team button** — what the guest types is saved with
the reservation (DES-473). *Age division* and *Gender* stack vertically
(DES-474) and are asked for a listed team (DES-462) **and** for "I'm not with
a team" (DES-469). **I'm not with a team** asks once more first (DES-463).

Use the **Event Setup Playground** controls to flip the three settings.
` } } },
}

const render = (start = {}, extra = {}) => (args) => ({
  components: { TeamSelectField },
  setup: () => ({
    args,
    team: ref(start.team || ''),
    age: ref(start.age || ''),
    gender: ref(start.gender || ''),
    extra,
  }),
  template: `<div style="max-width:560px;min-height:${extra.minHeight || 120}px">
    <label style="font-size:0.8125rem;font-weight:600;display:block;margin-bottom:6px">Team name <i style="color:var(--ds-color-text-danger);font-style:normal">*</i></label>
    <team-select-field v-bind="{ ...args, ...extra.props }" v-model="team" v-model:age-division="age" v-model:gender="gender" />
    <p style="margin-top:16px;color:var(--ds-color-text-subtle);font-size:0.8125rem">Saved → team: <strong>{{ team || '—' }}</strong> · age: <strong>{{ age || '—' }}</strong> · gender: <strong>{{ gender || '—' }}</strong></p>
  </div>`,
})

/** Flip the event setup with the controls (list hidden · age · gender). */
export const Playground = {
  name: 'Event Setup Playground',
  render: render(),
}

// ── Team list shown (scenario 1) ─────────────────────────────────────────

/** Default — empty; open the dropdown to search and pick a team. */
export const ListShown = {
  name: 'List Shown',
  render: render(),
}

/** DES-462 — a listed team is picked, so the organizer's qualifiers are asked. */
export const ListedTeamDetails = {
  name: 'Listed Team → Team Details',
  render: render({ team: 'A3 16 Elite' }),
}

/** DES-472/468 — "My team isn't listed": the add form replaces the dropdown. */
export const NotListed = {
  name: "My Team Isn't Listed",
  render: render({}, { minHeight: 520, props: { initialView: 'add' } }),
}

/** DES-469 — not with a team, but the organizer's qualifiers are still asked. */
export const NoTeamQualifiers = {
  name: 'Not With a Team — Still Asks Qualifiers',
  render: render({ team: "I'm not with a team" }),
}

/** DES-463 — "I'm not with a team" asks once more before accepting it. */
export const NoTeamConfirm = {
  name: 'Not With a Team — Confirm Step',
  render: render({}, { minHeight: 560, props: { initialOpen: true, initialView: 'confirm' } }),
}

// ── Team list hidden (scenario 2) ────────────────────────────────────────

/** DES-461 — no list; the add-team form is the field. */
export const ListHidden = {
  name: 'List Hidden',
  args: { listHidden: true },
  render: render(),
}

/** List hidden + "I'm not with a team" → the same confirmation step. */
export const ListHiddenNoTeam = {
  name: 'List Hidden — Not With a Team',
  args: { listHidden: true },
  render: render({}, { props: { initialView: 'confirm' } }),
}

/** List hidden, filled in — no Add Team button; saved with the reservation (DES-473). */
export const ListHiddenSaved = {
  name: 'List Hidden — Filled In',
  args: { listHidden: true },
  render: render({ team: 'Augusta Arsenal VBC', age: 'U13', gender: 'Girls' }),
}

// ── Qualifier setup ──────────────────────────────────────────────────────

/** Organizer only requires Age division — Gender is hidden everywhere. */
export const AgeOnly = {
  name: 'Age Division Only',
  args: { askGender: false },
  render: render({ team: 'A3 16 Elite' }),
}
