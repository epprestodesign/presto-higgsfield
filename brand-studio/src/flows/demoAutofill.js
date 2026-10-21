// Demo auto-fill — for walking the prototype on a phone without typing.
// While enabled, tapping an EMPTY text field fills it with realistic sample
// data (the Heartland Invitational Soccer Cup organizer) and closes the
// keyboard. Fields are recognised by their autocomplete hint, input type,
// label or placeholder, so it works across every screen without per-screen
// wiring. Tapping a field that already has a value leaves it alone (edit it
// normally). Choice controls (cards, chips, selects, dates in pickers) are
// already tap-only and are untouched.

export const DEMO_PERSONA = {
  eventName: 'Heartland Invitational Soccer Cup 2027',
  venue: 'Overland Park Soccer Complex',
  city: 'Overland Park',
  region: 'KS',
  startDate: '2027-06-16',
  endDate: '2027-06-19',
  website: 'heartlandcup.example.com', // matches the mock brand extractor's sample site
  firstName: 'Dana',
  lastName: 'Whitaker',
  fullName: 'Dana Whitaker',
  email: 'dana@heartlandcup.example.com',
  phone: '(913) 555-0142',
  organization: 'Heartland Youth Soccer Association',
  role: 'Tournament Director',
  password: 'Heartland-2027!',
  slug: 'heartland-cup-2027',
  sponsorName: 'Prairie Fire BBQ',
  sponsorUrl: 'https://example.com/prairie-fire-bbq',
  tagline: 'Official event hotels. Book early, stay close to the action.',
}

/** Persona for a sample / vertical example (data/sampleEvents ALL_EXAMPLES entry). */
export function personaFromSample(sample) {
  if (!sample) return DEMO_PERSONA
  const e = sample.event || {}
  const o = sample.organizer || {}
  const slug = String(e.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  return {
    ...DEMO_PERSONA,
    eventName: e.name || DEMO_PERSONA.eventName,
    venue: e.venue || DEMO_PERSONA.venue,
    city: e.city || DEMO_PERSONA.city,
    region: e.region || DEMO_PERSONA.region,
    startDate: e.startDate || DEMO_PERSONA.startDate,
    endDate: e.endDate || DEMO_PERSONA.endDate,
    // Matches the mock brand extractor, so "Scan my website" finds this example's kit.
    website: (e.websiteUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '') || DEMO_PERSONA.website,
    firstName: o.firstName || DEMO_PERSONA.firstName,
    lastName: o.lastName || DEMO_PERSONA.lastName,
    fullName: [o.firstName, o.lastName].filter(Boolean).join(' ') || DEMO_PERSONA.fullName,
    email: o.email || DEMO_PERSONA.email,
    phone: o.phone || DEMO_PERSONA.phone,
    organization: o.organization || DEMO_PERSONA.organization,
    role: o.role || DEMO_PERSONA.role,
    slug: slug || DEMO_PERSONA.slug,
    tagline: sample.copy?.tagline || DEMO_PERSONA.tagline,
  }
}

// Ordered: first match wins. `test` runs against "autocomplete|type|label|placeholder|aria|name".
const RULES = [
  { test: /password/i, key: 'password' },
  { test: /given-name|first name/i, key: 'firstName' },
  { test: /family-name|last name/i, key: 'lastName' },
  { test: /\bemail\b/i, key: 'email' },
  { test: /\btel\b|phone/i, key: 'phone' },
  { test: /organization-title|your role|job title/i, key: 'role' },
  { test: /\borganization\b|company/i, key: 'organization' },
  { test: /slug|page url|url slug|demo url/i, key: 'slug' },
  { test: /sponsor name/i, key: 'sponsorName' },
  { test: /destination|sponsor.*url/i, key: 'sponsorUrl' },
  { test: /website|\burl\b/i, key: 'website' },
  { test: /start date|check-in/i, key: 'startDate' },
  { test: /end date|check-out/i, key: 'endDate' },
  { test: /venue/i, key: 'venue' },
  { test: /address-level2|\bcity\b/i, key: 'city' },
  { test: /address-level1|state|region/i, key: 'region' },
  { test: /tagline/i, key: 'tagline' },
  { test: /booking page name|page name|event name|headline/i, key: 'eventName' },
  { test: /full name|your name|\bname\b/i, key: 'fullName' },
]

// Fields we never fill (search boxes, hex inputs, free-form sample text…).
const SKIP = /search|hex|#rrggbb|type your own|filter/i

function describe(el) {
  const field = el.closest('.q-field')
  const label = field?.querySelector('.q-field__label')?.textContent || ''
  const labelledBy = el.getAttribute('aria-labelledby')
  const ariaText = labelledBy ? labelledBy.split(' ').map((id) => document.getElementById(id)?.textContent || '').join(' ') : ''
  return [el.getAttribute('autocomplete'), el.type, label, el.placeholder, el.getAttribute('aria-label'), ariaText, el.name].filter(Boolean).join(' | ')
}

export function valueFor(el, persona = DEMO_PERSONA) {
  const text = describe(el)
  if (SKIP.test(text)) return null
  const rule = RULES.find((r) => r.test.test(text))
  if (!rule) return null
  // Native date inputs need ISO; the slug field wants the bare slug.
  return persona[rule.key] ?? null
}

/** Set an input's value the way a user would, so v-model / Quasar pick it up. */
export function fillInput(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

const FILLABLE = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled])'

/**
 * Enable auto-fill under `root` (default: document). Returns a disposer.
 * `persona` may be a function (re-read on every tap, e.g. to follow the chosen vertical).
 * `onFill(el, value)` lets the host show a little confirmation.
 */
export function enableDemoAutofill({ root = document, persona = DEMO_PERSONA, onFill } = {}) {
  const handler = (e) => {
    const el = e.target
    if (!(el instanceof Element) || !el.matches?.(FILLABLE)) return
    if (el.value) return
    const value = valueFor(el, typeof persona === 'function' ? persona() : persona)
    if (value == null) return
    fillInput(el, value)
    onFill?.(el, value)
    // Close the on-screen keyboard / native date picker: no typing needed.
    requestAnimationFrame(() => el.blur())
  }
  root.addEventListener('focusin', handler, true)
  return () => root.removeEventListener('focusin', handler, true)
}
