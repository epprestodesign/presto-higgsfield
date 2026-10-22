// Keys the Higgsfield phone shells (scripts/hf-generate-phone-shell.mjs) into
// overlays: flood-fills the white background and the green screen to
// transparency (soft edges, green spill removed), crops to the handset and
// records the screen opening so the live page can sit exactly behind it.
// The black bezel is trimmed to BEZEL × the shell width (Recraft draws it
// about twice as thick as a real phone) by widening the opening into it.
//
//   node scripts/key-phone-shell.mjs
// Writes <id>.png + shells.json in brand-studio/src/assets/devices/generated.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { ROOT } from './lib/hf.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const DIR = path.join(ROOT, 'brand-studio/src/assets/devices/generated')
const raws = fs.readdirSync(DIR).filter((f) => f.endsWith('-raw.png'))
const BEZEL = 0.016

// Runs in the page: returns { png (data URL), w, h, screen: { x, y, w, h, r } }.
function key([src, BEZEL]) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = reject
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight
      const c = document.createElement('canvas'); c.width = W; c.height = H
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, W, H), px = d.data
      const isWhite = (i) => Math.min(px[i], px[i + 1], px[i + 2]) > 228 && Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]) < 18
      const greenness = (i) => px[i + 1] - Math.max(px[i], px[i + 2])
      const isGreen = (i) => greenness(i) > 70
      const fill = (seeds, test) => {
        const seen = new Uint8Array(W * H), stack = [...seeds]
        while (stack.length) {
          const p = stack.pop()
          if (seen[p] || !test(p * 4)) continue
          seen[p] = 1
          const x = p % W, y = (p / W) | 0
          if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1)
          if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W)
        }
        return seen
      }
      const border = []
      for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x)
      for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1)
      const bg = fill(border, isWhite)
      const center = ((H / 2) | 0) * W + ((W / 2) | 0)
      const scr = fill([center], isGreen)
      let sx0 = W, sy0 = H, sx1 = 0, sy1 = 0, ox0 = W, oy0 = H, ox1 = 0, oy1 = 0
      for (let p = 0; p < W * H; p++) {
        const i = p * 4, x = p % W, y = (p / W) | 0
        if (bg[p] || scr[p]) { px[i + 3] = 0; if (scr[p]) { if (x < sx0) sx0 = x; if (x > sx1) sx1 = x; if (y < sy0) sy0 = y; if (y > sy1) sy1 = y } continue }
        // Soft edges: light pixels next to the background fade; green spill goes neutral.
        const near = (m) => (x > 0 && m[p - 1]) || (x < W - 1 && m[p + 1]) || (y > 0 && m[p - W]) || (y < H - 1 && m[p + W])
        if (near(bg)) px[i + 3] = Math.max(0, Math.min(255, (255 - Math.min(px[i], px[i + 1], px[i + 2])) * 4))
        if (greenness(i) > 8) px[i + 1] = Math.max(px[i], px[i + 2])
        if (near(scr) && greenness(i) > 0) px[i + 3] = 255
        if (px[i + 3] > 0) { if (x < ox0) ox0 = x; if (x > ox1) ox1 = x; if (y < oy0) oy0 = y; if (y > oy1) oy1 = y }
      }
      // Corner radius of the opening, from where the arc crosses its diagonal.
      let g = 0
      while (g < (sx1 - sx0) / 2 && !scr[(sy0 + g) * W + sx0 + g]) g++
      let r = g / (1 - Math.SQRT1_2)
      // Thin the bezel: measure the dark band left of the opening at mid-height,
      // then cut a larger concentric rounded rect (1px soft edge).
      const luma = (i) => 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]
      const midY = ((sy0 + sy1) / 2) | 0
      let band = 0
      while (sx0 - band - 1 > 0 && luma(((midY) * W + sx0 - band - 1) * 4) < 48) band++
      const grow = Math.max(0, band - Math.round(BEZEL * (ox1 - ox0)))
      if (grow) {
        sx0 -= grow; sy0 -= grow; sx1 += grow; sy1 += grow; r += grow
        const cx0 = sx0 + r, cy0 = sy0 + r, cx1 = sx1 - r, cy1 = sy1 - r
        for (let y = sy0; y <= sy1; y++) for (let x = sx0; x <= sx1; x++) {
          const dx = Math.max(cx0 - x, 0, x - cx1), dy = Math.max(cy0 - y, 0, y - cy1)
          const inside = r - Math.hypot(dx, dy) // > 0 inside the rounded rect
          if (inside <= -1) continue
          const i = (y * W + x) * 4
          px[i + 3] = Math.min(px[i + 3], Math.round(255 * Math.max(0, Math.min(1, -inside))))
        }
      }
      ctx.putImageData(d, 0, 0)
      const out = document.createElement('canvas'); out.width = ox1 - ox0 + 1; out.height = oy1 - oy0 + 1
      out.getContext('2d').drawImage(c, ox0, oy0, out.width, out.height, 0, 0, out.width, out.height)
      resolve({ png: out.toDataURL('image/png'), w: out.width, h: out.height, screen: { x: sx0 - ox0, y: sy0 - oy0, w: sx1 - sx0 + 1, h: sy1 - sy0 + 1, r: Math.round(r) }, band, grow })
    }
    img.src = src
  })
}

const browser = await chromium.launch()
const page = await browser.newPage()
const meta = {}
for (const f of raws) {
  const id = f.replace(/-raw\.png$/, '')
  const r = await page.evaluate(key, [`data:image/png;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`, BEZEL])
  fs.writeFileSync(path.join(DIR, `${id}.png`), Buffer.from(r.png.split(',')[1], 'base64'))
  meta[id] = { file: `${id}.png`, w: r.w, h: r.h, screen: r.screen, screenRatio: +(r.screen.h / r.screen.w).toFixed(3) }
  console.log(`  ✓ ${id} · bezel ${r.band}px → ${r.band - r.grow}px`, JSON.stringify(meta[id]))
}
fs.writeFileSync(path.join(DIR, 'shells.json'), JSON.stringify(meta, null, 2) + '\n')
await browser.close()
