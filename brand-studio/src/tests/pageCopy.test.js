import { describe, it, expect } from 'vitest'
import { defaultCopy, normalizeCopy, isDefaultCopy, applyCopy } from '../banner-lab/pageCopy.js'
import { heroProps } from '../components/preview/previewModel.js'
import { projectRow, toStudioProject, fingerprint } from '../banner-lab/projectStore.js'

const presto = () => ({
  event: { name: 'ESPN', startDate: '2027-06-16', endDate: '2027-06-19', city: 'Overland Park', region: 'KS' },
  pages: { landing: { hero: { headline: '', tagline: 'Official event hotels. Book early, stay close to the action.' } } },
  brandKit: {},
})

describe('page text', () => {
  it('starts from the event’s own wording', () => {
    const d = defaultCopy(presto())
    expect(d.headline).toBe('ESPN')
    expect(d.tagline).toMatch(/^Official event hotels/)
    expect(d.meta).toMatch(/Overland Park/)
  })
  it('fills gaps and keeps lines on unless switched off', () => {
    expect(normalizeCopy(null)).toEqual({ headline: '', meta: '', tagline: '', show: { headline: true, meta: true, tagline: true } })
    expect(normalizeCopy({ tagline: 'Hi', show: { tagline: false } }).show).toEqual({ headline: true, meta: true, tagline: false })
    expect(isDefaultCopy({ show: { headline: true } })).toBe(true)
    expect(isDefaultCopy({ show: { meta: false } })).toBe(false)
  })
  it('writes onto the hero the Presto pages render', () => {
    const p = applyCopy(presto(), { headline: 'ESPN Summer Classic', meta: 'June 2027 · Kansas City', tagline: '', show: { tagline: false } })
    const hero = heroProps(p)
    expect(hero).toMatchObject({ headline: 'ESPN Summer Classic', meta: 'June 2027 · Kansas City', showHeadline: true, showMeta: true, showTagline: false })
    expect(hero.tagline).toMatch(/^Official event hotels/) // empty = keep the event's tagline (only hidden)
  })
  it('leaves a project without copy alone', () => {
    expect(heroProps(applyCopy(presto(), undefined))).toMatchObject({ headline: 'ESPN', meta: '', showHeadline: true, showMeta: true, showTagline: true })
  })
})

describe('page text: saving', () => {
  const lab = (copy) => ({ dbId: 'p1', name: 'ESPN', kind: 'kit', messages: [], banners: [], sets: [], ...(copy ? { copy } : {}) })
  it('saves only real changes, and loads them back', () => {
    expect(projectRow(lab(), 'ws').page_copy).toBeNull()
    expect(projectRow(lab({ show: { headline: true } }), 'ws').page_copy).toBeNull()
    const row = projectRow(lab({ headline: 'ESPN Classic', show: { tagline: false } }), 'ws')
    expect(row.page_copy).toEqual({ headline: 'ESPN Classic', meta: '', tagline: '', show: { headline: true, meta: true, tagline: false } })
    const back = toStudioProject({ ...row, created_at: '2026-11-03T10:00:00Z', banner_sets: [], banners: [], chat_messages: [], brand_assets: [] })
    expect(back.copy).toEqual(row.page_copy)
  })
  it('autosaves when the text changes', () => {
    const p = lab()
    const before = fingerprint(p)
    p.copy = { headline: 'New' }
    expect(fingerprint(p)).not.toBe(before)
  })
})
