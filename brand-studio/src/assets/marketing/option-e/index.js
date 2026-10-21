// Homepage Option E lifestyle mosaic, generated with Higgsfield by
// scripts/hf-generate-option-e.mjs (Marketing Studio Flare). All fictional.
import manifest from './generated/manifest.json'

const files = import.meta.glob('./generated/*.jpg', { eager: true, query: '?url', import: 'default' })

/** id → URL, e.g. OPTION_E_ART['tile-team'] */
export const OPTION_E_ART = Object.fromEntries(
  manifest.map((m) => [m.id, files[`./generated/${m.file}`]]).filter(([, src]) => src),
)
