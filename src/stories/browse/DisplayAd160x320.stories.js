// BROWSE HOTELS / Display Ads / 160×320 — half skyscraper ad slot.
import DisplayAd from '../../components/DisplayAd.vue'
import PageFrame from '../../components/PageFrame.vue'
import HotelListPage from '../../components/browse/HotelListPage.vue'

export default {
  title: 'Browse Hotels/Components/Right Rail/Display Ads/160×320',
  component: DisplayAd,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: 'A **160×320** half-skyscraper Display Ad slot, as used in the Browse Hotels right rail.' } } },
}

/** The ad slot on its own. */
export const Default = {
  render: () => ({ components: { DisplayAd }, template: '<display-ad :width="160" :height="320" />' }),
}

/** The ad shown in context — the Core Booking Widget · Book Reservation · Browse Hotels page with the 160×320 half-skyscraper in the right rail. */
export const InContext = {
  name: 'In Context',
  parameters: { layout: 'fullscreen' },
  render: () => ({
    components: { PageFrame, HotelListPage },
    template: `<page-frame cart-mode="reserve"><hotel-list-page flow="reserve" :show-teams="false" :ad-size="[160, 320]" /></page-frame>`,
  }),
}
