// Advertisements — the ad suite that runs on an event's Presto pages.
// Uses brand-studio's approved ad system: the IAB sizes, page slots and preset
// placements (models/ads.js, from references/102126) and the AdCreative
// designs. The prototype adds: which placements this event offers, ads for
// sponsors or for the event's own pages (About, Sponsors, FAQ), "designed with
// Higgsfield" one size at a time or as a package (simulated), or re-fitted
// from an uploaded ad (drawn on a canvas, per size).
import { reactive } from 'vue'
import { LANDING_SIZE } from './adSizes.js'
import { AD_SIZES, AD_SLOTS, createPlacement } from '@bs/models/ads.js'
import { SAMPLE_SPONSORS } from '@bs/data/sponsors.js'

export { AD_SIZES }

/** The approved placements an event can offer (from the preset layouts). */
export const OFFERS = [
  { id: 'landing-banners', page: 'landing', slot: 'landing.afterContent', size: LANDING_SIZE, count: 3, label: '3 banners (340×215) below the event description' },
  { id: 'landing-billboard', page: 'landing', slot: 'landing.afterContent', size: '970x250', count: 1, label: 'Billboard below the event description' },
  { id: 'browse-top', page: 'browse', slot: 'browse.top', size: '970x90', count: 1, label: 'Leaderboard above the results' },
  { id: 'browse-rail', page: 'browse', slot: 'browse.rail', size: '160x600', count: 2, label: 'Right rail · 2 skyscrapers' },
  { id: 'browse-bottom', page: 'browse', slot: 'browse.bottom', size: '970x250', count: 1, label: 'Billboard below the results' },
  { id: 'details-rooms', page: 'details', slot: 'details.afterRooms', size: '970x250', count: 1, label: 'Billboard after room selection' },
  { id: 'details-rail', page: 'details', slot: 'details.rail', size: '160x600', count: 2, label: 'Info rail · 2 skyscrapers' },
  { id: 'details-bottom', page: 'details', slot: 'details.bottom', size: '970x90', count: 1, label: 'Leaderboard at the page bottom' },
]
export const PAGES = [
  { id: 'landing', label: 'Landing page' },
  { id: 'browse', label: 'Hotel browse' },
  { id: 'details', label: 'Hotel details' },
]
export const offerById = (id) => OFFERS.find((o) => o.id === id)
const mobileOf = (slotId) => Object.values(AD_SLOTS).flat().find((s) => s.id === slotId)?.mobile || null
export const offerMobile = (o) => mobileOf(o.slot)

/** Every size the picked placements need (phones included), largest first. */
export function packageSizes(ads) {
  const set = new Set()
  for (const id of ads.offers) {
    const o = offerById(id)
    if (!o) continue
    set.add(o.size)
    const m = offerMobile(o)
    if (m) set.add(m)
  }
  return [...set].sort((a, b) => AD_SIZES[b].width * AD_SIZES[b].height - AD_SIZES[a].width * AD_SIZES[a].height)
}

// ---------- Spots: each unit of a placement, filled on its own ----------
// A placement of 3 banners is three spots (Banner 1, 2, 3). Each spot holds its
// own ad, made in that spot's size (and its phone size); ads aren't designed as
// a matching set across sizes.
const KIND = { '340x215': 'Banner', '160x600': 'Skyscraper', '970x90': 'Leaderboard', '728x90': 'Leaderboard', '970x250': 'Billboard', '300x250': 'Rectangle', '300x600': 'Half page' }
/** Every spot the picked placements make, in page order. */
export function spotsOf(ads) {
  return OFFERS.filter((o) => ads.offers.includes(o.id)).flatMap((o) => Array.from({ length: o.count }, (_, i) => ({
    id: `${o.id}#${i + 1}`, offer: o, page: o.page, size: o.size, mobile: offerMobile(o), n: i + 1,
    label: `${KIND[o.size] || 'Ad'}${o.count > 1 ? ` ${i + 1}` : ''}`,
  })))
}
export const spotById = (ads, id) => spotsOf(ads).find((s) => s.id === id)
export const adInSpot = (ads, spotId) => ads.items.find((a) => a.spot === spotId)
export const firstEmptySpot = (ads) => spotsOf(ads).find((s) => !adInSpot(ads, s.id)) || null
export const pageLabel = (id) => PAGES.find((p) => p.id === id)?.label || id
/** Where an ad runs, e.g. "Banner 3 · Landing page" (or null if its spot is turned off). */
export function spotLabel(ads, ad) {
  const s = ad.spot && spotById(ads, ad.spot)
  return s ? `${s.label} · ${pageLabel(s.page)}` : null
}
/** The sizes an ad is made in: its spot's size and phone size (an ad outside a spot: every size the placements need). */
export function adSizes(ads, ad) {
  const s = ad.spot && spotById(ads, ad.spot)
  if (s) return [s.size, ...(s.mobile ? [s.mobile] : [])]
  return ad.spot ? Object.keys(ad.sizes).filter((z) => ad.sizes[z] === 'ready') : packageSizes(ads)
}

/** What an ad can point to. House ads promote the event's own pages. */
export const PURPOSES = [
  { id: 'sponsor', label: 'Sponsor', icon: 'users' },
  { id: 'about', label: 'About page', icon: 'help' },
  { id: 'sponsors', label: 'Sponsors page', icon: 'grid' },
  { id: 'faq', label: 'FAQ', icon: 'chat' },
  { id: 'link', label: 'Other link', icon: 'link' },
]
export function purposeDefaults(purpose, brand) {
  const site = `https://${brand.website}`
  return {
    sponsor: { name: '', tagline: '', cta: 'Learn more', url: '' },
    about: { name: `About ${brand.short}`, tagline: 'The schedule, venues and everything families need to know.', cta: 'Read about the event', url: `${site}/about` },
    sponsors: { name: 'Our sponsors', tagline: 'Meet the partners who make the weekend possible.', cta: 'See our sponsors', url: `${site}/sponsors` },
    faq: { name: 'Questions?', tagline: 'Parking, check-in times, refunds and more.', cta: 'Read the FAQ', url: `${site}/faq` },
    link: { name: '', tagline: '', cta: 'Learn more', url: site },
  }[purpose]
}

let n = 0
const id = () => `ad${++n}`
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** A fresh ads state for a project. */
export function newAds() {
  return reactive({ offers: [], items: [] })
}

/**
 * Create an ad. `how`: 'package' | 'single' (Higgsfield) | 'upload'.
 * House ads use the event's logo and main colours; sponsors bring their own.
 */
export function createAd(project, form) {
  const b = project.brand
  const house = form.purpose !== 'sponsor'
  const ad = reactive({
    id: id(),
    purpose: form.purpose,
    how: form.how,
    name: form.name || (house ? b.short : 'Sponsor'),
    tagline: form.tagline || '',
    cta: form.cta || 'Learn more',
    url: form.url || '',
    logo: form.logo || (house ? (project.logo || b.logo) : null),
    colors: form.colors || (house
      ? { background: project.palette[0], foreground: '#FFFFFF', accent: project.palette[1] }
      : { background: '#0F172A', foreground: '#FFFFFF', accent: '#F59E0B' }),
    spot: form.spot || null, // the spot it fills (see spotsOf)
    upload: form.upload || null, // the uploaded ad (object URL) when how = 'upload'
    artwork: {}, // { size: { src } } — re-fitted uploads
    overrides: {}, // { size: { colors, tagline, cta } } — changes asked for on one size only
    sizes: {}, // { size: 'idle' | 'working' | 'ready' }
    created: Date.now(),
  })
  project.ads.items.unshift(ad)
  return ad
}

/** Higgsfield (simulated): design one size, or every size in the package. */
export async function designSize(project, ad, size, delay = 1400) {
  ad.sizes[size] = 'working'
  if (ad.how === 'upload' && ad.upload) ad.artwork[size] = { src: await refit(ad.upload, size) }
  await wait(delay)
  ad.sizes[size] = 'ready'
  project.updated = Date.now()
}
export async function designPackage(project, ad, { speed = 1 } = {}) {
  const sizes = adSizes(project.ads, ad)
  sizes.forEach((s) => { if (ad.sizes[s] !== 'ready') ad.sizes[s] = 'working' })
  await Promise.all(sizes.map((s, i) => designSize(project, ad, s, (900 + i * 450) * speed)))
}

/** The ad as it looks in one size (its own changes on top of the ad's). */
export const adIn = (ad, size) => ({ ...ad, ...(size && ad.overrides?.[size]) })

/** What a quick change ("Darker", "Shorter line"…) does to an ad's look. */
function changeFor(project, base, text) {
  const t = text.toLowerCase()
  if (/dark/.test(t)) return { colors: { ...base.colors, background: '#0B1220', foreground: '#FFFFFF' } }
  if (/light|bright/.test(t)) return { colors: { ...base.colors, background: '#F8FAFC', foreground: '#0F172A' } }
  if (/event|our colou?r|brand/.test(t)) return { colors: { background: project.palette[0], foreground: '#FFFFFF', accent: project.palette[1] } }
  if (/short/.test(t)) return { tagline: base.tagline.split(/[.!]/)[0] }
  if (/button|cta/.test(t)) return { cta: base.cta === 'Learn more' ? 'Find out more' : 'Learn more' }
  return { colors: { ...base.colors, accent: base.colors.background === '#0F172A' ? '#38BDF8' : '#F59E0B' } }
}

/**
 * Changes asked for in an ad's "Ask for changes" box. With `size`, only that
 * size changes (it keeps its own look); otherwise every finished size does.
 */
export async function reviseAd(project, ad, text, size = null) {
  if (size) {
    ad.overrides[size] = { ...ad.overrides[size], ...changeFor(project, adIn(ad, size), text) }
    return designSize(project, ad, size, 900)
  }
  Object.assign(ad, changeFor(project, ad, text))
  ad.overrides = {}
  const ready = Object.keys(ad.sizes).filter((s) => ad.sizes[s] === 'ready')
  await Promise.all(ready.map((s, i) => designSize(project, ad, s, 700 + i * 200)))
}

/** Take one size off an ad (it goes back to "Design this size"). Returns an undo. */
export function removeSize(project, ad, size) {
  const before = { state: ad.sizes[size], artwork: ad.artwork[size], override: ad.overrides[size] }
  ad.sizes[size] = 'idle'
  delete ad.artwork[size]
  delete ad.overrides[size]
  project.updated = Date.now()
  return () => {
    ad.sizes[size] = before.state
    if (before.artwork) ad.artwork[size] = before.artwork
    if (before.override) ad.overrides[size] = before.override
    project.updated = Date.now()
  }
}

/** Delete a whole ad. It's kept aside (by id) so the chat and the Advertisements tab can offer Undo. */
export function removeAd(project, ad) {
  const i = project.ads.items.indexOf(ad)
  if (i < 0) return
  project.ads.items.splice(i, 1)
  project.ads.removed = { ...project.ads.removed, [ad.id]: { ad, i } }
  project.updated = Date.now()
}
export function restoreAd(project, id) {
  const r = project.ads.removed?.[id]
  if (!r) return
  project.ads.items.splice(Math.min(r.i, project.ads.items.length), 0, r.ad)
  const { [id]: _, ...rest } = project.ads.removed
  project.ads.removed = rest
  project.updated = Date.now()
}

/** The size that best shows an ad as a thumbnail: the largest wide one (towers read poorly small). */
export const thumbSize = (sizes) => [...sizes].sort((x, y) => (AD_SIZES[y].width >= AD_SIZES[y].height) - (AD_SIZES[x].width >= AD_SIZES[x].height) || AD_SIZES[y].width * AD_SIZES[y].height - AD_SIZES[x].width * AD_SIZES[x].height)[0]

export const readySizes = (ad) => Object.keys(ad.sizes).filter((s) => ad.sizes[s] === 'ready')

/** The ad as a Presto sponsor (what AdCreative / the Presto pages render); with `size`, as it looks in that size. */
export function asSponsor(ad, size = null) {
  const abs = (src) => (src ? new URL(src, window.location.href).href : null)
  const artwork = {}
  for (const [sz, a] of Object.entries(ad.artwork)) if (ad.sizes[sz] === 'ready') artwork[sz] = { id: `${ad.id}-${sz}`, src: a.src, kind: 'photo' }
  const v = adIn(ad, size)
  return {
    id: size && ad.overrides?.[size] ? `${ad.id}@${size}` : ad.id,
    name: v.name,
    tagline: v.tagline,
    cta: v.cta,
    url: ad.url,
    colors: { ...v.colors },
    logo: ad.logo ? { id: `${ad.id}-logo`, src: abs(ad.logo), alt: ad.name, kind: 'logo' } : null,
    artwork,
  }
}

/** The project's ads in the Presto project shape (models/project.js `ads`). */
export function prestoAds(ads) {
  const live = (ads?.items || []).filter((a) => readySizes(a).length)
  // One sponsor per ad, plus a variant for each size that has its own changes.
  const sponsors = live.flatMap((a) => [asSponsor(a), ...Object.keys(a.overrides || {}).map((sz) => asSponsor(a, sz))])
  const idFor = (a, size) => (a.overrides?.[size] ? `${a.id}@${size}` : a.id)
  // One placement per spot, showing just the ad in that spot (empty spots stay empty).
  const placements = { landing: [], browse: [], details: [] }
  for (const s of ads ? spotsOf(ads) : []) {
    const a = live.find((x) => x.spot === s.id)
    placements[s.page].push(createPlacement({ slot: s.offer.slot, size: s.size, count: 1, sponsorIds: a ? [idFor(a, s.size)] : [] }))
  }
  return { enabled: !!(sponsors.length && ads.offers.length), sponsors, placements, railMode: 'auto', presets: {} }
}

/** A short key that changes whenever the ads on the pages would change. */
export function adsKey(ads) {
  if (!ads) return ''
  return `${ads.offers.join()}|${ads.items.map((a) => `${a.id}@${a.spot}:${readySizes(a).join('+')}:${a.colors.background}${a.colors.accent}:${a.tagline}:${a.cta}:${JSON.stringify(a.overrides || {})}`).join(',')}`
}

/**
 * Seed ads for a sample project (Heartland), one per spot: sponsors from
 * brand-studio and an FAQ house ad, with a couple of spots left to fill.
 */
export function seedAds(project) {
  for (const o of ['landing-banners', 'browse-rail', 'details-bottom']) if (!project.ads.offers.includes(o)) project.ads.offers.push(o)
  const [fire, velo] = SAMPLE_SPONSORS
  const sponsor = (s) => ({ purpose: 'sponsor', how: 'package', name: s.name, tagline: s.tagline, cta: s.cta, url: s.url, logo: s.logo?.src, colors: { ...s.colors } })
  // Only open spots: the agent's own ad (About) already sits in the first one.
  const fill = (spot, form) => {
    if (adInSpot(project.ads, spot)) return
    const ad = createAd(project, { ...form, spot })
    adSizes(project.ads, ad).forEach((z) => { ad.sizes[z] = 'ready' })
  }
  fill('landing-banners#1', sponsor(fire))
  fill('landing-banners#2', sponsor(fire))
  fill('browse-rail#1', sponsor(velo))
  fill('details-bottom#1', { purpose: 'faq', how: 'package', ...purposeDefaults('faq', project.brand) })
}

// ---------- Re-fitting an uploaded ad to another size (canvas) ----------
const imgCache = new Map()
function load(src) {
  if (!imgCache.has(src)) {
    imgCache.set(src, new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    }))
  }
  return imgCache.get(src)
}
/** The uploaded design placed into `size`: blurred fill behind, the design fitted on top. */
export async function refit(src, size) {
  const img = await load(src)
  const { width: W, height: H } = AD_SIZES[size]
  const k = 2 // retina
  const c = document.createElement('canvas')
  c.width = W * k
  c.height = H * k
  const ctx = c.getContext('2d')
  const cover = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight)
  ctx.filter = 'blur(18px) brightness(0.75) saturate(1.1)'
  ctx.drawImage(img, (c.width - img.naturalWidth * cover) / 2, (c.height - img.naturalHeight * cover) / 2, img.naturalWidth * cover, img.naturalHeight * cover)
  ctx.filter = 'none'
  const pad = 0.06
  const fit = Math.min((c.width * (1 - pad * 2)) / img.naturalWidth, (c.height * (1 - pad * 2)) / img.naturalHeight)
  ctx.drawImage(img, (c.width - img.naturalWidth * fit) / 2, (c.height - img.naturalHeight * fit) / 2, img.naturalWidth * fit, img.naturalHeight * fit)
  return c.toDataURL('image/jpeg', 0.88)
}
