// Persistence adapters. Phase 1 ships the visitor (localStorage) adapter; the
// Supabase adapter (Phase 2) implements the same { save, load, list } shape
// against the `projects` table with row-level security on owner_id.
import { serializeProject } from '../models/project.js'

const DRAFT_KEY = 'presto-brand-studio:draft'

const storage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // private mode / blocked storage — the app still works, it just won't remember
  }
}

export const localDraftAdapter = {
  id: 'local',
  async save(project) {
    try { storage()?.setItem(DRAFT_KEY, serializeProject(project)) } catch { /* quota / blocked */ }
  },
  async load() {
    try { return storage()?.getItem(DRAFT_KEY) || null } catch { return null }
  },
  async clear() {
    try { storage()?.removeItem(DRAFT_KEY) } catch { /* ignore */ }
  },
}

/** In-memory adapter for stories and tests. */
export function memoryAdapter(initial = null) {
  let value = initial
  return {
    id: 'memory',
    async save(project) { value = serializeProject(project) },
    async load() { return value },
    async clear() { value = null },
  }
}
