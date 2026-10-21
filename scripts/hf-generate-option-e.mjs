// Generate the airy lifestyle mosaic for homepage Option E ("Group Booking",
// Storybook: Brand Studio/Marketing Site/Option E - Group Booking) with the
// Higgsfield API — bright, sunlit, photoreal tiles of fictional groups arriving
// at and enjoying hotels. Marketing Studio Flare. Everything is fictional.
//
//   node scripts/hf-generate-option-e.mjs --estimate     # free
//   node scripts/hf-generate-option-e.mjs                # all missing
//   node scripts/hf-generate-option-e.mjs --only tile-team,tile-wedding
//   node scripts/hf-generate-option-e.mjs --force
//
// Afterwards: node scripts/optimize-generated.mjs brand-studio/src/assets/marketing/option-e/generated
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, MODELS, submit, estimate, waitFor, pool, manifestAt } from './lib/hf.mjs'

const TILE_RULES = [
  'Bright, airy, sunlit lifestyle photograph with soft natural light, warm and optimistic, editorial travel photography.',
  'Faces soft, turned away or out of focus; people are never the sharp focal point.',
  'No text, no letters, no numbers, no logos, no brand names, no signage, no watermarks.',
].join(' ')

const flare = (prompt, aspect = '3:4') => ({ prompt: `${prompt} ${TILE_RULES}`, aspect_ratio: aspect, resolution: '2k', quality: 'high', enhance_prompt: false })

export const TASKS = [
  { id: 'tile-team', input: flare('A youth soccer team with matching duffel bags arriving in a bright modern hotel lobby, seen from behind, kids and coach rolling bags across a light marble floor.') },
  { id: 'tile-wedding', input: flare('Wedding guests mingling on a sunny hotel terrace with white linen, champagne glasses and greenery, shot from a distance with shallow depth of field.', '4:3') },
  { id: 'tile-crew', input: flare('A construction crew in hi-vis vests and hard hats under their arms checking in at a hotel front desk at dawn, golden light through tall windows, viewed from behind.') },
  { id: 'tile-conference', input: flare('Conference attendees with lanyards chatting in a bright airy hotel atrium with plants and skylights, blurred motion, morning light.', '4:3') },
  { id: 'tile-reunion', input: flare('A multigenerational family reunion relaxing around a sparkling hotel pool, towels and sun hats, bright summer afternoon, people small in frame.') },
  { id: 'tile-nurses', input: flare('Two travel nurses in scrubs with rolling suitcases walking into a calm, sunlit hotel entrance, viewed from behind, soft morning light.') },
  { id: 'tile-golf', input: flare('A group of friends with golf bags on a resort patio overlooking a green fairway, late afternoon sun, relaxed and candid, faces not visible.', '4:3') },
  { id: 'tile-festival', input: flare('Festival friends laughing on a hotel rooftop at golden hour with string lights and a city skyline softly blurred behind them.') },
  { id: 'tile-room', input: flare('A bright hotel room with crisp white bedding, an open suitcase with a team jersey folded on top, sunlight through sheer curtains, no people.', '4:3') },
  { id: 'tile-arrival', input: flare('A coach bus unloading a cheerful group with luggage at a sunny hotel entrance with palm trees, people small and soft in the frame.') },
  { id: 'tile-breakfast', input: flare('A hotel breakfast terrace with coffee cups, pastries and orange juice on a sunlit table, a group gathering softly blurred in the background.', '4:3') },
]

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const args = process.argv.slice(2)
  const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] || '' : '')
  const ONLY = flag('--only').split(',').filter(Boolean)
  const ESTIMATE = args.includes('--estimate')
  const FORCE = args.includes('--force')

  const DIR = path.join(ROOT, 'brand-studio/src/assets/marketing/option-e/generated')
  fs.mkdirSync(DIR, { recursive: true })
  const manifest = manifestAt(DIR)

  const jobs = TASKS.filter((t) => (!ONLY.length || ONLY.includes(t.id)) && (FORCE || !manifest.list.some((m) => m.id === t.id)))
  console.log(`${ESTIMATE ? 'Estimating' : 'Generating'} ${jobs.length} Option E tiles…`)

  if (ESTIMATE) {
    let credits = 0
    let tokenPriced = 0
    for (const j of jobs) {
      try {
        const e = await estimate(MODELS.flare, j.input)
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
      const sub = await submit(MODELS.flare, j.input)
      const done = await waitFor(sub.request_id)
      if (done.status !== 'completed' || !done.images?.length) { failed++; return console.log(`  ✗ ${j.id}: ${done.status} ${done.error || ''}`) }
      const buf = Buffer.from(await (await fetch(done.images[0].url)).arrayBuffer())
      fs.writeFileSync(path.join(DIR, `${j.id}.png`), buf)
      // kind 'abstract' → optimize-generated resizes to 1536px (plenty for mosaic tiles).
      manifest.upsert({ id: j.id, file: `${j.id}.png`, kind: 'abstract', role: 'tile', aspect: j.input.aspect_ratio, model: MODELS.flare, prompt: j.input.prompt, requestId: sub.request_id, createdAt: new Date().toISOString() })
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
