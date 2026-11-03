// The prototype's state and its scripted "agent". Everything is in memory and
// resets on reload. Replies are matched on simple keywords so we can walk the
// experience end to end without any real generation.
import { reactive } from 'vue'
import { BRANDS, brandFor } from './mockData.js'
import { route, go } from './router.js'
import { newAds, seedAds, createAd, purposeDefaults, readySizes, designSize, designPackage, AD_SIZES, adSizes, firstEmptySpot, spotsOf, pageLabel, offerById, PURPOSES, paintAll } from './ads.js'
import { pickModel, modelById, typeById, suggestTypes } from './imageModels.js'

export const state = reactive({
  projects: [],
  activeId: null,
  working: false,
  stop: false,
  speed: 1, // 0 = instant (seeded history, tests)
  toast: '',
  library: null, // 'banners' | 'logos' | 'pages' when a library page is open
})

let uid = 0
const nid = (p) => `${p}${++uid}`
const wait = (ms) => (state.speed ? new Promise((r) => setTimeout(r, ms * state.speed)) : Promise.resolve())

export const activeProject = () => state.projects.find((p) => p.id === state.activeId) || null
export const projectBySlug = (slug) => state.projects.find((p) => p.slug === slug) || null
/** A project's (or draft's) logo: an uploaded one wins over the brand kit's. */
export const logoOf = (v) => v.logo || v.brand.logo
export const logoOnDarkOf = (v) => (v.logo ? null : v.brand.logoOnDark)

export function toast(msg) {
  state.toast = msg
  clearTimeout(toast.t)
  toast.t = setTimeout(() => { state.toast = '' }, 2600)
}

// Looks for the logo: the same mark presented four ways.
export const LOGO_LOOKS = [
  { id: 'original', label: 'Original', note: 'As uploaded' },
  { id: 'badge', label: 'On a white badge', note: 'Reads on any photo' },
  { id: 'white', label: 'All white', note: 'For dark banners' },
  { id: 'dark', label: 'On dark', note: 'Light parts lifted' },
]

// Banner moods the agent understands in a follow-up.
const MOODS = [
  { words: ['moody', 'moodier', 'night', 'dark', 'dramatic'], filter: 'brightness(.7) contrast(1.1) saturate(1.15)', label: 'moodier, night-time' },
  { words: ['bright', 'brighter', 'day', 'sunny', 'light'], filter: 'brightness(1.12) saturate(1.08)', label: 'brighter, daytime' },
  { words: ['warm', 'warmer', 'golden', 'sunset'], filter: 'sepia(.28) saturate(1.25) brightness(1.02)', label: 'warmer, golden hour' },
  { words: ['cool', 'cooler', 'blue', 'calm'], filter: 'hue-rotate(14deg) saturate(.9) brightness(1.02)', label: 'cooler, calmer' },
  { words: ['bold', 'punchy', 'vivid', 'colorful', 'colourful'], filter: 'saturate(1.45) contrast(1.08)', label: 'bolder colour' },
]

function newProject(brand, prompt) {
  return reactive({
    id: nid('p'),
    brand,
    name: brand.short,
    prompt,
    updated: Date.now(),
    messages: [],
    sets: 0,
    look: 'badge',
    font: brand.fonts.display, // heading font on the Presto pages
    logo: null, // an uploaded logo (object URL); null = the brand kit's
    ads: newAds(), // Advertisements: offered placements + ads (event-wide, shared by every draft)
    logoName: '',
    mode: 'full',
    stage: 0, // index into stagesFor(p)
    palette: [...brand.colors],
    selected: null, // { key, src, filter }
    copy: { headline: brand.name, meta: `${brand.dates}  ·  ${brand.place}`, tagline: brand.tagline, show: { headline: true, meta: true, tagline: true } },
    // Drafts = version history. The newest is live (it is the project itself);
    // older ones are frozen snapshots. Chat messages carry the draft they belong to.
    drafts: [],
  })
}

/** What a draft looks like: a frozen snapshot, or the live project for the newest one. */
export function snapshot(p) {
  return {
    brand: p.brand,
    look: p.look,
    font: p.font,
    logo: p.logo,
    ads: p.ads, // event-wide, not frozen per draft
    palette: [...p.palette],
    selected: p.selected ? { ...p.selected } : null,
    copy: JSON.parse(JSON.stringify(p.copy)),
  }
}
export const draftView = (p, d) => d.snap || p

function startDraft(p, label) {
  const prev = p.drafts.at(-1)
  if (prev) prev.snap = snapshot(p)
  p.drafts.push(reactive({ id: nid('d'), n: p.drafts.length + 1, label, at: Date.now(), snap: null }))
}

/** Put an older draft's look back on the project, as a new draft. */
export function restoreDraft(p, d) {
  if (!d.snap || state.working) return
  const s = d.snap
  startDraft(p, `Restored draft ${d.n}`)
  Object.assign(p, { look: s.look, font: s.font, logo: s.logo, palette: [...s.palette], selected: s.selected ? { ...s.selected } : null, copy: JSON.parse(JSON.stringify(s.copy)) })
  p.messages.push({ id: nid('m'), role: 'agent', status: 'done', steps: [{ label: `Restoring draft ${d.n}`, done: true }], seconds: 1, text: `Restored **draft ${d.n}** (${d.label.toLowerCase()}). Keep going from here.`, card: { type: 'pages' }, chips: [], draft: p.drafts.length })
  p.updated = Date.now()
}

const userMsg = (p, text, extra = {}) => p.messages.push({ id: nid('m'), role: 'user', text, draft: p.drafts.length, ...extra })

/** Every banner the project has made, newest set first (for the rail strip). */
export function projectBanners(p) {
  const out = []
  for (let i = p.messages.length - 1; i >= 0; i--) {
    const c = p.messages[i].card
    if (c?.type === 'banners') out.push(...c.images)
  }
  return out
}

async function agentTurn(p, { steps, text, card = null, chips = [] }) {
  const m = reactive({ id: nid('m'), role: 'agent', status: 'working', steps: steps.map((label) => ({ label, done: false })), step: 0, text: '', card: null, chips: [], seconds: 0, draft: p.drafts.length })
  p.messages.push(m)
  const started = Date.now()
  for (let i = 0; i < m.steps.length; i++) {
    m.step = i
    await wait(i === m.steps.length - 1 ? 1300 : 850)
    if (state.stop) {
      m.status = 'stopped'
      m.text = 'Stopped. Tell me what to change, or pick up where I left off.'
      m.next = { label: 'Pick up where I left off', say: 'Continue' }
      p.stalled = true
      return false
    }
    m.steps[i].done = true
  }
  m.seconds = state.speed ? Math.max(1, Math.round((Date.now() - started) / 1000)) : steps.length * 3
  m.text = text
  m.card = card
  m.chips = chips
  m.status = 'done'
  p.updated = Date.now()
  return true
}

function bannerSet(p, mood) {
  p.sets += 1
  const n = p.sets
  const imgs = p.brand.images
  const rot = (n - 1) % imgs.length
  const order = [...imgs.slice(rot), ...imgs.slice(0, rot)]
  const setId = nid('s')
  const images = order.map((img) => ({ key: `${setId}:${img.id}`, src: img.src, kind: img.kind, filter: mood?.filter || '' }))
  return { type: 'banners', set: n, mood: mood?.label || '', images, credits: 6 }
}

function select(p, image) {
  p.selected = { key: image.key, src: image.src, filter: image.filter }
  p.updated = Date.now()
}
export function selectBanner(p, image) { select(p, image) }

async function run(fn) {
  state.working = true
  state.stop = false
  try { await fn() } finally { state.working = false; state.stop = false }
}

// The steps a new project walks through. The agent stops after each one and
// waits for a go-ahead ("Looks right", "Use this banner"…) before the next.
export const STAGES = [
  { id: 'brand', label: 'Brand kit', card: 'brand' },
  { id: 'logo', label: 'Logo', card: 'looks' },
  { id: 'banners', label: 'Banners', card: 'banners' },
  { id: 'pages', label: 'Pages', card: 'pages' },
  { id: 'ads', label: 'Ads', card: 'ads' },
  { id: 'files', label: 'Files', card: 'export' },
]
// What each starting choice on Home makes (the composer's modes).
export const MODES = [
  { id: 'logo', label: 'Logo only', icon: 'spark', stages: ['brand', 'logo', 'files'], credits: 'About 1 credit for a logo clean-up.' },
  { id: 'banners', label: 'Banners', icon: 'image', stages: ['brand', 'banners', 'pages', 'files'], credits: 'About 6 credits for a first set of 3 banners.' },
  { id: 'ads', label: 'Ads', icon: 'megaphone', stages: ['ads', 'pages', 'files'], credits: 'About 1 credit per ad spot (6 spots for the standard placements).' },
  { id: 'full', label: 'Full suite', icon: 'layers', stages: ['brand', 'logo', 'banners', 'pages', 'ads', 'files'], credits: 'About 11 credits: logo clean-up, 3 banners and an ad package.' },
]
// In the mode's own order (Ads starts on the ads: ads → pages → files).
export const modeOf = (p) => MODES.find((x) => x.id === p.mode) || MODES[3]
// Steps added later ("Tweak the logo", "Add banners", "Add ads") go in before
// the files, so the go-ahead after them remakes the files with them in.
export const stagesFor = (p) => {
  const extras = p.extras || []
  const base = modeOf(p).stages.filter((id) => id !== 'files' && !extras.includes(id))
  return [...base, ...extras, 'files'].map((id) => STAGES.find((s) => s.id === id))
}
export const has = (p, id) => stagesFor(p).some((s) => s.id === id)
// What a project that started small can still add, to grow into a full suite.
const GROW = { logo: 'Tweak the logo', banners: 'Add banners', ads: 'Add ads' }
export function growChips(p) {
  const missing = Object.keys(GROW).filter((id) => !has(p, id))
  return [...missing.map((id) => GROW[id]), ...(missing.length > 1 ? ['Make it a full suite'] : [])]
}

const STEP = {
  brand: (p) => ({
    steps: ['Reading your brief', `Looking up ${p.brand.website}`, 'Pulling the logo, colours and fonts'],
    text: `I found **${p.brand.name}**. Here’s the brand kit I’ll work from. Does it look right?`,
    card: { type: 'brand' },
    chips: ['Add a new logo'],
  }),
  logo: () => ({
    steps: ['Cleaning up the logo', 'Making versions for light and dark'],
    text: 'Four ways to show the logo. I picked the one that reads best on a photo. Tap another to switch.',
    card: { type: 'looks' },
    chips: ['Add a new logo'],
  }),
  banners: (p) => {
    const set = bannerSet(p)
    select(p, set.images[0])
    return {
      steps: ['Writing the image prompt', 'Generating 3 banners · about 6 credits'],
      text: 'Your first banner set. Tap the one you like best, or ask for something different.',
      card: set,
      chips: ['Moodier, at night', 'Brighter, daytime'],
    }
  },
  pages: (p) => (p.mode === 'ads'
    ? {
        steps: ['Placing your ads in the Presto pages'],
        text: 'Here are your ads on the Presto pages: the right rail on hotel browse, the three banners below the landing page description, and the leaderboard at the bottom of hotel details.',
        card: { type: 'pages', screen: 'browse' },
        chips: ['Open Advertisements'],
      }
    : {
        steps: ['Placing everything on the Presto pages'],
        text: 'Here’s how it looks on the landing page and the hotel pages. Check the text, then I’ll make the files.',
        card: { type: 'pages' },
        chips: ['Edit the text', 'Try another banner'],
      }),
  // Ads, in the chat, a step at a time: which pages → which placements (the
  // sizes) → the spots on each page, filled one by one. See chooseAdPages /
  // chooseAdPlacements / fillSpotInChat.
  // In Ads mode this is the first step: the brand is read quietly from the
  // website (no brand kit or logo questions), and it goes straight to the ads.
  ads: (p) => {
    const first = stagesFor(p)[0].id === 'ads' && !p.ads.offers.length
    return {
      steps: [...(first ? ['Reading your brief', `Looking up ${p.brand.website} for the logo and colours`] : []), 'Checking the ad placements Presto approves'],
      text: first
        ? `Let’s make the ads for **${p.brand.name}**. I’ll use the logo and colours from ${p.brand.website}. Where should they run, and what should they promote?`
        : 'Where should ads run, and what should they promote? Pick both, and I’ll show you the placements and sizes on each page.',
      card: { type: 'adsWhere' },
      chips: [],
    }
  },
  files: (p) => ({
    steps: [
      ...(has(p, 'logo') || has(p, 'banners') ? ['Sizing the logo for the Presto pages'] : []),
      ...(has(p, 'banners') ? ['Cropping banners to 1440×400 and 1440×240'] : []),
      ...(has(p, 'ads') ? ['Packing the ads by spot'] : []),
    ],
    text: `All done. Your files are sized for Presto. You can keep changing things; I’ll remake the files when you ask.${growChips(p).length ? ' You can also add what this project skipped, below.' : ''}`,
    card: { type: 'export' },
    chips: [...(has(p, 'banners') ? ['Try another banner', 'Edit the text'] : has(p, 'ads') ? ['Open Advertisements'] : ['Add a new logo']), ...growChips(p)],
  }),
}
const GO = {
  brand: 'Looks right',
  logo: 'Use this look',
  banners: 'Use this banner',
  pages: 'Looks good, make the files',
}

/** The go-ahead button for wherever the project is waiting (or null when it's finished). */
function nextFor(p) {
  const all = stagesFor(p)
  const st = all[p.stage]
  const next = all[p.stage + 1]
  if (!st || !next) return null
  const label = next.id === 'files'
    ? { logo: 'Use this look, make the files', pages: 'Looks good, make the files', ads: 'Looks good, make the files' }[st.id] || 'Looks good, make the files'
    : next.id === 'ads' ? 'Looks good, now the ads' : GO[st.id] || 'Looks good'
  return { label, say: label }
}

async function runStage(p, i) {
  const st = stagesFor(p)[i]
  if (!st) return false
  p.stage = i
  const ok = await agentTurn(p, STEP[st.id](p))
  // While it asks where ads go, the go-ahead is a way to skip them (not in Ads
  // mode, where the ads are the point).
  if (ok) p.messages.at(-1).next = st.id === 'ads' ? (i > 0 ? { label: 'Skip ads for now', say: 'Continue without ads' } : null) : nextFor(p)
  return ok
}

const APPROVE = /^(yes|yep|yeah|ok|okay|sure|great|perfect|next|continue|go ahead|go on|looks (right|good|great)|use this|carry on|approve|love it)/

/** Start a project from the home composer: runs the first step, then waits. */
export async function createProject(prompt, { mode = 'full', open = true } = {}) {
  const brand = brandFor(prompt)
  const p = newProject(brand, prompt)
  // A short, stable name for links (heartland, heartland-2, …).
  const taken = state.projects.filter((x) => x.brand.id === brand.id).length
  p.slug = taken ? `${brand.id}-${taken + 1}` : brand.id
  p.mode = mode
  state.projects.unshift(p)
  if (open) go({ view: 'project', project: p.slug })
  userMsg(p, prompt)
  await run(() => runStage(p, 0))
  return p
}

/** A follow-up in an open project. */
export async function reply(p, text) {
  const t = text.toLowerCase().trim()
  const finished = p.stage >= stagesFor(p).length - 1
  const approving = APPROVE.test(t) && (p.stalled || !finished)
  const upcoming = approving ? stagesFor(p)[p.stalled ? p.stage : p.stage + 1] : null
  // A change after the first preview starts a new draft (named after the ask);
  // reaching the pages for the first time starts draft 1.
  if (!p.drafts.length && upcoming?.id === 'pages') startDraft(p, 'First look')
  else if (p.drafts.length && !approving && !/export|download|files|zip|preview|show me|how does it look/.test(t)) startDraft(p, text.replace(/^./, (ch) => ch.toUpperCase()))
  userMsg(p, text)
  await run(async () => {
    if (APPROVE.test(t) && (p.stalled || !finished)) {
      const i = p.stalled ? p.stage : p.stage + 1
      p.stalled = false
      return runStage(p, i)
    }
    p.stalled = false
    // "Tweak the logo" / "Add banners" / "Add ads" / "Make it a full suite": add
    // the missing steps and run the first; their go-aheads lead on to the files.
    const add = /^make it a full suite/.test(t)
      ? Object.keys(GROW).filter((id) => !has(p, id))
      : Object.keys(GROW).filter((id) => t === GROW[id].toLowerCase() && !has(p, id))
    if (add.length) {
      p.extras = [...(p.extras || []), ...add]
      return runStage(p, stagesFor(p).findIndex((s) => s.id === add[0]))
    }
    const turn = (opts) => agentTurn(p, opts).then((ok) => { if (ok) p.messages.at(-1).next = nextFor(p); return ok })
    if (/\bads?\b|advert|sponsor/.test(t)) {
      if (!p.ads.offers.length) return turn({ ...STEP.ads(p), steps: ['Opening your ads'] })
      return turn({ steps: ['Opening your ads'], text: 'Here are your ad spots, page by page. Fill or change them here, or in **Advertisements**.', card: { type: 'adsSpots' }, chips: ['Open Advertisements'] })
    }
    if (/export|download|files|zip/.test(t)) {
      if (!finished) return runStage(p, stagesFor(p).length - 1)
      return turn(STEP.files(p))
    }
    if (/text|headline|tagline|subhead|wording|title|copy/.test(t)) {
      return turn({ steps: ['Opening the page text'], text: 'Change any line below, or switch it off. The preview updates as you type.', card: { type: 'pages', editing: true } })
    }
    if (/logo/.test(t)) {
      return turn({ steps: ['Re-checking the logo against your banner'], text: 'Here are the logo looks again. Pick the one you want on the pages.', card: { type: 'looks' } })
    }
    if (/colou?r|palette/.test(t)) {
      p.palette = [p.palette[1], p.palette[0], ...p.palette.slice(2)]
      return turn({ steps: ['Swapping the main and accent colours'], text: 'I swapped the main and accent colours. Say “undo” to switch back.', card: { type: 'brand' } })
    }
    if (/undo/.test(t)) {
      p.palette = [...p.brand.colors]
      return turn({ steps: ['Restoring the original colours'], text: 'Back to the original colours.', card: { type: 'brand' } })
    }
    if (/preview|page|how does it look/.test(t)) {
      return turn({ steps: ['Placing everything on the Presto pages'], text: 'Here are the pages with your current picks.', card: { type: 'pages' } })
    }
    const mood = MOODS.find((m) => m.words.some((w) => t.includes(w)))
    const set = bannerSet(p, mood)
    return turn({
      steps: ['Writing the image prompt', `Generating 3 banners${mood ? `, ${mood.label}` : ''} · about 6 credits`],
      text: mood ? `Set ${set.set}, ${mood.label}. Tap one to put it on your pages.` : `Set ${set.set}: three more. Tap one to put it on your pages.`,
      card: set,
      chips: ['Warmer, golden hour', 'Show me the pages'],
    })
  })
}

/** A new logo from a file upload: shown in the chat, "cleaned up", and used everywhere. */
export async function uploadLogo(p, file, text = '') {
  if (state.working || !file) return
  const url = URL.createObjectURL(file)
  if (p.drafts.length) startDraft(p, 'New logo')
  userMsg(p, text || 'Here’s a new logo to use.', { image: url, fileName: file.name })
  await run(async () => {
    const atBrand = stagesFor(p)[p.stage]?.id === 'brand'
    p.logo = url
    p.logoName = file.name
    const ok = await agentTurn(p, {
      steps: ['Removing the background', 'Checking it on light and dark', 'Putting it on the Presto pages'],
      text: atBrand
        ? `Got it. I cleaned up **${file.name}** and put it in the brand kit. Does it look right?`
        : `Got it. I cleaned up **${file.name}** and put it on everything. Pick how it should show on the pages.`,
      card: { type: atBrand ? 'brand' : 'looks' },
      chips: ['Add a new logo'],
    })
    if (ok) p.messages.at(-1).next = nextFor(p)
  })
}

/** Advertisements activity, echoed into the chat (no new draft: ads are event-wide). */
export function adsChat(p, userText, agentText, adId, extra = {}) {
  userMsg(p, userText, extra) // extra.adRef = { adId, size }: the banner it's about, shown with the message
  p.messages.push(reactive({ id: nid('m'), role: 'agent', status: 'done', steps: [{ label: 'Designing with Higgsfield', done: true }], seconds: 2, text: agentText, card: { type: 'ad', adId }, chips: [], draft: p.drafts.length }))
  p.updated = Date.now()
}

// An ad attached to the chat box as context ("Edit" on an ad in the chat):
// the next message changes that ad — one size, or every size.
export const chatContext = reactive({ projectId: null, adId: null, size: null, every: false })
export function editInChat(p, ad, size = null) { Object.assign(chatContext, { projectId: p.id, adId: ad.id, size, every: false }) }
export function clearChatContext() { Object.assign(chatContext, { projectId: null, adId: null, size: null, every: false }) }

/**
 * "Looks good, package it" (one ad) or "Package all ads": design any sizes
 * still missing, then hand the ads over as files for Presto, in the chat.
 */
export async function packageAds(p, ads, userText) {
  if (state.working || !ads.length) return
  const todo = ads.flatMap((a) => adSizes(p.ads, a).filter((s) => a.sizes[s] !== 'ready').map((s) => [a, s]))
  return run(async () => {
    userMsg(p, userText)
    const designing = Promise.all(todo.map(([a, s], i) => designSize(p, a, s, 700 + i * 260)))
    const files = ads.reduce((n, a) => n + new Set([...adSizes(p.ads, a), ...readySizes(a)]).size, 0)
    const one = ads.length === 1
    await agentTurn(p, {
      steps: [...(todo.length ? [`Designing ${todo.length} missing ${todo.length === 1 ? 'size' : 'sizes'} with Higgsfield`] : []), 'Sizing for each Presto spot', 'Packaging the files'],
      text: one
        ? `Packaged **${ads[0].name}** in ${files} sizes, ready for Presto.`
        : `Packaged **${ads.length} ads**: ${files} files, ready for Presto.`,
      card: { type: 'adPackage', adIds: ads.map((a) => a.id) },
      chips: ['Open Advertisements', ...growChips(p)],
    })
    await designing
  })
}
export const sizeName = (s) => `${s.replace('x', '×')} ${AD_SIZES[s]?.name || ''}`.trim()

// ---------- Ads in the chat: pages → placements → spots ----------
const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1)
const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`)

const PROMOTE_SAY = { about: 'our About page', faq: 'our FAQ', sponsors: 'our Sponsors page', sponsor: 'sponsors' }
/**
 * Ads, 1 of 4: the pages picked ("Landing page", "Hotel browse"…) and what the
 * ads promote (About, FAQ, Sponsors page, sponsors). Next: their placements.
 */
export function chooseAdPages(p, pages, card, promote = ['about', 'sponsor']) {
  if (state.working || !pages.length || !promote.length) return
  if (card) { card.picked = [...pages]; card.promote = [...promote] }
  p.ads.promote = [...promote]
  return run(async () => {
    userMsg(p, `Ads on the ${and(pages.map((x) => pageLabel(x).toLowerCase()))}, for ${and(promote.map((x) => PROMOTE_SAY[x]))}`)
    await agentTurn(p, {
      steps: [`Finding the approved placements on ${pages.length === 1 ? 'that page' : `those ${pages.length} pages`}`],
      text: 'Here are the approved placements and sizes. I ticked the usual ones; change them, then confirm.',
      card: { type: 'adsSizes', pages: [...pages] },
      chips: [],
    })
  })
}

/** Ads, 2 of 4: the placements picked. Makes the spots, then asks for a few looks. */
export function chooseAdPlacements(p, offerIds, card) {
  if (state.working || !offerIds.length) return
  if (card) card.picked = [...offerIds]
  p.ads.offers.splice(0, p.ads.offers.length, ...offerIds)
  return run(async () => {
    const said = and(offerIds.map((id) => offerById(id).say))
    userMsg(p, said.charAt(0).toUpperCase() + said.slice(1))
    const spots = spotsOf(p.ads)
    const pages = [...new Set(spots.map((s) => s.page))]
    await agentTurn(p, {
      steps: [`Setting up ${spots.length} ad spots`, 'Making sample ads in your colours'],
      text: `That’s **${spots.length} ad spots** ${pages.length === 1 ? `on the ${pageLabel(pages[0]).toLowerCase().replace(/(?<!page)$/, ' page')}` : `across the ${and(pages.map((x) => pageLabel(x).toLowerCase()))}`}. What should they look like? Pick a few looks and I’ll spread them across the spots. I ticked three that suit ${p.brand.short}.`,
      card: { type: 'adsLooks', picked: null },
      chips: [],
    })
  })
}

// The looks picked, used in turn: the next spot gets the one used least.
export function nextLook(p) {
  const looks = p.ads.looks?.length ? p.ads.looks : suggestTypes(p.brand.id)
  const used = (t) => p.ads.items.filter((a) => a.type === t && a.spot).length
  return [...looks].sort((x, y) => used(x) - used(y))[0]
}

/** Ads, 3 of 4: the looks picked. Makes an ad for each of your own pages picked, in those looks. */
export function chooseAdLooks(p, types, card) {
  if (state.working || !types.length) return
  if (card) card.picked = [...types]
  p.ads.looks = [...types]
  return run(async () => {
    userMsg(p, `Let’s go with ${and(types.map((t) => typeById(t).label.toLowerCase()))}`)
    const spots = spotsOf(p.ads)
    // One ad for each of your own pages picked (About, FAQ, Sponsors page), in
    // the first open spots; sponsors get the rest.
    const promote = p.ads.promote || ['about', 'sponsor']
    const made = []
    for (const purpose of promote.filter((x) => x !== 'sponsor')) {
      if (p.ads.items.some((a) => a.purpose === purpose && spots.some((s) => s.id === a.spot))) continue
      const spot = firstEmptySpot(p.ads)
      if (!spot) break
      const ad = createAd(p, { purpose, how: 'package', ...purposeDefaults(purpose, p.brand), spot: spot.id, type: nextLook(p) })
      adSizes(p.ads, ad).forEach((z) => { ad.sizes[z] = 'ready' })
      paintAll(p, ad)
      made.push({ ad, spot })
    }
    const openSpots = spots.filter((s) => !p.ads.items.some((a) => a.spot === s.id))
    const open = openSpots.length
    const WHAT = { about: 'About page', faq: 'FAQ', sponsors: 'Sponsors page' }
    const ok = await agentTurn(p, {
      steps: made.length ? made.map((m) => `Generating your ${WHAT[m.ad.purpose]} ad (${typeById(m.ad.type).label}) for ${m.spot.label} with ${modelById(pickModel(m.ad, m.spot.size).id).label}`) : ['Saving your looks'],
      text: `${made.length ? `I made ${and(made.map((m) => `your **${WHAT[m.ad.purpose]}** ad as **${typeById(m.ad.type).label}** in **${m.spot.label}**`))}.` : 'Your looks are saved.'}${open === 1 ? ` **${openSpots[0].label}** is open${promote.includes('sponsor') ? ' for a sponsor' : ''}: fill it below.` : open ? ` ${made.length ? 'The rest are' : 'They’re'} open${promote.includes('sponsor') ? ' for sponsors' : ''}: fill them below.` : ''} Change any ad’s look or model on its spot.`,
      card: { type: 'adsSpots' },
      chips: ['Open Advertisements'],
    })
    if (ok) p.messages.at(-1).next = nextFor(p)
  })
}

/** "with Higgsfield Soul (it makes photo-real scenes…), and the 320×100 phone size with Ideogram 4 (…)". */
export function modelSay(ad, spot) {
  const a = pickModel(ad, spot.size)
  const b = spot.mobile && pickModel(ad, spot.mobile)
  const one = (s, m) => `${s.replace('x', '×')} with **${modelById(m.id).label}** (${m.why})`
  return b ? `${one(spot.size, a)}, and the ${one(spot.mobile, b).replace(' with', ' phone size with')}` : one(spot.size, a)
}

/** Ads, 4 of 4: fill a spot from the chat with a house ad (About, FAQ, Sponsors page). */
export function fillSpotInChat(p, spot, purpose) {
  if (state.working) return
  const ad = createAd(p, { purpose, how: 'package', ...purposeDefaults(purpose, p.brand), spot: spot.id, type: nextLook(p) })
  const what = { about: 'About page', faq: 'FAQ', sponsors: 'Sponsors page' }[purpose] || lower(PURPOSES.find((x) => x.id === purpose).label)
  adsChat(p, `Put our ${what} in ${spot.label}`, `Generating **${ad.name}** as **${typeById(ad.type).label}** for **${spot.label}** on the ${pageLabel(spot.page).toLowerCase()}: ${modelSay(ad, spot)}.`, ad.id)
  designPackage(p, ad)
}

/** Send the go-ahead for the step a project is waiting on. */
export function goAhead(p) {
  const nx = nextFor(p)
  if (nx && !state.working) reply(p, nx.say)
}

export function stopWorking() { if (state.working) state.stop = true }

// Navigation goes through the route (the URL follows); ChatStudio maps it onto
// state.activeId / state.library.
export function openProject(id, extra = {}) {
  const p = state.projects.find((x) => x.id === id)
  if (p) go({ view: 'project', project: p.slug, ...extra })
}
export function newChat() { go({ view: 'home' }) }
export function openLibrary(kind) { go({ view: 'library', library: kind }) }
export { route }

/** A few projects so the rail isn't empty (built instantly). Some have several drafts; Fintech is waiting on its banners. */
export async function seed() {
  if (state.projects.length) return
  const speed = state.speed
  state.speed = 0
  const plan = [
    ['Charity golf classic for a children’s fund', 6 * 864e5, 'done', []],
    ['Vineyard wedding in Napa, sage and gold', 3 * 864e5, 'done', ['Brighter, daytime']],
    ['Fintech summit in New York, three days', 26 * 36e5, 'banners', []],
    ['Youth soccer tournament in Overland Park, June 2027', 40 * 6e4, 'done', ['Moodier, at night', 'Warmer, golden hour']],
  ]
  for (const [prompt, ago, upTo, changes] of plan) {
    const p = await createProject(prompt, { open: false })
    while (p.stage < stagesFor(p).length - 1 && stagesFor(p)[p.stage].id !== upTo) {
      // At the ads step, answer its questions the usual way: every page, the usual placements.
      if (stagesFor(p)[p.stage].id === 'ads' && !p.ads.offers.length) {
        await chooseAdPages(p, ['landing', 'browse', 'details'], p.messages.at(-1).card, ['about', 'sponsor'])
        await chooseAdPlacements(p, ['landing-banners', 'browse-rail', 'details-bottom'], p.messages.at(-1).card)
        await chooseAdLooks(p, suggestTypes(p.brand.id), p.messages.at(-1).card)
      }
      await reply(p, nextFor(p).say)
    }
    for (const [i, ask] of changes.entries()) {
      await reply(p, ask)
      select(p, projectBanners(p)[i % 2 ? 1 : 0])
    }
    p.drafts.forEach((d, i) => { d.at = Date.now() - ago - (p.drafts.length - 1 - i) * 18 * 6e4 })
    if (p.brand.id === 'heartland') seedAds(p)
    p.updated = Date.now() - ago
  }
  state.speed = speed
}

export { BRANDS }
