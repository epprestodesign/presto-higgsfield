// The landing page's ad row: three 340×215 banners below the event description.
// That size isn't in brand-studio's approved list (models/ads.js), so the
// prototype adds it here, at runtime, without touching brand-studio. Imported
// by the app (ads.js) and by the Preview Host (preview.js) so the real Presto
// templates render it too. AdCreative draws it in its "box" layout.
import { AD_SIZES, AD_SLOTS } from '@bs/models/ads.js'

export const LANDING_SIZE = '340x215'
if (!AD_SIZES[LANDING_SIZE]) AD_SIZES[LANDING_SIZE] = { width: 340, height: 215, name: 'Landing Banner' }
const slot = AD_SLOTS.landing.find((s) => s.id === 'landing.afterContent')
if (slot && !slot.sizes.includes(LANDING_SIZE)) slot.sizes.unshift(LANDING_SIZE)
