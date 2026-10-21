// Builds Concept objects from a Brand Kit. Used by the mock provider (and, in
// Phase 3, to wrap real model output with layout + typography metadata).
import { uid } from '../../models/ids.js'
import { resolvePalette } from '../../theme/brandTheme.js'
import { shade, tint, mix } from '../../theme/color.js'
import { getDirection } from '../../models/brandKit.js'
import { IMAGERY, imagesTagged } from '../../assets/imagery/index.js'

// Two templates per direction → the six-concept gallery.
const TEMPLATES = {
  signature: [
    { title: 'Solid Signature', layout: 'centered', overlay: 'none', pattern: 'dots', useImage: false, rationale: 'Your primary color owns the banner, with a quiet dot texture and your logo front and center.' },
    { title: 'Brand Split', layout: 'split', overlay: 'tint', pattern: 'lines', useImage: true, rationale: 'A brand-color panel carries the headline while a tinted photo hints at the event.' },
  ],
  energy: [
    { title: 'Matchday Band', layout: 'band', overlay: 'duotone', pattern: 'chevrons', useImage: true, rationale: 'High-contrast band with forward chevrons and a duotone action photo — urgency without clutter.' },
    { title: 'Breakaway Angles', layout: 'angled', overlay: 'duotone', pattern: 'speed', useImage: true, rationale: 'Diagonal cuts in your secondary and accent colors give the page motion and promo energy.' },
  ],
  premium: [
    { title: 'Editorial Full-Bleed', layout: 'editorial', overlay: 'scrim', pattern: 'none', useImage: true, serif: true, rationale: 'Full-bleed photography with a soft scrim and refined serif headline — magazine calm.' },
    { title: 'Gallery Frame', layout: 'framed', overlay: 'none', pattern: 'none', useImage: true, serif: true, rationale: 'A framed photograph beside generous whitespace; the type does the talking.' },
  ],
}

const CATEGORY_TAG = { sports: 'sports', conference: 'conference', wedding: 'wedding', festival: 'city', other: 'city' }

function pickImage(brandKit, event, offset) {
  const own = (brandKit.imagery || []).filter((a) => a.kind !== 'logo')
  if (own.length) return own[offset % own.length]
  const pool = imagesTagged(CATEGORY_TAG[event?.category] || 'city')
  const list = pool.length ? pool : IMAGERY
  return list[offset % list.length]
}

const SERIF_FALLBACK = 'playfair'

function treatmentFor(tpl, palette, image, variant) {
  const shift = (variant % 3) * 0.08
  const t = {
    background: palette.primary,
    foreground: palette.onPrimary,
    accent: palette.secondary,
    highlight: palette.accent,
    imageId: tpl.useImage && image ? image.id : null,
    imageSrc: tpl.useImage && image ? image.src : null,
    imageAlt: tpl.useImage && image ? image.alt : '',
    overlay: tpl.overlay,
    pattern: tpl.pattern,
  }
  if (tpl.layout === 'band') t.background = shade(palette.primary, 0.35 + shift)
  if (tpl.layout === 'angled') t.background = mix(palette.primary, palette.secondary, 0.15 + shift)
  if (tpl.layout === 'framed') {
    t.background = tint(palette.primary, 0.94)
    t.foreground = palette.ink
  }
  if (variant % 2 === 1 && tpl.layout !== 'framed') {
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
    `Layout: ${layout}; leave clear negative space for an HTML headline and logo.`,
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
  const image = pickImage(brandKit, event, templateIndex + variant * 2 + (direction === 'premium' ? 1 : 0))
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
