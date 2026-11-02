// Banner Lab session, shared by both modes through provide/inject:
//   Logo        drop → select (crop box) → results (transparent PNG, SVG, Presto sizes)
//   Background  brief (drop references, describe, prompt, optimize) → results → fit & export
// Canvases live in markRaw objects: Vue proxies break drawImage().
import { reactive, computed, inject, provide, watch, markRaw } from 'vue'
import { hf } from '../providers/higgsfield/client.js'
import { IMAGERY } from '../assets/imagery/index.js'
import { uid } from '../models/ids.js'
import { GENERATION, BANNER_SPECS } from './standards.js'
import { buildPrompt, flareInput } from './prompt.js'
import { optimizePrompt } from './optimizePrompt.js'
import { prepareUpload, optimizeLogo, vectorizeCanvas, readFile, loadImage, canvasOf, autoScrim, analyzeReferenceSrc } from './canvas.js'

import campsRaw from '../assets/logos/uploads/camps.png'
import heartland from '../assets/logos/heartland-cup.svg'
import fintech from '../assets/logos/fintech-forward.svg'

export const SAMPLE_LOGOS = [
  { id: 'camps', name: 'Camp Pinecrest', src: campsRaw, type: 'image/png', note: 'PNG on a white box' },
  { id: 'heartland', name: 'Heartland Cup', src: heartland, type: 'image/svg+xml', note: 'SVG' },
  { id: 'fintech', name: 'Fintech Forward', src: fintech, type: 'image/svg+xml', note: 'Dark SVG' },
]

export const MODES = [
  { id: 'logo', label: 'Logo', icon: 'auto_fix_high', hint: 'Transparent, vector, sized for Presto' },
  { id: 'background', label: 'Background graphics', icon: 'wallpaper', hint: 'Describe it, add references, generate' },
]

export const LOGO_STEPS = [
  { id: 'upload', label: 'Upload', hint: 'Drop or paste a logo' },
  { id: 'select', label: 'Select', hint: 'Box the logo' },
  { id: 'clean', label: 'Clean up', hint: 'Transparent, on dark' },
  { id: 'vector', label: 'Vector', hint: 'SVG version' },
  { id: 'sizes', label: 'Sizes & download', hint: 'Fit to Presto' },
]

export const BG_STEPS = [
  { id: 'references', label: 'References', hint: 'Images you like' },
  { id: 'describe', label: 'Describe', hint: 'Scene, style, mood' },
  { id: 'prompt', label: 'Prompt', hint: 'Optimize & generate' },
  { id: 'results', label: 'Results', hint: 'Pick one' },
  { id: 'fit', label: 'Fit & export', hint: '1440×400 · 1440×240' },
]

const KEY = Symbol('banner-lab')
const STATUS_TEXT = { preparing: 'Preparing', uploading: 'Uploading references', queued: 'Queued at Higgsfield', in_progress: 'Generating', completed: 'Done', failed: 'Failed (not charged)', nsfw: 'Blocked by moderation (not charged)', canceled: 'Canceled', error: 'Error' }
export const statusText = (st) => STATUS_TEXT[st] || st

const IMAGE_TYPES = /^image\/(png|jpe?g|webp|svg\+xml)$/

/** Shrink big reference photos before upload (long edge 1600, JPEG). */
async function compactReference(dataUrl) {
  const img = await loadImage(dataUrl)
  const r = Math.min(1, 1600 / Math.max(img.naturalWidth || 1600, img.naturalHeight || 1600))
  if (r === 1 && /^data:image\/(png|jpeg|webp)/.test(dataUrl)) return dataUrl
  const c = canvasOf((img.naturalWidth || 1600) * r, (img.naturalHeight || 900) * r)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.88)
}

/** A pasted URL → data: URL, through the dev proxy (no CORS on canvases). */
async function fetchAsDataUrl(url) {
  const res = await fetch(`/hf-api/_image?any=1&url=${encodeURIComponent(url)}`)
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json()).detail } catch { /* not JSON */ }
    throw new Error(detail || (res.status === 404 ? 'Pasting a URL needs the local dev server. Upload the file instead.' : `Couldn’t fetch that image (${res.status}).`))
  }
  const blob = await res.blob()
  return { src: await readFile(blob), type: blob.type, name: new URL(url).pathname.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image' }
}

export function createBannerLab({ sampleMode = false, sampleLatencyMs = 2400 } = {}) {
  const s = reactive({
    mode: 'logo',
    health: { proxy: false, configured: false, checked: false },
    forceSample: sampleMode,

    // Logo mode
    logoStep: 'upload', // LOGO_STEPS ids
    upload: null, // markRaw(prepareUpload())
    crop: null, // selection box, in upload.base pixels
    logo: null, // markRaw(optimizeLogo())
    busy: '',
    logoError: '',
    removeBg: true,
    treatment: 'original',
    vector: { colors: 6, detail: 'balanced', result: null, busy: false },

    // Background mode
    bgStep: 'references', // BG_STEPS ids
    brief: { description: '', style: 'photo', moods: [], usePalette: true, variants: 2 },
    references: [], // { id, name, src, url, analysis }
    refError: '',
    promptText: null, // null = follow the brief; otherwise what's in the editor
    promptSource: 'brief', // brief | optimized | edited
    optimization: null, // { changes, sections }
    enhance: false, // Flare's own enhance_prompt
    jobs: [],
    selected: null,
    view: { fx: 0.5, fy: 0.5, zoom: 1, scrim: 0, blur: 0, showLogo: true, autoScrim: 0 },
  })

  const live = computed(() => !s.forceSample && s.health.configured)
  const palette = computed(() => (s.logo?.palette || []).map((p) => p.hex))
  const basicPrompt = computed(() => buildPrompt({ ...s.brief, references: s.references.length, palette: palette.value }))
  const prompt = computed(() => s.promptText ?? basicPrompt.value)
  const logoCanvas = computed(() => (s.logo ? s.logo.treatments[s.treatment].canvas : null))

  async function checkHealth() {
    if (sampleMode) { s.health = { proxy: false, configured: false, checked: true }; return }
    s.health = { ...(await hf.health()), checked: true }
  }

  // ── Logo ────────────────────────────────────────────────────────────────
  async function startLogo(upload) {
    s.logoError = ''
    s.busy = 'Finding your logo…'
    try {
      const prep = await prepareUpload(upload.src, upload)
      s.upload = markRaw(prep)
      s.crop = { ...prep.region }
      s.logo = null
      s.vector.result = null
      s.logoStep = 'select'
    } catch (e) {
      s.logoError = e.message
    }
    s.busy = ''
  }

  async function logoFromFile(file) {
    if (!IMAGE_TYPES.test(file.type)) { s.logoError = 'Use a PNG, JPG, WebP or SVG image.'; return }
    if (file.size > 10 * 1024 * 1024) { s.logoError = 'That file is over 10 MB.'; return }
    await startLogo({ src: await readFile(file), name: file.name.replace(/\.[^.]+$/, ''), type: file.type })
  }
  async function logoFromUrl(url) {
    s.logoError = ''
    s.busy = 'Fetching the image…'
    try { await startLogo(await fetchAsDataUrl(url)) } catch (e) { s.logoError = e.message; s.busy = '' }
  }

  async function runOptimize() {
    if (!s.upload) return
    s.busy = 'Optimizing…'
    try {
      s.logo = markRaw(await optimizeLogo(s.upload, { crop: s.crop, removeBg: s.removeBg }))
      s.treatment = s.logo.recommended
      s.logoStep = 'clean'
      runVectorize()
    } catch (e) {
      s.logoError = e.message
    }
    s.busy = ''
  }
  watch(() => s.removeBg, () => { if (s.logo) runOptimize() })

  async function runVectorize() {
    if (!s.logo) return
    s.vector.busy = true
    // Let the spinner paint before the (synchronous) trace.
    await new Promise((r) => setTimeout(r, 30))
    try {
      s.vector.result = markRaw(vectorizeCanvas(s.logo.treatments.original.canvas, { colors: s.vector.colors, detail: s.vector.detail }))
    } catch (e) {
      s.vector.result = { error: e.message }
    }
    s.vector.busy = false
  }
  watch(() => [s.vector.colors, s.vector.detail], () => runVectorize())

  function resetLogo() {
    s.logoStep = 'upload'
    s.upload = null
    s.logo = null
    s.crop = null
    s.vector.result = null
    s.logoError = ''
  }

  // ── References & prompt ─────────────────────────────────────────────────
  async function addReference({ src, name }) {
    if (s.references.length >= GENERATION.maxReferences) { s.refError = `Up to ${GENERATION.maxReferences} reference images.`; return }
    const ref = reactive({ id: uid('ref'), name, src, url: null, analysis: null })
    s.references.push(ref)
    try { ref.analysis = await analyzeReferenceSrc(src) } catch { /* analysis is a bonus */ }
  }
  async function referencesFromFiles(files) {
    s.refError = ''
    for (const file of files) {
      if (!/^image\//.test(file.type)) continue
      await addReference({ src: await readFile(file), name: file.name })
    }
  }
  async function referenceFromUrl(url) {
    s.refError = ''
    try { const r = await fetchAsDataUrl(url); await addReference({ src: r.src, name: r.name }) } catch (e) { s.refError = e.message }
  }
  const removeReference = (id) => { s.references = s.references.filter((r) => r.id !== id) }

  function optimize() {
    const out = optimizePrompt({ ...s.brief, palette: palette.value, references: s.references.map((r) => r.analysis) })
    s.promptText = out.prompt
    s.promptSource = 'optimized'
    s.optimization = { changes: out.changes, sections: out.sections }
  }
  function editPrompt(text) {
    s.promptText = text
    s.promptSource = 'edited'
  }
  function resetPrompt() {
    s.promptText = null
    s.promptSource = 'brief'
    s.optimization = null
  }

  // ── Generation ──────────────────────────────────────────────────────────
  function sampleArt() {
    const pool = IMAGERY.filter((i) => i.generated && (s.brief.style === 'abstract' ? i.kind === 'pattern' : i.kind === 'photo'))
    const list = pool.length ? pool : IMAGERY
    return list[Math.floor(Math.random() * list.length)].src
  }

  async function uploadRefs(job) {
    job.status = 'uploading'
    const urls = []
    for (const r of s.references) {
      if (!r.url) r.url = await hf.uploadDataUrl(await compactReference(r.src))
      urls.push(r.url)
    }
    return urls
  }

  async function runJob(job) {
    try {
      if (!live.value) {
        for (const st of ['queued', 'in_progress']) { job.status = st; await new Promise((r) => setTimeout(r, sampleLatencyMs / 2)) }
        job.images = [sampleArt()]
        job.status = 'completed'
        return
      }
      const refs = await uploadRefs(job)
      const submitted = await hf.submit(GENERATION.endpoint, { ...flareInput(job.prompt, refs, GENERATION), enhance_prompt: job.enhance })
      job.requestId = submitted.request_id
      job.status = submitted.status || 'queued'
      const done = await hf.waitFor(job.requestId, { onUpdate: (snap) => { job.status = snap.status } })
      job.status = done.status
      job.images = (done.images || []).map((i) => i.url)
      if (done.status !== 'completed') job.error = done.error || statusText(done.status)
    } catch (e) {
      job.status = 'error'
      job.error = e.code === 'concurrency' ? 'Higgsfield runs 4 requests at once. Wait for one to finish, then try again.' : e.message
    }
  }

  function generate() {
    const batch = uid('batch')
    const jobs = Array.from({ length: s.brief.variants }, (_, i) => reactive({
      id: uid('gen'), batch, n: i + 1, prompt: prompt.value, promptSource: s.promptSource, enhance: s.enhance,
      references: s.references.length, status: 'preparing', error: '', images: [], requestId: null, sample: !live.value, createdAt: new Date(),
    }))
    s.jobs.unshift(...jobs)
    s.bgStep = 'results'
    jobs.forEach(runJob) // the brief caps variants at 4, Higgsfield's concurrency limit
  }

  async function cancel(job) {
    try { await hf.cancel(job.requestId); job.status = 'canceled' } catch (e) { job.error = e.message }
  }

  async function choose(job, src) {
    s.selected = { jobId: job.id, src, sample: job.sample }
    const art = await loadImage(src)
    const auto = autoScrim(art, { fx: 0.5, fy: 0.5, zoom: 1 })
    s.view = { fx: 0.5, fy: 0.5, zoom: 1, scrim: auto, blur: 0, showLogo: true, autoScrim: auto }
    s.bgStep = 'fit'
  }

  async function reAutoScrim() {
    if (!s.selected) return
    const art = await loadImage(s.selected.src)
    s.view.scrim = s.view.autoScrim = autoScrim(art, s.view)
  }

  /** A file dropped anywhere on the page goes to whichever mode is open. */
  async function dropFiles(files) {
    const list = [...files].filter((f) => /^image\//.test(f.type))
    if (!list.length) return
    if (s.mode === 'logo') return logoFromFile(list[0])
    s.bgStep = 'references'
    return referencesFromFiles(list)
  }

  // Which steps can be opened yet.
  const logoAvailable = (id) => (id === 'upload' ? true : id === 'select' ? !!s.upload : !!s.logo)
  const bgAvailable = (id) => (id === 'results' ? s.jobs.length > 0 : id === 'fit' ? !!s.selected : true)
  const goLogo = (id) => { if (logoAvailable(id)) s.logoStep = id }
  const goBg = (id) => { if (bgAvailable(id)) s.bgStep = id }

  const api = {
    s, live, palette, prompt, basicPrompt, logoCanvas, specs: BANNER_SPECS,
    checkHealth, startLogo, logoFromFile, logoFromUrl, runOptimize, runVectorize, resetLogo,
    referencesFromFiles, referenceFromUrl, removeReference, optimize, editPrompt, resetPrompt,
    generate, cancel, choose, reAutoScrim, dropFiles,
    logoAvailable, bgAvailable, goLogo, goBg,
  }
  provide(KEY, api)
  return api
}

export const useBannerLab = () => inject(KEY)
