// The hero image picked in the Brand panel should win over the image a
// photographic concept was generated with (selectConcept seeds heroImageId
// from the concept, so by default they agree). Graphic-only concepts are left
// untouched. Pure function → safe to reuse in BrandedSite / Preview Host.
import { getImage } from '../assets/imagery/index.js'
import { resolvePalette } from './brandTheme.js'
import { shade } from './color.js'
import { prestoBannerConcept } from '../providers/ai/conceptFactory.js'

const CENTERED = ['presto', 'centered']
const findAsset = (brandKit, id) => (id ? getImage(id) || (brandKit.imagery || []).find((a) => a.id === id) : null)

export function conceptWithHero(concept, brandKit = {}) {
  if (!concept || !concept.treatment?.imageSrc || !brandKit.heroImageId) return concept
  if (concept.treatment.imageId === brandKit.heroImageId) return concept
  const img = (brandKit.imagery || []).find((a) => a.id === brandKit.heroImageId) || getImage(brandKit.heroImageId)
  if (!img) return concept
  return { ...concept, treatment: { ...concept.treatment, imageId: img.id, imageSrc: img.src, imageAlt: img.alt || '' } }
}

/**
 * The concept a hero actually renders: the given concept, or (none selected) a
 * default from the Brand Kit — the Presto banner when there's a banner image,
 * else a solid brand field. Legacy side / framed layouts are normalized to the
 * one centered layout (even dim + white type over photos). Shared by BrandHero
 * and the asset export so both draw the same thing.
 */
export function resolveHeroConcept(concept, brandKit = {}) {
  const p = resolvePalette(brandKit.colors)
  if (!concept) {
    const banner = findAsset(brandKit, brandKit.bannerImageId) || findAsset(brandKit, brandKit.heroImageId)
    if (banner) return prestoBannerConcept(brandKit, banner)
    return {
      layout: 'centered',
      headingFont: brandKit.typography?.heading,
      treatment: { background: p.primary, foreground: p.onPrimary, accent: p.secondary, highlight: p.accent, imageSrc: null, imageAlt: '', overlay: 'none', pattern: 'dots' },
    }
  }
  if (CENTERED.includes(concept.layout || 'centered')) return concept
  const t = concept.treatment || {}
  const photo = !!t.imageSrc
  return {
    ...concept,
    layout: 'presto',
    treatment: {
      ...t,
      background: photo ? t.background || shade(p.primary, 0.3) : p.primary,
      foreground: photo ? '#FFFFFF' : p.onPrimary,
      overlay: photo && ['none', 'scrim'].includes(t.overlay || 'none') ? 'dim' : t.overlay,
      pattern: photo ? 'none' : t.pattern,
    },
  }
}
