// Display advertising — sponsor + placement model. Visual simulation only: no
// ad server, no tracking pixels. Every creative renders a "Sponsored" label.
import { uid } from './ids.js'

// IAB standard units used by the Presto booking pages (see references/102126).
export const AD_SIZES = {
  '160x600': { width: 160, height: 600, name: 'Wide Skyscraper' },
  '120x600': { width: 120, height: 600, name: 'Skyscraper' },
  '300x250': { width: 300, height: 250, name: 'Medium Rectangle' },
  '970x250': { width: 970, height: 250, name: 'Billboard' },
  '970x90': { width: 970, height: 90, name: 'Large Leaderboard' },
  '728x90': { width: 728, height: 90, name: 'Leaderboard' },
  '320x100': { width: 320, height: 100, name: 'Large Mobile Banner' },
  '320x50': { width: 320, height: 50, name: 'Mobile Banner' },
}

/**
 * Slots each page exposes. `sizes` lists what fits; `mobile` is the size the
 * slot falls back to under 600px (null = hidden on phones, like the right
 * rail). `count` = how many units stack in that slot.
 */
export const AD_SLOTS = {
  landing: [
    { id: 'landing.afterContent', label: 'Below event description', sizes: ['970x250', '970x90', '728x90', '300x250'], mobile: '320x100', maxCount: 3 },
  ],
  browse: [
    { id: 'browse.top', label: 'Above results', sizes: ['970x250', '970x90', '728x90'], mobile: '320x100', maxCount: 1 },
    { id: 'browse.rail', label: 'Right rail', sizes: ['160x600', '120x600', '300x250'], mobile: null, maxCount: 3 },
    { id: 'browse.bottom', label: 'Below results', sizes: ['970x250', '970x90', '728x90'], mobile: '320x100', maxCount: 1 },
  ],
  details: [
    { id: 'details.afterRooms', label: 'After room selection', sizes: ['970x250', '970x90', '728x90'], mobile: '320x100', maxCount: 1 },
    { id: 'details.rail', label: 'Right rail beside property info', sizes: ['160x600', '120x600', '300x250'], mobile: null, maxCount: 2 },
    { id: 'details.bottom', label: 'Page bottom', sizes: ['970x250', '970x90', '728x90'], mobile: '320x100', maxCount: 1 },
  ],
}

export const slotById = (slotId) => Object.values(AD_SLOTS).flat().find((s) => s.id === slotId) || null

/**
 * Preset layouts matching the reference screens in references/102126, so an
 * organizer can pick "Rail 160×600" instead of configuring slots one by one.
 */
export const AD_LAYOUT_PRESETS = {
  browse: [
    { id: 'none', label: 'No ads', placements: [] },
    { id: 'rail-160', label: 'Right rail · 160×600 ×2', placements: [{ slot: 'browse.rail', size: '160x600', count: 2 }] },
    { id: 'rail-120', label: 'Right rail · 120×600 ×2', placements: [{ slot: 'browse.rail', size: '120x600', count: 2 }] },
    { id: 'billboards-rail', label: 'Billboards 970×250 + rail ×3', placements: [{ slot: 'browse.top', size: '970x250', count: 1 }, { slot: 'browse.rail', size: '160x600', count: 3 }, { slot: 'browse.bottom', size: '970x250', count: 1 }] },
    { id: 'leaderboards-rail', label: 'Leaderboards 970×90 + rail ×3', placements: [{ slot: 'browse.top', size: '970x90', count: 1 }, { slot: 'browse.rail', size: '160x600', count: 3 }, { slot: 'browse.bottom', size: '970x90', count: 1 }] },
  ],
  details: [
    { id: 'none', label: 'No ads', placements: [] },
    { id: 'bottom-billboard', label: 'Billboard at page bottom', placements: [{ slot: 'details.bottom', size: '970x250', count: 1 }] },
    { id: 'rooms-billboard', label: 'Billboard after rooms', placements: [{ slot: 'details.afterRooms', size: '970x250', count: 1 }] },
    { id: 'rail-160', label: 'Info rail · 160×600 ×2', placements: [{ slot: 'details.rail', size: '160x600', count: 2 }] },
    { id: 'rail-120', label: 'Info rail · 120×600 ×2', placements: [{ slot: 'details.rail', size: '120x600', count: 2 }] },
  ],
  landing: [
    { id: 'none', label: 'No ads', placements: [] },
    { id: 'rectangles', label: '3 × Medium Rectangle', placements: [{ slot: 'landing.afterContent', size: '300x250', count: 3 }] },
    { id: 'billboard', label: 'Billboard', placements: [{ slot: 'landing.afterContent', size: '970x250', count: 1 }] },
  ],
}

export function createSponsor(overrides = {}) {
  return {
    id: uid('spn'),
    name: '',
    tagline: '',
    cta: 'Learn more',
    url: '', // destination (https only, opened with rel="sponsored noopener")
    colors: { background: '#0F172A', foreground: '#FFFFFF', accent: '#F59E0B' },
    logo: null, // BrandAsset
    artwork: {}, // { [sizeKey]: BrandAsset } — uploaded creative per size; HTML creative used when absent
    ...overrides,
  }
}

export function createPlacement(overrides = {}) {
  return { id: uid('plc'), slot: '', size: '', count: 1, sponsorIds: [], ...overrides }
}

/** Expand a preset into placements, rotating through the given sponsors. */
export function placementsFromPreset(page, presetId, sponsorIds = []) {
  const preset = (AD_LAYOUT_PRESETS[page] || []).find((p) => p.id === presetId)
  if (!preset) return []
  return preset.placements.map((p) => createPlacement({ ...p, sponsorIds: [...sponsorIds] }))
}
