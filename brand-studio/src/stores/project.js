// Project store — the one editable document for a Brand Studio session.
// Visitors work anonymously; the draft autosaves to localStorage so nothing is
// lost before sign-up (Phase 2 swaps the persistence adapter for Supabase).
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { createProject, deserializeProject, serializeProject, publishChecklist, deriveStatus } from '../models/project.js'
import { placementsFromPreset } from '../models/ads.js'
import { createPages } from '../models/pageConfig.js'
import { slugify } from '../models/ids.js'
import { brandThemeVars } from '../theme/brandTheme.js'
import { sampleProject } from '../data/sampleEvents.js'
import { localDraftAdapter } from './persistence.js'

export const useProjectStore = defineStore('bs-project', {
  state: () => ({
    project: createProject(),
    lastSavedAt: null,
    saving: false,
    persistence: markRaw(localDraftAdapter),
  }),

  getters: {
    brandKit: (s) => s.project.brandKit,
    event: (s) => s.project.event,
    pages: (s) => s.project.pages,
    ads: (s) => s.project.ads,
    themeVars: (s) => brandThemeVars(s.project.brandKit),
    selectedConcept: (s) => s.project.concepts.items.find((c) => c.id === s.project.concepts.selectedId) || null,
    favorites: (s) => s.project.concepts.items.filter((c) => s.project.concepts.favoriteIds.includes(c.id)),
    checklist: (s) => publishChecklist(s.project),
    status: (s) => deriveStatus(s.project),
    sponsorById: (s) => (id) => s.project.ads.sponsors.find((sp) => sp.id === id) || null,
  },

  actions: {
    touch() {
      this.project.updatedAt = new Date().toISOString()
      if (this.project.status === 'published') return
      this.project.status = deriveStatus(this.project)
    },

    // ── Lifecycle ───────────────────────────────────────────────────────────
    loadSample(key = 'heartland') { this.project = sampleProject(key) },
    reset() { this.project = createProject() },
    load(json) { this.project = deserializeProject(json) },
    exportJSON() { return serializeProject(this.project) },
    async saveDraft() {
      this.saving = true
      try {
        await this.persistence.save(this.project)
        this.lastSavedAt = new Date().toISOString()
      } finally {
        this.saving = false
      }
    },
    async restoreDraft() {
      const saved = await this.persistence.load()
      if (saved) this.project = deserializeProject(saved)
      return !!saved
    },

    // ── Intake ──────────────────────────────────────────────────────────────
    updateEvent(patch) {
      const prevName = this.project.event.name
      Object.assign(this.project.event, patch)
      // Keep the slug following the name until the organizer edits it by hand.
      if (patch.name !== undefined && this.project.publishing.slug === slugify(prevName)) {
        this.project.publishing.slug = slugify(patch.name)
      }
      this.touch()
    },
    updateOrganizer(patch) { Object.assign(this.project.organizer, patch); this.touch() },
    /** Re-seed starter page copy from the event (after intake completes). */
    regeneratePageCopy() { this.project.pages = createPages(this.project.event); this.touch() },

    // ── Brand Kit ───────────────────────────────────────────────────────────
    updateBrandKit(patch) { Object.assign(this.project.brandKit, patch); this.touch() },
    setColor(role, hex) { this.project.brandKit.colors[role] = hex; this.touch() },
    setFont(role, fontId) { this.project.brandKit.typography[role] = fontId; this.touch() },
    setLogo(asset) { this.project.brandKit.logo = asset; this.touch() },
    addImage(asset) { this.project.brandKit.imagery.push(asset); this.touch() },
    removeImage(id) {
      const bk = this.project.brandKit
      bk.imagery = bk.imagery.filter((a) => a.id !== id)
      if (bk.heroImageId === id) bk.heroImageId = bk.imagery[0]?.id || null
      this.touch()
    },
    setHeroImage(id) { this.project.brandKit.heroImageId = id; this.touch() },
    setDirection(direction) { this.project.brandKit.direction = direction; this.touch() },
    applyBrandSuggestion(suggestion) {
      Object.assign(this.project.brandKit, { ...suggestion, source: 'suggested' })
      this.touch()
    },

    // ── Concepts ────────────────────────────────────────────────────────────
    setConcepts(items) {
      const c = this.project.concepts
      c.items = items
      if (!items.some((i) => i.id === c.selectedId)) c.selectedId = null
      c.favoriteIds = c.favoriteIds.filter((id) => items.some((i) => i.id === id))
      c.compareIds = c.compareIds.filter((id) => items.some((i) => i.id === id))
      this.touch()
    },
    addConcepts(items) { this.project.concepts.items.push(...items); this.touch() },
    replaceConcept(id, next) {
      const c = this.project.concepts
      const i = c.items.findIndex((x) => x.id === id)
      if (i === -1) return
      c.items.splice(i, 1, next)
      if (c.selectedId === id) c.selectedId = next.id
      c.favoriteIds = c.favoriteIds.map((f) => (f === id ? next.id : f))
      c.compareIds = c.compareIds.map((f) => (f === id ? next.id : f))
      this.touch()
    },
    selectConcept(id) {
      const c = this.project.concepts
      c.selectedId = id
      const concept = c.items.find((x) => x.id === id)
      if (concept) {
        this.project.brandKit.direction = concept.direction
        if (concept.treatment.imageId) this.project.brandKit.heroImageId = concept.treatment.imageId
      }
      this.touch()
    },
    toggleFavorite(id) {
      const f = this.project.concepts.favoriteIds
      const i = f.indexOf(id)
      i === -1 ? f.push(id) : f.splice(i, 1)
      this.touch()
    },
    toggleCompare(id, max = 3) {
      const ids = this.project.concepts.compareIds
      const i = ids.indexOf(id)
      if (i !== -1) ids.splice(i, 1)
      else if (ids.length < max) ids.push(id)
      this.touch()
    },
    clearCompare() { this.project.concepts.compareIds = []; this.touch() },

    // ── Pages ───────────────────────────────────────────────────────────────
    updateHero(patch) { Object.assign(this.project.pages.landing.hero, patch); this.touch() },
    updateSection(sectionId, patch) { Object.assign(this.project.pages.landing.sections[sectionId], patch); this.touch() },
    toggleSection(sectionId) {
      const s = this.project.pages.landing.sections[sectionId]
      s.visible = !s.visible
      this.touch()
    },
    moveSection(sectionId, delta) {
      const order = this.project.pages.landing.sectionOrder
      const i = order.indexOf(sectionId)
      const j = i + delta
      if (i === -1 || j < 0 || j >= order.length) return
      ;[order[i], order[j]] = [order[j], order[i]]
      this.touch()
    },
    updatePage(pageId, patch) { Object.assign(this.project.pages[pageId], patch); this.touch() },

    // ── Ads ─────────────────────────────────────────────────────────────────
    setAdsEnabled(on) { this.project.ads.enabled = on; this.touch() },
    setRailMode(mode) { this.project.ads.railMode = mode; this.touch() },
    applyAdPreset(page, presetId) {
      const ads = this.project.ads
      ads.presets[page] = presetId
      ads.placements[page] = placementsFromPreset(page, presetId, ads.sponsors.map((s) => s.id))
      this.touch()
    },
    upsertSponsor(sponsor) {
      const list = this.project.ads.sponsors
      const i = list.findIndex((s) => s.id === sponsor.id)
      if (i === -1) {
        list.push(sponsor)
        Object.values(this.project.ads.placements).flat().forEach((p) => p.sponsorIds.push(sponsor.id))
      } else list.splice(i, 1, sponsor)
      this.touch()
    },
    removeSponsor(id) {
      const ads = this.project.ads
      ads.sponsors = ads.sponsors.filter((s) => s.id !== id)
      Object.values(ads.placements).flat().forEach((p) => { p.sponsorIds = p.sponsorIds.filter((x) => x !== id) })
      this.touch()
    },

    // ── Publishing (demo only — never live inventory or payments) ──────────
    setSlug(slug) { this.project.publishing.slug = slug; this.touch() },
    markReviewed(device) { this.project.publishing.reviewed[device] = true; this.touch() },
    acceptDisclaimer(on = true) { this.project.publishing.disclaimerAccepted = on; this.touch() },
    publish({ baseUrl = 'https://demo.eventpipe.com' } = {}) {
      if (!publishChecklist(this.project).ready) throw new Error('Complete the publishing checklist first.')
      const pub = this.project.publishing
      pub.publishedAt = new Date().toISOString()
      pub.publishedUrl = `${baseUrl}/${pub.slug}`
      this.project.status = 'published'
      this.touch()
    },
    unpublish() {
      this.project.status = 'draft'
      this.project.publishing.publishedAt = null
      this.project.publishing.publishedUrl = null
      this.touch()
    },
  },
})
