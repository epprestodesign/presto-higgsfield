// Generate every vertical example's logo + banners with the Higgsfield API, from
// brand-studio/src/data/verticals/catalog.js (one source of truth).
//
//   node scripts/hf-generate-verticals.mjs --estimate            # free
//   node scripts/hf-generate-verticals.mjs                       # all missing assets
//   node scripts/hf-generate-verticals.mjs --only esports,camps  # specific verticals
//   node scripts/hf-generate-verticals.mjs --kinds logo,photo    # subset of assets
//   node scripts/hf-generate-verticals.mjs --force               # regenerate existing
//
// Per vertical: logo (Ideogram 4.0 emblem) · photo + photo2 (Marketing Studio
// 2.5 Flare) · abstract (Recraft V4.1 on the brand palette). Afterwards run:
//   node scripts/recut-logos.mjs && node scripts/optimize-generated.mjs
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, bannerInput, logoInput, manifestAt } from './lib/hf.mjs'
import { VERTICALS } from '../brand-studio/src/data/verticals/catalog.js'

const args = process.argv.slice(2)
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] || '' : '')
const ONLY = flag('--only').split(',').filter(Boolean)
const KINDS = (flag('--kinds') || 'logo,photo,photo2,abstract').split(',')
const ESTIMATE = args.includes('--estimate')
const FORCE = args.includes('--force')

const IMG_DIR = path.join(ROOT, 'brand-studio/src/assets/imagery/generated')
const LOGO_DIR = path.join(ROOT, 'brand-studio/src/assets/logos/generated')
fs.mkdirSync(IMG_DIR, { recursive: true })
fs.mkdirSync(LOGO_DIR, { recursive: true })
const images = manifestAt(IMG_DIR)
const logos = manifestAt(LOGO_DIR)

const verticals = VERTICALS.filter((v) => v.prompts && (!ONLY.length || ONLY.includes(v.id)))
const jobs = []
for (const v of verticals) {
  const palette = [v.colors.primary, v.colors.secondary, v.colors.accent]
  for (const kind of KINDS) {
    if (kind === 'logo') {
      if (!FORCE && logos.list.some((m) => m.id === v.id)) continue
      jobs.push({ v, kind, id: v.id, model: MODELS.ideogram, input: logoInput(v.prompts.logo), alt: `${v.event.name} logo` })
    } else {
      const id = `${v.id}-${kind}`
      if (!FORCE && images.list.some((m) => m.id === id)) continue
      const model = kind === 'abstract' ? (v.abstractModel === 'flare' ? MODELS.flare : MODELS.recraft) : MODELS.flare
      jobs.push({ v, kind, id, model, input: bannerInput(model, v.prompts[kind], { palette }), alt: `${v.label}: ${v.prompts[kind].split(',')[0].toLowerCase()}` })
    }
  }
}

console.log(`${ESTIMATE ? 'Estimating' : 'Generating'} ${jobs.length} assets for ${verticals.length} verticals…`)
if (ESTIMATE) {
  let credits = 0
  let tokenPriced = 0
  for (const j of jobs) {
    const e = await estimate(j.model, j.input)
    if (e.credits) credits += Number(e.credits)
    else tokenPriced++
  }
  console.log(`  fixed-price: ${credits.toFixed(2)} credits · token-priced (Flare, settled on completion): ${tokenPriced} images`)
  process.exit(0)
}

let ok = 0
let failed = 0
await pool(jobs, async (j) => {
  try {
    const sub = await submit(j.model, j.input)
    const done = await waitFor(sub.request_id)
    if (done.status !== 'completed' || !done.images?.length) { failed++; return console.log(`  ✗ ${j.id}: ${done.status} ${done.error || ''}`) }
    const buf = Buffer.from(await (await fetch(done.images[0].url)).arrayBuffer())
    const meta = { model: j.model, prompt: j.input.prompt, requestId: sub.request_id, createdAt: new Date().toISOString() }
    if (j.kind === 'logo') {
      fs.writeFileSync(path.join(LOGO_DIR, `${j.id}-raw.png`), buf)
      logos.upsert({ id: j.id, file: `${j.id}.png`, raw: `${j.id}-raw.png`, alt: j.alt, vertical: j.v.id, ...meta })
      logos.save()
    } else {
      fs.writeFileSync(path.join(IMG_DIR, `${j.id}.png`), buf)
      images.upsert({ id: j.id, file: `${j.id}.png`, event: j.v.id, vertical: j.v.id, kind: j.kind === 'abstract' ? 'abstract' : 'photo', alt: j.alt, ...meta })
      images.save()
    }
    ok++
    console.log(`  ✓ ${j.id} (${ok}/${jobs.length})`)
  } catch (e) {
    failed++
    console.log(`  ✗ ${j.id}: ${e.message}`)
  }
})
console.log(`Done: ${ok} generated, ${failed} failed.`)
