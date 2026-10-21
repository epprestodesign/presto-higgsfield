import { describe, it, expect } from 'vitest'
import { HF_MODELS, getHfModel, closestAspect, BANNER_TARGETS } from '../providers/higgsfield/models.js'
import { buildBannerPrompt, defaultAnswers } from '../providers/higgsfield/bannerBrief.js'
import { ALLOWED_ENDPOINTS } from '../../dev/higgsfieldDevProxy.js'
import { sampleProject } from '../data/sampleEvents.js'

describe('Higgsfield model catalog', () => {
  it('only uses endpoints the dev proxy allows', () => {
    HF_MODELS.forEach((m) => expect(ALLOWED_ENDPOINTS.has(m.endpoint)).toBe(true))
  })

  it('picks the closest supported aspect ratio for every banner target', () => {
    expect(closestAspect(getHfModel('ideogram'), 160, 600)).toBe('1:3') // ~1:3.75 skyscraper
    expect(closestAspect(getHfModel('ideogram'), 970, 250)).toBe('3:1')
    expect(closestAspect(getHfModel('flare'), 970, 250)).toBe('21:9')
    expect(closestAspect(getHfModel('flare'), 160, 600)).toBe('9:16')
    expect(closestAspect(getHfModel('recraft'), 300, 250)).toBe('5:4')
    for (const m of HF_MODELS) for (const t of BANNER_TARGETS) expect(m.aspectRatios).toContain(closestAspect(m, t.width, t.height))
  })

  it('builds each model’s documented request body', () => {
    const flare = getHfModel('flare').buildInput({ prompt: 'p', aspectRatio: '21:9', referenceUrls: ['https://x/logo.png'], options: { quality: 'max' } })
    expect(flare).toEqual({ prompt: 'p', aspect_ratio: '21:9', resolution: '2k', quality: 'max', enhance_prompt: false, image_urls: ['https://x/logo.png'] })

    const recraft = getHfModel('recraft').buildInput({ prompt: 'p', aspectRatio: '16:9', palette: ['#0E1B2C', '#19C6B8', 'nope'] })
    expect(recraft.colors).toEqual([{ rgb: [14, 27, 44] }, { rgb: [25, 198, 184] }])
    expect(recraft.resolution).toBe('1k')
    expect(recraft).not.toHaveProperty('image_urls')

    const ideogram = getHfModel('ideogram').buildInput({ prompt: 'x'.repeat(3000), aspectRatio: '3:1', referenceUrls: ['https://x/a.png'] })
    expect(ideogram.prompt).toHaveLength(2048)
    expect(ideogram.image_url).toBe('https://x/a.png')
    expect(ideogram.rendering_speed).toBe('DEFAULT')
  })
})

describe('banner brief → prompt', () => {
  const p = sampleProject('heartland')
  const ctx = (overrides = {}) => ({ event: p.event, brandKit: p.brandKit, target: BANNER_TARGETS[0], model: getHfModel('flare'), ...overrides })

  it('keeps artwork a text-free, system-safe background (Presto banner rules)', () => {
    const prompt = buildBannerPrompt(defaultAnswers(), ctx())
    expect(prompt).toMatch(/No text, no letters, no numbers, no logos, no signage, no watermarks\./)
    expect(prompt).toMatch(/keep the center calm/)
    expect(prompt).toMatch(/Heartland Invitational Soccer Cup 2027/)
    expect(prompt).toMatch(/#0E1B2C/)
  })

  it('never asks a model to render text or place the logo, whatever the model', () => {
    for (const model of HF_MODELS) {
      const prompt = buildBannerPrompt(defaultAnswers(), ctx({ model }))
      expect(prompt).not.toMatch(/Render this headline|Place the attached logo/)
    }
  })

  it('sends the logo only as a color/style reference, and only to models that take references', () => {
    expect(buildBannerPrompt(defaultAnswers(), ctx())).toMatch(/do not reproduce the logo itself/)
    expect(buildBannerPrompt(defaultAnswers(), ctx({ model: getHfModel('recraft') }))).not.toMatch(/attached logo/)
    expect(buildBannerPrompt({ ...defaultAnswers(), logo: 'skip' }, ctx())).not.toMatch(/attached logo/)
  })

  it('writes sponsor ads for the sponsor', () => {
    const sponsor = p.ads.sponsors[0]
    const prompt = buildBannerPrompt(defaultAnswers(), ctx({ sponsor, target: BANNER_TARGETS.find((t) => t.id === '160x600') }))
    expect(prompt).toMatch(new RegExp(`Sponsored display ad .* for ${sponsor.name}`))
  })
})
