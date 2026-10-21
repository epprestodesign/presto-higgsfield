// LANDING PAGE / Mobile — the mobile-optimized landing experience, consolidated
// in one folder. These reuse the REAL landing stories (no duplication) but open
// at phone width (390) so you see the mobile treatment directly:
//   • shortened hero matching the /hotels hero's text + logo scale
//   • booking widget with full-screen date + travelers dialogs (tap to open)
import { CoreBookingWidget } from './BookReservation.stories.js'

export default {
  title: 'Landing Page/Mobile',
  tags: ['mobile'],
  parameters: { layout: 'fullscreen' },
}

// Reuse an existing story but force the mobile viewport on the canvas.
const mobile = (story, name) => ({ ...story, name, globals: { viewport: { value: 'mobile' } } })

/** The full landing page at 390 — compact hero + booking widget (tap the date /
 *  travelers fields to see the full-screen mobile dialogs). */
export const LandingPage = mobile(CoreBookingWidget, 'Landing Page')
