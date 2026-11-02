import { describe, it, expect } from 'vitest'
import {
  makeImage, detectBackground, removeBackground, alphaBounds, extractPalette, logoContrastOn, knockout,
  coverCrop, centerZone, zoneStats, gradeZone, scrimNeeded, contentBounds,
  keyOut, reverseKnockout, dilate, edgeContrast, haloShare, lumaKey, dropStrays,
} from '../banner-lab/pixels.js'
import { buildPrompt, flareInput, STANDARD_RULES } from '../banner-lab/prompt.js'
import { vectorize } from '../banner-lab/vectorize.js'
import { optimizePrompt, analyzeReference, colorName } from '../banner-lab/optimizePrompt.js'
import { THRESHOLDS, CENTER_ZONE, GENERATION, BANNER_SPECS, LOGO_SPEC, PLACEMENTS, fitInBox } from '../banner-lab/standards.js'

/** w×h image filled with `bg`, with a `fg` square of side s centred. */
function logoOn(w, h, bg, fg, s, { hole } = {}) {
  const img = makeImage(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inSq = Math.abs(x - w / 2) < s / 2 && Math.abs(y - h / 2) < s / 2
      const inHole = hole && Math.abs(x - w / 2) < hole / 2 && Math.abs(y - h / 2) < hole / 2
      const c = inSq && !inHole ? fg : bg
      img.data.set(c, (y * w + x) * 4)
    }
  }
  return img
}
const px = (img, x, y) => [...img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4)]

describe('standards', () => {
  it('matches the Presto banner system', () => {
    expect(LOGO_SPEC.size).toBe(200)
    expect(BANNER_SPECS.map((b) => `${b.width}x${b.height}`)).toEqual(['1440x400', '1440x240'])
  })
})

describe('logo background', () => {
  it('detects transparent, solid and complex backgrounds', () => {
    expect(detectBackground(logoOn(40, 40, [0, 0, 0, 0], [200, 0, 0, 255], 20)).kind).toBe('transparent')
    expect(detectBackground(logoOn(40, 40, [255, 255, 255, 255], [200, 0, 0, 255], 20))).toEqual({ kind: 'solid', color: [255, 255, 255] })
    const noisy = makeImage(40, 40)
    for (let i = 0; i < noisy.data.length; i += 4) noisy.data.set([(i * 37) % 256, (i * 91) % 256, (i * 13) % 256, 255], i)
    expect(detectBackground(noisy).kind).toBe('complex')
  })

  it('removes only the background connected to the edge, keeping inner white', () => {
    // Red ring (white hole in the middle) on a white box.
    const img = logoOn(60, 60, [255, 255, 255, 255], [200, 20, 20, 255], 30, { hole: 10 })
    const out = removeBackground(img, [255, 255, 255])
    expect(px(out, 2, 2)[3]).toBe(0) // outer white gone
    expect(px(out, 30, 30)).toEqual([255, 255, 255, 255]) // inner white kept
    expect(px(out, 30, 20)[3]).toBe(255) // ring kept
  })

  it('trims to the visible artwork', () => {
    const img = logoOn(50, 40, [0, 0, 0, 0], [0, 0, 255, 255], 10)
    // The fixture's square covers x 21–29, y 16–24 (strict < on both sides).
    expect(alphaBounds(img)).toEqual({ x: 21, y: 16, w: 9, h: 9 })
    expect(alphaBounds(makeImage(5, 5))).toBeNull()
  })
})

describe('logo colour and contrast', () => {
  it('extracts the main colours, most used first', () => {
    const img = logoOn(40, 40, [10, 40, 160, 255], [250, 200, 0, 255], 16)
    const p = extractPalette(img)
    expect(p[0].hex).toBe('#0A28A0')
    expect(p[1].hex).toBe('#FAC800')
    expect(p[0].share).toBeGreaterThan(p[1].share)
  })

  it('flags a navy logo on the navy banner, and passes its white knockout', () => {
    const navy = logoOn(20, 20, [0, 0, 0, 0], [12, 30, 80, 255], 20)
    expect(logoContrastOn(navy, '#0B1736').verdict).toBe('low')
    expect(logoContrastOn(knockout(navy), '#0B1736').verdict).toBe('good')
  })
})

describe('banner fit', () => {
  it('cover-crops around the focal point, clamped to the image', () => {
    // 2100×900 (21:9) to 1440×400 (3.6:1): full width, a band of 583px.
    const c = coverCrop(2100, 900, 1440, 400)
    expect(c.w).toBe(2100)
    expect(Math.round(c.h)).toBe(583)
    expect(Math.round(c.y)).toBe(158)
    expect(coverCrop(2100, 900, 1440, 400, { fy: 0 }).y).toBe(0)
    expect(Math.round(coverCrop(2100, 900, 1440, 240, { fy: 1 }).y)).toBe(550)
  })

  it('grades a bright center as failing and finds the scrim that fixes it', () => {
    const bright = logoOn(144, 40, [200, 200, 200, 255], [200, 200, 200, 255], 1)
    const zone = centerZone(144, 40, CENTER_ZONE)
    expect(gradeZone(zoneStats(bright, zone), THRESHOLDS).pass).toBe(false)
    const s = scrimNeeded(bright, zone, THRESHOLDS)
    expect(s).toBeGreaterThan(0)
    expect(s).toBeLessThanOrEqual(THRESHOLDS.maxScrim)
    expect(gradeZone(zoneStats(bright, zone, { scrim: s }), THRESHOLDS).dark).toBe(true)
  })

  it('passes a dark calm center with no scrim', () => {
    const navy = logoOn(144, 40, [11, 23, 54, 255], [11, 23, 54, 255], 1)
    const zone = centerZone(144, 40, CENTER_ZONE)
    expect(gradeZone(zoneStats(navy, zone), THRESHOLDS)).toMatchObject({ pass: true, calm: 'calm' })
    expect(scrimNeeded(navy, zone, THRESHOLDS)).toBe(0)
  })
})

describe('placements', () => {
  it('fits a logo to Presto’s boxes by height, or width when it is wide', () => {
    const nav = PLACEMENTS.find((p) => p.id === 'nav').box // 220 × 48
    expect(fitInBox(1, nav)).toEqual({ w: 48, h: 48, limit: 'height' })
    expect(fitInBox(6, nav)).toEqual({ w: 220, h: 37, limit: 'width' })
    expect(BANNER_SPECS[0]).toMatchObject({ logoHeight: 120, logoMaxWidth: 708 })
  })

  it('finds the logo inside an upload, ignoring its white box', () => {
    const img = logoOn(60, 40, [255, 255, 255, 255], [20, 20, 120, 255], 10)
    expect(contentBounds(img, detectBackground(img))).toEqual({ x: 26, y: 16, w: 9, h: 9 })
  })
})

describe('vectorize', () => {
  it('traces a two-colour logo to a clean SVG without the background layer', () => {
    const img = logoOn(40, 30, [0, 0, 0, 0], [200, 30, 30, 255], 20, { hole: 8 })
    const v = vectorize(img, { colors: 4 })
    expect(v.svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30">')).toBe(true)
    expect(v.svg).not.toMatch(/opacity="0"|width=|desc=/)
    expect(v.paths).toBe(1) // the ring; its hole stays transparent
    expect(v.palette).toEqual(['#C81E1E'])
  })
})

describe('optimize prompt', () => {
  it('names colours in plain English', () => {
    expect(colorName('#0B1736')).toBe('deep navy')
    expect(colorName('#E8812A')).toBe('vivid orange')
    expect(colorName('#B07A50')).toBe('orange')
    expect(colorName('#FFFFFF')).toBe('white')
  })

  it('reads a dark, cool photo reference', () => {
    const img = makeImage(60, 60)
    for (let i = 0; i < img.data.length; i += 4) img.data.set([10 + (i % 7), 20 + (i % 11), 60 + (i % 13), 255], i)
    expect(analyzeReference(img)).toMatchObject({ brightness: 'dark', temperature: 'cool' })
  })

  it('expands a short brief into a structured, Presto-safe prompt', () => {
    const out = optimizePrompt({
      description: 'volleyball net at night',
      style: 'photo', moods: ['Bold'], palette: ['#0A28A0'],
      references: [{ colors: ['#0B1736'], brightness: 'dark', saturation: 'muted', temperature: 'cool', kind: 'photo' }],
    })
    expect(out.prompt).toMatch(/^Scene: volleyball net at night\. Setting: an indoor volleyball arena/)
    for (const label of ['Composition', 'Camera', 'Lighting', 'Colour', 'References', 'Finish', 'Avoid']) expect(out.prompt).toContain(`${label}:`)
    expect(out.prompt).toContain('floodlights')
    expect(out.prompt).toContain('deep navy')
    expect(out.changes).toContain('Named the setting in detail')
    expect(out.prompt.length).toBeLessThan(2000)
  })

  it('keeps the organizer’s colours and light direction ahead of the brand palette', () => {
    const out = optimizePrompt({ description: 'Volleyball net in deep blue, arena lights from the right', palette: ['#14452F', '#E8812A'] })
    expect(out.prompt).toContain('directional light from the right')
    expect(out.prompt).toMatch(/Led by the colours described above and brand colours deep green and vivid orange only as subtle accents/)
    expect(out.changes).toContain('Kept your colours first, brand colours as accents')
  })
})

describe('prompt', () => {
  it('wraps the organizer’s words in the standards', () => {
    const p = buildPrompt({ description: '  volleyball   net, deep blue ', references: 2, moods: ['Bold'], palette: ['#0A28A0'] })
    expect(p).toContain('"volleyball net, deep blue"')
    expect(p).toContain('2 attached reference images')
    expect(p).toContain('#0A28A0')
    for (const r of STANDARD_RULES) expect(p).toContain(r.prompt)
  })

  it('builds the Flare body, references capped', () => {
    const body = flareInput('x', Array.from({ length: 9 }, (_, i) => `https://r/${i}`), GENERATION)
    expect(body).toMatchObject({ aspect_ratio: '21:9', resolution: '2k', quality: 'high' })
    expect(body.image_urls).toHaveLength(GENERATION.maxReferences)
    expect(flareInput('x', [], GENERATION).image_urls).toBeUndefined()
  })
})

describe('studio model picker', () => {
  it('auto-picks by mode, text, references, style and subject', async () => {
    const { pickModel, resolveModel, MODELS } = await import('../banner-lab/studioModels.js')
    expect(pickModel({ mode: 'logo' }).id).toBe('logo-local')
    expect(pickModel({ prompt: 'Sponsor ad with the headline Game Day' }).id).toBe('ideogram')
    expect(pickModel({ prompt: 'volleyball arena', references: 2 })).toMatchObject({ id: 'flare', reason: expect.stringContaining('2 references') })
    expect(pickModel({ prompt: 'Abstract halftone waves in navy' }).id).toBe('recraft')
    expect(pickModel({ prompt: 'Cheering fans in the stands' }).id).toBe('soul')
    expect(pickModel({ prompt: 'Lakeside camp at golden hour' }).id).toBe('flare')
    // Saying "no text", or mentioning the page's own text, isn't asking for text in the art
    expect(pickModel({ prompt: 'Darker and moodier, keeping the center calm so the white logo and text stand out' }).id).not.toBe('ideogram')
    expect(pickModel({ prompt: 'Abstract gradients on navy with a dark, quiet center and no text' }).id).toBe('recraft')
    expect(pickModel({ prompt: 'Stadium at night, text-free, without any lettering' }).id).not.toBe('ideogram')
    expect(pickModel({ prompt: 'Put the slogan "Play Hard" across the top' }).id).toBe('ideogram')
    expect(resolveModel('recraft', { prompt: 'fans' }).id).toBe('recraft')
    expect(MODELS[0].id).toBe('auto')
  })
})

// ── Logo clean-up methods and looks ───────────────────────────────────────
// A cream box with a black ring (an "O") whose hole shows the cream background.
function ringLogo({ bg = [245, 242, 235], ink = [10, 10, 10], detail = null } = {}) {
  const img = makeImage(40, 40)
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
    const d = Math.hypot(x - 19.5, y - 19.5)
    const c = d < 14 && d >= 6 ? ink : detail && d < 6 ? detail : bg
    img.data.set([...c, 255], (y * 40 + x) * 4)
  }
  return img
}
const alphaAt = (img, x, y) => img.data[(y * img.width + x) * 4 + 3]

describe('logo clean-up methods', () => {
  it('edge fill keeps the hole inside a letter; colour key clears it', () => {
    const img = ringLogo()
    const bg = detectBackground(img).color
    const flood = removeBackground(img, bg)
    const key = keyOut(img, bg)
    expect(alphaAt(flood, 1, 1)).toBe(0) // outside: gone either way
    expect(alphaAt(key, 1, 1)).toBe(0)
    expect(alphaAt(flood, 20, 20)).toBe(255) // the hole: kept by edge fill (not connected to the border)
    expect(alphaAt(key, 20, 20)).toBe(0) // …cleared by the colour key
    expect(alphaAt(key, 20, 9)).toBe(255) // the ring itself stays
  })
  it('measures a light halo left on the edge', () => {
    const img = ringLogo()
    const bg = detectBackground(img).color
    expect(haloShare(removeBackground(img, bg), bg)).toBeLessThan(0.05)
    // A logo that kept a cream fringe on its edge.
    const fringe = removeBackground(img, bg)
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const d = Math.hypot(x - 19.5, y - 19.5)
      if (d >= 13 && d < 14) fringe.data.set([240, 236, 228, 255], (y * 40 + x) * 4)
    }
    expect(haloShare(fringe, bg)).toBeGreaterThan(0.5)
  })
})

describe('logo looks for dark banners', () => {
  it('white with cut-outs: a dark badge turns white and its light detail cuts through', () => {
    const badge = removeBackground(ringLogo({ ink: [12, 18, 40], detail: [255, 255, 255] }), [245, 242, 235])
    const { img, cutouts } = reverseKnockout(badge)
    expect(cutouts).toBe(true)
    const i = (y, x) => (y * 40 + x) * 4
    expect([...img.data.slice(i(20, 9), i(20, 9) + 4)]).toEqual([255, 255, 255, 255]) // dark ring → white
    expect(img.data[i(20, 20) + 3]).toBe(0) // white center → cut out
  })
  it('a plain black logo becomes all white (no cut-outs)', () => {
    const { img, cutouts } = reverseKnockout(keyOut(ringLogo(), [245, 242, 235])) // just the black ring
    expect(cutouts).toBe(false)
    expect(img.data[(20 * 40 + 9) * 4]).toBe(255)
  })
  it('dilate grows a mask by r in every direction', () => {
    const m = new Uint8Array(9 * 9); m[4 * 9 + 4] = 1
    const g = dilate(m, 9, 9, 2)
    expect(g.reduce((s, v) => s + v, 0)).toBe(25) // a 5×5 square
    expect(g[2 * 9 + 2]).toBe(1)
    expect(g[1 * 9 + 4]).toBe(0)
  })
  it('edge contrast: black on navy fails, white on navy and black on a white box pass', () => {
    const navy = [11, 23, 54]
    const scene = (logoColor, ringColor) => {
      const img = makeImage(30, 30)
      const mask = new Uint8Array(900)
      for (let p = 0; p < 900; p++) {
        const x = p % 30, y = (p - x) / 30
        const inLogo = x >= 10 && x < 20 && y >= 10 && y < 20
        const nearLogo = x >= 6 && x < 24 && y >= 6 && y < 24
        mask[p] = inLogo ? 1 : 0
        img.data.set([...(inLogo ? logoColor : nearLogo ? ringColor : navy), 255], p * 4)
      }
      return edgeContrast(img, mask, 3)
    }
    expect(scene([0, 0, 0], navy).verdict).toBe('low')
    expect(scene([255, 255, 255], navy)).toMatchObject({ verdict: 'good' })
    expect(scene([0, 0, 0], [255, 255, 255]).ratio).toBeGreaterThan(15) // the white box
  })
})

describe('busy-background clean-up', () => {
  it('lifts bright and colourful lettering off a dark, smoky background', () => {
    // 40×40: dark grey "smoke" (varying 10–60), with a white bar and a blue bar.
    const img = makeImage(40, 40)
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const smoke = 10 + ((x * 7 + y * 13) % 50)
      const c = y >= 12 && y < 18 && x >= 6 && x < 34 ? [255, 255, 255]
        : y >= 22 && y < 28 && x >= 6 && x < 34 ? [40, 60, 220]
          : [smoke, smoke, smoke + 4]
      img.data.set([...c, 255], (y * 40 + x) * 4)
    }
    const { img: out, kept } = lumaKey(img, { dark: true })
    const a = (x, y) => out.data[(y * 40 + x) * 4 + 3]
    expect(a(2, 2)).toBe(0) // smoke gone
    expect(a(38, 35)).toBe(0)
    expect(a(20, 15)).toBe(255) // white lettering kept
    expect(a(20, 25)).toBe(255) // saturated blue kept, though it's fairly dark
    expect(kept).toBeGreaterThan(0.15)
    expect(kept).toBeLessThan(0.4)
  })
  it('lifts dark lettering off a light, textured background', () => {
    const img = makeImage(30, 30)
    for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) {
      const paper = 225 + ((x * 5 + y * 3) % 25)
      const ink = x >= 8 && x < 22 && y >= 10 && y < 20
      img.data.set([...(ink ? [20, 20, 30] : [paper, paper, paper - 6]), 255], (y * 30 + x) * 4)
    }
    const { img: out } = lumaKey(img, { dark: false })
    expect(out.data[(2 * 30 + 2) * 4 + 3]).toBe(0)
    expect(out.data[(15 * 30 + 15) * 4 + 3]).toBe(255)
  })
})

describe('logo projects: colours, names and follow-ups', () => {
  it('turns a logo palette into brand colours', async () => {
    const { paletteToColors } = await import('../banner-lab/studioProjects.js')
    const c = paletteToColors([{ hex: '#0A0A0C', share: 50 }, { hex: '#2B3FD6', share: 20 }, { hex: '#FFFFFF', share: 15 }, { hex: '#D9261C', share: 10 }])
    expect(c.primary).toBe('#2B3FD6') // most-used real colour, not black or white
    expect(c.secondary).toBe('#D9261C')
    expect(c.ink).toBe('#0A0A0C') // darkest
    expect(c.surface).toBe('#FFFFFF')
  })
  it('names a project from its uploaded file', async () => {
    const { nameFromFile } = await import('../banner-lab/studioProjects.js')
    expect(nameFromFile('bret-michaels_live-poster.png')).toBe('Bret Michaels Live Poster')
  })
  it('"isolate the logo" picks the background-removal clean-up', async () => {
    const { logoReply } = await import('../banner-lab/studioProjects.js')
    const project = { messages: [] }
    const picked = []
    logoReply(project, 'Can you isolate the logo from the background?', { pick: (w) => (picked.push(w), true), methods: [{ id: 'darkkey' }, { id: 'lightkey' }, { id: 'asis' }] })
    expect(picked).toEqual([{ method: 'darkkey' }])
    expect(project.messages.at(-1).text).toMatch(/removed the dark background/)
  })
})

describe('stray bits after a background key', () => {
  it('drops specks far from the logo but keeps small text next to it', () => {
    const img = makeImage(100, 60)
    const fill = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.data.set([255, 255, 255, 255], (y * 100 + x) * 4) }
    fill(30, 20, 70, 36) // the logo
    fill(40, 39, 46, 42) // small text just under it
    fill(2, 2, 5, 5) // a floodlight in the corner
    fill(94, 54, 98, 58) // another in the far corner
    const { img: out, dropped } = dropStrays(img)
    const a = (x, y) => out.data[(y * 100 + x) * 4 + 3]
    expect(a(50, 28)).toBe(255)
    expect(a(42, 40)).toBe(255)
    expect(a(3, 3)).toBe(0)
    expect(a(95, 55)).toBe(0)
    expect(dropped).toBe(9 + 16)
  })
})

describe('real banner generation (Studio)', () => {
  it('turns a chat request into a subject and names the church scene', async () => {
    const { briefFromRequest, optimizePrompt } = await import('../banner-lab/optimizePrompt.js')
    expect(briefFromRequest('can we add in a church dark background ?')).toBe('church dark background')
    const { prompt } = optimizePrompt({ description: 'can we add in a church dark background ?' })
    expect(prompt).toMatch(/^Scene: church dark background\./)
    expect(prompt).toMatch(/stained-glass/)
    expect(prompt).toMatch(/calm, uncluttered, darker center/)
  })
  it('builds tweaks on the previous brief', async () => {
    const { composeBrief } = await import('../banner-lab/studioGenerate.js')
    expect(composeBrief('make it darker', 'Church dark background')).toBe('Church dark background. Change: make it darker')
    expect(composeBrief('a sunny beach festival', 'Church dark background')).toBe('a sunny beach festival')
  })
  it('fills a set from the generator, and marks it failed when nothing comes back', async () => {
    const { revise, setBanners } = await import('../banner-lab/studioProjects.js')
    const project = { messages: [], banners: [], sets: [], colors: { primary: '#123456' }, logo: null, status: 'ready', steps: [] }
    const generate = async ({ text }) => ({ brief: text, prompt: `Scene: ${text}.`, images: ['https://cdn.example/a.png', 'https://cdn.example/b.png'], errors: [] })
    const set = await revise(project, { text: 'church dark background' }, { generate })
    expect(set).toMatchObject({ status: 'ready', sentPrompt: 'Scene: church dark background.', modelId: 'flare' })
    const made = setBanners(project, set.id) // in the order they were made
    expect(made.map((b) => b.src)).toEqual(['https://cdn.example/a.png', 'https://cdn.example/b.png'])
    expect(project.selectedBannerId).toBe(made[0].id)
    const failing = async () => ({ brief: 'x', prompt: 'x', images: [], errors: ['You need to be logged in to generate banners.'] })
    const set2 = await revise(project, { text: 'something else' }, { generate: failing })
    expect(set2).toMatchObject({ status: 'failed', error: 'You need to be logged in to generate banners.' })
    expect(project.messages.at(-1).text).toMatch(/failed/)
  })
})
