// Re-cut generated logos from their raw Higgsfield output (no new generation):
// removes the light, neutral background (and any pale "sticker" border)
// connected to the image edge, cleans the fringe, trims, and writes
//   <id>.png        — transparent logo
//   <id>-dark.png   — on-dark variant (only for logos with dark lettering outside the badge)
//
//   node scripts/recut-logos.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'brand-studio/src/assets/logos/generated')
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'))

// Logos whose wordmark sits outside the badge in a dark ink → white for dark heroes.
const DARK_VARIANT = { fintech: { ink: [27, 31, 94], fromX: 0.32 } }

const browser = await chromium.launch()
const page = await browser.newPage()

for (const entry of manifest) {
  const raw = fs.readFileSync(path.join(DIR, entry.raw))
  const variant = DARK_VARIANT[entry.id] || null
  const result = await page.evaluate(async ({ src, variant }) => {
    const img = new Image(); img.src = src; await img.decode()
    const w = img.naturalWidth, h = img.naturalHeight
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, w, h); const px = d.data
    // "Light neutral": bright and nearly colorless (white, off-white, pale grey).
    const lightNeutral = (i, minLum = 175, maxChroma = 28) => {
      const r = px[i], g = px[i + 1], b = px[i + 2]
      return Math.min(r, g, b) > minLum && Math.max(r, g, b) - Math.min(r, g, b) < maxChroma
    }
    const bg = new Uint8Array(w * h); const stack = []
    for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
    for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
    while (stack.length) {
      const p = stack.pop()
      if (bg[p] || !lightNeutral(p * 4)) continue
      bg[p] = 1
      const x = p % w, y = (p / w) | 0
      if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1)
      if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w)
    }
    for (let p = 0; p < w * h; p++) if (bg[p]) px[p * 4 + 3] = 0
    // Fringe: two passes removing pale, low-chroma pixels touching the background,
    // then a 1px soft edge on what remains.
    for (let pass = 0; pass < 2; pass++) {
      const kill = []
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const p = y * w + x
        if (bg[p]) continue
        if ((bg[p - 1] || bg[p + 1] || bg[p - w] || bg[p + w]) && lightNeutral(p * 4, 120, 40)) kill.push(p)
      }
      kill.forEach((p) => { bg[p] = 1; px[p * 4 + 3] = 0 })
    }
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x
      if (!bg[p] && (bg[p - 1] || bg[p + 1] || bg[p - w] || bg[p + w])) px[p * 4 + 3] = 150
    }
    ctx.putImageData(d, 0, 0)
    // Trim + 3% pad, cap at 800px.
    let x0 = w, y0 = h, x1 = 0, y1 = 0
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 16) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03)
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad)
    const s = Math.min(1, 800 / Math.max(x1 - x0 + 1, y1 - y0 + 1))
    const f = document.createElement('canvas'); f.width = Math.round((x1 - x0 + 1) * s); f.height = Math.round((y1 - y0 + 1) * s)
    const fctx = f.getContext('2d'); fctx.imageSmoothingQuality = 'high'
    fctx.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, f.width, f.height)
    const light = f.toDataURL('image/png')
    let dark = null
    if (variant) {
      const fd = fctx.getImageData(0, 0, f.width, f.height); const q = fd.data
      const [ir, ig, ib] = variant.ink
      for (let y = 0; y < f.height; y++) for (let x = Math.floor(f.width * variant.fromX); x < f.width; x++) {
        const i = (y * f.width + x) * 4
        // Letter counters (the white inside o, a, e…) aren't edge-connected, so clear any pale pixel here.
        const lo = Math.min(q[i], q[i + 1], q[i + 2])
        if (q[i + 3] && lo > 150 && Math.max(q[i], q[i + 1], q[i + 2]) - lo < 40) { q[i + 3] = 0; continue }
        if (q[i + 3] && Math.max(Math.abs(q[i] - ir), Math.abs(q[i + 1] - ig), Math.abs(q[i + 2] - ib)) < 90) { q[i] = 255; q[i + 1] = 255; q[i + 2] = 255 }
      }
      fctx.putImageData(fd, 0, 0)
      dark = f.toDataURL('image/png')
    }
    return { light, dark, w: f.width, h: f.height }
  }, { src: `data:image/png;base64,${raw.toString('base64')}`, variant })
  fs.writeFileSync(path.join(DIR, `${entry.id}.png`), Buffer.from(result.light.split(',')[1], 'base64'))
  if (result.dark) {
    fs.writeFileSync(path.join(DIR, `${entry.id}-dark.png`), Buffer.from(result.dark.split(',')[1], 'base64'))
    entry.fileOnDark = `${entry.id}-dark.png`
  }
  console.log(`  ✓ ${entry.id} ${result.w}×${result.h}${result.dark ? ' (+ on-dark variant)' : ''}`)
}
fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await browser.close()
