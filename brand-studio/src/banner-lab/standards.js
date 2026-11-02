// Banner Lab — the Presto banner system as numbers (references/102226,
// "Optimized Banners Create Branded Confidence"):
//   • a 200×200 brand logo, always a live layer, never baked into the art;
//   • ONE minimal, system-safe background, cropped twice: the 1440×400 landing
//     page banner and the 1440×240 hotel listings banner;
//   • the logo sits centered on the banner, so the center has to stay calm and
//     dark enough for a white logo / headline to read.

export const LOGO_SPEC = {
  size: 200, // the slot every Presto page reserves for the brand logo
  retina: 400, // same slot at 2x
  padding: 0.06, // breathing room inside the square, per side
  // Long edge the trimmed logo needs so the 200 slot (176px of artwork after
  // padding) is sharp at 1x / at 2x.
  minLongEdge: 176,
  crispLongEdge: 352,
  wideRatio: 2.2, // wider than this reads small in a square slot
}

// Where Presto shows the logo, as the box the CSS gives it (height, max width).
// Read from the code: GlobalNav.vue (.gnav__logo) and BrandHero.vue's Presto
// layout (.bh--presto .bh__logo at a 1440 page; compact = the listings band).
export const PLACEMENTS = [
  { id: 'slot', label: 'Brand logo', where: 'Event graphics standard: the 200×200 square', box: { w: 200, h: 200 }, square: true },
  { id: 'hero', label: 'Landing banner overlay', where: 'Centered on the 1440×400 banner', box: { w: 708, h: 120 } },
  { id: 'listings', label: 'Listings banner overlay', where: 'Centered on the 1440×240 banner', box: { w: 180, h: 56 } },
  { id: 'nav', label: 'Nav bar', where: 'Top bar, desktop', box: { w: 220, h: 48 } },
  { id: 'nav-mobile', label: 'Nav bar, mobile', where: 'Top bar, phones', box: { w: 160, h: 40 } },
  { id: 'hero-mobile', label: 'Banner overlay, mobile', where: 'Hero on phones', box: { w: 220, h: 48 } },
]

/**
 * The size a logo of this aspect (w/h) gets inside a placement box: it takes
 * the full height unless that makes it wider than the box, then the full width.
 */
export function fitInBox(aspect, box) {
  const byHeight = { w: box.h * aspect, h: box.h }
  const fit = byHeight.w <= box.w ? byHeight : { w: box.w, h: box.w / aspect }
  return { w: Math.round(fit.w), h: Math.round(fit.h), limit: byHeight.w <= box.w ? 'height' : 'width' }
}

const placement = (id) => PLACEMENTS.find((p) => p.id === id)
export const BANNER_SPECS = [
  { id: 'landing', label: 'Landing page banner', width: 1440, height: 400, logoHeight: placement('hero').box.h, logoMaxWidth: placement('hero').box.w },
  { id: 'listings', label: 'Hotel listings banner', width: 1440, height: 240, logoHeight: placement('listings').box.h, logoMaxWidth: placement('listings').box.w },
]

/** The navy the Presto abstract templates sit on; what "on a dark banner" means before art exists. */
export const SYSTEM_DARK = '#0B1736'

// Zone around the center where the logo (and any headline) sits, as a share of
// the banner. Standards are judged here, not across the whole image.
export const CENTER_ZONE = { w: 0.46, h: 0.62 }

export const THRESHOLDS = {
  // White text needs 4.5:1 → background relative luminance ≤ 1.05/4.5 − 0.05 ≈ 0.183.
  centerLuminance: 0.18,
  // Bright spots (90th percentile) can be lighter, but not glaring behind a white logo.
  centerHighlight: 0.4,
  // Mean gradient (0–255 luma steps) in the center: calm ≤ 14, busy > 24.
  calm: 14,
  busy: 24,
  maxScrim: 0.7,
}

// The model call. Marketing Studio Flare takes reference images; 21:9 is its
// widest ratio, and the 1440×400 / 1440×240 crops come out of the middle band.
export const GENERATION = {
  endpoint: 'marketing-studio/image/flare',
  model: 'Marketing Studio Image 2.5 Flare',
  aspectRatio: '21:9',
  resolution: '2k',
  quality: 'high',
  maxReferences: 6,
}
