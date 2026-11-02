import { describe, it, expect } from 'vitest'
import { siteFromText, siteLabel, brandFromFirecrawl } from '../banner-lab/siteBrand.js'
import { lookupBrand } from '../../server/brand.js'

describe('website in a prompt', () => {
  it('finds the site', () => {
    expect(siteFromText('espn.com')).toBe('https://espn.com/')
    expect(siteFromText('Get the logo from www.espn.com/nba please')).toBe('https://www.espn.com/nba')
    expect(siteFromText('https://firecrawl.dev, thanks')).toBe('https://firecrawl.dev/')
    expect(siteLabel('https://www.espn.com/nba')).toBe('espn.com')
  })
  it('ignores things that aren’t websites', () => {
    expect(siteFromText('Clean up our crest and make a white version')).toBe('')
    expect(siteFromText('use logo.png on dark banners')).toBe('')
    expect(siteFromText('email me at alex@eventpipe.com')).toBe('')
  })
})

describe('Firecrawl branding → project', () => {
  it('keeps the logo, usable colours and fonts we can load', () => {
    const b = brandFromFirecrawl({
      branding: {
        logo: 'https://a.espncdn.com/logo.svg',
        colors: { primary: '#cc0000', secondary: '#fff', accent: 'red' },
        typography: { fontFamilies: { heading: 'Montserrat, sans-serif', primary: 'Inter' } },
      },
      metadata: { title: 'ESPN - Serving Sports Fans. Anytime. Anywhere.' },
    })
    expect(b).toMatchObject({ name: 'ESPN', logoUrl: 'https://a.espncdn.com/logo.svg', colors: { primary: '#CC0000', secondary: '#FFFFFF' }, typography: { heading: 'montserrat', body: 'inter' } })
    expect(b.colors.accent).toBeUndefined()
  })
  it('falls back to images.logo, and has no colours or fonts when none are usable', () => {
    const b = brandFromFirecrawl({ branding: { images: { logo: 'https://x.com/l.png' }, fonts: [{ family: 'Comic Neue Pro' }] } })
    expect(b).toMatchObject({ logoUrl: 'https://x.com/l.png', colors: null, typography: null })
  })
  it('uses the brand name, without ".com", and a logo-named preview image as a candidate', () => {
    const b = brandFromFirecrawl({ branding: { brandName: 'ESPN.com', logo: 'https://a.espncdn.com/logo-82x20.png', images: { ogImage: 'https://a.espncdn.com/espn_logos/espn_red.png', favicon: 'https://a.espncdn.com/E.svg' } } })
    expect(b.name).toBe('ESPN')
    expect(b.logoUrls).toEqual(['https://a.espncdn.com/logo-82x20.png', 'https://a.espncdn.com/espn_logos/espn_red.png'])
    expect(b.iconUrl).toBe('https://a.espncdn.com/E.svg')
    expect(brandFromFirecrawl({ branding: { images: { ogImage: 'https://x.com/hero-photo.jpg' } } }).logoUrls).toEqual([])
  })
})

const response = (status, body, type = 'application/json') => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (k) => (k.toLowerCase() === 'content-type' ? type : null) },
  json: async () => body,
  arrayBuffer: async () => (typeof body === 'string' ? new TextEncoder().encode(body).buffer : new ArrayBuffer(0)),
})

describe('server lookup', () => {
  it('picks the widest logo, not the site’s tiny one', async () => {
    const { bestLogo } = await import('../../server/brand.js')
    const png = (w) => { const b = Buffer.alloc(33); b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(w, 16); return b }
    const fetchFn = async (u) => ({ ok: true, headers: { get: () => 'image/png' }, arrayBuffer: async () => png(String(u).includes('big') ? 1296 : 82) })
    const r = await bestLogo({ logoUrls: ['https://x.com/small.png', 'https://x.com/big.png'] }, fetchFn)
    expect(r.sourceUrl).toBe('https://x.com/big.png')
  })
  it('returns the logo as a data URL with the brand', async () => {
    const calls = []
    const fetchFn = async (url, opts) => {
      calls.push(String(url))
      if (String(url).includes('firecrawl')) {
        expect(opts.headers.Authorization).toBe('Bearer fc-test')
        expect(JSON.parse(opts.body).formats).toEqual(['branding'])
        return response(200, { success: true, data: { branding: { logo: 'https://cdn.example.com/logo.svg', colors: { primary: '#123456' } }, metadata: { ogSiteName: 'Example' } } })
      }
      return response(200, '<svg xmlns="http://www.w3.org/2000/svg"/>', 'image/svg+xml')
    }
    const r = await lookupBrand('https://example.com/', { apiKey: 'fc-test', fetchFn })
    expect(r.name).toBe('Example')
    expect(r.logo.src).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(r.colors).toEqual({ primary: '#123456' })
    expect(calls).toEqual(['https://api.firecrawl.dev/v2/scrape', 'https://cdn.example.com/logo.svg'])
  })
  it('explains what went wrong', async () => {
    await expect(lookupBrand('https://example.com/', {})).rejects.toMatchObject({ status: 412, code: 'firecrawl_not_configured' })
    await expect(lookupBrand('https://localhost/', { apiKey: 'k', fetchFn: async () => response(200, {}) })).rejects.toMatchObject({ code: 'bad_url' })
    await expect(lookupBrand('https://example.com/', { apiKey: 'k', fetchFn: async () => response(402, {}) })).rejects.toMatchObject({ code: 'firecrawl_credits' })
    const noLogo = async () => response(200, { success: true, data: { branding: {} } })
    await expect(lookupBrand('https://example.com/', { apiKey: 'k', fetchFn: noLogo })).rejects.toMatchObject({ status: 404, code: 'no_logo' })
  })
})
