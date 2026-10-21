// Creative-direction theme art (Concepts step cards), generated with Higgsfield
// by scripts/hf-generate-directions.mjs — three passes, reviewed in Storybook
// (Brand Studio/Creative Concepts/Direction Themes).
import manifest from './generated/manifest.json'

const files = import.meta.glob('./generated/*.jpg', { eager: true, query: '?url', import: 'default' })

const PASS_ORDER = ['a', 'b', 'c']

/** { a: { id, name, art: { signature, energy, premium } }, … } */
export const DIRECTION_THEMES = Object.fromEntries(
  PASS_ORDER.map((id) => {
    const entries = manifest.filter((m) => m.pass === id)
    const art = Object.fromEntries(entries.map((m) => [m.direction, files[`./generated/${m.file}`]]).filter(([, src]) => src))
    return [id, { id, name: entries[0]?.passName || id.toUpperCase(), art }]
  }).filter(([, t]) => Object.keys(t.art).length),
)

// Proposed pass (Light & place) — swap here once a theme is approved.
export const DEFAULT_DIRECTION_THEME = 'b'
