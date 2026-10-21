// Generate the creative-direction theme art (Concepts step → "Creative
// directions" cards) with the Higgsfield API. Three passes × three directions,
// reviewed side by side in Storybook (Brand Studio/Creative Concepts/Direction
// Themes) before one is adopted.
//
//   node scripts/hf-generate-directions.mjs --estimate     # free
//   node scripts/hf-generate-directions.mjs                # all missing
//   node scripts/hf-generate-directions.mjs --only b       # one pass
//   node scripts/hf-generate-directions.mjs --force        # regenerate
//
// Afterwards: node scripts/optimize-generated.mjs brand-studio/src/assets/directions/generated
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, bannerInput, manifestAt } from './lib/hf.mjs'

// Product-level palettes (not a customer's brand): Presto navy, an energetic
// violet/coral, and a warm champagne.
const PALETTES = {
  signature: ['#0B1A4A', '#2B4C9B', '#6E8BD6'],
  energy: ['#2A0E5C', '#7C3AED', '#FF6B5A'],
  premium: ['#EAE3D6', '#C9B48E', '#8C7350'],
}

export const PASSES = [
  {
    id: 'a',
    name: 'Soft gradients',
    model: MODELS.recraft,
    prompts: {
      signature: 'Smooth abstract mesh gradient in deep navy and midnight blue with a soft cool light bloom, calm, trustworthy and corporate, fine matte grain.',
      energy: 'Vivid abstract mesh gradient with flowing blurred light trails in electric violet, magenta and warm coral over deep indigo, a strong sense of motion and energy.',
      premium: 'Soft abstract gradient in warm champagne, ivory and muted gold with silky diffused light, elegant, quiet and luxurious.',
    },
  },
  {
    id: 'b',
    name: 'Light & place',
    model: MODELS.flare,
    prompts: {
      signature: 'Minimal modern hotel lobby architecture, softly out of focus, cool blue evening light, clean lines and calm symmetry, photographic.',
      energy: 'Stadium floodlights at dusk, out-of-focus bokeh, deep blue sky with a warm orange glow, electric game-night atmosphere, photographic.',
      premium: 'Luxury hotel suite detail, soft morning light through sheer curtains, linen and brushed brass tones, shallow depth of field, photographic.',
    },
  },
  {
    id: 'c',
    name: 'Sculpted materials',
    model: MODELS.recraft,
    prompts: {
      signature: 'Folded matte paper sculpture in navy and slate blue, soft studio light, minimal geometric layers, calm and precise.',
      energy: 'Flowing translucent glass ribbons in violet, magenta and coral on a dark indigo background, dynamic sweeping curves, studio lighting.',
      premium: 'Travertine stone and brushed brass surfaces in a minimal still life, warm soft light, refined and luxurious.',
    },
  },
]

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const args = process.argv.slice(2)
  const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] || '' : '')
  const ONLY = flag('--only').split(',').filter(Boolean)
  const ESTIMATE = args.includes('--estimate')
  const FORCE = args.includes('--force')

  const DIR = path.join(ROOT, 'brand-studio/src/assets/directions/generated')
  fs.mkdirSync(DIR, { recursive: true })
  const manifest = manifestAt(DIR)

  const jobs = []
  for (const pass of PASSES.filter((p) => !ONLY.length || ONLY.includes(p.id))) {
    for (const [direction, prompt] of Object.entries(pass.prompts)) {
      const id = `${pass.id}-${direction}`
      if (!FORCE && manifest.list.some((m) => m.id === id)) continue
      jobs.push({ id, pass, direction, model: pass.model, input: bannerInput(pass.model, prompt, { palette: PALETTES[direction] }) })
    }
  }

  console.log(`${ESTIMATE ? 'Estimating' : 'Generating'} ${jobs.length} direction themes…`)
  if (ESTIMATE) {
    let credits = 0
    let tokenPriced = 0
    for (const j of jobs) {
      const e = await estimate(j.model, j.input)
      if (e.credits) credits += Number(e.credits)
      else tokenPriced++
    }
    console.log(`  fixed-price: ${credits.toFixed(2)} credits · token-priced (Flare): ${tokenPriced} images`)
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
      fs.writeFileSync(path.join(DIR, `${j.id}.png`), buf)
      manifest.upsert({ id: j.id, file: `${j.id}.png`, pass: j.pass.id, passName: j.pass.name, direction: j.direction, kind: 'abstract', model: j.model, prompt: j.input.prompt, requestId: sub.request_id, createdAt: new Date().toISOString() })
      manifest.save()
      ok++
      console.log(`  ✓ ${j.id} (${ok}/${jobs.length})`)
    } catch (e) {
      failed++
      console.log(`  ✗ ${j.id}: ${e.message}`)
    }
  })
  console.log(`Done: ${ok} generated, ${failed} failed.`)
}
