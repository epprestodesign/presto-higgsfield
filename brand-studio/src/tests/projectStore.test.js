import { describe, it, expect } from 'vitest'
import { projectRow, setRow, messageRow, toStudioProject, fingerprint } from '../banner-lab/projectStore.js'

const project = () => ({
  dbId: 'p1', name: 'ESPN', kind: 'logo', key: 'heartland', prompt: 'espn.com', modelId: 'auto',
  colors: { primary: '#DD0000' }, typography: { heading: 'inter', body: 'inter' }, site: 'https://espn.com/',
  logoLab: { methodId: 'darkkey', lookId: 'white', strength: { darkkey: 0.5 }, source: 'data:…' },
  status: 'ready', messages: [], banners: [], sets: [],
})

describe('saving: rows', () => {
  it('maps a project, a set and a message to their rows', () => {
    const p = project()
    expect(projectRow(p, 'ws1')).toMatchObject({
      id: 'p1', workspace_id: 'ws1', name: 'ESPN', kind: 'logo', event_key: 'heartland', site: 'https://espn.com/',
      colors: { primary: '#DD0000' }, typography: { heading: 'inter', body: 'inter' },
      logo_lab: { methodId: 'darkkey', lookId: 'white', strength: { darkkey: 0.5 } }, status: 'ready',
    })
    expect(projectRow({ ...p, kind: 'weird', status: 'building' }, 'ws1')).toMatchObject({ kind: 'kit', status: 'building' })
    expect(setRow({ dbId: 's1', n: 2, prompt: 'church', modelId: 'flare', status: 'ready', brief: 'b', sentPrompt: 'Scene: …', referenceCount: 2 }, p))
      .toEqual({ id: 's1', project_id: 'p1', n: 2, prompt: 'church', model_id: 'flare', status: 'ready', meta: { brief: 'b', sentPrompt: 'Scene: …', error: '', referenceCount: 2 } })
    expect(messageRow({ role: 'agent', text: 'Done', items: ['a'], action: { id: 'make-banners' }, muted: true }, p))
      .toEqual({ project_id: 'p1', role: 'agent', body: 'Done', items: ['a'], action: { id: 'make-banners' }, attachments: null })
  })
  it('changes its fingerprint when something worth saving changes', () => {
    const p = project()
    const before = fingerprint(p)
    p.messages.push({ role: 'user', text: 'hi' })
    expect(fingerprint(p)).not.toBe(before)
  })
})

describe('loading: a saved project back into the Studio', () => {
  const row = {
    id: 'p1', name: 'ESPN', kind: 'kit', event_key: 'heartland', prompt: 'espn.com', model_id: 'auto', created_at: '2026-11-02T10:00:00Z',
    colors: { primary: '#DD0000' }, typography: null, site: 'https://espn.com/', logo_lab: { methodId: 'darkkey', lookId: 'white' }, selected_banner_id: 'b2',
    banner_sets: [
      { id: 's2', n: 2, prompt: 'darker', model_id: 'flare', status: 'building', meta: {}, created_at: '2026-11-02T10:05:00Z' },
      { id: 's1', n: 1, prompt: 'arena', model_id: 'flare', status: 'ready', meta: { brief: 'arena brief' }, created_at: '2026-11-02T10:01:00Z' },
    ],
    banners: [
      { id: 'b1', set_id: 's1', position: 0, storage_path: 'ws/p1/banners/b1.png', source_url: 'https://cdn/1.png', created_at: '2026-11-02T10:02:00Z' },
      { id: 'b2', set_id: 's1', position: 1, storage_path: null, source_url: 'https://cdn/2.png', created_at: '2026-11-02T10:02:00Z' },
    ],
    chat_messages: [
      { role: 'agent', body: 'Ready', created_at: '2026-11-02T10:03:00Z', items: null, action: null, attachments: null },
      { role: 'user', body: 'espn.com', created_at: '2026-11-02T10:00:00Z', items: null, action: null, attachments: null },
    ],
    brand_assets: [{ kind: 'logo_upload', label: 'ESPN', storage_path: 'ws/p1/logos/l.png', created_at: '2026-11-02T10:00:00Z' }],
  }
  const links = { 'ws/p1/banners/b1.png': 'https://x.supabase.co/signed/b1', 'ws/p1/logos/l.png': 'https://x.supabase.co/signed/logo' }

  it('rebuilds sets, banners, chat and logo in Studio order', () => {
    const p = toStudioProject(row, links)
    expect(p.sets.map((s) => [s.n, s.status])).toEqual([[1, 'ready'], [2, 'failed']]) // an unfinished set is marked interrupted
    expect(p.sets[1].error).toMatch(/interrupted/)
    expect(p.banners.map((b) => b.id)).toEqual(['b2', 'b1']) // last-made first
    expect(p.banners[1].src).toBe('https://x.supabase.co/signed/b1') // our copy wins
    expect(p.banners[0].src).toBe('https://cdn/2.png') // no copy: the original link
    expect(p.selectedBannerId).toBe('b2')
    expect(p.messages.map((m) => m.text)).toEqual(['espn.com', 'Ready'])
    expect(p.logo).toMatchObject({ src: 'https://x.supabase.co/signed/logo', name: 'ESPN' })
    expect(p.logoLab).toMatchObject({ source: 'https://x.supabase.co/signed/logo', methodId: 'darkkey', lookId: 'white', announced: true })
    expect(p).toMatchObject({ _persist: true, _savedMsgs: 2, _savedSelected: 'b2' })
  })
  it('round-trips: nothing to save right after loading', () => {
    const p = toStudioProject(row, links)
    for (const s of p.sets) expect(s._saved).toBe(JSON.stringify(setRow(s, p)))
  })
})
