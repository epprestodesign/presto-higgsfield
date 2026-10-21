import BrandedDetails from '../preview/BrandedDetails.vue'
import { previewProject } from '../preview/previewFixtures.js'
import { HOTELS } from '../../data/upstream/hotels.js'

// Recreates references/102126 Screen-4.png → Screen-7.png on the real Details page.
export default {
  title: 'Brand Studio/Advertising/Details Layouts',
  component: BrandedDetails,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Hotel Details ad presets (`AD_LAYOUT_PRESETS.details`) on the real Presto HotelDetailPage. Placements sit after room selection or beside the property information — never between the gallery, summary and room cards — so the core room-selection UX is untouched.',
      },
    },
  },
}

const hotel = HOTELS[3]

export const BottomBillboard = {
  name: 'Billboard at page bottom (Screen-4)',
  args: { project: previewProject('heartland', { details: 'bottom-billboard', filled: false }), hotel },
}
export const RoomsBillboard = {
  name: 'Billboard after rooms (Screen-5)',
  args: { project: previewProject('heartland', { details: 'rooms-billboard', filled: false }), hotel },
}
export const Rail160 = {
  name: 'Info rail 160×600 ×2 (Screen-6)',
  args: { project: previewProject('heartland', { details: 'rail-160', filled: false }), hotel },
}
export const Rail120 = {
  name: 'Info rail 120×600 ×2 (Screen-7)',
  args: { project: previewProject('heartland', { details: 'rail-120', filled: false }), hotel },
}
export const Rail160Filled = {
  name: 'Info rail 160×600 · with sponsors',
  args: { project: previewProject('heartland', { details: 'rail-160' }), hotel },
}
export const Mobile = {
  name: 'Mobile (rooms billboard → 320×100)',
  args: { project: previewProject('heartland', { details: 'rooms-billboard' }), hotel },
  globals: { viewport: { value: 'mobile' } },
}
