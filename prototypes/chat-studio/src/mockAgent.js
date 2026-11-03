// The prototype's state and its scripted "agent". Everything is in memory and
// resets on reload. Replies are matched on simple keywords so we can walk the
// experience end to end without any real generation.
import { reactive } from 'vue'
import { BRANDS, brandFor } from './mockData.js'
import { route, go } from './router.js'
import { newAds, seedAds } from './ads.js'

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
  { id: 'files', label: 'Files', card: 'export' },
]
export const stagesFor = (p) => STAGES.filter((s) => p.mode !== 'banners' || s.id !== 'logo')

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
  pages: () => ({
    steps: ['Placing everything on the Presto pages'],
    text: 'Here’s how it looks on the landing page and the hotel pages. Check the text, then I’ll make the files.',
    card: { type: 'pages' },
    chips: ['Edit the text', 'Try another banner'],
  }),
  files: () => ({
    steps: ['Sizing the logo for the Presto pages', 'Cropping banners to 1440×400 and 1440×240'],
    text: 'All done. Four files, sized for Presto. You can keep changing things; I’ll remake the files when you ask.',
    card: { type: 'export' },
    chips: ['Try another banner', 'Edit the text'],
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
  const st = stagesFor(p)[p.stage]
  return st && GO[st.id] ? { label: GO[st.id], say: GO[st.id] } : null
}

async function runStage(p, i) {
  const st = stagesFor(p)[i]
  if (!st) return false
  p.stage = i
  const ok = await agentTurn(p, STEP[st.id](p))
  if (ok) p.messages.at(-1).next = nextFor(p)
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
    const turn = (opts) => agentTurn(p, opts).then((ok) => { if (ok) p.messages.at(-1).next = nextFor(p); return ok })
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
export function adsChat(p, userText, agentText, adId) {
  userMsg(p, userText)
  p.messages.push(reactive({ id: nid('m'), role: 'agent', status: 'done', steps: [{ label: 'Designing with Higgsfield', done: true }], seconds: 2, text: agentText, card: { type: 'ad', adId }, chips: [], draft: p.drafts.length }))
  p.updated = Date.now()
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
    while (p.stage < stagesFor(p).length - 1 && stagesFor(p)[p.stage].id !== upTo) await reply(p, GO[stagesFor(p)[p.stage].id])
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
