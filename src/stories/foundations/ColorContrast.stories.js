// FOUNDATIONS / Color Contrast — a WCAG 2.2 AA audit of the semantic color
// tokens in real pairings (text on surfaces, inverse text on bold fills, status
// text on tinted surfaces). Ratios are computed with the WCAG relative-luminance
// formula; each pairing is graded for AA (4.5:1), AAA (7:1) and AA-large / non-
// text UI (3:1). This is a design-time reference — the live per-story checks come
// from the Accessibility panel (addon-a11y / axe).
import { semanticGroups } from '../_tokens-data.js'
import { contrast, grade } from '../_contrast.js'

// Flat name → hex lookup across every semantic group.
const BY_NAME = {}
for (const group of Object.values(semanticGroups)) {
  for (const t of group) BY_NAME[t.name] = t.hex
}
const hex = (name, fallback) => BY_NAME[name] || fallback
const fg = (name, label, fallback) => ({ label: label || name, hex: hex(name, fallback) })
const bg = fg

// Curated, real-usage pairings — not a full cartesian product.
const SURFACES = [
  { label: 'Surface (white)', hex: hex('elevation.surface', '#FFFFFF') },
  { label: 'Sunken (#F8FAFC)', hex: hex('elevation.surface.sunken', '#F8FAFC') },
  { label: 'Neutral bg (#F1F5F9)', hex: hex('color.background.neutral', '#F1F5F9') },
]

const TEXT_TOKENS = [
  fg('color.text', 'Text'),
  fg('color.text.subtle', 'Text subtle'),
  fg('color.text.subtlest', 'Text subtlest'),
  fg('color.text.brand', 'Text brand'),
  fg('color.text.danger', 'Text danger'),
  fg('color.text.warning', 'Text warning'),
  fg('color.text.success', 'Text success'),
  fg('color.text.info', 'Text info'),
]

const BOLD_FILLS = [
  bg('color.background.brand.bold', 'Brand bold'),
  bg('color.background.neutral.bold', 'Neutral bold'),
  bg('color.background.danger.bold', 'Danger bold'),
  bg('color.background.success.bold', 'Success bold'),
  bg('color.background.warning.bold', 'Warning bold'),
  bg('color.background.info.bold', 'Info bold'),
  bg('color.background.discovery.bold', 'Discovery bold'),
]

const STATUS_ON_TINT = [
  { fg: fg('color.text.danger', 'Text danger'), bg: bg('color.background.danger', 'Danger surface') },
  { fg: fg('color.text.warning', 'Text warning'), bg: bg('color.background.warning', 'Warning surface') },
  { fg: fg('color.text.success', 'Text success'), bg: bg('color.background.success', 'Success surface') },
  { fg: fg('color.text.info', 'Text info'), bg: bg('color.background.info', 'Info surface') },
]

const INVERSE = fg('color.text.inverse', 'Text inverse', '#FFFFFF')

const row = (f, b) => ({ fg: f, bg: b, ...grade(contrast(f.hex, b.hex)) })

const SECTIONS = [
  {
    title: 'Text on light surfaces',
    note: 'Body / label / metadata text on the white, sunken and neutral backgrounds. Normal text needs AA ≥ 4.5:1.',
    rows: TEXT_TOKENS.flatMap((f) => SURFACES.map((s) => row(f, s))),
  },
  {
    title: 'Inverse text on bold fills',
    note: 'White text/icons on the solid status & brand buttons. Watch the bright fills (success / warning) — these often fail.',
    rows: BOLD_FILLS.map((b) => row(INVERSE, b)),
  },
  {
    title: 'Status text on tinted surfaces',
    note: 'Colored text on its matching subtle surface (alerts, badges, banners).',
    rows: STATUS_ON_TINT.map(({ fg: f, bg: b }) => row(f, b)),
  },
]

const failCount = SECTIONS.reduce((n, s) => n + s.rows.filter((r) => !r.aaNormal).length, 0)
const rowCount = SECTIONS.reduce((n, s) => n + s.rows.length, 0)

export default {
  title: 'Foundations/Color Contrast',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    // This audit story intentionally renders known-failing combinations for
    // documentation, so don't let axe's own contrast check flag the page.
    a11y: { test: 'off' },
    docs: { description: { component: `
## Color Contrast — WCAG 2.2 AA audit
Computed contrast ratios for the semantic color tokens in **real pairings**, using
the WCAG relative-luminance formula. Each row is graded:

- **AA** — normal text, ratio **≥ 4.5:1** (WCAG 1.4.3).
- **AAA** — normal text, ratio **≥ 7:1** (1.4.6).
- **AA Large / UI** — large text (≥ 24px, or ≥ 18.66px bold) and non-text UI /
  graphics, ratio **≥ 3:1** (1.4.11).

A ✗ on **AA** means that pairing must not be used for normal-size body text. It may
still be valid for large headings or non-text UI — check the **AA Large / UI** column.

> This is a static, design-time reference. Per-component, per-state checks (and the
> DOM-aware \`color-contrast\` rule) run live in the **Accessibility** panel on every
> other story via addon-a11y / axe.
` } } },
}

const CHIP = (ok) => (ok
  ? '<span style="display:inline-flex;align-items:center;gap:4px;font-weight:700;color:#15803D">✓</span>'
  : '<span style="display:inline-flex;align-items:center;gap:4px;font-weight:700;color:#DC2626">✗</span>')

const TEMPLATE = `
  <div style="display:flex;flex-direction:column;gap:32px;font-family:inherit">
    <div style="padding:14px 16px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0">
      <strong>{{ rowCount }}</strong> pairings audited ·
      <strong :style="{ color: failCount ? '#DC2626' : '#15803D' }">{{ failCount }}</strong>
      fail AA for normal text. Target: <strong>WCAG 2.2 AA</strong>.
    </div>

    <section v-for="s in sections" :key="s.title" style="display:flex;flex-direction:column;gap:10px">
      <h3 style="margin:0;font-size:1.0625rem;font-weight:800;color:#0F172A">{{ s.title }}</h3>
      <p style="margin:0 0 6px;color:#475569;font-size:0.875rem;max-width:760px">{{ s.note }}</p>

      <div style="display:grid;grid-template-columns:120px 1fr 84px repeat(3, 92px);gap:0;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
        <div v-for="h in ['Sample','Pairing','Ratio','AA','AAA','AA Large / UI']" :key="h"
             style="padding:10px 12px;background:#F1F5F9;font-size:0.75rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.03em">{{ h }}</div>

        <template v-for="(r, i) in s.rows" :key="i">
          <div :style="{ background: r.bg.hex, borderTop: '1px solid #E2E8F0', padding: '10px 12px', display:'flex', alignItems:'center', gap:'8px' }">
            <span :style="{ color: r.fg.hex, fontSize:'15px', fontWeight:600 }">Aa</span>
            <span :style="{ color: r.fg.hex, fontSize:'22px', fontWeight:700 }">Aa</span>
          </div>
          <div style="border-top:1px solid #E2E8F0;padding:10px 12px;display:flex;flex-direction:column;justify-content:center">
            <div style="font-family:monospace;font-size:12px;color:#0F172A">{{ r.fg.label }} <span style="color:#94A3B8">on</span> {{ r.bg.label }}</div>
            <div style="font-family:monospace;font-size:11px;color:#94A3B8">{{ r.fg.hex }} / {{ r.bg.hex }}</div>
          </div>
          <div style="border-top:1px solid #E2E8F0;padding:10px 12px;display:flex;align-items:center;font-family:monospace;font-size:13px;font-weight:700"
               :style="{ color: r.aaNormal ? '#0F172A' : '#DC2626' }">{{ r.ratio.toFixed(2) }}:1</div>
          <div style="border-top:1px solid #E2E8F0;padding:10px 12px;display:flex;align-items:center;justify-content:center" v-html="chip(r.aaNormal)"></div>
          <div style="border-top:1px solid #E2E8F0;padding:10px 12px;display:flex;align-items:center;justify-content:center" v-html="chip(r.aaaNormal)"></div>
          <div style="border-top:1px solid #E2E8F0;padding:10px 12px;display:flex;align-items:center;justify-content:center" v-html="chip(r.aaLarge)"></div>
        </template>
      </div>
    </section>
  </div>`

/** Full audit matrix — text on surfaces, inverse on bold fills, status on tints. */
export const Audit = {
  render: () => ({
    setup: () => ({ sections: SECTIONS, failCount, rowCount, chip: CHIP }),
    template: TEMPLATE,
  }),
}
