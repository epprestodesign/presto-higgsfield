import BrandedDetails from './BrandedDetails.vue'
import { previewProject } from './previewFixtures.js'
import { HOTELS } from '../../data/upstream/hotels.js'

export default {
  title: 'Brand Studio/Branded Preview/Hotel Details',
  component: BrandedDetails,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The real Presto **HotelDetailPage** (gallery, summary, rooms, amenities, policies) in the organizer’s branding, with the Details ad slots (`details.afterRooms`, `details.rail`, `details.bottom`) placed so they never interrupt room selection.',
      },
    },
  },
}

export const Heartland = { name: 'Sports · Heartland Cup', args: { project: previewProject('heartland'), hotel: HOTELS[3] } }
export const Fintech = { name: 'Conference · rail ads', args: { project: previewProject('fintech', { details: 'rail-160' }), hotel: HOTELS[8] } }
export const Wedding = { name: 'Wedding · no ads', args: { project: previewProject('wedding', { ads: false }), hotel: HOTELS[12] } }
export const Mobile = {
  args: { project: previewProject('heartland', { details: 'rooms-billboard' }), hotel: HOTELS[3] },
  globals: { viewport: { value: 'mobile' } },
}
