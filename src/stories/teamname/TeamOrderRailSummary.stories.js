// TEAM NAME QUALIFIERS / Book Reservation / Order Rail Summary — the collapsible
// "Team" summary that leads the cart / checkout order rail for the Book
// Reservation flow, echoing the team name + its qualifiers.
import TeamQualifierSummary from '../../components/teamname/TeamQualifierSummary.vue'

export default {
  title: 'Team Name Qualifiers/Book Reservation/Order Rail Summary',
  component: TeamQualifierSummary,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Order Rail Summary — Book Reservation

The single-team counterpart to the Group Block's *Group Block Details* card:
a collapsible **Team** summary in the order rail showing the team name and its
qualifiers (age division · gender).
` } } },
}

/** Expanded — team chip + the Team qualifiers row. */
export const TeamSummary = {
  name: 'Team Summary',
  render: () => ({ components: { TeamQualifierSummary }, template: `<team-qualifier-summary />` }),
}

/** Collapsed — team name + qualifiers on one line. */
export const Collapsed = {
  name: 'Collapsed',
  render: () => ({ components: { TeamQualifierSummary }, template: `<team-qualifier-summary :initial-open="false" />` }),
}
