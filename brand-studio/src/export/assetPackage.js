// The Studio asset export: what goes in the ZIP, grouped for the preview sheet.
//
//   banners/   upload-ready Presto backgrounds (no text — Presto renders the
//              logo + copy live): hero 1440×400, directory/details band 1440×240
//   previews/  the same banners with logo + copy, for review and sign-off
//   ads/       every sponsor × every unit size it's placed at (+ mobile fallbacks)
//   brand/     logo files + brand-kit.json
//   README.txt
//
// Each item renders lazily (`render()` → Blob) so the sheet can show progress.
import { heroProps, selectedConcept } from '../components/preview/previewModel.js'
import { resolveHeroConcept, conceptWithHero } from '../theme/heroConcept.js'
import { getFont } from '../theme/fonts.js'
import { AD_SIZES, slotById } from '../models/ads.js'
import { renderBanner, renderAd, canvasBlob } from './render.js'
import { zipFiles } from './zip.js'

export const slugify = (s, fallback = 'event') =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || fallback

export const EXPORT_GROUPS = [
  { id: 'banners', label: 'Presto banners', hint: 'Upload-ready backgrounds. Presto adds your logo and text live on top.' },
  { id: 'previews', label: 'Banner previews', hint: 'The same banners with your logo and copy, for review and sign-off.' },
  { id: 'ads', label: 'Display ads', hint: 'Every sponsor at every size it’s placed, including mobile fallbacks.' },
  { id: 'brand', label: 'Brand kit', hint: 'Logo files and your colors and fonts as JSON.' },
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
  for (const [key, asset, label] of [['logo', bk.logo, 'Logo'], ['logo-on-dark', bk.logoOnDark, 'Logo (on dark)']]) {
    if (!asset?.src) continue
    items.push({
      id: `brand-${key}`, group: 'brand', label, preview: true, kind: 'logo', dark: key === 'logo-on-dark',
      path: `brand/${slug}-${key}.png`,
      render: async () => fetchBlob(asset.src),
      resolvePath: (blob) => `brand/${slug}-${key}.${extFor(blob, asset.src)}`,
    })
  }
  items.push({
    id: 'brand-json', group: 'brand', label: 'brand-kit.json', preview: false, kind: 'json',
    path: 'brand/brand-kit.json',
    render: async () => new Blob([JSON.stringify(brandKitJson(project, concept), null, 2) + '\n'], { type: 'application/json' }),
  })
  items.push({
    id: 'readme', group: 'brand', label: 'README.txt', preview: false, kind: 'text',
    path: 'README.txt',
    render: async () => new Blob([readme(project, slug)], { type: 'text/plain' }),
  })
  return { slug, items }
}

function brandKitJson(project, concept) {
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
    sponsors: (project?.ads?.sponsors || []).map((s) => ({ name: s.name, url: s.url, cta: s.cta, colors: s.colors })),
    exportedAt: new Date().toISOString(),
  }
}

function readme(project, slug) {
  return [
    `${project?.event?.name || 'Event'} — brand assets`,
    'Exported from Presto Brand Studio.',
    '',
    'banners/   Upload these to Presto as the banner backgrounds.',
    '           Homepage hero 1440×400 · Hotel directory + details band 1440×240.',
    '           They contain no text: Presto renders your logo, event name and',
    '           dates live on top, centered.',
    'previews/  The same banners with your logo and copy, for review only.',
    'ads/       Sponsor display ads, one folder per sponsor, at every IAB size',
    '           they are placed at (plus the 320×100 mobile fallback).',
    'brand/     Logo files and brand-kit.json (colors, fonts, sponsors).',
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
