// Storybook Overview "On mobile" step illustrations (Higgsfield · Recraft V4.1):
// six flat spot illustrations in one style and palette, one per workflow step.
//
//   node scripts/hf-generate-docs-illustrations.mjs [--estimate] [--only id,id] [--force]
// Afterwards: node scripts/optimize-generated.mjs brand-studio/src/docs/assets/overview/illustrations
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, manifestAt } from './lib/hf.mjs'

const STYLE = 'Minimal flat vector spot illustration, soft rounded geometric shapes, gentle long shadows, a smartphone as the hero object held at a slight angle, centered on a plain very pale lavender background with generous empty margin. Palette strictly deep navy, violet, soft lavender, white and a touch of warm coral. Friendly, modern product-marketing style, consistent line weight. Absolutely no text, no letters, no numbers, no words, no logos, no UI copy — use simple shapes and icons only.'
const PALETTE = ['#01113E', '#7C3AED', '#C4B5FD', '#F3F0FF', '#FF7A59']
export const STEPS = [
  { id: 'step-1-home', prompt: 'A smartphone showing a large rounded input pill with a link chain icon and a glowing magic sparkle wand tapping it, small floating globe icon.' },
  { id: 'step-2-intake', prompt: 'A smartphone showing a simple form of three rounded field bars with a calendar icon, a map pin icon and a check badge, a tap ripple on one field.' },
  { id: 'step-3-brand', prompt: 'A smartphone surrounded by a floating color palette of round swatches, a paint brush and a shield-shaped badge emblem, suggesting a brand kit being scanned.' },
  { id: 'step-4-concepts', prompt: 'A smartphone with a fanned stack of three wide banner cards rising out of it, one card highlighted with a star, sparkles around.' },
  { id: 'step-5-studio', prompt: 'A smartphone showing an editor: slider controls and toggles in a bottom sheet, a small mountain-photo placeholder and a color dot, a hand cursor adjusting a slider.' },
  { id: 'step-6-publish', prompt: 'A smartphone with a big check mark badge and a share arrow, small confetti and a paper plane flying away, celebratory.' },
]

const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))
const input = (s) => ({ prompt: `${s.prompt} ${STYLE}`, aspect_ratio: '1:1', resolution: '1k', output_format: 'png', colors: PALETTE.map((h) => ({ rgb: rgb(h) })), background_color: { rgb: rgb('#F3F0FF') } })

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const args = process.argv.slice(2)
  const only = (args.includes('--only') ? args[args.indexOf('--only') + 1] : '').split(',').filter(Boolean)
  const DIR = path.join(ROOT, 'brand-studio/src/docs/assets/overview/illustrations')
  fs.mkdirSync(DIR, { recursive: true })
  const manifest = manifestAt(DIR)
  const jobs = STEPS.filter((s) => (!only.length || only.includes(s.id)) && (args.includes('--force') || !manifest.list.some((m) => m.id === s.id)))
  if (args.includes('--estimate')) {
    let c = 0
    for (const j of jobs) c += Number((await estimate(MODELS.recraft, input(j))).credits || 0)
    console.log(`${jobs.length} illustrations · ${c.toFixed(2)} credits`)
    process.exit(0)
  }
  await pool(jobs, async (j) => {
    const sub = await submit(MODELS.recraft, input(j))
    const done = await waitFor(sub.request_id)
    if (done.status !== 'completed' || !done.images?.length) return console.log(`  ✗ ${j.id}: ${done.status}`)
    fs.writeFileSync(path.join(DIR, `${j.id}.png`), Buffer.from(await (await fetch(done.images[0].url)).arrayBuffer()))
    manifest.upsert({ id: j.id, file: `${j.id}.png`, kind: 'abstract', model: MODELS.recraft, prompt: input(j).prompt, requestId: sub.request_id, createdAt: new Date().toISOString() })
    manifest.save()
    console.log(`  ✓ ${j.id}`)
  })
}
