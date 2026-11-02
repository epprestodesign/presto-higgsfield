// Every graphic made for one concept (a project's chosen banner + its logo and
// chosen look), itemized: the logo files, the logo at each Presto placement,
// and the banner at both crops with and without the logo. Each item can be
// previewed, downloaded on its own, or zipped with the rest.
import { loadImage, canvasOf, renderBanner, placementAssets, vectorizeCanvas } from './canvas.js'
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

/**
 * @param project   lab project (logo, logoLab, name)
 * @param banner    the chosen banner (or null)
 * @param lookLabel the chosen dark-banner look's name, if any
 * @returns [{ id, group, label, detail, w, h, format, file, canvas?, text?, thumb, bg }]
 */
export async function conceptGraphics(project, banner, { lookLabel = '' } = {}) {
  const name = slug(project.name)
  const items = []
  const logoSrc = project.logo?.src
  const logo = logoSrc ? await canvasFromSrc(logoSrc) : null
  const onDark = project.logo?.onDarkSrc ? await canvasFromSrc(project.logo.onDarkSrc) : logo

  if (logo) {
    items.push({
      id: 'logo-clean', group: 'Logo', label: 'Cleaned-up logo', detail: 'Transparent background, trimmed',
      w: logo.width, h: logo.height, format: 'PNG', file: `logo/${name}-logo.png`, canvas: logo, bg: 'light',
    })
    if (onDark !== logo) {
      items.push({
        id: 'logo-dark', group: 'Logo', label: `Dark-banner look${lookLabel ? ` · ${lookLabel}` : ''}`, detail: 'Used on every banner and dark surface',
        w: onDark.width, h: onDark.height, format: 'PNG', file: `logo/${name}-logo-on-dark.png`, canvas: onDark, bg: 'dark',
      })
    }
    const svg = /\.svg(\?|$)|^data:image\/svg/.test(logoSrc) ? await (await fetch(logoSrc)).text() : vectorizeCanvas(logo, { colors: 6 }).svg
    items.push({
      id: 'logo-svg', group: 'Logo', label: 'Vector logo', detail: 'Sharp at any size',
      w: logo.width, h: logo.height, format: 'SVG', file: `logo/${name}-logo.svg`, text: svg, bg: 'light',
      thumb: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    })
    const light = placementAssets(logo)
    const dark = placementAssets(onDark)
    items.push({
      id: 'slot', group: 'Logo sizes in Presto', label: 'Brand logo', detail: `${light[0].where} · with a 2x copy`,
      w: light[0].size.w, h: light[0].size.h, format: 'PNG', file: `logo/presto/brand-logo-200x200.png`, canvas: light[0].png1x, retina: light[0].png2x, bg: 'light',
    })
    // Banner overlays get the dark-banner look; the nav bar is white, so it
    // gets the cleaned-up logo as is.
    dark.slice(1).forEach((d, i) => {
      const onBanner = !/^nav/.test(d.id)
      const p = onBanner ? d : light[i + 1]
      items.push({
        id: `place-${p.id}`, group: 'Logo sizes in Presto', label: p.label, detail: `${p.where} · with a 2x copy`,
        w: p.size.w, h: p.size.h, format: 'PNG', file: `logo/presto/${p.id}-${p.size.w}x${p.size.h}.png`, canvas: p.png1x, retina: p.png2x, bg: onBanner ? 'dark' : 'light',
      })
    })
  }

  if (banner) {
    const art = await loadImage(banner.src)
    for (const spec of BANNER_SPECS) {
      const plain = renderBanner(art, spec, {}, null).canvas
      items.push({
        id: `banner-${spec.id}`, group: 'Banners', label: spec.label, detail: 'Background only (Presto adds the logo)',
        w: spec.width, h: spec.height, format: 'JPG', file: `banners/${spec.id}-${spec.width}x${spec.height}.jpg`, canvas: plain, type: 'image/jpeg', bg: 'dark',
      })
      if (onDark) {
        const withLogo = renderBanner(art, spec, {}, onDark).canvas
        items.push({
          id: `banner-${spec.id}-logo`, group: 'Banners', label: `${spec.label} with logo`, detail: 'For decks, emails and social',
          w: spec.width, h: spec.height, format: 'JPG', file: `banners/${spec.id}-${spec.width}x${spec.height}-with-logo.jpg`, canvas: withLogo, type: 'image/jpeg', bg: 'dark',
        })
      }
    }
  }

  for (const it of items) it.thumb ||= thumbOf(it.canvas, it.group === 'Banners' ? 560 : 360, it.type === 'image/jpeg' ? 'image/jpeg' : 'image/png')
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
