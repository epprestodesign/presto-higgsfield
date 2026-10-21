// Event + organizer intake model and validation.

export const EVENT_CATEGORIES = [
  { value: 'sports', label: 'Sports tournament', icon: 'sports_soccer', hint: 'Club tournaments, leagues, races, championships' },
  { value: 'conference', label: 'Conference or meeting', icon: 'groups', hint: 'Summits, trade shows, annual meetings' },
  { value: 'wedding', label: 'Wedding or celebration', icon: 'favorite', hint: 'Weddings, reunions, milestone parties' },
  { value: 'festival', label: 'Festival or concert', icon: 'music_note', hint: 'Music, food and cultural festivals' },
  { value: 'other', label: 'Something else', icon: 'event', hint: 'Crews, healthcare, camps, memorials, graduations and more' },
]

export const categoryLabel = (value) => EVENT_CATEGORIES.find((c) => c.value === value)?.label || 'Event'

export function createEvent(overrides = {}) {
  return {
    name: '',
    category: '',
    vertical: '', // industry vertical id (data/verticals/catalog.js), refines `category`
    venue: '',
    city: '',
    region: '',
    startDate: '', // ISO yyyy-mm-dd
    endDate: '',
    websiteUrl: '',
    attendance: '', // expected attendees, free text range e.g. '500–1,000'
    description: '',
    ...overrides,
  }
}

export function createOrganizer(overrides = {}) {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    marketingConsent: false,
    ...overrides,
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Normalizes a user-typed website. Only http(s) is allowed — this value is
 * later handed to the server-side brand extractor, which must never be
 * pointed at file:, javascript:, or internal hosts. Returns null if invalid.
 */
export function normalizeWebsiteUrl(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const u = new URL(withScheme)
    if (!['http:', 'https:'].includes(u.protocol)) return null
    if (!u.hostname.includes('.') || u.hostname === 'localhost') return null
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)) return null // raw IPs (SSRF guard, enforced server-side too)
    return u.toString()
  } catch {
    return null
  }
}

/** Per-field errors for the event step. Empty object = valid. */
export function validateEvent(e = {}) {
  const errors = {}
  if (!e.name?.trim()) errors.name = 'Give your booking page a name.'
  else if (e.name.trim().length < 3) errors.name = 'Use at least 3 characters.'
  if (!e.category) errors.category = 'Pick the type of event.'
  if (!e.city?.trim()) errors.city = 'Where is the event? A city is enough.'
  if (!e.startDate) errors.startDate = 'Add a start date.'
  if (!e.endDate) errors.endDate = 'Add an end date.'
  if (e.startDate && e.endDate && e.endDate < e.startDate) errors.endDate = 'End date must be on or after the start date.'
  if (e.websiteUrl && normalizeWebsiteUrl(e.websiteUrl) === null) errors.websiteUrl = 'Enter a public website, like yourevent.com.'
  return errors
}

export function validateOrganizer(o = {}) {
  const errors = {}
  if (!o.firstName?.trim()) errors.firstName = 'Add your first name.'
  if (!o.lastName?.trim()) errors.lastName = 'Add your last name.'
  if (!o.email?.trim()) errors.email = 'Add an email so we can send your preview link.'
  else if (!EMAIL_RE.test(o.email.trim())) errors.email = 'Enter a valid email address.'
  if (o.phone && o.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a 10-digit phone number, or leave it blank.'
  return errors
}

/** "Jun 16 – 19, 2027" style range for hero banners. */
export function formatDateRange(start, end) {
  if (!start) return ''
  const s = new Date(`${start}T12:00:00`)
  const e = end ? new Date(`${end}T12:00:00`) : s
  const mo = (d) => d.toLocaleString('en-US', { month: 'short' })
  if (s.getFullYear() !== e.getFullYear()) return `${mo(s)} ${s.getDate()}, ${s.getFullYear()} – ${mo(e)} ${e.getDate()}, ${e.getFullYear()}`
  if (s.getMonth() !== e.getMonth()) return `${mo(s)} ${s.getDate()} – ${mo(e)} ${e.getDate()}, ${e.getFullYear()}`
  if (s.getDate() === e.getDate()) return `${mo(s)} ${s.getDate()}, ${s.getFullYear()}`
  return `${mo(s)} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`
}

export const locationLabel = (e = {}) => [e.city, e.region].filter(Boolean).join(', ')
