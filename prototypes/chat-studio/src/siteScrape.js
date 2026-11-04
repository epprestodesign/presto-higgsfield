// The event website, "scraped" (mocked: the sample sites aren't real). In the
// real product this is a Firecrawl crawl of the site the brief names (the
// same Firecrawl key brand-studio uses for logos); here each sample brand has
// the pages a crawl would find. Pages are ranked for what these ads are for:
// getting guests booked near the event first (travel and hotels), then the
// help they need to get there and make the most of it (venue and parking,
// schedule, FAQ), then the event and its partners (about, sponsors).
//
// Each page becomes an ad that links back to the site: `ad` holds its
// headline, line and button.

const RANK = { travel: 1, venue: 2, schedule: 3, faq: 4, about: 5, sponsors: 6 }
export const KIND_LABEL = { travel: 'Travel & hotels', venue: 'Venue, map & parking', schedule: 'Schedule & key dates', faq: 'FAQ & help', about: 'About', sponsors: 'Sponsors' }

const SITES = {
  heartland: [
    { path: '/travel', kind: 'travel', title: 'Travel & team hotels', found: 'Mentions the team hotel block, the shuttle to every match and the 10-minute drive from the fields.', ad: { name: 'Team hotels 10 minutes from the fields', tagline: 'Shuttle to every match · June 12–15', cta: 'Find a team hotel' } },
    { path: '/venues', kind: 'venue', title: 'Fields, map & parking', found: 'A map of the eight fields, the parking lots and the shuttle stop.', ad: { name: 'Fields, map & parking', tagline: 'Know where to go before you arrive', cta: 'See the fields map' } },
    { path: '/schedule', kind: 'schedule', title: 'Schedule & results', found: 'Opening night on Thursday, group stage Friday and Saturday, the final on Sunday.', ad: { name: 'The full match schedule', tagline: 'Opening night Thu 12 · the final Sun 15', cta: 'See the schedule' } },
    { path: '/faq', kind: 'faq', title: 'Family FAQ', found: 'Check-in times, parking passes, what to bring and refunds.', ad: { name: 'Questions before you travel?', tagline: 'Check-in, parking, what to bring', cta: 'Read the family FAQ' } },
    { path: '/about', kind: 'about', title: 'About the Cup', found: '120 club teams from six states; four days of youth soccer under the lights.', ad: { name: 'Four days of youth soccer under the lights', tagline: '120 club teams · Overland Park', cta: 'About the Cup' } },
    { path: '/sponsors', kind: 'sponsors', title: 'Our sponsors', found: 'Lists the local partners: Prairie Fire BBQ, Velo Hydration and more.', ad: { name: 'Brought to you by our partners', tagline: 'Local businesses behind the Cup', cta: 'Meet our sponsors' } },
  ],
}

// Any other event: the pages most event sites have.
function generic(b) {
  const where = b.place ? b.place.split(',')[0].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : 'the venue'
  return [
    { path: '/travel', kind: 'travel', title: 'Where to stay', found: `Recommended hotels near ${where} and the group rate.`, ad: { name: `Where to stay in ${where}`, tagline: 'Group rates near the venue', cta: 'Find a hotel' } },
    { path: '/venue', kind: 'venue', title: 'Venue & getting there', found: 'Address, parking and how to get there.', ad: { name: 'Getting there', tagline: 'Venue, parking and directions', cta: 'Plan your trip' } },
    { path: '/schedule', kind: 'schedule', title: 'Schedule', found: `What happens when, ${b.dates || 'all weekend'}.`, ad: { name: 'What’s on, and when', tagline: b.dates || 'The full schedule', cta: 'See the schedule' } },
    { path: '/faq', kind: 'faq', title: 'FAQ', found: 'Answers to the most common questions.', ad: { name: 'Questions?', tagline: 'Everything guests ask us', cta: 'Read the FAQ' } },
    { path: '/about', kind: 'about', title: `About ${b.short}`, found: b.tagline || 'The story of the event.', ad: { name: `About ${b.short}`, tagline: b.tagline || '', cta: 'Learn more' } },
    { path: '/sponsors', kind: 'sponsors', title: 'Sponsors', found: 'The partners who make it happen.', ad: { name: 'Our sponsors', tagline: 'Meet the partners', cta: 'See our sponsors' } },
  ]
}

// No website (the brief had none, and the organiser uploaded a logo or went
// without): nothing to scrape, so the ads link to the event's own Presto pages.
function presto(b) {
  const where = b.place ? b.place.split(',')[0].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : 'the venue'
  return [
    { path: '/', kind: 'travel', title: 'Book your stay', found: 'The event’s Presto page: event rates at hotels near the venue.', ad: { name: 'Book your stay', tagline: `${b.short} · event rates nearby`, cta: 'Find a hotel' } },
    { path: '/hotels', kind: 'venue', title: 'Hotels near the venue', found: 'Hotel browse, sorted by distance from the venue.', ad: { name: `Hotels near ${where}`, tagline: 'Sorted by distance from the venue', cta: 'See the hotels' } },
    { path: '/manage', kind: 'faq', title: 'Manage your booking', found: 'Change or cancel a room, or contact the hotel.', ad: { name: 'Already booked?', tagline: 'Change or cancel your room', cta: 'Manage booking' } },
  ]
}

/** The site's pages, ranked (travel and hotels first), with full URLs (`where` is the short form shown). */
export function scrapeSite(brand) {
  if (brand.noSite) return presto(brand).map((pg, i) => ({ ...pg, id: pg.path, rank: i + 1, url: `presto:/${brand.id}${pg.path}`, where: `Presto · ${pg.title}` }))
  const pages = SITES[brand.id] || generic(brand)
  return [...pages].sort((a, b) => RANK[a.kind] - RANK[b.kind]).map((pg, i) => ({ ...pg, id: pg.path, rank: i + 1, url: `https://${brand.website}${pg.path}`, where: `${brand.website}${pg.path}` }))
}

/** The pages picked to start with: travel and hotels, plus the next two most useful. */
export const defaultLinks = (pages) => pages.slice(0, 3).map((p) => p.id)
