// LANDING PAGE / Group Block — the fully composed landing page for the group
// block flow, shown with each Booking Widget state:
//   Teams Booking Widget (Registered Team(s) field) and Core Booking Widget
//   (generic search, no team field).
import LandingPage from '../../components/LandingPage.vue'

export default {
  title: 'Landing Page/Group Block',
  component: LandingPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Group Block
The event **Landing Page** for the **Group Block** flow — Global Nav → Hero →
Booking Widget (group mode, hold-cart nav) → event description → Display Ads →
Footer.

Two widget states:
- **Teams Booking Widget** — the widget includes the **Registered Team(s)** field
  (Booking type · Team(s) · Travelers).
- **Core Booking Widget** — the **team field is removed** for a generic group
  search (Booking type · Travelers).
` } } },
}

/** Landing page — Teams Booking Widget (with the Registered Team(s) field). */
export const TeamsBookingWidget = {
  name: 'Teams Booking Widget',
  render: () => ({ components: { LandingPage }, template: '<landing-page mode="group" :show-teams="true" />' }),
}

/** Landing page — Core Booking Widget (no team field). */
export const CoreBookingWidget = {
  name: 'Core Booking Widget',
  render: () => ({ components: { LandingPage }, template: '<landing-page mode="group" :show-teams="false" />' }),
}
