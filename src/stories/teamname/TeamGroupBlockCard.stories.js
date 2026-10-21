// TEAM NAME QUALIFIERS / Group Block / Group Block Details — the cart / checkout
// order-rail summary for a group hold: the registered teams drive the room
// estimate shown here.
import TeamGroupBlockCard from '../../components/teamname/TeamGroupBlockCard.vue'

export default {
  title: 'Team Name Qualifiers/Group Block/Group Block Details',
  component: TeamGroupBlockCard,
  tags: ['autodocs'],
  argTypes: {
    roomsPerTeam: { control: { type: 'number' } },
    roomsAdded: { control: { type: 'number' } },
    initialOpen: { control: 'boolean' },
  },
  parameters: { docs: { description: { component: `
## Group Block Details — Group Block

The first card in the order rail for a **group hold** — the Group Block
counterpart to Book Reservation's *Order Rail Summary*. The registered teams
drive the **estimated rooms needed** (~6 rooms/team) and the rooms-added progress.
` } } },
}

/** Five registered teams: 5 × 6 = 30 est. rooms, 2 added. */
export const FiveTeams = {
  name: 'Five Teams (2 of 30 rooms)',
  render: () => ({ components: { TeamGroupBlockCard }, template: `<team-group-block-card />` }),
}

/** A single team — minimal block. */
export const OneTeam = {
  name: 'One Team',
  render: () => ({ components: { TeamGroupBlockCard }, template: `<team-group-block-card :teams="['Arsenal U12 Boys Select']" :rooms-added="3" />` }),
}

/** Estimate reached — the progress bar turns success-green. */
export const EstimateMet = {
  name: 'Estimate Reached',
  render: () => ({ components: { TeamGroupBlockCard }, template: `<team-group-block-card :teams="['Team 1', 'Team 2']" :rooms-added="12" block-name="Spring Cup — Eagles SC" />` }),
}

/** Collapsed — the high-level summary row only. */
export const Collapsed = {
  name: 'Collapsed',
  render: () => ({ components: { TeamGroupBlockCard }, template: `<team-group-block-card :initial-open="false" />` }),
}
