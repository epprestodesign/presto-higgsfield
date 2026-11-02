// Banner Lab Studio — the record of projects (logo extractions and Presto
// banners), the mock agent that "builds" a new one, and the bridge from a lab
// project to a full Presto project the real page components can render.
//
// Concept data: projects are seeded from the Brand Studio examples (each has a
// Higgsfield logo and banners) and live in memory for the session.
import { reactive } from 'vue'
import { sampleProject, getSampleEvent } from '../data/sampleEvents.js'
import { IMAGERY, getImage } from '../assets/imagery/index.js'
import { getModel, resolveModel } from './studioModels.js'
import { uid } from '../models/ids.js'

// The uploads as they came in (logos on their original boxes), for clean-up.
// 800px copies of the generated originals, which stay out of git at full size.
const RAW_LOGOS = import.meta.glob('../assets/logos/uploads/*.png', { eager: true, query: '?url', import: 'default' })
export const rawLogo = (key) => RAW_LOGOS[`../assets/logos/uploads/${key}.png`] || ''

const DAY = 864e5
const now = Date.now()

// kind: 'kit' = logo + banners · 'logo' = logo extraction only · 'banner' = banners only
const SEEDS = [
  { key: 'camps', kind: 'kit', ago: 0.1, model: 'flare', prompt: 'Lakeside summer camp at golden hour, pine trees and canoes at the edges' },
  {
    key: 'heartland', kind: 'kit', ago: 1, model: 'flare', prompt: 'Floodlit youth soccer stadium at night, crowd soft in the background',
    followUps: [
      { prompt: 'Make it darker and moodier, keeping the center especially dark and calm', model: 'flare' },
      { prompt: 'Try an abstract version on the brand colours with a dark, quiet center', model: 'recraft' },
    ],
  },
  { key: 'golf', kind: 'banner', ago: 2, model: 'flare', prompt: 'Rolling fairway at dawn with a flag on a distant green' },
  { key: 'fintech', kind: 'kit', ago: 3, model: 'recraft', prompt: 'Abstract navy and teal data waves with fine halftone' },
  { key: 'construction', kind: 'logo', ago: 0.3, model: 'logo-local', prompt: 'Our Ironline logo is black and disappears on dark banners. Make it work.' },
  { key: 'commencement', kind: 'logo', ago: 4, model: 'logo-local', prompt: 'Clean up the Westbrook University crest' },
  { key: 'esports', kind: 'banner', ago: 6, model: 'recraft', prompt: 'Neon arena light streaks, dark and moody center' },
  { key: 'music-festival', kind: 'kit', ago: 9, model: 'soul', prompt: 'Festival crowd silhouettes under stage light beams' },
  { key: 'lakeshore', kind: 'banner', ago: 12, model: 'flare', prompt: 'City marathon street at sunrise with motion blur' },
]
const SHARED = new Set(['golf', 'music-festival'])

// ── Banner sets ───────────────────────────────────────────────────────────
// Every prompt makes a new set of banners; the project keeps them all (its
// history). project.sets = [{ id, n, prompt, modelId, createdAt, status }],
// oldest first; each banner carries its setId. project.banners stays a flat
// list (newest first) for the pages, preview and export.

const SET_SIZE = 3
let bannerSeq = 0
const asBanner = (img, { setId, model, prompt, createdAt }) => ({
  id: `${img.id}~${++bannerSeq}`, imageId: img.id, setId,
  src: img.src, alt: img.alt || '', kind: img.kind, model, prompt, createdAt,
})

/** The sample event's own banner art (the first set of a project). */
function bannersFor(key, model, prompt, createdAt, setId) {
  const kit = sampleProject(key).brandKit
  return (kit.imagery || []).slice(0, SET_SIZE).map((img, i) => asBanner(img, { setId, model, prompt, createdAt: new Date(createdAt + i * 6e4) }))
}

const hash = (t) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/**
 * Art for a follow-up set: generated backgrounds that fit the request (photo
 * or abstract, dark if asked), this event's own art first, avoiding images
 * the project already has where it can.
 */
function pickSet(project, text, modelId, { random = Math.random } = {}) {
  const used = new Set(project.banners.map((b) => b.imageId))
  const dark = /dark|midnight|night|moody/i.test(text)
  const abstract = /abstract|pattern|graphic|geometric|gradient/i.test(text) || modelId.startsWith('recraft')
  const fits = (i) => i.generated && (abstract ? i.kind === 'pattern' : i.kind === 'photo')
  const darkOk = (i) => !dark || /midnight|night|royal|signature|dark|dusk/.test(i.id)
  const own = (i) => i.tags?.[0] === project.key
  const ranked = IMAGERY.filter(fits)
    .map((i) => ({ i, score: (used.has(i.id) ? 0 : 4) + (own(i) ? 2 : 0) + (darkOk(i) ? 1 : 0) + random() }))
    .sort((a, b) => b.score - a.score)
  return ranked.slice(0, SET_SIZE).map((r) => r.i)
}

function addSet(project, { prompt, modelId, createdAt = new Date(), status = 'ready' }) {
  project.sets ||= []
  const set = { id: `set-${project.sets.length + 1}`, n: project.sets.length + 1, prompt, modelId, createdAt, status }
  project.sets.push(set)
  return project.sets[project.sets.length - 1]
}

/** Banners of one set, in the order they were made. */
export const setBanners = (project, setId) => project.banners.filter((b) => b.setId === setId).reverse()

function seed(s) {
  const createdAt = now - s.ago * DAY
  const p = sampleProject(s.key)
  const kit = p.brandKit
  const banners = s.kind === 'logo' ? [] : bannersFor(s.key, s.model, s.prompt, createdAt, 'set-1')
  const sets = banners.length ? [{ id: 'set-1', n: 1, prompt: s.prompt, modelId: s.model, createdAt: new Date(createdAt), status: 'ready' }] : []
  const project = {
    id: `lab-${s.key}`,
    key: s.key,
    name: p.event.name,
    kind: s.kind,
    createdAt: new Date(createdAt),
    shared: SHARED.has(s.key),
    prompt: s.prompt,
    modelId: s.model,
    logo: kit.logo ? { src: kit.logo.src, onDarkSrc: kit.logoOnDark?.src || '', name: p.event.name } : null,
    colors: kit.colors,
    banners: [...banners].reverse(),
    sets,
    selectedBannerId: banners[0]?.id || null,
    status: 'ready',
    steps: [],
    messages: summaryMessages(s, p, banners),
    logoLab: s.kind === 'logo' ? newLogoLab(rawLogo(s.key) || kit.logo?.src || '') : null,
  }
  // Some projects come with follow-up sets already, to show the history.
  for (const [k, f] of (s.followUps || []).entries()) {
    const at = new Date(createdAt + (k + 1) * 36e5)
    const set = addSet(project, { prompt: f.prompt, modelId: f.model, createdAt: at })
    let r = hash(f.prompt)
    const imgs = pickSet(project, f.prompt, f.model, { random: () => ((r = (r * 1103515245 + 12345) >>> 0) / 2 ** 32) })
    project.banners.unshift(...imgs.map((img) => asBanner(img, { setId: set.id, model: f.model, prompt: f.prompt, createdAt: at })).reverse())
    project.messages.push({ role: 'user', text: f.prompt }, { role: 'agent', text: `Set ${set.n}: ${imgs.length} new banners with ${getModel(f.model).name}.` })
  }
  return project
}

/** Clean-up state for a logo project; the heavy results live in the workspace. */
function newLogoLab(source) {
  return { source, methodId: '', lookId: '', recommendedLook: '', announced: false }
}

function summaryMessages(s, p, banners) {
  const model = getModel(s.model).name
  return [
    { role: 'user', text: s.prompt },
    {
      role: 'agent',
      text: s.kind === 'logo'
        ? `I cleaned up the ${p.event.name} logo a few different ways and tried it in looks made for dark Presto banners, each scored for contrast.`
        : `I made ${banners.length} Presto banner backgrounds with ${model}, each cropped to 1440×400 and 1440×240 and checked against the banner standard.`,
      items: s.kind === 'logo'
        ? ['1 · Clean-up: edge fill, colour key, soft edges and an SVG trace', '2 · Looks on dark banners: white, outline, glow, white box and more', '3 · Brand kit: the chosen look, colours and every Presto size']
        : ['Brand kit: your logo, colours and type', 'Banners: calm, dark center for the logo', 'Mockups: the landing and hotel details pages on desktop and phone'],
    },
  ]
}

export const studio = reactive({
  projects: SEEDS.map(seed),
})

export const getProject = (id) => studio.projects.find((p) => p.id === id) || null

// ── New projects (mock agent) ─────────────────────────────────────────────

const MATCH = [
  [/camp|lake|outdoor|canoe|cabin/, 'camps'], [/golf|fairway/, 'golf'], [/soccer|football|stadium|tournament/, 'heartland'],
  [/marathon|run|race/, 'lakeshore'], [/conference|summit|fintech|tech|keynote/, 'fintech'], [/wedding|bride/, 'wedding'],
  [/esport|gaming|neon/, 'esports'], [/music|festival|concert/, 'music-festival'], [/graduat|commencement|campus|university/, 'commencement'],
  [/reunion|family/, 'family-reunion'], [/expo|trade show|booth/, 'trade-show'],
]
const matchKey = (text) => MATCH.find(([re]) => re.test(text.toLowerCase()))?.[1] || 'heartland'

export const buildSteps = (mode, { hasLogo, references, model }) => (mode === 'logo'
  ? ['Finding the logo in your image', 'Removing the background a few ways', 'Tracing the vector (SVG)', 'Trying looks on dark banners', 'Scoring each look for contrast']
  : [
      'Reading your brief',
      references ? `Studying ${references} reference image${references > 1 ? 's' : ''}` : 'Optimizing the prompt for Higgsfield',
      hasLogo ? 'Extracting your logo and colours' : 'Building the brand kit',
      `Generating banners with ${getModel(model).name}`,
      'Fitting to 1440×400 and 1440×240',
      'Mocking up your Presto pages',
    ]
).map((label) => ({ label, status: 'pending' }))

/**
 * Start a project from the composer. Returns it with status 'building'; call
 * runBuild() to walk the steps.
 */
export function createProject({ prompt = '', mode = 'banner', modelId = 'auto', logo = null, references = [] }) {
  const key = matchKey(prompt)
  const p = sampleProject(key)
  const model = resolveModel(modelId, { mode, prompt, references: references.length, hasLogo: !!logo })
  const kind = mode === 'logo' ? 'logo' : logo ? 'kit' : 'kit'
  const project = reactive({
    id: uid('lab'),
    key,
    name: p.event.name,
    kind,
    createdAt: new Date(),
    shared: false,
    prompt: prompt.trim() || (mode === 'logo' ? 'Extract my logo' : 'New Presto banners'),
    modelId: model.id,
    autoReason: modelId === 'auto' ? model.reason : '',
    logo: logo ? { src: logo.src, onDarkSrc: '', name: logo.name || p.event.name } : p.brandKit.logo ? { src: p.brandKit.logo.src, onDarkSrc: p.brandKit.logoOnDark?.src || '', name: p.event.name } : null,
    colors: p.brandKit.colors,
    banners: [],
    sets: [],
    selectedBannerId: null,
    logoLab: mode === 'logo' ? newLogoLab(logo?.src || rawLogo(key) || p.brandKit.logo?.src || '') : null,
    status: 'building',
    steps: buildSteps(mode, { hasLogo: !!logo, references: references.length, model: model.id }),
    messages: [{ role: 'user', text: prompt.trim() || (mode === 'logo' ? 'Extract my logo' : 'New Presto banners'), attachments: [logo && 'logo', references.length && `${references.length} reference${references.length > 1 ? 's' : ''}`].filter(Boolean) }],
  })
  studio.projects.unshift(project)
  return project
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** Walk the build steps, then fill in the banners and the agent's summary. */
export async function runBuild(project, { stepMs = 650 } = {}) {
  const set = project.kind !== 'logo' ? addSet(project, { prompt: project.prompt, modelId: project.modelId, status: 'building' }) : null
  for (const step of project.steps) {
    step.status = 'active'
    await wait(stepMs)
    step.status = 'done'
  }
  if (set) {
    set.status = 'ready'
    project.banners = bannersFor(project.key, project.modelId, project.prompt, Date.now(), set.id).reverse()
    project.selectedBannerId = project.banners[project.banners.length - 1]?.id || null
  }
  project.messages.push(summaryMessages({ kind: project.kind, model: project.modelId }, sampleProject(project.key), project.banners)[1])
  if (project.autoReason) project.messages.push({ role: 'agent', text: `Auto picked ${getModel(project.modelId).name}: ${project.autoReason}`, muted: true })
  if (project.kind !== 'logo') project.messages.push({ role: 'agent', text: 'What do you think of this direction? Open ▶ Preview to see the real Presto pages and export.' })
  project.status = 'ready'
}

// ── Logo projects: choosing a look, then moving on to banners ─────────────

export const BANNERS_FOR_LOGO = (project, lookLabel) =>
  `Make Presto banner backgrounds for the ${project.name} logo${lookLabel ? ` (${lookLabel.toLowerCase()} look)` : ''}: a calm, dark center where the logo sits, the brand colours as soft accents toward the edges, and no text in the art.`

/**
 * The user picked a clean-up method and look: put it on the project's logo
 * and suggest banners as the next step (one agent message, updated in place).
 */
export function applyLogoLook(project, { method, look, recommended = false }) {
  if (!method || !look) return
  project.logoLab.methodId = method.id
  project.logoLab.lookId = look.id
  project.logoLab.lookLabel = look.label
  project.logo = { ...(project.logo || {}), src: method.url, onDarkSrc: look.assetUrl || '', name: project.logo?.name || project.name }
  const score = `${look.navy.ratio}:1 on navy${look.photo ? `, ${look.photo.ratio}:1 on a photo banner` : ''}`
  const msg = project.kind !== 'logo' ? {
    role: 'agent',
    kind: 'look',
    text: `Logo look updated: ${method.label.toLowerCase()} + ${look.label.toLowerCase()} (${score}). The banners and page mockups use it now.`,
  } : {
    role: 'agent',
    kind: 'look',
    text: recommended
      ? `Recommended: ${method.label.toLowerCase()} + ${look.label.toLowerCase()} (${score}). Pick any other look on the canvas, or move on to banners.`
      : `Logo look set: ${method.label.toLowerCase()} + ${look.label.toLowerCase()} (${score}). Ready to make banners with it?`,
    action: { id: 'make-banners', label: 'Make banners with this logo', icon: 'wallpaper' },
  }
  const last = project.messages[project.messages.length - 1]
  if (last?.kind === 'look') project.messages.splice(project.messages.length - 1, 1, msg)
  else project.messages.push(msg)
}

/** Logo project → logo + banners: generates banners that use the chosen look. */
export async function makeBanners(project, { text, modelId = 'auto' }, { stepMs = 550 } = {}) {
  const model = resolveModel(modelId, { mode: 'banner', prompt: text, references: 0, hasLogo: true })
  project.messages.push({ role: 'user', text })
  // Becomes a logo + banners project right away, so the banner and page frames
  // appear (as placeholders) under the logo work while they're made.
  project.kind = 'kit'
  project.status = 'building'
  const set = addSet(project, { prompt: text, modelId: model.id, status: 'building' })
  project.steps = ['Reading your brief', 'Using your chosen logo look', `Generating banners with ${getModel(model.id).name}`, 'Fitting to 1440×400 and 1440×240', 'Mocking up your Presto pages']
    .map((label) => ({ label, status: 'pending' }))
  for (const step of project.steps) { step.status = 'active'; await wait(stepMs); step.status = 'done' }
  project.modelId = model.id
  project.banners = bannersFor(project.key, model.id, text, Date.now(), set.id).reverse()
  project.selectedBannerId = project.banners[project.banners.length - 1]?.id || null
  set.status = 'ready'
  project.messages.push({
    role: 'agent',
    text: `I made ${project.banners.length} banners with ${getModel(model.id).name}, each with a calm, dark center for your logo, and mocked up your Presto pages.`,
    items: ['Banners: both Presto crops, scored against the standard', 'Mockups: the landing and hotel details pages on desktop and phone'],
  })
  project.messages.push({ role: 'agent', text: 'Open ▶ Preview to see the real Presto pages and export.' })
  project.status = 'ready'
}

/** A follow-up on a logo project that isn't about banners: point at the looks. */
export function logoReply(project, text, { pick }) {
  project.messages.push({ role: 'user', text })
  const t = text.toLowerCase()
  const want = /svg|vector|trace/.test(t) ? { method: 'vector' }
    : /white/.test(t) ? { look: 'white' } : /outline|stroke/.test(t) ? { look: 'outline' }
      : /glow/.test(t) ? { look: 'glow' } : /shadow/.test(t) ? { look: 'shadow' }
        : /box|plate|badge/.test(t) ? { look: 'box' } : /original|as is|colou?rs/.test(t) ? { look: 'original' } : null
  if (want && pick(want)) return
  project.messages.push({ role: 'agent', text: 'Try a clean-up method or a look on the canvas: click one to use it. When it reads well, I can make banners with it.' })
}

/**
 * A follow-up request in the workspace: a new set of banners. Earlier sets
 * stay on the canvas as the project's history.
 * @returns the new set
 */
export async function revise(project, { text, modelId = 'auto' }, { stepMs = 500, onSet } = {}) {
  const model = resolveModel(modelId, { mode: 'banner', prompt: text, references: 0, hasLogo: !!project.logo })
  project.messages.push({ role: 'user', text })
  project.status = 'building'
  const set = addSet(project, { prompt: text, modelId: model.id, status: 'building' })
  onSet?.(set)
  project.steps = ['Updating the prompt', `Generating ${SET_SIZE} banners with ${getModel(model.id).name}`, 'Fitting to 1440×400 and 1440×240', 'Checking them against the banner standard']
    .map((label) => ({ label, status: 'pending' }))
  for (const step of project.steps) { step.status = 'active'; await wait(stepMs); step.status = 'done' }
  const createdAt = new Date()
  const made = pickSet(project, text, model.id).map((img, i) => asBanner(img, { setId: set.id, model: model.id, prompt: text, createdAt: new Date(+createdAt + i) }))
  project.banners.unshift(...[...made].reverse())
  project.selectedBannerId = made[0]?.id || project.selectedBannerId
  set.status = 'ready'
  project.messages.push({ role: 'agent', text: `Set ${set.n} is ready: ${made.length} new banners from “${text}” with ${getModel(model.id).name}. The first one is on the page mockups; earlier sets are still on the canvas.` })
  project.status = 'ready'
  return set
}

// ── Lab project → Presto project ──────────────────────────────────────────

/** A full Presto project (real page components) branded with this lab project. */
export function toPrestoProject(lab, bannerId = lab.selectedBannerId) {
  const p = sampleProject(lab.key)
  const banner = lab.banners.find((b) => b.id === bannerId) || null
  const kit = p.brandKit
  if (lab.logo?.src) {
    kit.logo = { ...(kit.logo || {}), id: kit.logo?.id || 'logo', src: lab.logo.src, alt: lab.logo.name }
    kit.logoOnDark = lab.logo.onDarkSrc ? { ...(kit.logoOnDark || {}), src: lab.logo.onDarkSrc } : null
  }
  if (banner) {
    const asset = getImage(banner.imageId || banner.id) || { id: banner.imageId || banner.id, src: banner.src, alt: banner.alt, kind: banner.kind }
    if (!(kit.imagery || []).some((a) => a.id === asset.id)) kit.imagery = [asset, ...(kit.imagery || [])]
    kit.bannerImageId = asset.id
    kit.heroImageId = asset.id
  }
  return p
}

export const sampleName = (key) => getSampleEvent(key)?.event?.name || ''

export const KIND_LABEL = { kit: 'Logo + banners', logo: 'Logo extraction', banner: 'Banners' }
export const KIND_ICON = { kit: 'auto_awesome_mosaic', logo: 'auto_fix_high', banner: 'wallpaper' }

export function relativeDate(d) {
  const days = Math.floor((Date.now() - d.getTime()) / DAY)
  if (days < 1) return 'Today'
  if (days < 2) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
