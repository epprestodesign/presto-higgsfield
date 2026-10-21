// TEAM NAME QUALIFIERS / Book Reservation / Booking Widget — the single-team
// selection surface for the Book Reservation flow (one registered team).
import TeamBookingWidget from '../../components/teamname/TeamBookingWidget.vue'

export default {
  title: 'Team Name Qualifiers/Book Reservation/Booking Widget',
  component: TeamBookingWidget,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: `
## Booking Widget — Book Reservation (single team)

The **Book Reservation** team selection: open the **Registered Team Name** field
for the *Search Teams* popover — a single-select radio list grouped by club,
filterable by name / age / gender — plus the *"Don't see your team? Add them"*
entry point. Forked copy; safe to iterate without affecting the live widget.
` } } },
}

/** Single-team selection (Book Reservations). Open Registered Team Name → radio
 *  list grouped by club, filter by name/age/gender. */
export const SingleTeam = {
  name: 'Single Team Select',
  render: () => ({ components: { TeamBookingWidget }, template: `<div style="max-width:1000px"><team-booking-widget mode="reservations" :tabs="false" /></div>` }),
}

/** Tabs layout — the inline "Add them" link shows below the fields. */
export const TabsLayout = {
  name: 'Tabs Layout',
  render: () => ({ components: { TeamBookingWidget }, template: `<div style="max-width:1040px"><team-booking-widget mode="reservations" :tabs="true" /></div>` }),
}
