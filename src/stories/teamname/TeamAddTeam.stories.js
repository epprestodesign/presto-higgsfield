// TEAM NAME QUALIFIERS / Book Reservation / Add a Team — registering an unlisted
// team from the Book Reservation booking widget (typically one team).
import TeamAddTeamModal from '../../components/teamname/TeamAddTeamModal.vue'

export default {
  title: 'Team Name Qualifiers/Book Reservation/Add a Team',
  component: TeamAddTeamModal,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Add a team — Book Reservation

Reached from the Search Teams popover when a team isn't in the list. The **Add**
button stays disabled until the name is non-empty and non-duplicate; entering a
name that matches a registered team surfaces the duplicate-name error.
` } } },
}

/** One empty row — the default for a single reservation. */
export const OneTeam = {
  name: 'Add One Team',
  render: () => ({ components: { TeamAddTeamModal }, template: `<team-add-team-modal :initial-teams="['']" />` }),
}

/** Duplicate-name error — an entered name matches a registered team. */
export const DuplicateError = {
  name: 'Duplicate Name Error',
  render: () => ({ components: { TeamAddTeamModal }, template: `<team-add-team-modal :initial-teams="['Arsenal U12 Boys Select']" />` }),
}
