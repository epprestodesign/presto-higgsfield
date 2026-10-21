// Storybook Overview banner backdrop (Higgsfield · Marketing Studio Flare),
// in the homepage's airy look. Real prototype screenshots are composited on
// top in the docs — the image itself carries no UI or text.
//
//   node scripts/hf-generate-docs-banner.mjs [--estimate] [--force]
// Afterwards: node scripts/optimize-generated.mjs brand-studio/src/docs/assets/overview/generated
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, manifestAt } from './lib/hf.mjs'

const RULES = 'Ultra-wide 21:9 website banner background. Bright, airy, sunlit and soft; gentle shallow depth of field; calm, low-detail light area on the left third for overlaid headline text; nothing important in the center or right where product screenshots will be placed. Photoreal. No people in focus, no faces, no text, no letters, no logos, no signage, no screens, no devices.'
const JOBS = [
  { id: 'banner-atrium', prompt: 'Modern hotel atrium lobby in soft morning light, white stone floors, pale wood, tall windows with sheer curtains, a few green plants, warm white and very pale blue tones, dreamy soft bokeh.' },
  { id: 'banner-arrival', prompt: 'Sunlit entrance terrace of a modern resort hotel at golden morning hour, rolling suitcases softly out of focus, potted olive trees, pale stone and warm white tones, hazy soft light, airy.' },
]

const args = process.argv.slice(2)
const DIR = path.join(ROOT, 'brand-studio/src/docs/assets/overview/generated')
fs.mkdirSync(DIR, { recursive: true })
const manifest = manifestAt(DIR)
const input = (j) => ({ prompt: `${j.prompt} ${RULES}`, aspect_ratio: '21:9', resolution: '2k', quality: 'high', enhance_prompt: false })
const jobs = JOBS.filter((j) => args.includes('--force') || !manifest.list.some((m) => m.id === j.id))

if (args.includes('--estimate')) {
  for (const j of jobs) console.log(j.id, JSON.stringify(await estimate(MODELS.flare, input(j))).slice(0, 120))
  process.exit(0)
}
await pool(jobs, async (j) => {
  const sub = await submit(MODELS.flare, input(j))
  const done = await waitFor(sub.request_id)
  if (done.status !== 'completed' || !done.images?.length) return console.log(`  ✗ ${j.id}: ${done.status}`)
  fs.writeFileSync(path.join(DIR, `${j.id}.png`), Buffer.from(await (await fetch(done.images[0].url)).arrayBuffer()))
  manifest.upsert({ id: j.id, file: `${j.id}.png`, kind: 'photo', model: MODELS.flare, prompt: input(j).prompt, requestId: sub.request_id, createdAt: new Date().toISOString() })
  manifest.save()
  console.log(`  ✓ ${j.id}`)
})
