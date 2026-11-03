// Advertisements — the ad suite that runs on an event's Presto pages.
// Uses brand-studio's approved ad system: the IAB sizes, page slots and preset
// placements (models/ads.js, from references/102126) and the AdCreative
// designs. The prototype adds: which placements this event offers, ads for
// sponsors or for the event's own pages (About, Sponsors, FAQ), "designed with
// Higgsfield" one size at a time or as a package (simulated), or re-fitted
// from an uploaded ad (drawn on a canvas, per size).
import { reactive } from 'vue'
import { AD_SIZES, AD_SLOTS, createPlacement } from '@bs/models/ads.js'
import { SAMPLE_SPONSORS } from '@bs/data/sponsors.js'

export { AD_SIZES }

/** The approved placements an event can offer (from the preset layouts). */
export const OFFERS = [
  { id: 'landing-billboard', page: 'landing', slot: 'landing.afterContent', size: '970x250', count: 1, label: 'Billboard below the event description' },
  { id: 'landing-rects', page: 'landing', slot: 'landing.afterContent', size: '300x250', count: 3, label: '3 medium rectangles below the event description' },
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
    upload: form.upload || null, // the uploaded ad (object URL) when how = 'upload'
    artwork: {}, // { size: { src } } — re-fitted uploads
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
  const sizes = packageSizes(project.ads)
  sizes.forEach((s) => { if (ad.sizes[s] !== 'ready') ad.sizes[s] = 'working' })
  await Promise.all(sizes.map((s, i) => designSize(project, ad, s, (900 + i * 450) * speed)))
}

/** Quick changes asked for in an ad's "Ask for changes" box. */
export async function reviseAd(project, ad, text) {
  const t = text.toLowerCase()
  if (/dark/.test(t)) ad.colors = { ...ad.colors, background: '#0B1220', foreground: '#FFFFFF' }
  else if (/light|bright/.test(t)) ad.colors = { ...ad.colors, background: '#F8FAFC', foreground: '#0F172A' }
  else if (/event|our colou?r|brand/.test(t)) ad.colors = { background: project.palette[0], foreground: '#FFFFFF', accent: project.palette[1] }
  else if (/short/.test(t)) ad.tagline = ad.tagline.split(/[.!]/)[0]
  else if (/button|cta/.test(t)) ad.cta = ad.cta === 'Learn more' ? 'Find out more' : 'Learn more'
  else ad.colors = { ...ad.colors, accent: ad.colors.background === '#0F172A' ? '#38BDF8' : '#F59E0B' }
  const ready = Object.keys(ad.sizes).filter((s) => ad.sizes[s] === 'ready')
  await Promise.all(ready.map((s, i) => designSize(project, ad, s, 700 + i * 200)))
}

export const readySizes = (ad) => Object.keys(ad.sizes).filter((s) => ad.sizes[s] === 'ready')

/** The ad as a Presto sponsor (what AdCreative / the Presto pages render). */
export function asSponsor(ad) {
  const abs = (src) => (src ? new URL(src, window.location.href).href : null)
  const artwork = {}
  for (const [size, a] of Object.entries(ad.artwork)) if (ad.sizes[size] === 'ready') artwork[size] = { id: `${ad.id}-${size}`, src: a.src, kind: 'photo' }
  return {
    id: ad.id,
    name: ad.name,
    tagline: ad.tagline,
    cta: ad.cta,
    url: ad.url,
    colors: { ...ad.colors },
    logo: ad.logo ? { id: `${ad.id}-logo`, src: abs(ad.logo), alt: ad.name, kind: 'logo' } : null,
    artwork,
  }
}

/** The project's ads in the Presto project shape (models/project.js `ads`). */
export function prestoAds(ads) {
  const live = (ads?.items || []).filter((a) => readySizes(a).length)
  const sponsors = live.map(asSponsor)
  const ids = sponsors.map((s) => s.id)
  const placements = { landing: [], browse: [], details: [] }
  for (const oid of ads?.offers || []) {
    const o = offerById(oid)
    if (o) placements[o.page].push(createPlacement({ slot: o.slot, size: o.size, count: o.count, sponsorIds: ids }))
  }
  return { enabled: !!(sponsors.length && ads.offers.length), sponsors, placements, railMode: 'auto', presets: {} }
}

/** A short key that changes whenever the ads on the pages would change. */
export function adsKey(ads) {
  if (!ads) return ''
  return `${ads.offers.join()}|${ads.items.map((a) => `${a.id}:${readySizes(a).join('+')}:${a.colors.background}${a.colors.accent}:${a.tagline}:${a.cta}`).join(',')}`
}

/** Seed ads for a sample project (Heartland): sponsors from brand-studio + an FAQ house ad. */
export function seedAds(project) {
  for (const o of ['landing-billboard', 'browse-rail', 'details-bottom']) if (!project.ads.offers.includes(o)) project.ads.offers.push(o)
  const sizes = packageSizes(project.ads)
  const spn = SAMPLE_SPONSORS.slice(0, 2)
  for (const s of [...spn].reverse()) {
    const ad = createAd(project, { purpose: 'sponsor', how: 'package', name: s.name, tagline: s.tagline, cta: s.cta, url: s.url, logo: s.logo?.src, colors: { ...s.colors } })
    sizes.forEach((z) => { ad.sizes[z] = 'ready' })
  }
  const faq = createAd(project, { purpose: 'faq', how: 'single', ...purposeDefaults('faq', project.brand) })
  ;['970x250', '320x100'].forEach((z) => { faq.sizes[z] = 'ready' })
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
