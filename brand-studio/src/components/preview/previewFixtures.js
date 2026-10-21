// Story fixtures: plain project objects (no store) for the preview + ad stories.
import { sampleProject } from '../../data/sampleEvents.js'
import { placementsFromPreset } from '../../models/ads.js'
import { conceptsFor } from '../../stories/_helpers.js'

// Concept index per sample (0–5: signature centered/split, energy band/angled,
// premium editorial/framed) — each event shown in its natural direction.
const NATURAL_CONCEPT = { heartland: 2, fintech: 1, wedding: 4, lakeshore: 3 }

/**
 * @param {string} key  sample event
 * @param {object} o
 *   concept   — concept index, or null for the Brand Kit fallback hero
 *   ads       — false to switch ads off
 *   filled    — false = empty slots (dimension placeholders, as in references/102126)
 *   browse / details / landing — AD_LAYOUT_PRESETS ids
 *   mutate    — (project) => void
 */
export function previewProject(key = 'heartland', o = {}) {
  const p = sampleProject(key)
  const items = conceptsFor(p)
  p.concepts.items = items
  const ci = o.concept === undefined ? NATURAL_CONCEPT[key] ?? 0 : o.concept
  p.concepts.selectedId = ci === null ? null : items[ci].id
  if (o.ads === false) p.ads.enabled = false
  else {
    p.ads.enabled = true
    if (!p.ads.sponsors.length && o.filled !== false) p.ads.sponsors = sampleProject('heartland').ads.sponsors
    const ids = o.filled === false ? [] : p.ads.sponsors.map((s) => s.id)
    for (const page of ['landing', 'browse', 'details']) {
      const preset = o[page] || p.ads.presets[page]
      p.ads.presets[page] = preset
      p.ads.placements[page] = placementsFromPreset(page, preset, ids)
    }
  }
  p.pages.checkout.enabled = true
  p.pages.confirmation.enabled = true
  o.mutate?.(p)
  return p
}
