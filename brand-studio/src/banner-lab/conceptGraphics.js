// The graphics for one concept (a project's chosen banner + its chosen logo
// look), itemized: the logo in that look at the two Presto banner sizes, and
// the banner at both Presto crops (1440×400 landing, 1440×240 listings). Each
// item can be previewed, downloaded on its own, or zipped with the rest.
import { loadImage, canvasOf, renderBanner, placementAssets } from './canvas.js'
import { BANNER_SPECS } from './standards.js'
import { slug } from './download.js'

async function canvasFromSrc(src) {
  const img = await loadImage(src)
  const c = canvasOf(img.naturalWidth || img.width || 800, img.naturalHeight || img.height || 800)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c
}

const thumbOf = (canvas, max = 360, type = 'image/png') => {
  const r = Math.min(1, max / Math.max(canvas.width, canvas.height))
  const t = canvasOf(Math.round(canvas.width * r), Math.round(canvas.height * r))
  const ctx = t.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, t.width, t.height)
  return t.toDataURL(type, 0.85)
}

// The logo sizes the Presto banners use: centered on each crop.
const LOGO_SLOTS = ['hero', 'listings']

/**
 * @param project   lab project (logo, logoLab, name)
 * @param banner    the chosen banner (or null)
 * @param lookLabel the chosen dark-banner look's name, if any
 * @returns [{ id, group, label, detail, w, h, format, file, canvas, retina?, thumb, bg }]
 */
export async function conceptGraphics(project, banner, { lookLabel = '' } = {}) {
  const name = slug(project.name)
  const items = []
  const logoSrc = project.logo?.onDarkSrc || project.logo?.src
  const logo = logoSrc ? await canvasFromSrc(logoSrc) : null

  if (logo) {
    const look = lookLabel ? ` · ${lookLabel}` : ''
    for (const p of placementAssets(logo).filter((a) => LOGO_SLOTS.includes(a.id))) {
      items.push({
        id: `logo-${p.id}`, group: 'Logo for the Presto pages', label: `${p.label}${look}`, detail: `${p.where} · with a 2x copy`,
        w: p.size.w, h: p.size.h, format: 'PNG', file: `logo/${name}-${p.id}-${p.size.w}x${p.size.h}.png`, canvas: p.png1x, retina: p.png2x, bg: 'dark',
      })
    }
  }

  if (banner) {
    const art = await loadImage(banner.src)
    for (const spec of BANNER_SPECS) {
      items.push({
        id: `banner-${spec.id}`, group: 'Banners', label: spec.label, detail: 'Background only (Presto adds the logo and text)',
        w: spec.width, h: spec.height, format: 'JPG', file: `banners/${name}-${spec.id}-${spec.width}x${spec.height}.jpg`,
        canvas: renderBanner(art, spec, {}, null).canvas, type: 'image/jpeg', bg: 'dark',
      })
    }
  }

  for (const it of items) it.thumb = thumbOf(it.canvas, it.group === 'Banners' ? 560 : 360, it.type === 'image/jpeg' ? 'image/jpeg' : 'image/png')
  return items
}

/** ZIP entries for a list of items (2x copies included). */
export function zipEntries(items) {
  const out = []
  for (const it of items) {
    if (it.text != null) out.push({ name: it.file, text: it.text })
    else out.push({ name: it.file, canvas: it.canvas, type: it.type, quality: it.type === 'image/jpeg' ? 0.9 : undefined })
    if (it.retina) out.push({ name: it.file.replace(/\.png$/, '@2x.png'), canvas: it.retina })
  }
  return out
}
