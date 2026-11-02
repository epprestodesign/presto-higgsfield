// Banner Lab Studio · saving projects to Supabase.
//
// The browser talks to Supabase directly with the signed-in user's Clerk
// session token (Clerk is a third-party auth provider there), so row-level
// security decides what anyone can read or write: members of a workspace see
// its projects. Everyone is in the one EventPipe team workspace
// (POST /api/workspace adds them on sign-in).
//
// What's saved: the project (name, colours, fonts, logo choices), its logo
// file, every banner set and banner, and the chat. Generated images are copied
// into the private `banner-lab` bucket because Higgsfield deletes them after
// about 7 days; they're shown through signed links.
//
// Only real projects are saved: the app marks them `_persist` (Storybook and
// the sample projects never are). Saving is automatic, a moment after anything
// changes, one project at a time.
import { reactive, watch } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { authMode, getSessionToken } from '../auth/index.js'
import { studio } from './studioProjects.js'
import { sameOrigin } from './canvas.js'
import { isDefaultCopy, normalizeCopy } from './pageCopy.js'

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const BUCKET = 'banner-lab'
const LINK_TTL = 7 * 24 * 60 * 60 // signed links last a week

export const persistence = reactive({
  status: 'off', // off | loading | ready | error
  error: '',
  workspace: null, // { id, name }
  saving: 0,
  lastSavedAt: null,
})

/** Saving needs Supabase settings and a real (Clerk) sign-in. */
export const canPersist = () => !!(SUPABASE_URL && SUPABASE_KEY) && authMode() === 'clerk'

let db
function client() {
  db ||= createClient(SUPABASE_URL, SUPABASE_KEY, {
    accessToken: async () => (await getSessionToken()) || null,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return db
}
const ok = (r, what) => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`)
  return r.data
}
async function bearer() {
  const t = await getSessionToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// ── Rows (pure; tested) ───────────────────────────────────────────────────

export function projectRow(p, workspaceId) {
  return {
    id: p.dbId,
    workspace_id: workspaceId,
    name: p.name || 'Untitled',
    kind: ['kit', 'logo', 'banner'].includes(p.kind) ? p.kind : 'kit',
    event_key: p.key || null,
    prompt: p.prompt || null,
    model_id: p.modelId || null,
    colors: p.colors || {},
    typography: p.typography || null,
    site: p.site || null,
    logo_lab: p.logoLab ? { methodId: p.logoLab.methodId || '', lookId: p.logoLab.lookId || '', strength: p.logoLab.strength || null } : null,
    page_copy: p.copy && !isDefaultCopy(p.copy) ? normalizeCopy(p.copy) : null,
    status: p.status === 'building' ? 'building' : 'ready',
  }
}

export function setRow(s, p) {
  return {
    id: s.dbId,
    project_id: p.dbId,
    n: s.n,
    prompt: s.prompt || '',
    model_id: s.modelId || null,
    status: ['building', 'ready', 'failed'].includes(s.status) ? s.status : 'ready',
    meta: { brief: s.brief || '', sentPrompt: s.sentPrompt || '', error: s.error || '', referenceCount: s.referenceCount || 0 },
  }
}

export function messageRow(m, p) {
  return {
    project_id: p.dbId,
    role: m.role === 'user' ? 'user' : 'agent',
    body: m.text || '',
    items: m.items?.length ? m.items : null,
    action: m.action || null,
    attachments: m.attachments?.length ? m.attachments : null,
  }
}

const INTERRUPTED = 'This set was interrupted: the page closed while it was generating.'

/** A saved project (with its children and signed links) as a Studio project. */
export function toStudioProject(row, links = {}) {
  const sets = [...(row.banner_sets || [])].sort((a, b) => a.n - b.n).map((s) => ({
    id: s.id, dbId: s.id, n: s.n, prompt: s.prompt, modelId: s.model_id, createdAt: new Date(s.created_at),
    status: s.status === 'building' ? 'failed' : s.status,
    brief: s.meta?.brief || '', sentPrompt: s.meta?.sentPrompt || '', referenceCount: s.meta?.referenceCount || 0,
    error: s.status === 'building' ? INTERRUPTED : s.meta?.error || '',
  }))
  const setById = Object.fromEntries(sets.map((s) => [s.id, s]))
  // Newest set first; inside a set, last-made first (how the Studio keeps them).
  const banners = [...(row.banners || [])]
    .filter((b) => setById[b.set_id] && (links[b.storage_path] || b.source_url))
    .sort((a, b) => setById[b.set_id].n - setById[a.set_id].n || b.position - a.position)
    .map((b) => {
      const set = setById[b.set_id]
      return {
        id: b.id, dbId: b.id, imageId: null, setId: b.set_id, src: links[b.storage_path] || b.source_url,
        alt: set.brief || set.prompt, kind: b.kind || 'photo', model: set.modelId, prompt: set.prompt, createdAt: new Date(b.created_at),
      }
    })
  const logoAsset = [...(row.brand_assets || [])].filter((a) => a.kind === 'logo_upload' && links[a.storage_path])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const logo = logoAsset ? { src: links[logoAsset.storage_path], onDarkSrc: '', name: logoAsset.label || row.name } : null
  const messages = [...(row.chat_messages || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((m) => ({
    role: m.role, text: m.body, ...(m.items ? { items: m.items } : {}), ...(m.action ? { action: m.action } : {}), ...(m.attachments ? { attachments: m.attachments } : {}),
  }))
  const selected = banners.find((b) => b.id === row.selected_banner_id)?.id || banners[0]?.id || null
  const p = {
    id: row.id, dbId: row.id, key: row.event_key || 'heartland', name: row.name, kind: row.kind,
    createdAt: new Date(row.created_at), shared: true, prompt: row.prompt || '', modelId: row.model_id || 'auto', autoReason: '',
    logo, colors: row.colors || {}, typography: row.typography || {}, colorsFromLogo: false, site: row.site || '',
    ...(row.page_copy ? { copy: normalizeCopy(row.page_copy) } : {}),
    banners, sets, selectedBannerId: selected,
    logoLab: logo ? { source: logo.src, methodId: row.logo_lab?.methodId || '', lookId: row.logo_lab?.lookId || '', recommendedLook: '', announced: true, ...(row.logo_lab?.strength ? { strength: row.logo_lab.strength } : {}) } : null,
    status: 'ready', steps: [], messages: messages.length ? messages : [{ role: 'user', text: row.prompt || row.name }],
    // Bookkeeping: what's already saved.
    _persist: true, _savedMsgs: messages.length, _savedLogo: logo?.src || '', _savedSelected: row.selected_banner_id || null,
  }
  for (const s of p.sets) s._saved = JSON.stringify(setRow(s, p))
  return p
}

// ── Loading ───────────────────────────────────────────────────────────────

async function ensureWorkspace() {
  const r = await fetch('/api/workspace', { method: 'POST', headers: await bearer() })
  const json = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(json.detail || `Couldn’t open your workspace (${r.status}).`)
  return json
}

async function signedLinks(paths) {
  const unique = [...new Set(paths.filter(Boolean))]
  if (!unique.length) return {}
  const data = ok(await client().storage.from(BUCKET).createSignedUrls(unique, LINK_TTL), 'Sign file links')
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
}

/** Join the team workspace and load its projects in place of the samples. */
export async function loadWorkspace() {
  if (!canPersist()) return
  persistence.status = 'loading'
  persistence.error = ''
  try {
    persistence.workspace = await ensureWorkspace()
    const rows = ok(await client().from('projects')
      .select('*, banner_sets(*), banners!banners_project_id_fkey(*), chat_messages(*), brand_assets(*)')
      .eq('workspace_id', persistence.workspace.id)
      .order('updated_at', { ascending: false }), 'Load projects')
    const links = await signedLinks(rows.flatMap((r) => [...(r.banners || []).map((b) => b.storage_path), ...(r.brand_assets || []).map((a) => a.storage_path)]))
    studio.projects.splice(0, studio.projects.length, ...rows.map((r) => reactive(toStudioProject(r, links))))
    persistence.status = 'ready'
    startAutosave()
  } catch (e) {
    console.error('[projects] load failed', e)
    persistence.status = 'error'
    persistence.error = e.message || 'Couldn’t load your projects.'
  }
}

// ── Saving ────────────────────────────────────────────────────────────────

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' }

async function upload(path, blob) {
  ok(await client().storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: true }), 'Upload file')
  return path
}

async function saveLogo(p, ws) {
  const blob = await (await fetch(p.logo.src)).blob()
  const type = EXT[blob.type] ? blob.type : 'image/png'
  const path = `${ws}/${p.dbId}/logos/${crypto.randomUUID()}.${EXT[type]}`
  await upload(path, blob.type === type ? blob : new Blob([blob], { type }))
  ok(await client().from('brand_assets').insert({ project_id: p.dbId, kind: 'logo_upload', label: p.logo.name || p.name, storage_path: path }), 'Save logo')
}

/** Copy a generated image into storage (Higgsfield's links expire). */
async function copyBanner(p, b, ws) {
  try {
    const r = await fetch(sameOrigin(b.src), { headers: await bearer() })
    if (!r.ok) throw new Error(`fetch ${r.status}`)
    const blob = await r.blob()
    if (!EXT[blob.type]) throw new Error(`unexpected ${blob.type}`)
    return await upload(`${ws}/${p.dbId}/banners/${b.dbId}.${EXT[blob.type]}`, blob)
  } catch (e) {
    console.warn('[projects] kept the Higgsfield link; copy failed', e.message)
    return null
  }
}

/** Save whatever changed since the last save. */
export async function saveProject(p) {
  const ws = persistence.workspace?.id
  if (!ws || !p._persist || p._deleted) return
  const sb = client()
  p.dbId ||= crypto.randomUUID()
  ok(await sb.from('projects').upsert(projectRow(p, ws)), 'Save project')

  if (p.logo?.src && p._savedLogo !== p.logo.src) {
    await saveLogo(p, ws)
    p._savedLogo = p.logo.src
  }

  for (const s of p.sets || []) {
    s.dbId ||= crypto.randomUUID()
    const row = setRow(s, p)
    const key = JSON.stringify(row)
    if (s._saved !== key) {
      ok(await sb.from('banner_sets').upsert(row), 'Save banner set')
      s._saved = key
    }
  }

  // Banners of finished sets, oldest set first, in the order they were made.
  for (const s of p.sets || []) {
    if (s.status !== 'ready') continue
    const made = p.banners.filter((b) => b.setId === s.id).reverse()
    for (const [position, b] of made.entries()) {
      if (b.dbId || !/^https?:/.test(b.src)) continue
      b.dbId = crypto.randomUUID()
      const path = await copyBanner(p, b, ws)
      ok(await sb.from('banners').insert({ id: b.dbId, set_id: s.dbId, project_id: p.dbId, position, storage_path: path, source_url: b.src, kind: b.kind === 'pattern' ? 'pattern' : 'photo' }), 'Save banner')
    }
  }

  const selected = p.banners.find((b) => b.id === p.selectedBannerId)?.dbId || null
  if (selected !== p._savedSelected) {
    ok(await sb.from('projects').update({ selected_banner_id: selected }).eq('id', p.dbId), 'Save selected banner')
    p._savedSelected = selected
  }

  const from = p._savedMsgs || 0
  if (p.messages.length > from) {
    const rows = p.messages.slice(from).map((m) => messageRow(m, p))
    ok(await sb.from('chat_messages').insert(rows), 'Save chat')
    p._savedMsgs = p.messages.length
  }
  persistence.lastSavedAt = new Date()
}

/**
 * Delete a saved project: its stored files, then the project row (sets,
 * banners, chat and logo records go with it; usage history is kept by a
 * database trigger). Waits for any save in flight first.
 */
export async function deleteSaved(p) {
  p._deleted = true
  await (p._queue || Promise.resolve()).catch(() => {})
  const ws = persistence.workspace?.id
  if (!ws || !p.dbId) return
  const sb = client()
  const paths = []
  for (const folder of ['logos', 'banners']) {
    const dir = `${ws}/${p.dbId}/${folder}`
    const files = ok(await sb.storage.from(BUCKET).list(dir, { limit: 1000 }), 'List files')
    paths.push(...files.filter((f) => f.id).map((f) => `${dir}/${f.name}`))
  }
  if (paths.length) ok(await sb.storage.from(BUCKET).remove(paths), 'Delete files')
  ok(await sb.from('projects').delete().eq('id', p.dbId), 'Delete project')
}

/** Queue a save; saves of one project never overlap. */
export function queueSave(p) {
  persistence.saving++
  p._queue = (p._queue || Promise.resolve())
    .then(() => saveProject(p))
    .then(() => { if (persistence.error.startsWith('Saving')) persistence.error = '' })
    .catch((e) => {
      console.error('[projects] save failed', e)
      persistence.error = `Saving “${p.name}” failed: ${e.message}`
    })
    .finally(() => { persistence.saving-- })
  return p._queue
}

/** What, if it changes, means a project needs saving. */
export const fingerprint = (p) => JSON.stringify([
  p.name, p.kind, p.status, p.prompt, p.colors, p.typography, p.site, p.copy || null,
  p.logo?.src?.length || 0, p.logo?.src?.slice(-48) || '',
  p.logoLab?.methodId, p.logoLab?.lookId, p.logoLab?.strength,
  p.selectedBannerId, p.messages.length, p.banners.length,
  (p.sets || []).map((s) => [s.status, s.brief, s.error]),
])

let autosaving = false
let timer = 0
const seen = new Map()
function startAutosave() {
  if (autosaving) return
  autosaving = true
  for (const p of studio.projects) if (p._persist) seen.set(p.id, fingerprint(p))
  watch(() => studio.projects.filter((p) => p._persist).map((p) => [p, fingerprint(p)]), (list) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      for (const [p, f] of list) {
        if (seen.get(p.id) === f) continue
        seen.set(p.id, f)
        queueSave(p)
      }
    }, 800)
  })
}
