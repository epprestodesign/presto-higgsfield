// Mock website brand extractor (Phase 1).
//
// Phase 3 replaces this with a server-side service: the browser sends only the
// URL; the server fetches the PUBLIC page with SSRF guards (https only, DNS
// resolved and private/loopback ranges refused, redirects re-checked, size +
// time limits), extracts logo/colors/fonts, and returns a suggestion. Nothing
// is applied until the organizer approves it. Same return shape as here.
import { normalizeWebsiteUrl } from '../../models/event.js'
import { SAMPLE_EVENTS } from '../../data/sampleEvents.js'
import { FONT_OPTIONS } from '../../theme/fonts.js'
import { rgbToHex, shade } from '../../theme/color.js'

export const EXTRACTION_STAGES = [
  { id: 'fetch', label: 'Fetching public page' },
  { id: 'logo', label: 'Finding logo' },
  { id: 'colors', label: 'Extracting colors' },
  { id: 'fonts', label: 'Detecting fonts' },
]

export class ExtractionError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const hashString = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToHex({ r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 })
}

function monogram(hostname, color) {
  const name = hostname.replace(/^www\./, '').split('.')[0]
  const parts = name.split(/[-_]/).filter(Boolean)
  const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="${color}"/><text x="60" y="76" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="46" fill="#fff">${initials}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new ExtractionError('canceled', 'Scan canceled.')) }, { once: true })
  })

/**
 * @param {string} input   the website the organizer typed
 * @param {{ onStage?: (index:number, stage:object) => void, delayMs?: number, signal?: AbortSignal }} opts
 * @returns {Promise<object>} suggestion — { url, hostname, source, logo, logoOnDark, colors, typography, confidence, notes }
 */
export async function extractBrandFromUrl(input, { onStage, delayMs = 650, signal } = {}) {
  const url = normalizeWebsiteUrl(input)
  if (!url) throw new ExtractionError('invalid_url', 'Enter a public website address, like yourevent.com.')
  const { hostname } = new URL(url)

  for (let i = 0; i < EXTRACTION_STAGES.length; i++) {
    onStage?.(i, EXTRACTION_STAGES[i])
    await wait(delayMs, signal)
    if (i === 0 && /(^|\.)(offline|unreachable|down)\b|\.invalid$/.test(hostname)) {
      throw new ExtractionError('unreachable', `We couldn’t reach ${hostname}. Check the address, or set up your brand by hand below.`)
    }
  }

  // Known sample sites → their real kits (demo realism).
  const sample = SAMPLE_EVENTS.find((s) => s.event.websiteUrl && new URL(s.event.websiteUrl).hostname === hostname)
  if (sample) {
    const k = sample.brandKit
    return {
      url, hostname, source: 'sample',
      logo: k.logo, logoOnDark: k.logoOnDark || null,
      colors: { ...k.colors },
      typography: { ...k.typography },
      confidence: { logo: 'high', colors: 'high', fonts: 'medium' },
      notes: ['Logo found in the site header (SVG).', 'Colors taken from buttons, header and links.'],
    }
  }

  // Unknown site → deterministic palette from the hostname.
  const h = hashString(hostname)
  const hue = h % 360
  const primary = hslToHex(hue, 62, 28)
  const secondary = hslToHex((hue + 150) % 360, 70, 48)
  const accent = hslToHex((hue + 40) % 360, 90, 56)
  const sans = FONT_OPTIONS.filter((f) => f.category !== 'serif')
  const heading = FONT_OPTIONS[(h >> 3) % FONT_OPTIONS.length]
  const body = sans[(h >> 7) % sans.length]
  return {
    url, hostname, source: 'derived',
    logo: { id: `logo-${hostname}`, src: monogram(hostname, primary), alt: `${hostname} placeholder monogram`, kind: 'logo', placeholder: true },
    logoOnDark: null,
    colors: { primary, secondary, accent, ink: shade(primary, 0.55) },
    typography: { heading: heading.id, body: body.id },
    confidence: { logo: 'low', colors: 'medium', fonts: 'medium' },
    notes: ['No high-resolution logo found — we made a placeholder monogram. Upload your real logo for best results.', 'Colors estimated from the page theme.'],
  }
}
