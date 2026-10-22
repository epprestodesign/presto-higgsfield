// Phone shell for the live mobile previews (intake sidebar, Studio mobile),
// generated with the Higgsfield API (Recraft V4.1): a flat, front-on handset
// with no shadow, on pure white with a pure green screen, so
// scripts/key-phone-shell.mjs can key both out to transparency.
//
//   node scripts/hf-generate-phone-shell.mjs [--estimate] [--force]
// Afterwards: node scripts/key-phone-shell.mjs
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, manifestAt } from './lib/hf.mjs'

const RULES = 'Perfectly straight-on orthographic front view, centered, upright, the whole phone visible with generous white margin. The screen is one flat solid pure green (#00FF00) rounded rectangle filling the display edge to edge inside a thin even black bezel: no Dynamic Island, no notch, no camera, no UI, no icons, no reflections or glare on the screen. Perfectly flat plain pure white background. No shadow, no drop shadow, no reflection, no floor, no gradient, no text, no logos, no hands.'
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))
const JOBS = [
  { id: 'phone-graphite', prompt: 'Clean product render of a modern premium smartphone with a slim brushed graphite titanium frame and subtle side buttons.', colors: ['#FFFFFF', '#00FF00', '#2B2D31', '#5A5D63'] },
  { id: 'phone-black', prompt: 'Clean product render of a modern premium smartphone with a slim matte black frame and subtle side buttons.', colors: ['#FFFFFF', '#00FF00', '#111214', '#3A3C40'] },
  { id: 'phone-thin-graphite', prompt: 'Clean product render of a modern premium smartphone with an ultra-thin, barely visible black bezel (a hairline border around the display), a slim natural graphite titanium edge and subtle side buttons. The display reaches almost to the very edge of the phone.', colors: ['#FFFFFF', '#00FF00', '#3A3B3F', '#6B6E74'] },
  { id: 'phone-thin-natural', prompt: 'Clean product render of a modern premium smartphone with an ultra-thin, barely visible black bezel (a hairline border around the display), a slim light natural titanium edge and subtle side buttons. The display reaches almost to the very edge of the phone.', colors: ['#FFFFFF', '#00FF00', '#8E8A84', '#C9C5BF'] },
  { id: 'phone-silver', prompt: 'Clean product render of a modern premium smartphone with a slim polished silver titanium frame and subtle side buttons.', colors: ['#FFFFFF', '#00FF00', '#C9CCD1', '#8E9298'] },
]

const args = process.argv.slice(2)
const DIR = path.join(ROOT, 'brand-studio/src/assets/devices/generated')
fs.mkdirSync(DIR, { recursive: true })
const manifest = manifestAt(DIR)
const input = (j) => ({ prompt: `${j.prompt} ${RULES}`, aspect_ratio: '9:16', resolution: '1k', output_format: 'png', colors: j.colors.map((h) => ({ rgb: rgb(h) })), background_color: { rgb: rgb('#FFFFFF') } })
const jobs = JOBS.filter((j) => args.includes('--force') || !manifest.list.some((m) => m.id === j.id))

if (args.includes('--estimate')) {
  let credits = 0
  for (const j of jobs) credits += Number((await estimate(MODELS.recraft, input(j))).credits || 0)
  console.log(`${jobs.length} phone shells · ${credits.toFixed(2)} credits`)
  process.exit(0)
}
await pool(jobs, async (j) => {
  const sub = await submit(MODELS.recraft, input(j))
  const done = await waitFor(sub.request_id)
  if (done.status !== 'completed' || !done.images?.length) return console.log(`  ✗ ${j.id}: ${done.status}`)
  fs.writeFileSync(path.join(DIR, `${j.id}-raw.png`), Buffer.from(await (await fetch(done.images[0].url)).arrayBuffer()))
  manifest.upsert({ id: j.id, file: `${j.id}-raw.png`, kind: 'device', model: MODELS.recraft, prompt: input(j).prompt, requestId: sub.request_id, createdAt: new Date().toISOString() })
  manifest.save()
  console.log(`  ✓ ${j.id}`)
})
