// POST /hf-api/_brand { url } — a website's logo, colours and fonts via
// Firecrawl's "branding" scrape. Served by the dev proxy and by api/hf.js
// (behind Clerk). The Firecrawl key (FIRECRAWL_API_KEY) stays on the server.
//
// The logo comes back as a data: URL, so the browser can clean it up on a
// canvas without any cross-origin trouble.
import { brandFromFirecrawl, siteLabel } from '../src/banner-lab/siteBrand.js'
import { imageUrlAllowed } from './higgsfield.js'

const FIRECRAWL = 'https://api.firecrawl.dev/v2/scrape'
export const MAX_LOGO = 5 * 1024 * 1024

const fail = (status, detail, code) => Object.assign(new Error(detail), { status, code })

/** Pixel width of a PNG / JPEG / GIF / WebP from its header (0 if unknown). */
export function imageWidth(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return buf.readUInt32BE(16) // PNG IHDR
  if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') return buf.readUInt16LE(6)
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const kind = buf.toString('ascii', 12, 16)
    if (kind === 'VP8X') return 1 + buf.readUIntLE(24, 3)
    if (kind === 'VP8L') return 1 + (buf.readUInt16LE(21) & 0x3fff)
    if (kind === 'VP8 ') return buf.readUInt16LE(26) & 0x3fff
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) { // JPEG: walk to the first SOF marker
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return buf.readUInt16BE(i + 7)
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  return 0
}

/** Download one image: { src: data URL, type, width, svg } or null. */
async function fetchImage(url, fetchFn) {
  let u
  try { u = new URL(url) } catch { return null }
  if (!imageUrlAllowed(u, true)) return null
  const r = await fetchFn(u, { headers: { Accept: 'image/*' } })
  const type = (r.headers.get('content-type') || '').split(';')[0].trim()
  if (!r.ok || !/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(type)) return null
  const buf = Buffer.from(await r.arrayBuffer())
  if (!buf.length || buf.length > MAX_LOGO) return null
  const svg = type === 'image/svg+xml'
  return { url, src: `data:${type};base64,${buf.toString('base64')}`, svg, width: svg ? Infinity : imageWidth(buf) }
}

/**
 * The sharpest real logo: an SVG wins (sharp at any size), otherwise the
 * widest image; ties go to the site's own pick. The favicon only when nothing
 * else downloads.
 */
export async function bestLogo({ logoUrls = [], iconUrl = '' }, fetchFn) {
  const got = (await Promise.all(logoUrls.slice(0, 3).map((u) => fetchImage(u, fetchFn).catch(() => null)))).filter(Boolean)
  if (!got.length && iconUrl) {
    const icon = await fetchImage(iconUrl, fetchFn).catch(() => null)
    return icon ? { src: icon.src, sourceUrl: icon.url } : null
  }
  const best = got.reduce((a, b) => (b.width > a.width ? b : a), got[0])
  return best ? { src: best.src, sourceUrl: best.url } : null
}

/**
 * @param {string} url  the website
 * @param {{ apiKey?: string, fetchFn?: typeof fetch }} o
 * @returns {Promise<{ site, name, logo: {src, sourceUrl}, colors, typography, colorScheme }>}
 */
export async function lookupBrand(url, { apiKey, fetchFn = fetch } = {}) {
  if (!apiKey) throw fail(412, 'Looking up a website’s logo isn’t set up here yet (FIRECRAWL_API_KEY is missing).', 'firecrawl_not_configured')
  let site
  try { site = new URL(url) } catch { throw fail(400, 'That doesn’t look like a website address.', 'bad_url') }
  if (!imageUrlAllowed(Object.assign(new URL(site.href), { protocol: 'https:' }), true)) throw fail(400, 'Use a public website address, like espn.com.', 'bad_url')

  const r = await fetchFn(FIRECRAWL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: site.href, formats: ['branding'], onlyMainContent: false, timeout: 45000 }),
  })
  const json = await r.json().catch(() => ({}))
  if (r.status === 401 || r.status === 403) throw fail(502, 'Firecrawl didn’t accept the API key. Check FIRECRAWL_API_KEY.', 'firecrawl_auth')
  if (r.status === 402) throw fail(402, 'Firecrawl is out of credits for this month.', 'firecrawl_credits')
  if (r.status === 429) throw fail(429, 'Firecrawl is busy. Try again in a moment.', 'firecrawl_busy')
  if (!r.ok || !json.success) throw fail(502, `Couldn’t read ${siteLabel(site.href)}${json.error ? `: ${String(json.error).slice(0, 120)}` : '.'}`, 'firecrawl_error')

  const brand = brandFromFirecrawl(json.data)
  const logo = await bestLogo(brand, fetchFn)
  if (!logo) throw fail(404, `I couldn’t find a logo on ${siteLabel(site.href)}. Drop the logo in instead.`, 'no_logo')
  return {
    site: site.href,
    name: brand.name || siteLabel(site.href),
    logo,
    colors: brand.colors,
    typography: brand.typography,
    colorScheme: brand.colorScheme,
  }
}
