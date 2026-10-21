// TEAM NAME QUALIFIERS / Group Block / Add a Team — registering unlisted teams
// from the Group Block booking widget (often several teams at once).
import TeamAddTeamModal from '../../components/teamname/TeamAddTeamModal.vue'

export default {
  title: 'Team Name Qualifiers/Group Block/Add a Team',
  component: TeamAddTeamModal,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Add a team — Group Block

For a group block an organizer often adds several teams at once. "Add another
team" grows the list ("Add N Teams"); each row is validated for empty / duplicate
names before the button enables.
` } } },
}

/** Several rows — the button reads "Add N Teams". */
export const MultipleTeams = {
  name: 'Add Multiple Teams',
  render: () => ({ components: { TeamAddTeamModal }, template: `<team-add-team-modal :initial-teams="['Falcons U10 Boys', 'Falcons U10 Girls']" />` }),
}

/** Duplicate-name error — an entered name matches a registered team. */
export const DuplicateError = {
  name: 'Duplicate Name Error',
  render: () => ({ components: { TeamAddTeamModal }, template: `<team-add-team-modal :initial-teams="['Arsenal U12 Boys Select']" />` }),
}
