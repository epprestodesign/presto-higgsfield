// The logo looks as real image files, so the Presto pages (which use the logo
// image as-is) show the chosen look: drawn once on a canvas per logo + look and
// cached. Until a look is ready the original logo is used.
import { reactive } from 'vue'
import { logoOf } from '../mockAgent.js'

const cache = reactive({}) // `${look}|${src}` → data URL
const pending = new Set()

function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function contain(img, box) {
  const s = Math.min(box / img.naturalWidth, box / img.naturalHeight)
  return { w: img.naturalWidth * s, h: img.naturalHeight * s }
}

async function draw(src, look) {
  const img = await load(src)
  const N = 512
  const c = document.createElement('canvas')
  c.width = N
  c.height = N
  const ctx = c.getContext('2d')
  const pad = look === 'white' ? 0.04 : 0.14
  const { w, h } = contain(img, N * (1 - pad * 2))
  if (look === 'badge') {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(0, 0, N, N, N * 0.22)
    ctx.fill()
  } else if (look === 'dark') {
    ctx.fillStyle = '#111111'
    ctx.beginPath()
    ctx.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.filter = 'brightness(1.15) contrast(1.05)'
  } else if (look === 'white') {
    ctx.filter = 'brightness(0) invert(1)'
  }
  ctx.drawImage(img, (N - w) / 2, (N - h) / 2, w, h)
  return c.toDataURL('image/png')
}

/** The logo image for a project / draft in its chosen look (sync; fills in when drawn). */
export function lookedLogo(view) {
  const src = logoOf(view)
  const look = view.look || 'original'
  if (!src || look === 'original') return src
  const key = `${look}|${src}`
  if (cache[key]) return cache[key]
  if (!pending.has(key)) {
    pending.add(key)
    draw(src, look).then((url) => { cache[key] = url }).catch(() => {}).finally(() => pending.delete(key))
  }
  return src
}
