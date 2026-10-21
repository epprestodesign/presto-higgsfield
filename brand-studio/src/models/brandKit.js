// Brand Kit — the customer's identity, stored separately from page config so
// one change re-themes every page preview at once.
import { uid } from './ids.js'
import { PRESTO_DEFAULT_COLORS } from '../theme/brandTheme.js'
import { DEFAULT_FONT_ID } from '../theme/fonts.js'

export const CREATIVE_DIRECTIONS = [
  {
    id: 'signature',
    name: 'Brand Signature',
    summary: 'Clean and on-brand.',
    description: 'Your colors and logo lead: solid brand fields and calm photography, so the page feels like your website.',
    icon: 'verified',
  },
  {
    id: 'energy',
    name: 'Event Energy',
    summary: 'Bold and promotional.',
    description: 'Vivid duotones and abstract brand art. Best for tournaments, races and festivals.',
    icon: 'bolt',
  },
  {
    id: 'premium',
    name: 'Premium Experience',
    summary: 'Soft, photographic and refined.',
    description: 'Soft-focus and tinted photography with serif headlines. Best for conferences and weddings.',
    icon: 'diamond',
  },
]

export const getDirection = (id) => CREATIVE_DIRECTIONS.find((d) => d.id === id) || CREATIVE_DIRECTIONS[0]

/**
 * @typedef {Object} BrandAsset
 * @property {string} id
 * @property {string} src        data: URL (visitor upload) or storage URL (Supabase, Phase 2)
 * @property {string} alt
 * @property {'logo'|'photo'|'pattern'} kind
 * @property {string} [credit]
 * @property {string} [storagePath]  set once uploaded to Supabase Storage
 */

export function createBrandKit(overrides = {}) {
  return {
    id: uid('bk'),
    source: 'manual', // 'manual' | 'suggested' | 'extracted'
    logo: null, // BrandAsset | null
    logoOnDark: null, // optional light variant for dark heroes
    colors: { ...PRESTO_DEFAULT_COLORS },
    typography: { heading: DEFAULT_FONT_ID, body: DEFAULT_FONT_ID },
    imagery: [], // BrandAsset[]
    heroImageId: null,
    direction: 'signature',
    keywords: [], // creative-direction keywords, e.g. ['competitive', 'family-friendly']
    ...overrides,
  }
}

// Upload limits enforced client-side for visitors; Supabase Storage policies
// enforce the same server-side (Phase 2).
export const UPLOAD_LIMITS = {
  logo: { maxBytes: 2 * 1024 * 1024, types: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'] },
  photo: { maxBytes: 8 * 1024 * 1024, types: ['image/png', 'image/jpeg', 'image/webp'] },
}

/** Returns an error string or '' for a File the user picked. */
export function validateUpload(file, kind = 'photo') {
  const rule = UPLOAD_LIMITS[kind] || UPLOAD_LIMITS.photo
  if (!file) return 'No file selected.'
  if (!rule.types.includes(file.type)) return kind === 'logo' ? 'Use an SVG, PNG, JPG or WebP logo.' : 'Use a PNG, JPG or WebP image.'
  if (file.size > rule.maxBytes) return `Files must be under ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`
  return ''
}
