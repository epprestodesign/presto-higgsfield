// HOTEL DETAILS / Group Block — the fully-rendered hotel detail page for the
// group-block flow, wrapped in the app shell (Global Nav + footer).
import HotelDetailPage from '../../components/details/HotelDetailPage.vue'
import PageFrame from '../../components/PageFrame.vue'
import { hotelBase, groupRooms } from './_detail-data.js'

export default {
  title: 'Hotel Details/Group Block',
  component: HotelDetailPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: `
## Hotel Detail Page — Group Block
The fully-composed page inside the app shell — Global Nav, real hero gallery,
summary header, the Group Block **Rooms** carousel (per-night quantity steppers,
starting price, Add to Cart), about / amenities / policies, and footer. Same
section order as Book Reservation.
` } } },
}

/** Full rendered page — real imagery + detailed rooms with per-night steppers. */
export const Page = {
  render: () => ({
    components: { PageFrame, HotelDetailPage },
    setup: () => ({ args: { ...hotelBase, rooms: groupRooms, roomsFlow: 'group', roomsTitle: 'Hold Rooms for Your Group', roomsSubtitle: 'Choose how many rooms to hold each night.' } }),
    template: `<page-frame cart-mode="hold"><hotel-detail-page v-bind="args" /></page-frame>`,
  }),
}

// Booking-widget variants — the booking widget shown under the Global Nav on top
// of the FULL core page experience (fixed anchor tabs, photo gallery, summary,
// rooms, about, amenities, policies). Teams includes the Registered Team(s)
// field; Core omits it.
const widgetPage = (widgetShowTeams) => () => ({
  components: { PageFrame, HotelDetailPage },
  setup: () => ({ args: { ...hotelBase, rooms: groupRooms, roomsFlow: 'group', roomsTitle: 'Hold Rooms for Your Group', roomsSubtitle: 'Choose how many rooms to hold each night.', showWidget: true, widgetShowTeams } }),
  template: `<page-frame cart-mode="hold"><hotel-detail-page v-bind="args" /></page-frame>`,
})

/** Global Nav + Teams Booking Widget + full core page. */
export const TeamsBookingWidget = { name: 'Teams Booking Widget', render: widgetPage(true) }

/** Global Nav + Core Booking Widget (no team field) + full core page. */
export const CoreBookingWidget = { name: 'Core Booking Widget', render: widgetPage(false) }
