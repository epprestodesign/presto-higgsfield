// BROWSE HOTELS / Mobile — the mobile-optimized browse experience, consolidated
// in one folder (alongside the Hotel Listing Card stories). Reuses the REAL list
// page stories at phone width, for BOTH flows:
//   • search parameters collapse to a one-line summary card with a pencil that
//     reopens the full booking widget
//   • Filters + Map sit side by side above a full-width "Sort By" select — the
//     map is its own button now, so the Filters sheet no longer carries one
//   • results switch to the compact horizontal card, price block right-aligned
//     with the taxes note and a real "Choose Your Room" CTA
// (DES-419 individual reservation · DES-422 group block)
import { Mobile as ListMobile } from './HotelListPage.stories.js'
import PageFrame from '../../components/PageFrame.vue'
// Aliased: the story export below is named `HotelListPage`, so the component
// import can't share the name.
import HotelListPageComponent from '../../components/browse/HotelListPage.vue'

export default {
  title: 'Browse Hotels/Mobile',
  tags: ['mobile'],
  parameters: { layout: 'fullscreen' },
}

/** The full hotel-list page at 390 — Book Reservation flow (DES-419). */
export const HotelListPage = { ...ListMobile, name: 'Hotel List Page' }

/** The same page at 390 in the Group Block flow (DES-422) — identical chrome;
 *  the cards switch to the group availability wording and "Select Rooms". */
export const HotelListPageGroup = {
  name: 'Hotel List Page — Group Block',
  tags: ['mobile'],
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: () => ({
    components: { PageFrame, HotelListPage: HotelListPageComponent },
    template: `<page-frame cart-mode="hold"><hotel-list-page flow="group" :show-teams="false" /></page-frame>`,
  }),
}
