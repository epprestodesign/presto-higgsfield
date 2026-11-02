// Logo + brand from a website (Firecrawl's "branding" scrape), shared by the
// browser and the server. No secrets here: the Firecrawl key only lives on the
// server (brand-studio/server/brand.js).

import { FONT_OPTIONS } from '../theme/fonts.js'

/**
 * The first website in a prompt, as an https URL ("espn.com", "www.espn.com/nba",
 * "https://espn.com"), or '' when there isn't one. Emails don't count.
 */
export function siteFromText(text = '') {
  const m = /(?:^|[\s(])((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?)/i.exec(String(text))
  if (!m || /@/.test(text.slice(Math.max(0, m.index - 1), m.index + 1))) return ''
  let raw = m[1].replace(/[.,;:!?]+$/, '')
  // "logo.png" or "v2.0" aren't websites.
  if (!/^https?:\/\//i.test(raw) && /\.(png|jpe?g|webp|gif|svg|pdf|ai|eps|zip)$/i.test(raw)) return ''
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''
  } catch { return '' }
}

/** "https://www.espn.com/nba" → "espn.com" */
export const siteLabel = (url = '') => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url } }

const HEX = /^#[0-9a-f]{6}$/i
const hex = (v) => {
  const s = String(v || '').trim()
  if (HEX.test(s)) return s.toUpperCase()
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s)
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase() : ''
}
const fontId = (family = '') => {
  const f = String(family).split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
  return FONT_OPTIONS.find((o) => o.label.toLowerCase() === f || o.id === f.replace(/\s+/g, '-'))?.id || ''
}

/**
 * Turn Firecrawl's `branding` object (plus page metadata) into what a project
 * uses. Colours and fonts are only kept when they're usable (6-digit hex, a
 * font we can load).
 * @returns {{ name: string, logoUrl: string, logoUrls: string[], iconUrl: string, colors: object|null, typography: object|null, colorScheme: string }}
 */
export function brandFromFirecrawl(data = {}) {
  const b = data.branding || {}
  const meta = data.metadata || {}
  const isUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)
  // Logo candidates, best guess first. The link-preview image only counts when
  // its address says it's a logo (it's usually a photo); the favicon is a last
  // resort (an icon, not the wordmark).
  const logoUrls = [...new Set([
    b.logo, b.images?.logo,
    /logo|brand|wordmark|mark/i.test(b.images?.ogImage || '') ? b.images.ogImage : '',
  ].filter(isUrl))]
  const iconUrl = isUrl(b.images?.favicon) ? b.images.favicon : ''
  const logoUrl = logoUrls[0] || ''
  const c = b.colors || {}
  const primary = hex(c.primary)
  const colors = primary
    ? Object.fromEntries(Object.entries({ primary, secondary: hex(c.secondary), accent: hex(c.accent) }).filter(([, v]) => v))
    : null
  const families = b.typography?.fontFamilies || {}
  const heading = fontId(families.heading) || fontId(b.fonts?.[0]?.family)
  const body = fontId(families.primary) || fontId(b.fonts?.[1]?.family) || heading
  const name = String(b.brandName || meta.ogSiteName || meta['og:site_name'] || meta.title || '')
    .split(/\s[|–—-]\s/)[0].trim()
    .replace(/\.(com|org|net|io|co|us|uk|ca|tv|app|dev|ai)$/i, '') // "ESPN.com" → "ESPN"
    .slice(0, 60)
  return {
    name,
    logoUrl,
    logoUrls,
    iconUrl,
    colors,
    typography: heading ? { heading, body } : null,
    colorScheme: b.colorScheme || '',
  }
}
