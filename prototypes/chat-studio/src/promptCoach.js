// While someone writes a prompt on Home: what the agent can already pick out
// of it (✓), and the details still worth adding for the chosen mode, each with
// a one-tap way to add it. Simple pattern matching — a stand-in for the real
// agent reading the brief.

const EVENT_WORDS = [
  'tournament', 'cup', 'league', 'marathon', 'half', '5k', '10k', 'race', 'run', 'golf', 'classic', 'scramble', 'esports',
  'invitational', 'summit', 'conference', 'kickoff', 'sko', 'expo', 'offsite', 'retreat', 'meeting', 'festival', 'concert',
  'wedding', 'reunion', 'commencement', 'gala', 'fundraiser', 'soccer', 'basketball', 'volleyball', 'hockey', 'baseball', 'softball', 'swim',
]
const MONTHS = 'jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t|tember)?|oct(ober)?|nov(ember)?|dec(ember)?'
const MOOD_WORDS = ['night', 'dusk', 'sunrise', 'sunset', 'golden', 'bright', 'daytime', 'moody', 'dark', 'neon', 'warm', 'cool', 'calm', 'bold', 'vivid', 'electric', 'skyline', 'stadium', 'floodlit', 'beach', 'mountain', 'vineyard', 'lake', 'river']
const STOP = new Set(['a', 'an', 'the', 'our', 'my', 'for', 'brand', 'make', 'build', 'design', 'of', 'and', 'with', 'to', 'banners', 'banner', 'logo', 'ads', 'ad', 'pages'])
const LOOK_WORDS = ['white', 'badge', 'dark', 'transparent', 'crisp', 'clean', 'version', 'mono', 'black']

const find = {
  // The event word plus up to two words before it ("youth soccer tournament").
  event: (t) => {
    for (const w of EVENT_WORDS) {
      const m = t.match(new RegExp(`((?:[\\w’'-]+\\s+){0,2})${w}\\b`, 'i'))
      if (m) return [...m[1].split(/\s+/).filter((x) => x && !STOP.has(x.toLowerCase())), m[0].trim().split(/\s+/).at(-1)].join(' ')
    }
    return null
  },
  website: (t) => t.match(/\b[\w-]+\.(com|org|io|gg|net|co|us|events?|wedding|club|run|golf)\b/i)?.[0],
  place: (t) => [...t.matchAll(/\b(?:in|at|along|by|near)\s+(?:the\s+)?([A-Z][\w'’.-]*(?:\s+[A-Z][\w'’.-]*)*)/g)]
    .map((m) => m[1]).find((p) => !new RegExp(`^(${MONTHS})\\b`, 'i').test(p)),
  when: (t) => t.match(new RegExp(`\\b(?:(?:${MONTHS})\\b(?:\\s+\\d{1,2}(?!\\d))?(?:,?\\s+20\\d\\d)?|20\\d\\d|spring|summer|fall|autumn|winter|weekend|three days|two days|\\d+ nights?)`, 'i'))?.[0],
  mood: (t) => { for (const w of MOOD_WORDS) { const m = t.match(new RegExp(`\\b${w}\\w*(?:\\s+(?:hour|light|lights|start|colou?rs?))?`, 'i')); if (m) return m[0] } return null },
  look: (t) => LOOK_WORDS.find((w) => new RegExp(`\\b${w}\\b`, 'i').test(t)),
  ads: (t) => t.match(/\b(sponsors?|faq|about page|about|parking|tickets|link(?:ing)? to)\b/i)?.[0],
  people: (t) => t.match(/\b\d[\d,]*\s+(?:teams|reps|runners|guests|players|people|attendees|families)\b/i)?.[0],
}

// Each detail: how to show it found, and how to add it (insert words, or a short menu).
const DETAILS = {
  event: { label: 'Event', add: 'What’s the event?', hint: 'Say what kind of event it is, e.g. “youth soccer tournament”.', icon: 'pencil' },
  website: { label: 'Website', add: 'Website', insert: ', from ', note: 'We’ll pull the logo, colours and fonts from it', icon: 'link' },
  logo: { label: 'Logo', add: 'Upload a logo', attach: true, icon: 'clip' },
  place: { label: 'Place', add: 'Where', insert: ' in ', icon: 'map' },
  when: { label: 'When', add: 'When', menu: ['in June 2027', 'next spring', 'over a weekend', 'three days in September'], icon: 'sun' },
  mood: { label: 'Mood', add: 'Mood', menu: ['at night, under the lights', 'at golden hour', 'bright and daytime', 'bold, vivid colour', 'calm and minimal'], icon: 'palette' },
  look: { label: 'Version', add: 'Logo version', menu: ['make a white version for dark banners', 'put it on a white badge', 'make it crisp on a transparent background'], icon: 'spark' },
  ads: { label: 'Ads for', add: 'Who the ads are for', menu: ['ads for our sponsors, linking to their sites', 'an ad linking to our FAQ', 'an ad linking to our About page', 'an ad for our sponsors page'], icon: 'megaphone' },
  people: { label: 'Size', add: 'How big', menu: ['for 16 teams', 'for about 900 people', 'for 2,000 runners'], icon: 'users' },
}
const PLAN = {
  logo: ['event', 'source', 'look'],
  banners: ['event', 'place', 'mood', 'source'],
  ads: ['event', 'ads', 'source'],
  full: ['event', 'place', 'when', 'source'],
}

/** `{ found: [{ id, label, value }], missing: [detail], done, total }` for a prompt in a mode. */
export function coach(text, mode, hasFile) {
  const t = text || ''
  const found = []
  const missing = []
  for (const id of PLAN[mode] || PLAN.full) {
    if (id === 'source') {
      // A website or an uploaded logo: either gives us the brand.
      const site = find.website(t)
      if (site) found.push({ id: 'website', ...DETAILS.website, value: site })
      else if (hasFile) found.push({ id: 'logo', ...DETAILS.logo, value: 'attached' })
      else missing.push({ id: 'website', ...DETAILS.website, or: { id: 'logo', ...DETAILS.logo } })
      continue
    }
    const v = find[id](t)
    if (v) found.push({ id, ...DETAILS[id], value: v.trim() })
    else missing.push({ id, ...DETAILS[id] })
  }
  // Nice-to-haves, shown only once they're there.
  for (const id of ['people', mode === 'banners' ? 'when' : 'mood']) {
    if (found.some((f) => f.id === id)) continue
    const v = find[id](t)
    if (v) found.push({ id, ...DETAILS[id], value: v.trim(), extra: true })
  }
  const total = (PLAN[mode] || PLAN.full).length
  const done = found.filter((f) => !f.extra).length
  // A website fills in the rest (place, dates, look), so it's enough on its own.
  const site = found.find((f) => f.id === 'website')
  const ready = done >= total || (site && found.some((f) => f.id === 'event'))
  const verdict = ready ? (site && done < total ? `Ready, we’ll read the rest from ${site.value}` : 'Ready to go')
    : done >= total - 1 ? 'Good to start' : done ? 'Add a little more' : 'Tell us the event'
  return { found, missing, done: ready ? total : done, total, verdict }
}

/** Add words to the end of a prompt, tidying the join. */
export function appendTo(text, words) {
  const base = text.replace(/\s+$/, '')
  if (!base) return words.trim().replace(/^\w/, (c) => c.toUpperCase())
  if (/^[\s,]/.test(words)) return base + words.replace(/^\s+/, ' ')
  return `${base.replace(/[.]$/, '')}, ${words}`
}
