// Desktop wallpaper behind the Studio's Chrome-framed live preview, generated
// with the Higgsfield API (Recraft V4.1). Two calm, light options; the first
// is used by DevicePreview's `backdrop` mode.
//
//   node scripts/hf-generate-studio-backdrop.mjs [--estimate] [--force]
// Afterwards: node scripts/optimize-generated.mjs brand-studio/src/assets/studio/generated
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, manifestAt } from './lib/hf.mjs'

const RULES = 'Ultra-wide desktop wallpaper. Calm, minimal, low contrast, mostly soft empty space so a browser window in front stays the focus. No text, no letters, no logos, no UI, no devices, no people.'
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))
const JOBS = [
  { id: 'wallpaper-lavender', prompt: 'Soft abstract wallpaper of large flowing translucent silk ribbons in pale lavender, periwinkle blue and warm white, gentle diffused light, subtle depth, macOS-style.', colors: ['#EEF0FF', '#C9CFF5', '#9AA6E8', '#FFFFFF'] },
  { id: 'wallpaper-dune', prompt: 'Soft abstract wallpaper of smooth layered dunes in pale sand, mist blue and warm white, gentle gradient light, serene and airy, macOS-style.', colors: ['#F5F1EA', '#DCE4EE', '#B8C6DA', '#FFFFFF'] },
]

const args = process.argv.slice(2)
const DIR = path.join(ROOT, 'brand-studio/src/assets/studio/generated')
fs.mkdirSync(DIR, { recursive: true })
const manifest = manifestAt(DIR)
const input = (j) => ({ prompt: `${j.prompt} ${RULES}`, aspect_ratio: '2:1', resolution: '1k', output_format: 'png', colors: j.colors.map((h) => ({ rgb: rgb(h) })), background_color: { rgb: rgb(j.colors[0]) } })
const jobs = JOBS.filter((j) => args.includes('--force') || !manifest.list.some((m) => m.id === j.id))

if (args.includes('--estimate')) {
  let credits = 0
  for (const j of jobs) credits += Number((await estimate(MODELS.recraft, input(j))).credits || 0)
  console.log(`${jobs.length} wallpapers · ${credits.toFixed(2)} credits`)
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
