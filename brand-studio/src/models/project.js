// Project — the single serializable document a Brand Studio session edits.
//
//   project
//   ├─ event / organizer     (intake)
//   ├─ brandKit              (identity — shared by every page)
//   ├─ concepts              (AI creative results + selection)
//   ├─ pages                 (per-page content + section visibility)
//   ├─ ads                   (sponsors + placements per page)
//   └─ publishing            (slug, status, checklist acks)
//
// Phase 2 maps this 1:1 onto Supabase: `projects` row (owner_id + jsonb doc),
// `brand_kits`, `assets` (Storage), `generation_jobs`. See docs/BRAND_STUDIO_AUDIT.md.
import { uid, slugify, validateSlug } from './ids.js'
import { createEvent, createOrganizer, validateEvent, validateOrganizer } from './event.js'
import { createBrandKit } from './brandKit.js'
import { createPages } from './pageConfig.js'
import { placementsFromPreset } from './ads.js'
import { PRESTO_DEFAULT_COLORS } from '../theme/brandTheme.js'

export const SCHEMA_VERSION = 1

export const PROJECT_STATUS = {
  draft: { label: 'Draft', color: 'grey-7', icon: 'edit_note' },
  ready: { label: 'Ready to publish', color: 'warning', icon: 'checklist' },
  published: { label: 'Published demo', color: 'positive', icon: 'public' },
}

export function createProject({ event = {}, organizer = {}, brandKit = {}, sponsors = [] } = {}) {
  const ev = createEvent(event)
  const sponsorIds = sponsors.map((s) => s.id)
  const now = new Date().toISOString()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: uid('prj'),
    ownerId: null, // Supabase auth.uid() once the visitor signs up
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    event: ev,
    organizer: createOrganizer(organizer),
    brandKit: createBrandKit(brandKit),
    concepts: { items: [], selectedId: null, favoriteIds: [], compareIds: [] },
    pages: createPages(ev),
    ads: {
      enabled: sponsors.length > 0,
      sponsors,
      presets: { landing: 'rectangles', browse: 'rail-160', details: 'bottom-billboard' },
      placements: {
        landing: placementsFromPreset('landing', 'rectangles', sponsorIds),
        browse: placementsFromPreset('browse', 'rail-160', sponsorIds),
        details: placementsFromPreset('details', 'bottom-billboard', sponsorIds),
      },
    },
    publishing: {
      slug: slugify(ev.name),
      publishedAt: null,
      publishedUrl: null,
      reviewed: { desktop: false, mobile: false },
      disclaimerAccepted: false,
    },
  }
}

export const serializeProject = (project) => JSON.stringify(project)

/** Parse + migrate a stored project. Unknown/missing fields fall back to defaults. */
export function deserializeProject(json) {
  const raw = typeof json === 'string' ? JSON.parse(json) : json
  if (!raw || typeof raw !== 'object') throw new Error('Not a Brand Studio project')
  if (raw.schemaVersion > SCHEMA_VERSION) throw new Error(`Project schema v${raw.schemaVersion} is newer than this app (v${SCHEMA_VERSION}).`)
  const base = createProject({ event: raw.event, organizer: raw.organizer, brandKit: raw.brandKit })
  return {
    ...base,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    event: { ...base.event, ...raw.event },
    organizer: { ...base.organizer, ...raw.organizer },
    brandKit: { ...base.brandKit, ...raw.brandKit, colors: { ...base.brandKit.colors, ...raw.brandKit?.colors } },
    concepts: { ...base.concepts, ...raw.concepts },
    pages: { ...base.pages, ...raw.pages },
    ads: { ...base.ads, ...raw.ads },
    publishing: { ...base.publishing, ...raw.publishing },
  }
}

/** Publishing checklist — every item must pass before "Publish demo" enables. */
export function publishChecklist(project) {
  const p = project
  const slugError = validateSlug(p.publishing.slug)
  const items = [
    { id: 'event', label: 'Event details are complete', pass: Object.keys(validateEvent(p.event)).length === 0, fix: 'intake' },
    { id: 'contact', label: 'Organizer contact added', pass: Object.keys(validateOrganizer(p.organizer)).length === 0, fix: 'intake' },
    { id: 'brand', label: 'Logo or brand colors set', pass: !!p.brandKit.logo || p.brandKit.colors.primary !== PRESTO_DEFAULT_COLORS.primary, fix: 'brand' },
    { id: 'concept', label: 'Creative concept selected', pass: !!p.concepts.selectedId, fix: 'concepts' },
    { id: 'slug', label: 'Page URL is valid', pass: !slugError, detail: slugError, fix: 'publish' },
    { id: 'desktop', label: 'Reviewed the desktop preview', pass: !!p.publishing.reviewed.desktop, fix: 'publish' },
    { id: 'mobile', label: 'Reviewed the mobile preview', pass: !!p.publishing.reviewed.mobile, fix: 'publish' },
    { id: 'disclaimer', label: 'Acknowledged this is a demo (no live rates or bookings)', pass: !!p.publishing.disclaimerAccepted, fix: 'publish' },
  ]
  return { items, done: items.filter((i) => i.pass).length, total: items.length, ready: items.every((i) => i.pass) }
}

/** Status derived from the checklist (published is sticky until unpublished). */
export function deriveStatus(project) {
  if (project.status === 'published') return 'published'
  return publishChecklist(project).ready ? 'ready' : 'draft'
}
