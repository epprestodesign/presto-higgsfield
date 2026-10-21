// LANDING PAGE / Book Reservation — the fully composed landing page for the
// individual reservation flow, shown with each Booking Widget state:
//   Teams Booking Widget (Registered Team(s) field) and Core Booking Widget
//   (generic hotel search, no team field).
import LandingPage from '../../components/LandingPage.vue'

export default {
  title: 'Landing Page/Book Reservation',
  component: LandingPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Book Reservation
The event **Landing Page** for the **Book Reservation** (individual) flow —
Global Nav → Hero → Booking Widget → event description → Display Ads → Footer.

Two widget states:
- **Teams Booking Widget** — the widget includes the **Registered Team(s)** field
  (Booking type · Team · Check-in – Check-out · Travelers).
- **Core Booking Widget** — the **team field is removed** for a generic hotel
  search (Booking type · Check-in – Check-out · Travelers).
` } } },
}

/** Landing page — Teams Booking Widget (with the Registered Team(s) field). */
export const TeamsBookingWidget = {
  name: 'Teams Booking Widget',
  render: () => ({ components: { LandingPage }, template: '<landing-page mode="reservations" :show-teams="true" />' }),
}

/** Landing page — Core Booking Widget (no team field). */
export const CoreBookingWidget = {
  name: 'Core Booking Widget',
  render: () => ({ components: { LandingPage }, template: '<landing-page mode="reservations" :show-teams="false" />' }),
}
