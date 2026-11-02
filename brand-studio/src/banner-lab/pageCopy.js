// The text on the Presto page banner: the headline (event name), the
// subheadline (dates · place) and the tagline. A Studio project keeps its own
// wording in `project.copy`; an empty line means "use the event's own", and
// each line can be switched off.
import { formatDateRange, locationLabel } from '../models/event.js'

export const COPY_LINES = [
  { id: 'headline', label: 'Headline', hint: 'The event name, in large type.' },
  { id: 'meta', label: 'Subheadline', hint: 'Dates and place, in small capitals.' },
  { id: 'tagline', label: 'Second subheadline', hint: 'The short line under it. Shows on the landing page only; the hotel pages use a shorter banner.' },
]

/** What each line says when the project hasn't changed it, from a Presto project. */
export function defaultCopy(presto) {
  const event = presto?.event || {}
  return {
    headline: event.name || '',
    meta: [formatDateRange(event.startDate, event.endDate), locationLabel(event)].filter(Boolean).join('  ·  '),
    tagline: presto?.pages?.landing?.hero?.tagline || '',
  }
}

/** A complete copy object: missing text is '', every line on unless switched off. */
export function normalizeCopy(copy) {
  const c = copy || {}
  const show = c.show || {}
  return {
    headline: c.headline || '',
    meta: c.meta || '',
    tagline: c.tagline || '',
    show: { headline: show.headline !== false, meta: show.meta !== false, tagline: show.tagline !== false },
  }
}

/** Nothing changed from the defaults (no saved copy needed). */
export function isDefaultCopy(copy) {
  const c = normalizeCopy(copy)
  return !c.headline && !c.meta && !c.tagline && c.show.headline && c.show.meta && c.show.tagline
}

/** Write the project's wording onto a Presto project's landing hero (in place). */
export function applyCopy(presto, copy) {
  if (!copy) return presto
  const c = normalizeCopy(copy)
  const hero = presto.pages?.landing?.hero
  if (!hero) return presto
  if (c.headline.trim()) hero.headline = c.headline.trim()
  if (c.meta.trim()) hero.meta = c.meta.trim()
  if (c.tagline.trim()) hero.tagline = c.tagline.trim()
  hero.showHeadline = c.show.headline
  hero.showMeta = c.show.meta
  hero.showTagline = c.show.tagline
  return presto
}
