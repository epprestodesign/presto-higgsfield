// The hero image picked in the Brand panel should win over the image a
// photographic concept was generated with (selectConcept seeds heroImageId
// from the concept, so by default they agree). Graphic-only concepts are left
// untouched. Pure function → safe to reuse in BrandedSite / Preview Host.
import { getImage } from '../assets/imagery/index.js'

export function conceptWithHero(concept, brandKit = {}) {
  if (!concept || !concept.treatment?.imageSrc || !brandKit.heroImageId) return concept
  if (concept.treatment.imageId === brandKit.heroImageId) return concept
  const img = (brandKit.imagery || []).find((a) => a.id === brandKit.heroImageId) || getImage(brandKit.heroImageId)
  if (!img) return concept
  return { ...concept, treatment: { ...concept.treatment, imageId: img.id, imageSrc: img.src, imageAlt: img.alt || '' } }
}
