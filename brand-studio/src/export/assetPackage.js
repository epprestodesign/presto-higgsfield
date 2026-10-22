// The Studio asset export: what goes in the ZIP, grouped for the preview sheet.
//
//   logo/      the logo on its own, trimmed + resized (master, hero @2x,
//              band @2x, 512 square) for each version, with a contrast check
//              against the banner it sits on
//   banners/   upload-ready Presto backgrounds (no logo, no text — Presto
//              renders both live): hero 1440×400, directory/details band 1440×240
//   previews/  the same banners with logo + copy, for review and sign-off
//   mockups/   Homepage, Hotel directory, Hotel details at 1440 + 390 with the
//              banner and every ad in its slot (sample sponsors when none set)
//   ads/       every sponsor × every unit size it's placed at (+ mobile fallbacks)
//   brand/     brand-kit.json
//   README.txt
//
// Each item renders lazily (`render()` → Blob) so the sheet can show progress.
import { heroProps, selectedConcept } from '../components/preview/previewModel.js'
import { resolveHeroConcept, conceptWithHero } from '../theme/heroConcept.js'
import { getFont } from '../theme/fonts.js'
import { AD_SIZES, slotById } from '../models/ads.js'
import { renderBanner, renderAd, canvasBlob } from './render.js'
import { renderPageMock } from './renderPage.js'
import { trimmedLogo, fitCanvas, heightCanvas, squareCanvas, logoContrast, cropAround } from './logo.js'
import { zipFiles } from './zip.js'

export const slugify = (s, fallback = 'event') =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || fallback

export const EXPORT_GROUPS = [
  { id: 'logo', label: 'Logo', hint: 'Your logo on its own: trimmed and resized for the Presto hero and listing band, checked for contrast against your banner.' },
  { id: 'banners', label: 'Presto banners', hint: 'Upload-ready backgrounds with no logo or text. Presto places your logo and copy live on top.' },
  { id: 'previews', label: 'Banner previews', hint: 'The banners with your logo and copy, for review and sign-off.' },
  { id: 'mockups', label: 'Page mockups', hint: 'Every page with the banner and display ads in their real slots, desktop and mobile.' },
  { id: 'ads', label: 'Display ads', hint: 'Every sponsor at every size it’s placed, including mobile fallbacks.' },
  { id: 'brand', label: 'Brand kit', hint: 'Your colors, fonts, logo contrast and sponsors as JSON, plus a README.' },
]

const BANNERS = [
  { id: 'hero', file: 'homepage-hero', label: 'Homepage hero', width: 1440, height: 400, size: 'landing' },
  { id: 'listing', file: 'hotel-directory-and-details', label: 'Hotel directory + details banner', width: 1440, height: 240, size: 'compact' },
]

/** Sizes each sponsor is placed at across enabled pages (+ the slot's mobile fallback). */
export function sponsorAdSizes(project) {
  const ads = project?.ads
  const out = new Map()
  if (!ads?.enabled) return out
  for (const [page, list] of Object.entries(ads.placements || {})) {
    if (project.pages?.[page] && project.pages[page].enabled === false) continue
    if (project.pages?.[page]?.sections?.ads?.visible === false) continue
    for (const p of list || []) {
      if (!(p.count || 1) || !AD_SIZES[p.size]) continue
      const mobile = slotById(p.slot)?.mobile
      for (const id of p.sponsorIds || []) {
        if (!out.has(id)) out.set(id, new Set())
        out.get(id).add(p.size)
        if (mobile && AD_SIZES[mobile]) out.get(id).add(mobile)
      }
    }
  }
  return out
}

const BY_AREA = (a, b) => AD_SIZES[b].width * AD_SIZES[b].height - AD_SIZES[a].width * AD_SIZES[a].height

async function fetchBlob(src) {
  const r = await fetch(src)
  if (!r.ok) throw new Error(`Could not read ${src}`)
  return r.blob()
}
const extFor = (blob, src = '') => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/webp': 'webp' })[blob.type] || (/\.(\w+)(?:\?|$)/.exec(src)?.[1] ?? 'png')

/**
 * @returns {{ slug: string, items: ExportItem[] }}
 * ExportItem: { id, group, path, label, width?, height?, render: () => Promise<Blob>, preview: boolean }
 */
export function buildAssetPackage(project) {
  const slug = slugify(project?.event?.name)
  const items = []
  const hero = heroProps(project)
  const concept = resolveHeroConcept(conceptWithHero(selectedConcept(project), project?.brandKit), project?.brandKit)
  const resolved = { ...hero, concept }

  for (const b of BANNERS) {
    items.push({
      id: `banner-${b.id}`, group: 'banners', label: `${b.label} background`, width: b.width, height: b.height, preview: true,
      path: `banners/${slug}-${b.file}-${b.width}x${b.height}.png`,
      render: async () => canvasBlob(await renderBanner(resolved, { ...b, withCopy: false })),
    })
  }
  for (const b of BANNERS) {
    items.push({
      id: `preview-${b.id}`, group: 'previews', label: b.label, width: b.width, height: b.height, preview: true,
      path: `previews/${slug}-${b.file}-${b.width}x${b.height}-preview.png`,
      render: async () => canvasBlob(await renderBanner(resolved, { ...b, withCopy: true })),
    })
  }

  const PAGES = [
    { id: 'landing', label: 'Homepage', file: 'homepage' },
    { id: 'browse', label: 'Hotel directory', file: 'hotel-directory' },
    { id: 'details', label: 'Hotel details', file: 'hotel-details' },
  ]
  for (const mobile of [false, true]) {
    for (const p of PAGES) {
      if (project?.pages?.[p.id]?.enabled === false) continue
      const w = mobile ? 390 : 1440
      items.push({
        id: `mock-${p.id}-${w}`, group: 'mockups', label: `${p.label} · ${mobile ? 'Mobile' : 'Desktop'}`, width: w, preview: true, kind: 'mockup', mobile,
        path: `mockups/${slug}-${p.file}-${mobile ? 'mobile-390' : 'desktop-1440'}.png`,
        render: async () => {
          const c = await renderPageMock(project, resolved, p.id, { mobile })
          const blob = await canvasBlob(c)
          blob.meta = { height: c.height, sampleAds: c.sampleAds }
          return blob
        },
      })
    }
  }

  const sizes = sponsorAdSizes(project)
  for (const sponsor of project?.ads?.sponsors || []) {
    const list = [...(sizes.get(sponsor.id) || [])].sort(BY_AREA)
    const s = slugify(sponsor.name, 'sponsor')
    for (const size of list) {
      const d = AD_SIZES[size]
      items.push({
        id: `ad-${sponsor.id}-${size}`, group: 'ads', label: `${sponsor.name || 'Sponsor'} · ${d.name}`, sponsor: sponsor.name || 'Sponsor', width: d.width, height: d.height, preview: true,
        path: `ads/${s}/${s}-${size}.png`,
        render: async () => canvasBlob(await renderAd(sponsor, size)),
      })
    }
  }

  const bk = project?.brandKit || {}
  const logos = logoVersions(bk)
  const LOGO_FILES = [
    { id: 'master', label: 'Master', note: 'trimmed · max 1200px', make: (c) => fitCanvas(c, 1200, 1200) },
    { id: 'hero-240h', label: 'Homepage hero @2x', note: '240px tall (shown at 120)', make: (c) => heightCanvas(c, 240, 1200) },
    { id: 'band-112h', label: 'Listing band @2x', note: '112px tall (shown at 56)', make: (c) => heightCanvas(c, 112, 360) },
    { id: 'square-512', label: 'Square 512', note: 'favicon / social', make: (c) => squareCanvas(c, 512) },
  ]
  for (const v of logos) {
    for (const f of LOGO_FILES) {
      if (v.key === 'on-dark' && f.id === 'square-512') continue
      items.push({
        id: `logo-${v.key}-${f.id}`, group: 'logo', label: `${v.label} · ${f.label}`, note: f.note, preview: true, kind: 'logo', dark: v.key === 'on-dark',
        path: `logo/${slug}-logo${v.key === 'on-dark' ? '-on-dark' : ''}-${f.id}.png`,
        render: async () => {
          const t = await trimmedLogo(v.src)
          if (!t) throw new Error('Could not read the logo')
          const c = f.make(t)
          const blob = await canvasBlob(c)
          blob.meta = { width: c.width, height: c.height }
          return blob
        },
      })
    }
  }
  const analyze = memo(() => analyzeLogo(resolved, logos))
  items.push({
    id: 'brand-json', group: 'brand', label: 'brand-kit.json', preview: false, kind: 'json',
    path: 'brand/brand-kit.json',
    render: async () => new Blob([JSON.stringify(brandKitJson(project, concept, await analyze().catch(() => null)), null, 2) + '\n'], { type: 'application/json' }),
  })
  items.push({
    id: 'readme', group: 'brand', label: 'README.txt', preview: false, kind: 'text',
    path: 'README.txt',
    render: async () => new Blob([readme(project, slug)], { type: 'text/plain' }),
  })
  return { slug, items, analyze }
}

const memo = (fn) => { let p; return () => (p ??= fn()) }

/** The logo versions in the kit: standard + on-dark (when different). */
export function logoVersions(bk = {}) {
  const out = []
  if (bk.logo?.src) out.push({ key: 'standard', label: 'Logo', src: bk.logo.src })
  if (bk.logoOnDark?.src && bk.logoOnDark.src !== bk.logo?.src) out.push({ key: 'on-dark', label: 'Logo on dark', src: bk.logoOnDark.src })
  return out
}

/**
 * Contrast of each logo version against the actual banner behind it, on the
 * hero (1440×400) and the listing band (1440×240). Returns per-version ratios,
 * swatch crops (data URLs) and which version to use.
 */
export async function analyzeLogo(hero, logos) {
  if (!logos.length) return { versions: [], recommended: null }
  const sizes = [
    { id: 'hero', label: 'Homepage hero', width: 1440, height: 400, size: 'landing' },
    { id: 'band', label: 'Listing band', width: 1440, height: 240, size: 'compact' },
  ]
  const bgs = {}
  for (const s of sizes) bgs[s.id] = await renderBanner(hero, { ...s, withCopy: false })
  const versions = []
  for (const v of logos) {
    const logo = await trimmedLogo(v.src)
    if (!logo) continue
    const checks = []
    for (const s of sizes) {
      const composed = await renderBanner(hero, { ...s, withCopy: true, logoSrc: v.src })
      const rect = composed.logoRect
      if (!rect) continue
      const c = logoContrast(bgs[s.id], logo, rect)
      const crop = cropAround(composed, rect, s.size === 'compact' ? 160 : 220, s.size === 'compact' ? 20 : 40)
      checks.push({ id: s.id, label: s.label, ...c, swatch: crop.toDataURL('image/jpeg', 0.85) })
    }
    // Score = the weaker of the two banners; verdict rank first, then detail contrast.
    const RANK = { good: 3, detail: 2, borderline: 1, low: 0, none: 0 }
    const rank = checks.length ? Math.min(...checks.map((c) => RANK[c.verdict])) : 0
    const detail = checks.length ? Math.min(...checks.map((c) => c.detail)) : 0
    versions.push({ key: v.key, label: v.label, checks, rank, detail })
  }
  const best = [...versions].sort((a, b) => b.rank - a.rank || b.detail - a.detail)[0] || null
  const recommended = best && { key: best.key, label: best.label, level: ['low', 'borderline', 'detail', 'good'][best.rank] }
  return { versions, recommended }
}

function brandKitJson(project, concept, contrast) {
  const bk = project?.brandKit || {}
  return {
    event: {
      name: project?.event?.name || '', startDate: project?.event?.startDate || '', endDate: project?.event?.endDate || '',
      venue: project?.event?.venue || '', city: project?.event?.city || '', state: project?.event?.state || '',
    },
    colors: bk.colors || {},
    typography: {
      heading: getFont(bk.typography?.heading).label,
      body: getFont(bk.typography?.body).label,
    },
    banner: { concept: concept?.title || 'Presto Banner', treatment: concept?.treatment?.overlay || 'none', layout: 'centered' },
    logoContrast: contrast?.versions?.map((v) => ({ version: v.label, checks: v.checks.map((c) => ({ on: c.label, shape: `${c.ratio}:1`, details: `${c.detail}:1`, coverage: `${c.coverage}%`, verdict: c.verdict })) })) || [],
    recommendedLogo: contrast?.recommended?.label || null,
    sponsors: (project?.ads?.sponsors || []).map((s) => ({ name: s.name, url: s.url, cta: s.cta, colors: s.colors })),
    exportedAt: new Date().toISOString(),
  }
}

function readme(project, slug) {
  return [
    `${project?.event?.name || 'Event'} — brand assets`,
    'Exported from Presto Brand Studio.',
    '',
    'logo/      Your logo on its own — upload it to Presto separately from the',
    '           banner. master (trimmed), hero-240h (2× the 120px hero slot),',
    '           band-112h (2× the 56px listing slot), square-512. The on-dark',
    '           version is included when your kit has one; brand-kit.json lists',
    '           the contrast of each version against your banner.',
    'banners/   Upload these to Presto as the banner backgrounds.',
    '           Homepage hero 1440×400 · Hotel directory + details band 1440×240.',
    '           They contain no logo and no text: Presto places both live on',
    '           top, centered.',
    'previews/  The same banners with your logo and copy, for review only.',
    'mockups/   Homepage, Hotel directory and Hotel details (desktop 1440 and',
    '           mobile 390) with the banner and every display ad in its slot.',
    'ads/       Sponsor display ads, one folder per sponsor, at every IAB size',
    '           they are placed at (plus the 320×100 mobile fallback).',
    'brand/     brand-kit.json (colors, fonts, logo contrast, sponsors).',
    '',
    `Package: ${slug}-brand-assets.zip`,
    '',
  ].join('\n')
}

/**
 * Render the chosen items and zip them.
 * @param {ExportItem[]} items
 * @param {Map<string, Blob>} [rendered]  cache from the preview sheet
 */
export async function packageZip(items, rendered = new Map()) {
  const files = []
  for (const it of items) {
    const blob = rendered.get(it.id) || (await it.render())
    const path = it.resolvePath ? it.resolvePath(blob) : it.path
    files.push({ name: path, data: new Uint8Array(await blob.arrayBuffer()) })
  }
  return zipFiles(files)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
