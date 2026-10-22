// Page mockups for the asset export: the Presto Homepage, Hotel directory and
// Hotel details pages at desktop (1440) and mobile (390) width, with the
// branded banner and every display ad drawn in its real slot. Hotel content is
// a simplified, static rendering (names/prices from the upstream fixtures) so
// the banner + ad placements are what reads.
import { resolvePalette } from '../theme/brandTheme.js'
import { AD_SIZES, AD_SLOTS, placementsFromPreset } from '../models/ads.js'
import { HOTELS } from '../data/upstream/hotels.js'
import { sampleProject } from '../data/sampleEvents.js'
import { renderBanner, renderAd, loadImage } from './render.js'

const FONT = "'PT Sans', sans-serif"
const INK = '#0F172A'
const SOFT = '#475569'
const FAINT = '#94A3B8'
const LINE = '#E2E8F0'
const CANVAS_BG = '#F8FAFC'

// Shown when a page has no ads configured — so every mock shows its ad slots.
const SAMPLE_PRESET = { landing: 'rectangles', browse: 'billboards-rail', details: 'bottom-billboard' }

/** Placements + sponsors for a page; falls back to sample sponsors/presets. */
export function pageAds(project, page) {
  const ads = project?.ads || {}
  const own = ads.enabled && (ads.sponsors || []).length ? ads.placements?.[page] || [] : []
  if (own.some((p) => (p.count || 1) > 0 && p.sponsorIds?.length)) return { placements: own, sponsors: ads.sponsors, sample: false }
  const sponsors = sampleProject('heartland').ads.sponsors.map((s) => ({ ...s, name: s.name }))
  return { placements: placementsFromPreset(page, SAMPLE_PRESET[page], sponsors.map((s) => s.id)), sponsors, sample: true }
}

/** Expand placements into units for one slot: [{ size, sponsor }]. */
function unitsFor(ads, slotId, mobile) {
  const slot = AD_SLOTS[slotId.split('.')[0]]?.find((s) => s.id === slotId)
  const out = []
  for (const p of ads.placements.filter((x) => x.slot === slotId)) {
    const size = mobile ? slot?.mobile : p.size
    if (!size || !AD_SIZES[size]) continue
    const count = mobile ? 1 : p.count || 1
    for (let k = 0; k < count; k++) {
      const id = p.sponsorIds?.[k % Math.max(1, p.sponsorIds.length)]
      out.push({ size, sponsor: ads.sponsors.find((s) => s.id === id) || ads.sponsors[k % ads.sponsors.length] })
    }
  }
  return out
}

function rr(ctx, x, y, w, h, r = 6) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function text(ctx, str, x, y, { size = 14, weight = 400, color = INK, align = 'left', max } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  let s = String(str || '')
  if (max) while (s.length > 1 && ctx.measureText(s).width > max) s = s.slice(0, -2) + '…'
  ctx.fillText(s, x, y)
}
function wrapLines(ctx, str, maxW, size, weight = 400) {
  ctx.font = `${weight} ${size}px ${FONT}`
  const words = String(str || '').split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}
function placeholderImg(ctx, x, y, w, h, img) {
  ctx.save()
  rr(ctx, x, y, w, h, 4); ctx.clip()
  if (img) {
    const r = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    ctx.drawImage(img, x + (w - img.naturalWidth * r) / 2, y + (h - img.naturalHeight * r) / 2, img.naturalWidth * r, img.naturalHeight * r)
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h)
    g.addColorStop(0, '#E2E8F0'); g.addColorStop(1, '#CBD5E1')
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h)
    // simple building glyph
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    const bw = Math.min(w, h) * 0.28
    ctx.fillRect(x + w / 2 - bw / 2, y + h / 2 - bw * 0.6, bw, bw * 1.2)
    ctx.fillStyle = '#CBD5E1'
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) ctx.fillRect(x + w / 2 - bw / 2 + bw * (0.15 + j * 0.27), y + h / 2 - bw * 0.45 + i * bw * 0.3, bw * 0.15, bw * 0.15)
  }
  ctx.restore()
}
function button(ctx, label, x, y, w, h, color, { outline = false, size = 14 } = {}) {
  rr(ctx, x, y, w, h, 4)
  if (outline) { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke() } else { ctx.fillStyle = color; ctx.fill() }
  text(ctx, label, x + w / 2, y + h / 2 + size * 0.36, { size, weight: 700, color: outline ? color : '#fff', align: 'center' })
}
function field(ctx, label, value, x, y, w, h) {
  rr(ctx, x, y, w, h, 4); ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1; ctx.stroke()
  text(ctx, label, x + 14, y + h * 0.4, { size: 12, color: FAINT, max: w - 28 })
  text(ctx, value, x + 14, y + h * 0.74, { size: 15, color: INK, max: w - 28 })
}

async function drawAds(ctx, units, x, y, maxW, { gap = 24, align = 'center' } = {}) {
  // Rows of units that fit maxW; returns the height used.
  let rowY = y
  let i = 0
  while (i < units.length) {
    const row = []
    let w = 0
    while (i < units.length) {
      const d = AD_SIZES[units[i].size]
      const add = (row.length ? gap : 0) + d.width
      if (row.length && w + add > maxW) break
      row.push(units[i]); w += add; i++
    }
    let cx = align === 'center' ? x + (maxW - w) / 2 : x
    let rowH = 0
    for (const u of row) {
      const d = AD_SIZES[u.size]
      const scale = Math.min(1, maxW / d.width)
      const ad = await renderAd(u.sponsor, u.size)
      ctx.drawImage(ad, cx, rowY, d.width * scale, d.height * scale)
      cx += d.width * scale + gap
      rowH = Math.max(rowH, d.height * scale)
    }
    rowY += rowH + gap
  }
  return units.length ? rowY - y - gap : 0
}

async function drawNav(ctx, W, project, mobile) {
  const h = mobile ? 56 : 72
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, h)
  ctx.fillStyle = LINE; ctx.fillRect(0, h - 1, W, 1)
  const pad = mobile ? 16 : 48
  const logo = await loadImage(project.brandKit?.logo?.src)
  let x = pad
  if (logo) {
    const lh = mobile ? 30 : 40
    const lw = Math.min((logo.naturalWidth / logo.naturalHeight) * lh, mobile ? 80 : 140)
    ctx.drawImage(logo, x, (h - lh) / 2, lw, (lw / ((logo.naturalWidth / logo.naturalHeight) * lh)) * lh)
    x += lw + 12
  }
  text(ctx, project.event?.name || 'Your Event', x, h / 2 + 7, { size: mobile ? 15 : 20, weight: 700, max: mobile ? W - x - 56 : 560 })
  if (mobile) {
    ctx.fillStyle = INK
    for (let i = 0; i < 3; i++) ctx.fillRect(W - pad - 22, h / 2 - 7 + i * 7, 22, 2.5)
  } else {
    text(ctx, 'Contact Us', W - pad - 210, h / 2 + 5, { size: 15, weight: 700 })
    rr(ctx, W - pad - 150, h / 2 - 20, 150, 40, 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke()
    text(ctx, 'Manage Booking', W - pad - 75, h / 2 + 5, { size: 14, weight: 700, align: 'center' })
  }
  return h
}

function drawFooter(ctx, W, y, mobile) {
  const h = mobile ? 64 : 72
  ctx.fillStyle = '#F1F5F9'; ctx.fillRect(0, y, W, h)
  text(ctx, 'Powered by EventPipe · Presto', W / 2, y + h / 2 + 5, { size: 13, color: FAINT, align: 'center' })
  return h
}

function adLabel(ctx, label, x, y) {
  text(ctx, label, x, y, { size: 11, weight: 700, color: FAINT })
}

/**
 * @param project   plain project
 * @param hero      resolved hero props ({ ...heroProps, concept })
 * @param page      'landing' | 'browse' | 'details'
 * @param mobile    390px phone layout instead of 1440 desktop
 */
export async function renderPageMock(project, hero, page, { mobile = false } = {}) {
  const W = mobile ? 390 : 1440
  const c = document.createElement('canvas')
  c.width = W; c.height = 4200
  const ctx = c.getContext('2d')
  ctx.fillStyle = CANVAS_BG; ctx.fillRect(0, 0, W, c.height)
  const primary = resolvePalette(project.brandKit?.colors).primary
  const ads = pageAds(project, page)
  const pad = mobile ? 16 : 130
  const inner = W - pad * 2
  // Hotel photos are neutral placeholders (the kit's imagery is event art, not hotels).
  const imgs = []
  await document.fonts?.load(`700 16px ${FONT}`).catch(() => {})

  let y = await drawNav(ctx, W, project, mobile)

  // Banner
  const landing = page === 'landing'
  const bw = W
  const bh = landing ? (mobile ? 280 : 400) : (mobile ? 160 : 240)
  const banner = await renderBanner(hero, { width: bw, height: bh, size: landing ? 'landing' : 'compact' })
  ctx.drawImage(banner, 0, y)
  y += bh

  if (landing) {
    // Booking widget tucked onto the hero
    const ww = mobile ? W - 32 : 1040
    const wx = (W - ww) / 2
    const wy = y - (mobile ? 24 : 48)
    const wh = mobile ? 248 : 112
    ctx.save(); ctx.shadowColor = 'rgba(15,23,42,0.12)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4
    rr(ctx, wx, wy, ww, wh, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore()
    if (mobile) {
      ;['Booking Type', 'Check-in - Check-out', 'Travelers'].forEach((l, i) => field(ctx, l, i === 1 ? hero.dates || 'Add dates' : i === 2 ? '1 traveler, 1 room' : '', wx + 16, wy + 16 + i * 60, ww - 32, 52))
      button(ctx, 'Search', wx + 16, wy + wh - 52 - 12 + 16 - 16, ww - 32, 44, primary)
    } else {
      const fw = (ww - 48 - 140 - 36) / 3
      ;['Booking Type', 'Check-in - Check-out', 'Travelers'].forEach((l, i) => field(ctx, l, i === 1 ? hero.dates || 'Add dates' : i === 2 ? '1 traveler, 1 room' : '', wx + 24 + i * (fw + 12), wy + 24, fw, 64))
      button(ctx, 'Search', wx + ww - 24 - 140, wy + 24, 140, 64, primary, { size: 16 })
    }
    y = wy + wh + (mobile ? 28 : 48)

    // Intro + benefits (real copy)
    const sec = project.pages?.landing?.sections || {}
    const maxW = mobile ? W - 32 : 860
    for (const para of (sec.intro?.paragraphs || []).slice(0, 2)) {
      for (const line of wrapLines(ctx, para, maxW, mobile ? 15 : 17)) { text(ctx, line, W / 2, y, { size: mobile ? 15 : 17, color: SOFT, align: 'center' }); y += mobile ? 22 : 26 }
      y += 10
    }
    for (const b of (sec.benefits?.items || []).slice(0, 4)) { text(ctx, `✔  ${b}`, W / 2, y + 4, { size: mobile ? 14 : 16, align: 'center' }); y += mobile ? 24 : 28 }
    y += mobile ? 20 : 36

    const units = unitsFor(ads, 'landing.afterContent', mobile)
    if (units.length) {
      adLabel(ctx, ads.sample ? 'SPONSORED · sample sponsors' : 'SPONSORED', mobile ? 16 : (W - 970) / 2, y); y += 12
      y += (await drawAds(ctx, units, mobile ? 16 : (W - 1180) / 2, y, mobile ? W - 32 : 1180)) + (mobile ? 28 : 48)
    }
  } else {
    // Search strip
    const sh = mobile ? 64 : 88
    ctx.fillStyle = '#fff'; ctx.fillRect(0, y, W, sh); ctx.fillStyle = LINE; ctx.fillRect(0, y + sh - 1, W, 1)
    if (mobile) {
      field(ctx, 'Dates', hero.dates || 'Add dates', 16, y + 8, W - 32 - 92, 48)
      button(ctx, 'Search', W - 16 - 84, y + 8, 84, 48, primary)
    } else {
      const fw = (inner - 160 - 36) / 3
      ;['Location', 'Check-in - Check-out', 'Travelers'].forEach((l, i) => field(ctx, l, i === 0 ? hero.location || 'Venue' : i === 1 ? hero.dates || 'Add dates' : '1 traveler, 1 room', pad + i * (fw + 12), y + 14, fw, 60))
      button(ctx, 'Search', pad + inner - 160, y + 14, 160, 60, primary, { size: 16 })
    }
    y += sh + (mobile ? 16 : 28)

    const top = unitsFor(ads, page === 'browse' ? 'browse.top' : 'details.afterRooms', mobile)
    const rail = mobile ? [] : unitsFor(ads, page === 'browse' ? 'browse.rail' : 'details.rail', false)
    const railW = rail.length ? Math.max(...rail.map((u) => AD_SIZES[u.size].width)) : 0
    const mainW = inner - (railW ? railW + 28 : 0)

    if (page === 'browse' && top.length) {
      adLabel(ctx, ads.sample ? 'SPONSORED · sample sponsors' : 'SPONSORED', pad, y); y += 12
      y += (await drawAds(ctx, top, pad, y, inner)) + (mobile ? 16 : 28)
    }

    const startY = y
    if (page === 'browse') {
      text(ctx, `${HOTELS.length} hotels near ${hero.location || 'the venue'}`, pad, y + 18, { size: mobile ? 15 : 18, weight: 700 }); y += mobile ? 32 : 40
      for (let i = 0; i < (mobile ? 3 : 5); i++) {
        const h = HOTELS[i]
        const ch = mobile ? 290 : 172
        rr(ctx, pad, y, mainW, ch, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.stroke()
        if (mobile) {
          placeholderImg(ctx, pad + 12, y + 12, mainW - 24, 150)
          text(ctx, h.name, pad + 12, y + 190, { size: 16, weight: 700, max: mainW - 24 })
          text(ctx, `${'★'.repeat(Math.round(h.stars))}  ·  ${h.distance}`, pad + 12, y + 212, { size: 12, color: SOFT, max: mainW - 24 })
          text(ctx, `From $${h.fromNightly}/night`, pad + 12, y + 240, { size: 15, weight: 700 })
          button(ctx, 'Choose your room', pad + 12, y + ch - 44, mainW - 24, 34, primary, { size: 13 })
        } else {
          placeholderImg(ctx, pad + 16, y + 16, 220, ch - 32)
          text(ctx, h.name, pad + 256, y + 42, { size: 19, weight: 700, max: mainW - 480 })
          text(ctx, `${'★'.repeat(Math.round(h.stars))}  ·  ${h.rating} (${h.reviews} reviews)`, pad + 256, y + 66, { size: 13, color: SOFT })
          text(ctx, h.distance, pad + 256, y + 88, { size: 13, color: SOFT })
          text(ctx, 'Free breakfast · Parking · Non-smoking', pad + 256, y + 112, { size: 13, color: FAINT, max: mainW - 480 })
          text(ctx, 'From', pad + mainW - 24, y + 52, { size: 12, color: FAINT, align: 'right' })
          text(ctx, `$${h.fromNightly}`, pad + mainW - 24, y + 84, { size: 28, weight: 700, align: 'right' })
          text(ctx, 'per night', pad + mainW - 24, y + 102, { size: 12, color: FAINT, align: 'right' })
          button(ctx, 'Choose your room', pad + mainW - 24 - 190, y + ch - 56, 190, 40, primary)
        }
        y += ch + 16
      }
    } else {
      const h = HOTELS[0]
      text(ctx, '‹ Back to hotels', pad, y + 14, { size: 14, weight: 700, color: primary }); y += 32
      text(ctx, h.name, pad, y + 26, { size: mobile ? 22 : 32, weight: 700, max: mainW }); y += mobile ? 40 : 52
      text(ctx, `${'★'.repeat(Math.round(h.stars))}  ·  ${h.distance}`, pad, y, { size: 14, color: SOFT }); y += 20
      if (mobile) {
        placeholderImg(ctx, pad, y, inner, 220, imgs[0]); y += 236
      } else {
        const gw = mainW
        placeholderImg(ctx, pad, y, gw * 0.62, 360, imgs[0])
        placeholderImg(ctx, pad + gw * 0.62 + 12, y, gw * 0.38 - 12, 174, imgs[1])
        placeholderImg(ctx, pad + gw * 0.62 + 12, y + 186, gw * 0.38 - 12, 174, imgs[2])
        y += 384
      }
      text(ctx, 'About this hotel', pad, y + 18, { size: 18, weight: 700 }); y += 34
      for (const line of wrapLines(ctx, 'Steps from the venue with free breakfast, on-site parking and a 24-hour front desk. Event-rate rooms are held for attendees until the block releases.', mainW, 15)) { text(ctx, line, pad, y, { size: 15, color: SOFT }); y += 22 }
      y += 20
      text(ctx, 'Select your room', pad, y + 18, { size: 20, weight: 700 }); y += 36
      for (const room of (h.rooms || []).slice(0, 3)) {
        const rh = mobile ? 118 : 96
        rr(ctx, pad, y, mainW, rh, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = LINE; ctx.stroke()
        text(ctx, room.type, pad + 18, y + 32, { size: 16, weight: 700, max: mainW - 220 })
        text(ctx, 'Event rate · Free cancellation', pad + 18, y + 56, { size: 13, color: SOFT })
        if (mobile) button(ctx, `Select · $${room.nightly}`, pad + 18, y + rh - 44, mainW - 36, 32, primary, { size: 13 })
        else { text(ctx, `$${room.nightly}`, pad + mainW - 190, y + 56, { size: 24, weight: 700, align: 'right' }); button(ctx, 'Select', pad + mainW - 160, y + 28, 140, 40, primary) }
        y += rh + 12
      }
      if (top.length) {
        y += 12
        adLabel(ctx, ads.sample ? 'SPONSORED · sample sponsors' : 'SPONSORED', pad, y); y += 12
        y += (await drawAds(ctx, top, pad, y, mainW)) + 16
      }
    }

    // Right rail beside the list
    if (rail.length) {
      let ry = startY
      adLabel(ctx, ads.sample ? 'SPONSORED · sample' : 'SPONSORED', pad + inner - railW, ry); ry += 12
      for (const u of rail) {
        const d = AD_SIZES[u.size]
        ctx.drawImage(await renderAd(u.sponsor, u.size), pad + inner - railW + (railW - d.width) / 2, ry)
        ry += d.height + 16
      }
      y = Math.max(y, ry)
    }

    const bottom = unitsFor(ads, page === 'browse' ? 'browse.bottom' : 'details.bottom', mobile)
    if (bottom.length) {
      y += mobile ? 12 : 24
      adLabel(ctx, ads.sample ? 'SPONSORED · sample sponsors' : 'SPONSORED', pad, y); y += 12
      y += (await drawAds(ctx, bottom, pad, y, inner)) + (mobile ? 12 : 24)
    }
    y += mobile ? 20 : 32
  }

  y += drawFooter(ctx, W, y, mobile)
  const out = document.createElement('canvas')
  out.width = W; out.height = Math.ceil(y)
  out.getContext('2d').drawImage(c, 0, 0)
  out.sampleAds = ads.sample
  return out
}
