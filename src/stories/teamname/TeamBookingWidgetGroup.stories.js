// TEAM NAME QUALIFIERS / Group Block / Booking Widget — the multi-team selection
// surface for the Group Block flow (hold rooms for several teams).
import TeamBookingWidget from '../../components/teamname/TeamBookingWidget.vue'

export default {
  title: 'Team Name Qualifiers/Group Block/Booking Widget',
  component: TeamBookingWidget,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Booking Widget — Group Block (multiple teams)

The **Group Block** team selection: open **Registered Team(s)** for the multi-
select popover — checkboxes with *My Teams* and *All of <club>* group toggles,
filterable by name / age / gender — plus the add-a-team entry point.
` } } },
}

/** Multi-team selection (Hold Rooms for Group or Team). */
export const MultipleTeams = {
  name: 'Multiple Team Select',
  render: () => ({ components: { TeamBookingWidget }, template: `<div style="max-width:1040px"><team-booking-widget mode="group" :tabs="false" :mode-dropdown="true" /></div>` }),
}
