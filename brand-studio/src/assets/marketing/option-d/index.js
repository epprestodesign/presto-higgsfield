// Homepage Option D concept imagery, generated with Higgsfield by
// scripts/hf-generate-option-d.mjs (Ideogram 4.0 posters, Recraft V4.1
// illustrated portraits, Marketing Studio Flare scenes). All fictional.
import manifest from './generated/manifest.json'

const files = import.meta.glob('./generated/*.jpg', { eager: true, query: '?url', import: 'default' })

/** id → URL, e.g. OPTION_D_ART['poster-cup'] */
export const OPTION_D_ART = Object.fromEntries(
  manifest.map((m) => [m.id, files[`./generated/${m.file}`]]).filter(([, src]) => src),
)

/** id → { model, role } for credits / docs. */
export const OPTION_D_META = Object.fromEntries(manifest.map((m) => [m.id, { model: m.model, role: m.role }]))
