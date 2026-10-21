// Builds Concept objects from a Brand Kit. Used by the mock provider (and, in
// Phase 3, to wrap real model output with layout + typography metadata).
import { uid } from '../../models/ids.js'
import { resolvePalette } from '../../theme/brandTheme.js'
import { shade, tint, mix } from '../../theme/color.js'
import { getDirection } from '../../models/brandKit.js'
import { IMAGERY, imagesTagged } from '../../assets/imagery/index.js'

// Two templates per direction → the six-concept gallery. Every concept uses
// the one Presto layout (logo + copy centered over a full-bleed background,
// matching presto-2026); directions differ only in the background treatment.
//   image: 'photo' | 'abstract' | null (solid brand field)
const TEMPLATES = {
  signature: [
    { title: 'Presto Banner', layout: 'presto', image: 'photo', overlay: 'dim', pattern: 'none', rationale: 'The Presto standard: a minimal, system-safe background with your logo and headline centered on top.' },
    { title: 'Brand Field', layout: 'presto', image: null, overlay: 'none', pattern: 'dots', rationale: 'A solid field in your primary color with a quiet dot texture at the edges — no photo needed.' },
  ],
  energy: [
    { title: 'Duotone Photo', layout: 'presto', image: 'photo', overlay: 'duotone', pattern: 'none', rationale: 'Your event photo pushed into a brand-color duotone — bold and on-identity, copy still centered.' },
    { title: 'Abstract Brand Art', layout: 'presto', image: 'abstract', overlay: 'none', pattern: 'none', rationale: 'Generated abstract artwork in your palette: energetic texture that never fights the logo.' },
  ],
  premium: [
    { title: 'Soft Focus', layout: 'presto', image: 'photo', overlay: 'soft', pattern: 'none', serif: true, rationale: 'A softly defocused photo under a refined serif headline — calm, atmospheric, easy to read.' },
    { title: 'Brand Tint', layout: 'presto', image: 'photo', overlay: 'tint', pattern: 'none', serif: true, rationale: 'Photography washed in your primary color for a cohesive, premium feel.' },
  ],
}

// Fallback image sets (Higgsfield-generated) when a brand kit has no imagery:
// the event's vertical first, else a representative sample per event type.
const CATEGORY_SET = { sports: 'heartland', conference: 'fintech', wedding: 'wedding', festival: 'music-festival', other: 'camps' }
const isAbstract = (a) => a.kind === 'pattern' || /abstract/.test(a.id)

function pickImage(brandKit, event, offset, prefer = 'photo') {
  const usable = (list) => {
    const noLogos = list.filter((a) => a.kind !== 'logo')
    const preferred = noLogos.filter((a) => (prefer === 'abstract' ? isAbstract(a) : !isAbstract(a)))
    return preferred.length ? preferred : noLogos
  }
  const own = usable(brandKit.imagery || [])
  if (own.length) return own[offset % own.length]
  const generated = IMAGERY.filter((a) => a.generated)
  const set = usable(imagesTagged(event?.vertical || CATEGORY_SET[event?.category] || 'heartland').filter((a) => a.generated))
  const list = set.length ? set : usable(generated.length ? generated : IMAGERY)
  return list[offset % list.length]
}

const SERIF_FALLBACK = 'playfair'

function treatmentFor(tpl, palette, image, variant) {
  const shift = (variant % 3) * 0.08
  const art = tpl.image && image ? image : null
  const t = {
    background: art ? shade(palette.primary, 0.3 + shift) : variant % 2 ? mix(palette.primary, palette.secondary, 0.2) : palette.primary,
    foreground: art ? '#FFFFFF' : palette.onPrimary,
    accent: palette.secondary,
    highlight: palette.accent,
    imageId: art?.id || null,
    imageSrc: art?.src || null,
    imageAlt: art?.alt || '',
    // Abstracts were generated with room for the logo; a photo always gets an overlay.
    overlay: !art ? 'none' : tpl.overlay !== 'none' ? tpl.overlay : isAbstract(art) ? 'none' : 'dim',
    pattern: art ? tpl.pattern : 'dots',
  }
  if (variant % 2 === 1) {
    // Variation flips accent/highlight for a visibly different take.
    ;[t.accent, t.highlight] = [t.highlight, t.accent]
  }
  return t
}

/** Background-art prompt for a real image model. Never asks for text/logos. */
export function artworkPrompt({ direction, layout, event, brandKit, image }) {
  const d = getDirection(direction)
  const p = resolvePalette(brandKit.colors)
  const keywords = (brandKit.keywords || []).join(', ')
  return [
    `Wide website hero background for a ${event?.category || 'event'} booking page (${event?.name || 'event'}, ${event?.city || ''}).`,
    `Creative direction: ${d.name} — ${d.summary}`,
    `Layout: ${layout}; keep the center calm and uncluttered for a centered HTML logo and headline.`,
    `Palette: ${p.primary}, ${p.secondary}, ${p.accent}.`,
    keywords && `Mood: ${keywords}.`,
    image && `Reference photo: ${image.alt}.`,
    'No text, no letters, no logos, no watermarks.',
  ].filter(Boolean).join(' ')
}

export function buildConcept({ direction, templateIndex = 0, brandKit, event, variant = 0, parent = null, retake = false, provider = 'mock', model = 'mock-v1' }) {
  const tpl = TEMPLATES[direction][templateIndex % TEMPLATES[direction].length]
  const palette = resolvePalette(brandKit.colors)
  // Variations step through the photo pool so each one is visibly different.
  const image = tpl.image ? pickImage(brandKit, event, templateIndex + variant * 2 + (direction === 'premium' ? 1 : 0), tpl.image) : null
  const seed = Math.floor(Math.random() * 1e6)
  const headingFont = tpl.serif && !/serif|playfair|lora|dm-serif/.test(brandKit.typography?.heading || '') ? SERIF_FALLBACK : brandKit.typography?.heading
  return {
    id: uid('cpt'),
    direction,
    title: parent ? `${tpl.title} · v${(parent.version || 1) + variant}` : retake ? `${tpl.title} · New take` : tpl.title,
    rationale: tpl.rationale,
    layout: tpl.layout,
    treatment: treatmentFor(tpl, palette, image, variant),
    headingFont,
    prompt: artworkPrompt({ direction, layout: tpl.layout, event, brandKit, image }),
    seed,
    parentId: parent?.id || null,
    version: parent ? (parent.version || 1) + variant : 1,
    templateIndex,
    provider,
    model,
    createdAt: new Date().toISOString(),
  }
}

export const templatesFor = (direction) => TEMPLATES[direction] || []

/**
 * The Presto banner standard for a given background image: full-bleed,
 * evenly dimmed photo (or an undimmed abstract), logo + copy centered on top.
 */
export function prestoBannerConcept(brandKit = {}, image) {
  const palette = resolvePalette(brandKit.colors)
  const abstract = /abstract/.test(image?.id || '') || image?.kind === 'pattern'
  return {
    id: `presto-${image?.id || 'solid'}`,
    direction: 'signature',
    title: 'Presto Banner',
    rationale: TEMPLATES.signature[0].rationale,
    layout: 'presto',
    headingFont: brandKit.typography?.heading,
    treatment: {
      background: shade(palette.primary, 0.35),
      foreground: '#FFFFFF',
      accent: palette.secondary,
      highlight: palette.accent,
      imageId: image?.id || null,
      imageSrc: image?.src || null,
      imageAlt: '',
      overlay: abstract ? 'none' : 'dim',
      pattern: image ? 'none' : 'dots',
    },
    templateIndex: 0,
    version: 1,
    parentId: null,
    provider: 'presto',
    model: 'banner-system',
  }
}
