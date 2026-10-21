import { describe, it, expect } from 'vitest'
import { contrast, ensureContrast, normalizeHex, onColor, mix } from '../theme/color.js'
import { brandThemeVars, resolvePalette, paletteChecks } from '../theme/brandTheme.js'

describe('color helpers', () => {
  it('normalizes hex input', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex('0e1b2c')).toBe('#0E1B2C')
    expect(normalizeHex('red')).toBeNull()
  })

  it('computes WCAG contrast', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('picks readable text for a background', () => {
    expect(onColor('#0E1B2C')).toBe('#FFFFFF')
    expect(onColor('#FFD23F')).not.toBe('#FFFFFF')
  })

  it('nudges light brand colors until they pass AA on white', () => {
    const fixed = ensureContrast('#FFD23F', '#FFFFFF', 4.5)
    expect(contrast(fixed, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
  })

  it('mixes colors', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080')
  })
})

describe('brand theme engine', () => {
  it('maps the brand kit onto Presto semantic tokens and Quasar vars', () => {
    const vars = brandThemeVars({ colors: { primary: '#0057B8', secondary: '#FF3D2E' }, typography: { heading: 'oswald', body: 'work-sans' } })
    expect(vars['--ds-color-background-brand-bold']).toBe('#0057B8')
    expect(vars['--q-primary']).toBe('#0057B8')
    expect(vars['--q-secondary']).toBe('#FF3D2E')
    expect(vars['--brand-font-heading']).toContain('Oswald')
    expect(vars.fontFamily).toContain('Work Sans')
  })

  it('keeps brand text legible even when the primary color is light', () => {
    const p = resolvePalette({ primary: '#9AE6FF' })
    expect(contrast(p.brandText, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
  })

  it('falls back to Presto navy for an empty kit', () => {
    expect(resolvePalette({}).primary).toBe('#01113E')
  })

  it('reports palette accessibility checks', () => {
    const checks = paletteChecks({ primary: '#0E1B2C', secondary: '#19C6B8' })
    expect(checks).toHaveLength(4)
    expect(checks.every((c) => typeof c.pass === 'boolean')).toBe(true)
    expect(checks.find((c) => c.label.startsWith('Brand text')).pass).toBe(true)
  })
})
