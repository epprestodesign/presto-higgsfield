// Storybook Overview "On mobile" tiles: minimal skeleton wireframes of each
// workflow screen (Higgsfield · Recraft V4.1), one style and palette.
//
//   node scripts/hf-generate-docs-wireframes.mjs [--estimate] [--only id,id] [--force]
// Afterwards: node scripts/optimize-generated.mjs brand-studio/src/docs/assets/overview/wireframes
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, manifestAt } from './lib/hf.mjs'

const STYLE = 'Minimalist skeleton wireframe of a mobile app screen, seen flat and straight-on, cropped to the top part of the screen. Loading-skeleton style: soft rounded light-grey placeholder bars for text, rounded rectangles for images and inputs, simple circles for avatars and icons, plenty of white space, crisp clean edges, no shadows except very subtle ones. Palette: white, very light cool grey, pale lavender, one small violet accent element. Absolutely no text, no letters, no numbers, no logos, no photos — only abstract placeholder shapes.'
const PALETTE = ['#FFFFFF', '#EEF0F4', '#E4E7EE', '#EDE9FE', '#7C3AED']
export const STEPS = [
  { id: '1-home', prompt: 'A homepage: a thin top nav bar with a small logo circle and a pill button, a large centered two-line headline made of thick grey bars, three short check-mark lines, then a wide rounded input pill with a violet pill button inside it at the right.' },
  { id: '2-intake', prompt: 'A form screen: a step progress bar of four dots at the top, a bold heading bar, two lines of body bars, then an outlined input field box with a label bar, and below it two option cards with a small icon circle each, one card selected with a violet check circle.' },
  { id: '3-brand', prompt: 'A brand kit screen: a heading bar, a row of four round color swatches, an outlined card containing a square logo placeholder on a checkerboard grid, and a second card with two font sample bars of different weights; one violet checkbox.' },
  { id: '4-concepts', prompt: 'A gallery screen: a row of filter pill chips at the top, then a large wide banner card with a dark grey image rectangle and a centered small circle and two centered bars on it, below it a title bar with a heart icon outline, and the edge of a second card.' },
  { id: '5-studio', prompt: 'An editor screen: a top toolbar of small rounded icon buttons and one violet pill button, a dropdown bar and a segmented three-icon control, and below a smaller phone-shaped preview frame showing a dark banner rectangle and grey bars.' },
  { id: '6-demo', prompt: 'A published booking page: a slim banner strip with a small badge pill and a button outline at the top, a nav row with a logo circle and a menu icon, then a large dark banner rectangle with a centered emblem circle and two centered bars, then a stacked search form of three input boxes and a wide violet button.' },
]

const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))
const input = (s) => ({ prompt: `${s.prompt} ${STYLE}`, aspect_ratio: '4:3', resolution: '1k', output_format: 'png', colors: PALETTE.map((h) => ({ rgb: rgb(h) })), background_color: { rgb: rgb('#F7F7FB') } })

const args = process.argv.slice(2)
const only = (args.includes('--only') ? args[args.indexOf('--only') + 1] : '').split(',').filter(Boolean)
const DIR = path.join(ROOT, 'brand-studio/src/docs/assets/overview/wireframes')
fs.mkdirSync(DIR, { recursive: true })
const manifest = manifestAt(DIR)
const jobs = STEPS.filter((s) => (!only.length || only.includes(s.id)) && (args.includes('--force') || !manifest.list.some((m) => m.id === s.id)))
if (args.includes('--estimate')) {
  let c = 0
  for (const j of jobs) c += Number((await estimate(MODELS.recraft, input(j))).credits || 0)
  console.log(`${jobs.length} wireframes · ${c.toFixed(2)} credits`)
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
