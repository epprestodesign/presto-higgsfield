// TEAM NAME QUALIFIERS / Group Block / Confirmation — the post-checkout success
// screen with the Team section for the Group Block flow: the registered teams +
// estimated rooms, including single-team and "not holding for a team" edge cases.
import TeamConfirmationPage from '../../components/teamname/TeamConfirmationPage.vue'

const holdData = {
  contactName: 'Coach Lee',
  groupId: 'G-00584977',
  reservedOn: 'Thu, 06/11/2027 03:31 PM EST',
  releaseDate: 'Thu, 06/18/2027 11:59 PM PT',
  organizationName: 'Eagles SC',
  groupContact: 'Coach Lee — (518) 796-3050',
  email: 'coach.lee@eventpipe.com',
  hotels: [{
    name: 'Embassy Suites Chicago Downtown', stars: 4, address: '511 N Columbus Dr, Chicago, IL', seed: 2,
    checkIn: 'Wed, 06/16/2027 03:00 PM', checkOut: 'Sat, 06/19/2027 11:00 AM',
    rooms: [{ type: 'Two-Room Suite King', note: '1 King Bed · Sleeps 4', nights: [
      { date: 'Wed, 06/16/2027', qty: 4, price: 269 },
      { date: 'Thu, 06/17/2027', qty: 4, price: 269 },
    ] }],
  }],
  policies: [{ hotel: 'Embassy Suites Chicago Downtown', items: [
    { title: 'Group Cancellation Policy', body: 'Held rooms may be released without charge until the block release date shown above.' },
  ] }],
}

export default {
  title: 'Team Name Qualifiers/Group Block/Confirmation',
  component: TeamConfirmationPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
## Confirmation — Group Block

The success screen with a **Team** section showing the registered teams held in
the block and the estimated rooms. Edge cases: a **single team**, and **not
holding for a team** (the block isn't tied to a specific team).
` } } },
}

/** Multiple teams held in the block. */
export const TeamsHeld = {
  name: 'Teams Held',
  render: () => ({ components: { TeamConfirmationPage }, setup: () => ({ data: holdData }), template: `<team-confirmation-page mode="hold" :data="data" team-flow="group" :teams="['Team 1', 'Team 2', 'Arsenal U12 Boys Select', 'Falcons U10 Boys', 'Eagles SC 15 Premier']" :rooms-added="12" />` }),
}

/** A single team held. */
export const SingleTeam = {
  name: 'Single Team',
  render: () => ({ components: { TeamConfirmationPage }, setup: () => ({ data: holdData }), template: `<team-confirmation-page mode="hold" :data="data" team-flow="group" :teams="['Arsenal U12 Boys Select']" :rooms-added="4" />` }),
}

/** Edge case — not holding for a specific team. */
export const NotHolding = {
  name: 'Not Holding for a Team',
  render: () => ({ components: { TeamConfirmationPage }, setup: () => ({ data: holdData }), template: `<team-confirmation-page mode="hold" :data="data" team-flow="group" :no-team="true" />` }),
}
