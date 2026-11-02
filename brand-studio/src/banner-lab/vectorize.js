// Raster logo → SVG. Traces the transparent, trimmed logo with ImageTracer,
// locked to the logo's own colours so the result is a clean, few-colour
// vector (what a logo should be) rather than a photo-like mosaic.
import ImageTracer from 'imagetracerjs'
import { cloneImage, extractPalette, hexToRgb } from './pixels.js'

export const DETAIL = {
  smooth: { label: 'Smooth', ltres: 1.2, qtres: 1.2, pathomit: 24 },
  balanced: { label: 'Balanced', ltres: 0.6, qtres: 0.6, pathomit: 10 },
  precise: { label: 'Precise', ltres: 0.25, qtres: 0.25, pathomit: 3 },
}

/**
 * @param img     ImageData-like (transparent background, trimmed)
 * @param colors  how many colours to keep (2–12)
 * @param detail  key of DETAIL
 * @returns { svg, paths, bytes, palette }
 */
export function vectorize(img, { colors = 6, detail = 'balanced' } = {}) {
  // Hard alpha edge: anti-aliased fringes would otherwise trace as extra rings.
  const work = cloneImage(img)
  for (let i = 3; i < work.data.length; i += 4) work.data[i] = work.data[i] < 128 ? 0 : 255

  const palette = extractPalette(work, colors).map((p) => p.hex)
  const pal = [{ r: 0, g: 0, b: 0, a: 0 }, ...palette.map((hex) => { const [r, g, b] = hexToRgb(hex); return { r, g, b, a: 255 } })]
  const d = DETAIL[detail] || DETAIL.balanced
  const raw = ImageTracer.imagedataToSVG(work, {
    ...d,
    pal,
    colorsampling: 0,
    numberofcolors: pal.length,
    colorquantcycles: 1,
    mincolorratio: 0,
    rightangleenhance: true,
    linefilter: false,
    strokewidth: 0,
    roundcoords: 1,
    viewbox: true,
    desc: false,
    scale: 1,
    blurradius: 0,
  })

  // Drop the invisible layer traced for the transparent background, and the
  // fixed width/height so the SVG scales to whatever box it's placed in.
  const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1] || `0 0 ${img.width} ${img.height}`
  const body = (raw.match(/<path [^>]*\/>/g) || [])
    .filter((p) => !/opacity="0"/.test(p))
    .map((p) => p.replace(/ stroke="[^"]*"| stroke-width="[^"]*"| opacity="1"/g, '').replace(/\s+\/>/, '/>').replace(/ +/g, ' '))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body.join('')}</svg>`
  const paths = (svg.match(/<path /g) || []).length
  return { svg, paths, bytes: new TextEncoder().encode(svg).length, palette }
}
