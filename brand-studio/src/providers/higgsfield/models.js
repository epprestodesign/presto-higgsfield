// The three Higgsfield image workflows Brand Studio uses, with exactly the
// parameters their API reference documents (docs.higgsfield.ai/docs/models/*).
// `buildInput` turns one common request shape into each model's body.

const toRgb = (hex) => {
  const h = String(hex || '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

export const HF_MODELS = [
  {
    id: 'flare',
    endpoint: 'marketing-studio/image/flare',
    label: 'Marketing Studio Image 2.5 Flare',
    badge: 'Best starting point',
    summary: 'Campaign imagery from your uploaded assets. Takes up to 16 reference images (logo first), up to 4K.',
    bestFor: 'Themed banners built from an organizer’s logo and photos',
    references: 16,
    palette: false,
    typography: false,
    aspectRatios: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'],
    options: {
      quality: { label: 'Quality', values: ['low', 'medium', 'high', 'xhigh', 'max'], default: 'high' },
      resolution: { label: 'Resolution', values: ['1k', '2k', '4k'], default: '2k' },
    },
    buildInput: ({ prompt, aspectRatio, referenceUrls = [], options = {} }) => ({
      prompt,
      aspect_ratio: aspectRatio,
      resolution: options.resolution || '2k',
      quality: options.quality || 'high',
      enhance_prompt: false,
      ...(referenceUrls.length ? { image_urls: referenceUrls.slice(0, 16) } : {}),
    }),
  },
  {
    id: 'recraft',
    endpoint: 'recraft/v4.1/text-to-image',
    label: 'Recraft V4.1',
    badge: '$0.035 / image at 1K',
    summary: 'Enforces your brand palette. Branded illustrations and graphic backgrounds. No reference images.',
    bestFor: 'On-palette patterns, illustrations and graphic backdrops',
    references: 0,
    palette: true,
    typography: false,
    aspectRatios: ['1:1', '2:1', '1:2', '3:2', '2:3', '4:3', '3:4', '5:4', '4:5', '6:10', '14:10', '10:14', '16:9', '9:16'],
    options: {
      output_format: { label: 'Format', values: ['jpg', 'png', 'webp'], default: 'jpg' },
    },
    buildInput: ({ prompt, aspectRatio, palette = [], background, options = {} }) => ({
      prompt,
      aspect_ratio: aspectRatio,
      resolution: '1k',
      output_format: options.output_format || 'jpg',
      colors: palette.map(toRgb).filter(Boolean).slice(0, 10).map((rgb) => ({ rgb })),
      ...(toRgb(background) ? { background_color: { rgb: toRgb(background) } } : {}),
    }),
  },
  {
    id: 'ideogram',
    endpoint: 'ideogram/v4.0',
    label: 'Ideogram 4.0',
    badge: '$0.03 / image',
    summary: 'Promotional compositions where typography is the design. One optional reference image.',
    bestFor: 'Type-led promo banners: headline baked into the artwork',
    references: 1,
    palette: false,
    typography: true,
    aspectRatios: ['1:1', '1:2', '2:1', '2:3', '3:2', '4:5', '5:4', '9:16', '16:9', '5:8', '8:5', '3:4', '4:3', '9:22', '22:9', '9:23', '23:9', '3:8', '8:3', '5:12', '12:5', '1:3', '3:1'],
    options: {
      rendering_speed: { label: 'Speed', values: ['TURBO', 'DEFAULT', 'QUALITY'], default: 'DEFAULT' },
    },
    buildInput: ({ prompt, aspectRatio, referenceUrls = [], options = {} }) => ({
      prompt: prompt.slice(0, 2048),
      aspect_ratio: aspectRatio,
      rendering_speed: options.rendering_speed || 'DEFAULT',
      ...(referenceUrls[0] ? { image_url: referenceUrls[0], image_weight: options.image_weight || 30 } : {}),
    }),
  },
]

export const getHfModel = (id) => HF_MODELS.find((m) => m.id === id) || HF_MODELS[0]

// What can be generated, with target pixel size (ad sizes from models/ads.js).
export const BANNER_TARGETS = [
  { id: 'hero', label: 'Event hero banner', width: 1600, height: 640, group: 'Event page' },
  { id: 'hero-mobile', label: 'Event hero · mobile', width: 390, height: 520, group: 'Event page' },
  { id: '970x250', label: 'Billboard 970×250', width: 970, height: 250, group: 'Sponsor ads' },
  { id: '970x90', label: 'Leaderboard 970×90', width: 970, height: 90, group: 'Sponsor ads' },
  { id: '728x90', label: 'Leaderboard 728×90', width: 728, height: 90, group: 'Sponsor ads' },
  { id: '300x250', label: 'Medium rectangle 300×250', width: 300, height: 250, group: 'Sponsor ads' },
  { id: '160x600', label: 'Wide skyscraper 160×600', width: 160, height: 600, group: 'Sponsor ads' },
  { id: '120x600', label: 'Skyscraper 120×600', width: 120, height: 600, group: 'Sponsor ads' },
  { id: '320x100', label: 'Mobile banner 320×100', width: 320, height: 100, group: 'Sponsor ads' },
]

/** The model's supported aspect ratio closest to the target (the image is then cover-cropped). */
export function closestAspect(model, width, height) {
  const target = Math.log(width / height)
  let best = model.aspectRatios[0]
  let bestD = Infinity
  for (const ar of model.aspectRatios) {
    const [w, h] = ar.split(':').map(Number)
    const d = Math.abs(Math.log(w / h) - target)
    if (d < bestD) { bestD = d; best = ar }
  }
  return best
}
