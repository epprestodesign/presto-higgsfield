// APP SHELL / Mobile — the mobile-optimized app shell, consolidated in one folder.
// Reuses the REAL Global Nav story at phone width (Contact Us + Manage Booking
// collapse into the hamburger; only the brand + cart icon stay in the bar).
import { Mobile as NavMobile } from './GlobalNav.stories.js'

export default {
  title: 'App Shell/Mobile',
  tags: ['mobile'],
  parameters: { layout: 'fullscreen' },
}

/** The Global Nav at 390 — condensed bar + hamburger menu. */
export const GlobalNav = { ...NavMobile, name: 'Global Nav' }
