// Page configuration — WHAT the booking pages say and show, independent of the
// Brand Kit (HOW they look). Every value is plain JSON.
import { starterContent } from './content.js'

export const PAGE_IDS = ['landing', 'browse', 'details', 'checkout', 'confirmation']

export const PAGE_META = {
  landing: { label: 'Event landing', icon: 'home', required: true },
  browse: { label: 'Browse hotels', icon: 'travel_explore', required: true },
  details: { label: 'Hotel details', icon: 'hotel', required: true },
  checkout: { label: 'Checkout (simulated)', icon: 'shopping_cart_checkout', required: false },
  confirmation: { label: 'Confirmation (simulated)', icon: 'task_alt', required: false },
}

// Landing sections the editor can show/hide/reorder, in default order.
export const LANDING_SECTIONS = [
  { id: 'widget', label: 'Hotel search', lockable: true },
  { id: 'intro', label: 'Event description' },
  { id: 'benefits', label: 'Booking benefits' },
  { id: 'attending', label: "Who's attending" },
  { id: 'eventInfo', label: 'Event information' },
  { id: 'closing', label: 'Closing note' },
  { id: 'ads', label: 'Sponsors' },
]

export function createPages(event = {}) {
  const c = starterContent(event)
  return {
    landing: {
      enabled: true,
      hero: {
        headline: '', // '' → falls back to the event name
        tagline: c.tagline,
        ctaLabel: 'Find your hotel',
        showLogo: true,
        showDates: true,
      },
      sectionOrder: LANDING_SECTIONS.map((s) => s.id),
      sections: {
        widget: { visible: true, showTeams: event.category === 'sports' },
        intro: { visible: true, paragraphs: c.intro },
        benefits: { visible: true, items: c.benefits },
        attending: { visible: true, title: c.attendingTitle, items: c.attending },
        eventInfo: { visible: true, title: 'Event information', ...c.eventInfo },
        closing: { visible: true, paragraphs: c.closing },
        ads: { visible: true },
      },
    },
    browse: { enabled: true, heroSize: 'compact', resultsState: 'full', cardCta: 'Choose your room' },
    details: { enabled: true, hotelIndex: 0, roomsTitle: 'Select your room' },
    checkout: { enabled: false },
    confirmation: { enabled: false },
  }
}
