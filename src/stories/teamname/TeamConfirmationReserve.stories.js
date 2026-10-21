// TEAM NAME QUALIFIERS / Book Reservation / Confirmation — the post-checkout
// success screen with the Team section for the Book Reservation flow, including
// the "booked as an individual" (no team) edge case.
import TeamConfirmationPage from '../../components/teamname/TeamConfirmationPage.vue'

const reserveData = {
  contactName: 'Alex Smith',
  confirmationId: '72055771948934',
  reservedOn: 'Mon, 06/14/2027 02:14 PM EST',
  guest: 'Alex Smith — (555) 018-2245',
  email: 'alex.smith@eventpipe.com',
  hotels: [{
    name: 'Marriott Downtown', stars: 4, address: '123 Main St, Kansas City, MO', seed: 1,
    checkIn: 'Wed, 06/16/2027 03:00 PM', checkOut: 'Sat, 06/19/2027 11:00 AM',
    rooms: [{ type: 'King Bedroom', note: '1 King Bed · Sleeps 2', nights: [
      { date: 'Wed, 06/16/2027', qty: 1, price: 110 },
      { date: 'Thu, 06/17/2027', qty: 1, price: 115 },
      { date: 'Fri, 06/18/2027', qty: 1, price: 120 },
    ] }],
    totals: { taxes: 15, roomCost: 345, amountPaid: 158, balanceDue: 270 },
  }],
  policies: [{ hotel: 'Marriott Downtown', items: [
    { title: 'Cancellation Policy', body: 'Free cancellation before Jun 14, 2027. After that the first night plus tax is charged.' },
  ] }],
}

export default {
  title: 'Team Name Qualifiers/Book Reservation/Confirmation',
  component: TeamConfirmationPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: `
## Confirmation — Book Reservation

The success screen with a **Team** section echoing the booked team + its
qualifiers (age division · gender). Edge case: **booked as an individual**
("I'm not with a team") shows a no-team note instead of the team card.
` } } },
}

/** Confirmed with a team + qualifiers. */
export const WithTeam = {
  name: 'With Team',
  render: () => ({ components: { TeamConfirmationPage }, setup: () => ({ data: reserveData }), template: `<team-confirmation-page mode="reserve" :data="data" team-flow="reserve" :team="{ name: 'Arsenal U12 Boys Select', ageDivision: 'U12', gender: 'Boys' }" />` }),
}

/** Edge case — "I'm not with a team": booked as an individual. */
export const NoTeam = {
  name: 'No Team (Individual)',
  render: () => ({ components: { TeamConfirmationPage }, setup: () => ({ data: reserveData }), template: `<team-confirmation-page mode="reserve" :data="data" team-flow="reserve" :no-team="true" />` }),
}
