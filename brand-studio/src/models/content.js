// Starter copy for a new booking page, by event category. Organizers edit all
// of it in the Studio; this just means no preview ever starts blank.
import { formatDateRange, locationLabel } from './event.js'

const BY_CATEGORY = {
  sports: {
    tagline: 'Official team hotels. Book early, stay close to the fields.',
    benefits: [
      'Official event hotels near the venue',
      'Exclusive team and family rates when available',
      'Flexible rooms for players, coaches and families',
      'Instant confirmation, easy changes',
      'Keep your whole club in one place',
    ],
    attendingTitle: "Who's attending?",
    attending: [
      { title: 'Players', text: 'Rest up between matches with hotels minutes from the fields.' },
      { title: 'Coaches & clubs', text: 'Keep the roster together with block rates and simple group booking.' },
      { title: 'Families & fans', text: 'Find family-friendly rooms near restaurants and local attractions.' },
    ],
  },
  conference: {
    tagline: 'Preferred hotels within walking distance of every session.',
    benefits: [
      'Negotiated attendee rates at preferred hotels',
      'Walkable to the convention center',
      'Free cancellation on most rooms',
      'Business-ready rooms with fast Wi-Fi',
      'One booking page for your whole team',
    ],
    attendingTitle: "Who's attending?",
    attending: [
      { title: 'Attendees', text: 'Stay steps from the keynote hall and the networking events.' },
      { title: 'Speakers & sponsors', text: 'Reserve suites near the green room and the expo floor.' },
      { title: 'Teams', text: 'Book several rooms at once and keep everyone on the same itinerary.' },
    ],
  },
  wedding: {
    tagline: 'Celebrate with us. Rooms are held for our guests.',
    benefits: [
      'Rooms held for wedding guests at special rates',
      'Close to the ceremony and reception',
      'Shuttle-friendly hotels',
      'Easy changes if your plans shift',
    ],
    attendingTitle: 'For our guests',
    attending: [
      { title: 'Family', text: 'Suites and connecting rooms for the whole family.' },
      { title: 'Friends', text: 'Stay close to the celebration and to each other.' },
    ],
  },
  festival: {
    tagline: 'Stay close to the stages. Rooms are going fast.',
    benefits: ['Hotels near every stage', 'Late check-out at select hotels', 'Rideshare-friendly pickup points', 'Instant confirmation'],
    attendingTitle: 'Plan your weekend',
    attending: [
      { title: 'Fans', text: 'Walkable hotels so you never miss a set.' },
      { title: 'Artists & crew', text: 'Quiet rooms with early check-in.' },
    ],
  },
  other: {
    tagline: 'Official hotels for our attendees.',
    benefits: ['Official partner hotels', 'Special attendee rates', 'Instant confirmation', 'Flexible cancellation on most rooms'],
    attendingTitle: "Who's attending?",
    attending: [{ title: 'Attendees', text: 'Find a comfortable stay close to the action.' }],
  },
}

export function starterContent(event = {}) {
  const c = BY_CATEGORY[event.category] || BY_CATEGORY.other
  const where = event.venue ? `${event.venue} in ${event.city}` : locationLabel(event) || 'the host city'
  const when = formatDateRange(event.startDate, event.endDate)
  return {
    tagline: c.tagline,
    intro: [
      event.description?.trim() ||
        `${event.name || 'Our event'} comes to ${where}${when ? `, ${when}` : ''}. Book your stay through our official booking page to get event rates at hotels close to the venue.`,
    ],
    benefits: [...c.benefits],
    attendingTitle: c.attendingTitle,
    attending: c.attending.map((a) => ({ ...a })),
    eventInfo: {
      dates: when,
      lines: [event.venue, locationLabel(event)].filter(Boolean),
    },
    closing: ['Book early for the best selection. Rooms near the venue sell out first.'],
  }
}
