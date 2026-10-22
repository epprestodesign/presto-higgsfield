// Generate the concept imagery for homepage Option D ("Presto for Organizers",
// Storybook: Brand Studio/Marketing Site/Option D · For Organizers) with the
// Higgsfield API. Everything is fictional.
//
//   poster-*   Ideogram 4.0 — square event posters / org tiles with lettering
//              (fictional names) for the hero collage + org badges
//   avatar-*   Recraft V4.1 — flat illustrated (non-photoreal) organizer portraits
//   scene-*    Marketing Studio Flare — no-text scene backgrounds behind the phones
//
//   node scripts/hf-generate-option-d.mjs --estimate     # free
//   node scripts/hf-generate-option-d.mjs                # all missing
//   node scripts/hf-generate-option-d.mjs --only scene-lobby,poster-cup
//   node scripts/hf-generate-option-d.mjs --force
//
// Afterwards: node scripts/optimize-generated.mjs brand-studio/src/assets/marketing/option-d/generated
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, manifestAt } from './lib/hf.mjs'

const POSTER_RULES = 'Square flat graphic poster tile, bold and joyful, full-bleed color with no border and no mockup, crisp vector shapes, perfectly spelled lettering exactly as written and no other text, no watermark.'
const AVATAR_RULES = 'Flat vector illustration portrait, stylized and clearly illustrated (not a photo), head and shoulders, centered, friendly expression, simple shapes, soft solid pastel background, no text.'
const SCENE_RULES = [
  'Wide photographic background, softly lit, calm and uncluttered in the center where a phone mockup will sit.',
  'No people as a focal point, no faces in focus.',
  'No text, no letters, no numbers, no logos, no signage, no watermarks.',
].join(' ')

const ideogram = (prompt) => ({ prompt: `${prompt} ${POSTER_RULES}`, aspect_ratio: '1:1', rendering_speed: 'QUALITY' })
const recraft = (prompt) => ({ prompt: `${prompt} ${AVATAR_RULES}`, aspect_ratio: '1:1', resolution: '1k', output_format: 'png' })
const flare = (prompt) => ({ prompt: `${prompt} ${SCENE_RULES}`, aspect_ratio: '16:9', resolution: '2k', quality: 'high', enhance_prompt: false })

export const TASKS = [
  // Hero collage posters (fictional orgs)
  { id: 'poster-cup', model: MODELS.ideogram, kind: 'poster', input: ideogram('Youth soccer tournament poster reading "PRAIRIE CUP" with a big bouncing soccer ball, cobalt blue and lime green, playful retro sports type.') },
  { id: 'poster-reunion', model: MODELS.ideogram, kind: 'poster', input: ideogram('Family reunion poster reading "Okafor Reunion" in warm hand-lettered script with sunflowers and a picnic blanket pattern, marigold, coral and teal.') },
  { id: 'poster-summit', model: MODELS.ideogram, kind: 'poster', input: ideogram('Tech conference poster reading "NORTHSTAR SUMMIT" with a glowing star and geometric grid, deep indigo with electric violet and peach accents.') },
  { id: 'poster-crew', model: MODELS.ideogram, kind: 'poster', input: ideogram('Construction crew lodging tile reading "IRONLINE CREW" with a stylized steel beam and hard hat icon, safety orange and charcoal, bold industrial stencil type.') },
  { id: 'poster-wedding', model: MODELS.ideogram, kind: 'poster', input: ideogram('Wedding weekend poster reading "Mara & Theo" in elegant serif with dried florals and a sun arch, blush pink, sage and cream.') },
  { id: 'poster-fest', model: MODELS.ideogram, kind: 'poster', input: ideogram('Music festival poster reading "SALT FLATS FEST" with a desert sunset and sound waves, hot pink, tangerine and deep purple, groovy 70s type.') },
  // Illustrated organizer portraits (clearly fictional)
  { id: 'avatar-coach', model: MODELS.recraft, kind: 'avatar', input: recraft('A cheerful youth soccer coach with a whistle and a cap, warm brown skin, mint green background.') },
  { id: 'avatar-planner', model: MODELS.recraft, kind: 'avatar', input: recraft('A confident conference planner with glasses and a blazer, short silver hair, lavender background.') },
  { id: 'avatar-host', model: MODELS.recraft, kind: 'avatar', input: recraft('A smiling family reunion organizer with curly hair and a sunflower pin, peach background.') },
  // Scene backgrounds behind the phone mockups (feature rows)
  { id: 'scene-lobby', model: MODELS.flare, kind: 'scene', input: flare('Modern boutique hotel lobby at dusk, warm pendant lights, soft bokeh, pastel lavender and amber tones.') },
  { id: 'scene-stadium', model: MODELS.flare, kind: 'scene', input: flare('Empty youth soccer stadium at golden hour seen from the stands, soft haze, pastel sky with lilac and peach clouds.') },
  { id: 'scene-hall', model: MODELS.flare, kind: 'scene', input: flare('Bright convention center atrium with tall glass windows and soft morning light, airy mint and sky blue tones.') },
  { id: 'scene-waterfront', model: MODELS.flare, kind: 'scene', input: flare('Calm waterfront promenade near hotels at sunset, gentle pastel pink and blue sky reflecting on the water.') },
]

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const args = process.argv.slice(2)
  const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] || '' : '')
  const ONLY = flag('--only').split(',').filter(Boolean)
  const ESTIMATE = args.includes('--estimate')
  const FORCE = args.includes('--force')

  const DIR = path.join(ROOT, 'brand-studio/src/assets/marketing/option-d/generated')
  fs.mkdirSync(DIR, { recursive: true })
  const manifest = manifestAt(DIR)

  const jobs = TASKS.filter((t) => (!ONLY.length || ONLY.includes(t.id)) && (FORCE || !manifest.list.some((m) => m.id === t.id)))
  console.log(`${ESTIMATE ? 'Estimating' : 'Generating'} ${jobs.length} Option D images…`)

  if (ESTIMATE) {
    let credits = 0
    let tokenPriced = 0
    for (const j of jobs) {
      try {
        const e = await estimate(j.model, j.input)
        if (e.credits) credits += Number(e.credits)
        else tokenPriced++
      } catch (err) {
        console.log(`  ✗ ${j.id}: ${err.message}`)
      }
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
      // kind 'abstract' → optimize-generated resizes to 1536px (posters / avatars); scenes stay 2400px.
      manifest.upsert({ id: j.id, file: `${j.id}.png`, kind: j.kind === 'scene' ? 'photo' : 'abstract', role: j.kind, model: j.model, prompt: j.input.prompt, requestId: sub.request_id, createdAt: new Date().toISOString() })
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
