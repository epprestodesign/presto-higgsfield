// Brand theme engine — turns a Brand Kit into CSS custom properties that
// re-skin the *unmodified* Presto components.
//
// Presto components only read semantic tokens (--ds-color-*) and Quasar's
// runtime brand vars (--q-primary …). Setting those on a wrapper element
// scopes the customer's branding to that subtree, so one Brand Kit can theme
// the landing, browse and details previews at once while the Studio chrome
// around them stays Presto-navy.
//
// Caveat: Quasar portals (QDialog, QMenu, QTooltip) teleport to <body> and
// therefore render with the default Presto theme. See docs/BRAND_STUDIO_AUDIT.md.
import { normalizeHex, tint, shade, onColor, ensureContrast, contrast } from './color.js'
import { getFont } from './fonts.js'

export const PRESTO_DEFAULT_COLORS = {
  primary: '#01113E',
  secondary: '#2C4380',
  accent: '#16A34A',
  ink: '#0F172A',
  surface: '#FFFFFF',
}

/** Resolved, contrast-safe palette derived from the brand kit colors. */
export function resolvePalette(colors = {}) {
  const primary = normalizeHex(colors.primary) || PRESTO_DEFAULT_COLORS.primary
  const secondary = normalizeHex(colors.secondary) || shade(primary, 0.25)
  const accent = normalizeHex(colors.accent) || secondary
  const ink = normalizeHex(colors.ink) || PRESTO_DEFAULT_COLORS.ink
  const surface = normalizeHex(colors.surface) || PRESTO_DEFAULT_COLORS.surface

  // Buttons/fills keep the exact brand color; brand *text* is nudged until it
  // passes AA on the surface so light brand colors stay legible.
  const brandText = ensureContrast(primary, surface, 4.5)
  return {
    primary,
    secondary,
    accent,
    ink,
    surface,
    onPrimary: onColor(primary),
    onSecondary: onColor(secondary),
    onAccent: onColor(accent),
    brandText,
    subtlest: tint(primary, 0.93),
    selected: tint(primary, 0.82),
    hover: shade(primary, 0.12),
  }
}

/** CSS custom properties for a Brand Kit (apply with :style on a wrapper). */
export function brandThemeVars(brandKit = {}) {
  const p = resolvePalette(brandKit.colors)
  const heading = getFont(brandKit.typography?.heading)
  const body = getFont(brandKit.typography?.body)
  return {
    // Presto semantic tokens (Tier 2)
    '--ds-color-background-brand-bold': p.primary,
    '--ds-color-background-brand-subtlest': p.subtlest,
    '--ds-color-background-selected': p.selected,
    '--ds-color-background-selected-bold': p.primary,
    '--ds-color-text-brand': p.brandText,
    '--ds-color-link': p.brandText,
    '--ds-color-link-visited': p.brandText,
    '--ds-color-border-brand': p.brandText,
    '--ds-color-border-focused': p.brandText,
    '--ds-font-family': heading.family,
    // Quasar runtime brand vars (bg-primary / text-primary / q-btn color="primary")
    '--q-primary': p.primary,
    '--q-secondary': p.secondary,
    '--q-accent': p.accent,
    '--q-dark': p.ink,
    // Brand Studio additions, read by BrandHero / ad creatives
    '--brand-primary': p.primary,
    '--brand-secondary': p.secondary,
    '--brand-accent': p.accent,
    '--brand-ink': p.ink,
    '--brand-on-primary': p.onPrimary,
    '--brand-on-secondary': p.onSecondary,
    '--brand-on-accent': p.onAccent,
    '--brand-font-heading': heading.family,
    '--brand-font-body': body.family,
    fontFamily: body.family,
  }
}

/**
 * Accessibility report for the Brand Kit editor: which color pairings pass
 * WCAG AA, so organizers see the consequence of their picks immediately.
 */
export function paletteChecks(colors = {}) {
  const p = resolvePalette(colors)
  const row = (label, fg, bg, min = 4.5) => {
    const ratio = contrast(fg, bg)
    return { label, fg, bg, ratio: Math.round(ratio * 100) / 100, pass: ratio >= min }
  }
  return [
    row('Button text on primary', p.onPrimary, p.primary),
    row('Text on secondary', p.onSecondary, p.secondary),
    row('Primary on white (raw)', p.primary, '#FFFFFF'),
    row('Brand text on white (adjusted)', p.brandText, '#FFFFFF'),
  ]
}
