// Runs the logo clean-up for a logo project (methods, then looks for the
// chosen method) and keeps the results out of Vue's reactivity: they hold
// canvases. Results are cached per project + source, so reopening a project
// or switching back to a method is instant.
import { markRaw, reactive, watch } from 'vue'
import { cleanupMethods, vectorMethod, darkLooks, cutoutInput, aiMethod } from '../../banner-lab/logoLooks.js'
import { hf } from '../../providers/higgsfield/client.js'
import { applyLogoLook, paletteToColors } from '../../banner-lab/studioProjects.js'

const cache = new Map() // `${id}|${source}` → { methods: Promise, looks: Map(methodId → Promise) }

export function useLogoLab(getProject, getPhoto) {
  const state = reactive({
    loading: false, error: '',
    before: '', background: null, methods: [], recommendedMethod: '',
    looksLoading: false, looks: [], recommendedLook: '', vectorLoading: false,
    ai: '', aiError: '', // AI cut-out: '' | 'running'
  })
  let entry = null
  let token = 0
  let shown = ''

  async function run() {
    const project = getProject()
    const lab = project?.logoLab
    if (!lab?.source || project.status === 'building') return
    const key = `${project.id}|${lab.source}`
    if (key === shown && state.methods.length) return // already on screen
    shown = key
    const mine = ++token
    entry = cache.get(key)
    if (!entry) {
      entry = { methods: cleanupMethods(lab.source).then(async (r) => r), looks: new Map(), vector: null }
      cache.set(key, entry)
    }
    state.loading = true
    state.error = ''
    try {
      const r = await entry.methods
      if (mine !== token) return
      state.before = r.before
      state.background = r.background
      state.methods = r.methods.map(markRaw)
      state.recommendedMethod = r.recommended
      state.loading = false
      // The SVG trace is slower: add it once it's ready.
      const from = r.methods.find((m) => m.id === r.recommended)
      if (from && from.id !== 'asis') {
        state.vectorLoading = true
        entry.vector ||= vectorMethod(from).catch(() => null)
        const v = await entry.vector
        if (mine !== token) return
        if (v && !state.methods.some((m) => m.id === 'vector')) state.methods = [...state.methods, markRaw(v)]
        state.vectorLoading = false
      }
      if (!lab.methodId) lab.methodId = r.recommended
      await loadLooks(lab.methodId)
    } catch (e) {
      if (mine === token) { state.loading = false; state.error = e?.message || String(e) }
    }
  }

  async function loadLooks(methodId, userChange = false) {
    const project = getProject()
    const method = state.methods.find((m) => m.id === methodId)
    if (!method || !entry) return
    const mine = token
    state.looksLoading = true
    if (!entry.looks.has(methodId)) entry.looks.set(methodId, darkLooks(method.canvas, { photoSrc: getPhoto() }))
    const r = await entry.looks.get(methodId)
    if (mine !== token) return
    state.looks = r.looks.map(markRaw)
    state.recommendedLook = r.recommended
    state.looksLoading = false
    // Brand colours from the logo itself (uploaded logos, once).
    project.logoPalette = r.palette
    if (project.colorsFromLogo && r.palette?.length) {
      project.colors = paletteToColors(r.palette, project.colors)
      project.colorsFromLogo = false
    }
    const lab = project.logoLab
    const lookId = lab.lookId && state.looks.some((l) => l.id === lab.lookId) ? lab.lookId : r.recommended
    // Only a fresh logo project announces its pick; reopening a project, or
    // one that already has banners, keeps what was chosen without a new message.
    if (!lab.announced && project.kind === 'logo') {
      applyLogoLook(project, { method, look: state.looks.find((l) => l.id === lookId), recommended: true })
      lab.announced = true
    } else if (userChange) {
      applyLogoLook(project, { method, look: state.looks.find((l) => l.id === lookId) })
    }
  }

  function chooseMethod(id) {
    const lab = getProject().logoLab
    if (lab.methodId === id) return
    lab.methodId = id
    loadLooks(id, true)
  }
  function chooseLook(id) {
    const project = getProject()
    const method = state.methods.find((m) => m.id === project.logoLab.methodId)
    const look = state.looks.find((l) => l.id === id)
    applyLogoLook(project, { method, look })
  }
  /**
   * Re-cut a background-removal clean-up at another strength (0 = keep most,
   * 1 = remove most), from the slider or a chat tweak, and use it.
   */
  async function tune(id, strength) {
    if (!entry) return false
    const r = await entry.methods
    if (!r.rekey || !state.methods.some((m) => m.id === id)) return false
    const s = Math.max(0, Math.min(1, strength))
    const lab = getProject().logoLab
    lab.strength = { ...(lab.strength || {}), [id]: s }
    const fresh = markRaw(r.rekey(id, s))
    state.methods = state.methods.map((m) => (m.id === id ? fresh : m))
    entry.looks.delete(id)
    lab.methodId = id
    await loadLooks(id, true)
    return true
  }
  /**
   * AI cut-out (Photoroom, paid per image): run on request, then use it.
   * Kept with the project's cached clean-ups, so it isn't paid for twice.
   */
  async function aiCutout() {
    const project = getProject()
    const lab = project?.logoLab
    if (!lab?.source || !entry || state.ai === 'running') return false
    state.ai = 'running'
    state.aiError = ''
    try {
      entry.ai ||= cutoutInput(lab.source)
        .then((input) => hf.cutout(input, { projectId: project.dbId || '' }))
        .then((r) => aiMethod(r.src))
      entry.ai.catch(() => { entry.ai = null }) // a failure can be retried
      const m = markRaw(await entry.ai)
      state.methods = [...state.methods.filter((x) => x.id !== 'ai'), m]
      entry.looks.delete('ai')
      lab.methodId = 'ai'
      state.ai = ''
      await loadLooks('ai', true)
      return true
    } catch (e) {
      state.ai = ''
      state.aiError = e?.message || 'The AI cut-out didn’t work.'
      return false
    }
  }

  const current = () => state.methods.find((m) => m.id === getProject().logoLab?.methodId) || null

  /** For follow-ups like "trace it to SVG" or "use the white version". */
  function pick({ method, look }) {
    if (method && state.methods.some((m) => m.id === method)) { chooseMethod(method); return true }
    if (look && state.looks.some((l) => l.id === look)) { chooseLook(look); return true }
    return false
  }

  watch(() => {
    const p = getProject()
    return [p?.id, p?.logoLab?.source, p?.status]
  }, run, { immediate: true })

  return { state, chooseMethod, chooseLook, pick, tune, current, aiCutout }
}
