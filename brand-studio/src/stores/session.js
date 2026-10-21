// Session store — mock auth for Phase 1. Phase 2 replaces signUp/signIn with
// Supabase Auth (email/password + Google OAuth) and keeps the same surface.
// Signing up claims the anonymous draft: project.ownerId = user.id.
import { defineStore } from 'pinia'
import { useProjectStore } from './project.js'
import { sampleProject } from '../data/sampleEvents.js'

export const useSessionStore = defineStore('bs-session', {
  state: () => ({
    user: null, // { id, email, name, provider: 'password' | 'google' }
    pending: false,
    error: '',
    projects: [], // dashboard list (mock); Phase 2 = select from `projects` where owner_id = auth.uid()
  }),

  getters: {
    isAuthenticated: (s) => !!s.user,
  },

  actions: {
    async signUp({ email, password, name }, { delayMs = 700 } = {}) {
      this.error = ''
      if (!email || !password || password.length < 8) {
        this.error = 'Use your email and a password of at least 8 characters.'
        return false
      }
      this.pending = true
      await new Promise((r) => setTimeout(r, delayMs))
      this.user = { id: `usr_${Date.now().toString(36)}`, email, name: name || email.split('@')[0], provider: 'password' }
      this.pending = false
      this.claimDraft()
      return true
    },
    async signInWithGoogle({ delayMs = 700 } = {}) {
      this.pending = true
      await new Promise((r) => setTimeout(r, delayMs))
      this.user = { id: `usr_${Date.now().toString(36)}`, email: 'organizer@example.com', name: 'Event Organizer', provider: 'google' }
      this.pending = false
      this.claimDraft()
      return true
    },
    signOut() { this.user = null },

    /** Attach the visitor's in-progress project to the new account (no progress lost). */
    claimDraft() {
      const project = useProjectStore()
      project.project.ownerId = this.user.id
      if (!this.projects.some((p) => p.id === project.project.id)) this.projects.unshift(project.project)
    },

    /** Seed the dashboard with sample projects for stories/demos. */
    seedDemoProjects() {
      const a = sampleProject('heartland')
      const b = sampleProject('fintech')
      const c = sampleProject('wedding')
      b.status = 'ready'
      c.status = 'published'
      c.publishing.publishedAt = '2026-10-02T15:20:00.000Z'
      c.publishing.publishedUrl = `https://demo.eventpipe.com/${c.publishing.slug}`
      a.updatedAt = '2026-10-20T18:05:00.000Z'
      b.updatedAt = '2026-10-14T13:40:00.000Z'
      c.updatedAt = '2026-10-02T15:20:00.000Z'
      this.projects = [a, b, c]
    },
    duplicateProject(id) {
      const src = this.projects.find((p) => p.id === id)
      if (!src) return null
      const copy = JSON.parse(JSON.stringify(src))
      copy.id = `prj_${Math.random().toString(36).slice(2, 10)}`
      copy.event.name = `${src.event.name} (copy)`
      copy.status = 'draft'
      copy.publishing = { ...copy.publishing, slug: `${src.publishing.slug}-copy`, publishedAt: null, publishedUrl: null }
      copy.updatedAt = new Date().toISOString()
      this.projects.unshift(copy)
      return copy
    },
  },
})
