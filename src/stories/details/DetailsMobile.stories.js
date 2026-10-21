// HOTEL DETAILS / Mobile — the mobile-optimized detail experience, consolidated
// in one folder. Reuses the REAL detail stories (no duplication) at phone width.
// The page follows production's reading order (DES-420 individual · DES-423
// group block), since this screen isn't in scope for redesign:
//   • edge-to-edge gallery hero with a circular back button overlaid top-left and
//     "See all photos" bottom-right; it's a swipeable carousel, and the
//     all-photos view is full-screen single-column (top-down)
//   • name + star class, then "About this property"
//   • PropertyFacts: 2-up amenity grid → "See All Amenities" → Check In /
//     Check Out → map card with "View Map" + address → distance
//   • no tab bar on phones (production's page has none)
//   • 16px page gutters throughout
import { Page } from './HotelDetailPage.stories.js'
import { Default as GalleryDefault } from './PhotoGallery.stories.js'
import { Mobile as RoomCardMobile } from './RoomCardGroup.stories.js'

export default {
  title: 'Hotel Details/Mobile',
  tags: ['mobile'],
  parameters: { layout: 'fullscreen' },
}

const mobile = (story, name, parameters) => ({
  ...story, name, globals: { viewport: { value: 'mobile' } },
  ...(parameters ? { parameters } : {}),
})

/** The full hotel detail page at 390 — carousel gallery, sticky tabs, rooms. */
export const HotelDetailPage = mobile(Page, 'Hotel Detail Page')

/** The photo gallery at 390 — swipe the carousel; tap to open the full-screen,
 *  single-column (top-down) all-photos view. */
export const PhotoGallery = mobile(GalleryDefault, 'Photo Gallery', { layout: 'padded' })

/** The Group Block room card at 390 — fills the phone width (single column). */
export const RoomCard = mobile(RoomCardMobile, 'Room Card', { layout: 'padded' })
