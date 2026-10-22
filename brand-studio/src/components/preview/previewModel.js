// Pure helpers that turn a plain `project` (models/project.js shape) into the
// props the branded preview pages pass to BrandHero, the Presto pages and the
// ad slots. Kept framework-free so the published-demo renderer can reuse them.
import { formatDateRange, locationLabel } from '../../models/event.js'
import { conceptWithHero } from '../../theme/heroConcept.js'

export const selectedConcept = (project) =>
  project?.concepts?.items?.find((c) => c.id === project.concepts.selectedId) || null

export const eventDates = (project) => formatDateRange(project?.event?.startDate, project?.event?.endDate)

/** "Jun 16 - Jun 19" — the compact range the Browse search summary shows. */
export function searchDates(project) {
  const { startDate, endDate } = project?.event || {}
  if (!startDate) return ''
  const f = (iso) => new Date(`${iso}T12:00:00`).toLocaleString('en-US', { month: 'short', day: 'numeric' })
  return endDate && endDate !== startDate ? `${f(startDate)} - ${f(endDate)}` : f(startDate)
}

/** Props for BrandHero on a given page. */
export function heroProps(project, { size = 'landing' } = {}) {
  const hero = project?.pages?.landing?.hero || {}
  return {
    // The Brand Kit's hero image wins over the photo a concept was generated with.
    concept: conceptWithHero(selectedConcept(project), project?.brandKit),
    brandKit: project?.brandKit || {},
    headline: hero.headline?.trim() || project?.event?.name || 'Your Event Name',
    tagline: hero.tagline || '',
    dates: eventDates(project),
    location: locationLabel(project?.event),
    showLogo: hero.showLogo !== false,
    showDates: hero.showDates !== false,
    size,
    headingLevel: size === 'landing' ? 1 : 2,
  }
}

/** Placements + sponsors for a page, or empty when ads are switched off. */
export function adsFor(project, page) {
  const ads = project?.ads
  if (!ads?.enabled) return { placements: [], sponsors: [] }
  return { placements: ads.placements?.[page] || [], sponsors: ads.sponsors || [] }
}

/** Widest unit in a slot (rail column width). */
export function slotWidth(placements, slotId, fallback = 160) {
  const widths = placements.filter((p) => p.slot === slotId).map((p) => parseInt(p.size, 10) || 0)
  return widths.length ? Math.max(...widths) : fallback
}

export const hasSlot = (placements, slotId) => placements.some((p) => p.slot === slotId && (p.count || 1) > 0)

export const navBrand = (project) => project?.event?.name || 'Your Event'
export const navLogo = (project) => project?.brandKit?.logo?.src || ''
