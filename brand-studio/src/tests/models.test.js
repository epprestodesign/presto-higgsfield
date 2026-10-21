import { describe, it, expect } from 'vitest'
import { validateEvent, validateOrganizer, normalizeWebsiteUrl, formatDateRange } from '../models/event.js'
import { slugify, validateSlug } from '../models/ids.js'
import { createProject, serializeProject, deserializeProject, publishChecklist, deriveStatus, SCHEMA_VERSION } from '../models/project.js'
import { placementsFromPreset, AD_LAYOUT_PRESETS, slotById } from '../models/ads.js'
import { validateUpload } from '../models/brandKit.js'
import { sampleProject } from '../data/sampleEvents.js'

describe('event intake validation', () => {
  it('flags every required field on an empty event', () => {
    const errors = validateEvent({})
    expect(Object.keys(errors).sort()).toEqual(['category', 'city', 'endDate', 'name', 'startDate'])
  })

  it('rejects an end date before the start date', () => {
    const errors = validateEvent({ name: 'Cup', category: 'sports', city: 'Austin', startDate: '2027-06-19', endDate: '2027-06-16' })
    expect(errors.endDate).toMatch(/after the start/)
  })

  it('accepts a complete event', () => {
    expect(validateEvent(sampleProject('heartland').event)).toEqual({})
  })

  it('validates organizer email and optional phone', () => {
    expect(validateOrganizer({ firstName: 'A', lastName: 'B', email: 'nope' }).email).toBeTruthy()
    expect(validateOrganizer({ firstName: 'A', lastName: 'B', email: 'a@b.co', phone: '123' }).phone).toBeTruthy()
    expect(validateOrganizer({ firstName: 'A', lastName: 'B', email: 'a@b.co' })).toEqual({})
  })
})

describe('website URL handling (input to the future brand extractor)', () => {
  it('adds https to bare domains', () => {
    expect(normalizeWebsiteUrl('heartlandcup.org')).toBe('https://heartlandcup.org/')
  })
  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'http://localhost:3000', 'http://192.168.1.10', 'not a url'])('rejects %s', (bad) => {
    expect(normalizeWebsiteUrl(bad)).toBeNull()
  })
  it('treats empty as "not provided"', () => {
    expect(normalizeWebsiteUrl('')).toBe('')
  })
})

describe('slugs', () => {
  it('slugifies event names', () => {
    expect(slugify('The Alvarez & Chen Wedding')).toBe('the-alvarez-and-chen-wedding')
    expect(slugify('  Fintech Forward Summit 2027! ')).toBe('fintech-forward-summit-2027')
  })
  it('validates slugs', () => {
    expect(validateSlug('ok-slug-2027')).toBe('')
    expect(validateSlug('admin')).toMatch(/reserved/)
    expect(validateSlug('Bad Slug')).toBeTruthy()
    expect(validateSlug('ab')).toBeTruthy()
  })
})

describe('date ranges', () => {
  it('formats same-month, cross-month and single-day ranges', () => {
    expect(formatDateRange('2027-06-16', '2027-06-19')).toBe('Jun 16 – 19, 2027')
    expect(formatDateRange('2027-06-30', '2027-07-02')).toBe('Jun 30 – Jul 2, 2027')
    expect(formatDateRange('2027-10-09', '2027-10-09')).toBe('Oct 9, 2027')
  })
})

describe('project document', () => {
  it('round-trips through JSON', () => {
    const p = sampleProject('fintech')
    const back = deserializeProject(serializeProject(p))
    expect(back).toEqual(p)
  })

  it('fills defaults when migrating a partial document', () => {
    const back = deserializeProject({ schemaVersion: 1, event: { name: 'Old' } })
    expect(back.event.name).toBe('Old')
    expect(back.pages.landing.sections.intro.visible).toBe(true)
    expect(back.brandKit.colors.primary).toBeTruthy()
  })

  it('refuses documents from a newer schema', () => {
    expect(() => deserializeProject({ schemaVersion: SCHEMA_VERSION + 1 })).toThrow(/newer/)
  })

  it('keeps branding separate from page config', () => {
    const p = createProject({ event: { name: 'X', category: 'sports' } })
    expect(p.brandKit).toBeDefined()
    expect(p.pages.landing.hero).not.toHaveProperty('colors')
    expect(p.pages.landing.sections.widget.showTeams).toBe(true)
  })

  it('only becomes ready once every checklist item passes', () => {
    const p = sampleProject('heartland')
    expect(publishChecklist(p).ready).toBe(false)
    expect(deriveStatus(p)).toBe('draft')
    p.concepts.items = [{ id: 'cpt_1' }]
    p.concepts.selectedId = 'cpt_1'
    p.publishing.reviewed = { desktop: true, mobile: true }
    p.publishing.disclaimerAccepted = true
    const list = publishChecklist(p)
    expect(list.items.filter((i) => !i.pass)).toEqual([])
    expect(deriveStatus(p)).toBe('ready')
  })
})

describe('ads', () => {
  it('expands every preset into placements on real slots', () => {
    for (const [page, presets] of Object.entries(AD_LAYOUT_PRESETS)) {
      for (const preset of presets) {
        const placements = placementsFromPreset(page, preset.id, ['spn_a'])
        placements.forEach((pl) => {
          const slot = slotById(pl.slot)
          expect(slot, `${page}/${preset.id}`).toBeTruthy()
          expect(slot.sizes).toContain(pl.size)
          expect(pl.count).toBeLessThanOrEqual(slot.maxCount)
        })
      }
    }
  })
})

describe('uploads', () => {
  it('enforces type and size limits', () => {
    expect(validateUpload({ type: 'image/gif', size: 10 }, 'photo')).toBeTruthy()
    expect(validateUpload({ type: 'image/png', size: 9 * 1024 * 1024 }, 'photo')).toMatch(/under 8 MB/)
    expect(validateUpload({ type: 'image/svg+xml', size: 1000 }, 'logo')).toBe('')
  })
})
