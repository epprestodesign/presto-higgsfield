// "Optimize prompt": turn an organizer's short brief into the long, specific,
// structured prompt image models reward. Runs locally, no credits: it names
// the scene, adds camera, lighting, colour grade and finish, writes in what the
// reference images look like, applies the Presto composition rules, and ends
// with an explicit avoid list. Every addition is reported back as a "change".
import { extractPalette, hexToRgb, luminance } from './pixels.js'

// ── Reference analysis ────────────────────────────────────────────────────

const rgbToHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

/** Plain-English name for a colour ("deep navy", "warm orange", "charcoal"). */
export function colorName(hex) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex))
  if (s < 0.12) return l < 0.12 ? 'black' : l < 0.3 ? 'charcoal' : l < 0.7 ? 'grey' : l < 0.92 ? 'light grey' : 'white'
  if (l > 0.8 && h >= 25 && h < 65) return 'cream'
  const hue = h < 15 || h >= 345 ? 'red' : h < 40 ? 'orange' : h < 65 ? 'gold' : h < 90 ? 'lime' : h < 160 ? 'green' : h < 190 ? 'teal' : h < 215 ? 'sky blue' : h < 250 ? 'blue' : h < 280 ? 'indigo' : h < 320 ? 'purple' : 'magenta'
  const shade = l < 0.22 ? (hue === 'blue' || hue === 'indigo' ? 'deep navy' : `deep ${hue}`) : l < 0.4 ? `dark ${hue}` : l > 0.75 ? `pale ${hue}` : s > 0.7 ? `vivid ${hue}` : hue
  return shade.replace('deep deep', 'deep')
}

/**
 * What a reference image looks like, from its pixels (pass a downscaled copy).
 * @returns { colors, brightness, saturation, temperature, kind }
 */
export function analyzeReference(img) {
  const { data } = img
  let lum = 0, sat = 0, warm = 0, n = 0
  const distinct = new Set()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const rgb = [data[i], data[i + 1], data[i + 2]]
    const [, s] = rgbToHsl(rgb)
    lum += luminance(...rgb)
    sat += s
    warm += (rgb[0] - rgb[2]) / 255
    distinct.add((rgb[0] >> 3) << 10 | (rgb[1] >> 3) << 5 | (rgb[2] >> 3))
    n++
  }
  if (!n) return null
  lum /= n; sat /= n; warm /= n
  return {
    colors: extractPalette(img, 4).map((c) => c.hex),
    brightness: lum < 0.08 ? 'dark' : lum < 0.3 ? 'mid' : 'bright',
    saturation: sat < 0.22 ? 'muted' : sat < 0.5 ? 'balanced' : 'vivid',
    temperature: warm > 0.08 ? 'warm' : warm < -0.06 ? 'cool' : 'neutral',
    // Flat graphics use a handful of colours. Dark, soft photos also use few,
    // so only call it a graphic when it's clearly flat.
    kind: distinct.size < 150 ? 'graphic' : 'photo',
  }
}

// ── Scene vocabulary ──────────────────────────────────────────────────────

const SCENES = [
  { k: /volleyball/, scene: 'an indoor volleyball arena: the net stretching across the frame in a long diagonal, polished court floor, arena lights overhead' },
  { k: /basketball/, scene: 'a basketball arena: hardwood court with glossy reflections, hoops and backboards at the far edges, stands rising into shadow' },
  { k: /soccer|futbol|fútbol/, scene: 'a soccer stadium: striped green pitch, goal nets at the edges, floodlit stands' },
  { k: /football|gridiron/, scene: 'an American football stadium: green field with yard lines, goal posts at the edges, packed stands under floodlights' },
  { k: /baseball|softball/, scene: 'a baseball park: infield dirt and green outfield, foul poles at the edges, stadium lights' },
  { k: /hockey/, scene: 'an ice hockey rink: glossy ice with blue and red lines, boards and glass, arena lights' },
  { k: /tennis|pickleball/, scene: 'a tennis court: clean court lines, net across the frame, stadium seating beyond' },
  { k: /swim|aquatic|diving/, scene: 'an indoor aquatic center: lane lines across a calm pool, light patterns on the water' },
  { k: /run|marathon|track|5k|10k|race/, scene: 'a city race course: an open road with motion blur, barricades and banners out of focus at the edges' },
  { k: /wrestl|gymnast|cheer|dance/, scene: 'a competition arena: mat or floor under spotlights, empty stands fading into darkness' },
  { k: /golf/, scene: 'a golf course at dawn: rolling fairway, flag on a distant green' },
  { k: /lacrosse|rugby|field hockey/, scene: 'a sports field under floodlights: turf lines and goals at the edges' },
  { k: /conference|summit|expo|keynote|tech|convention/, scene: 'a modern conference hall: a wide stage with soft LED light, audience silhouettes, light haze' },
  { k: /wedding|bridal/, scene: 'an elegant wedding venue: soft florals and draped fabric at the edges, warm candle glow' },
  { k: /graduat|commencement|campus|school|college|university/, scene: 'a university campus: stately buildings and trees at the edges, open quad, gentle light' },
  { k: /concert|music|festival|band/, scene: 'a concert stage: light beams cutting through haze, crowd silhouettes at the bottom edges' },
  { k: /camp|outdoor|lake|mountain|forest|trail/, scene: 'an outdoor landscape: pine forest and lake at the edges, open sky, distant mountains' },
  { k: /reunion|family|gala|party|celebration/, scene: 'a celebration venue: string lights and soft bokeh, tables and guests out of focus at the edges' },
]

const COLOUR_WORDS = /\b(blue|navy|red|crimson|maroon|green|teal|gold|yellow|orange|purple|violet|pink|black|white|silver|grey|gray|cream|beige|brown|monochrome|neon)\b/

const LIGHT = [
  { k: /light(s|ing)? (coming )?from the (left|right)|(left|right)[- ]side light/, light: (t) => `strong directional light from the ${/left/.test(t) ? 'left' : 'right'}, glowing at that edge and falling off into darkness toward the center` },
  { k: /night|floodlit|under (the )?lights|stadium lights/, light: 'night under bright floodlights, strong rim light and light flares at the edges, deep shadows elsewhere' },
  { k: /golden|sunset|sunrise|dusk|dawn/, light: 'golden hour sunlight raking across the scene, long soft shadows, warm glow' },
  { k: /dramatic|moody|dark/, light: 'dramatic low-key lighting with pools of light and deep shadows' },
  { k: /bright|sunny|day/, light: 'bright natural daylight, crisp and clear, softened toward the center' },
]

const MOOD_LIGHT = {
  energetic: 'dynamic light beams and subtle motion blur',
  premium: 'moody low-key lighting with refined highlights',
  calm: 'soft, even, diffused light',
  bold: 'high-contrast lighting with strong edge light',
  celebratory: 'warm glowing light with soft bokeh highlights',
  'family-friendly': 'warm, friendly natural light',
}

const CAMERA = {
  photo: 'Panoramic photograph on a full-frame camera with a 24mm wide-angle lens at eye level; shallow depth of field so the center falls into soft focus.',
  abstract: 'Flat, vector-like graphic: layered sweeping lines, halftone dot gradients and soft geometric shapes with fine grain; no photography.',
  illustration: 'Clean modern editorial illustration with flat shapes, gentle gradients and subtle paper texture.',
}

const FINISH = {
  photo: 'Cinematic colour grading, high dynamic range, fine film grain, sharp detail at the edges, professional advertising quality.',
  abstract: 'Smooth gradients, crisp edges, print-quality detail, no noise or banding.',
  illustration: 'Crisp edges, consistent line weight, polished agency-quality finish.',
}

const AVOID = 'Avoid: any text, letters, numbers, logos, jersey numbers, signage, watermarks, borders or frames; faces in sharp focus; bright highlights or busy detail in the center.'

/**
 * @param brief { description, style, moods[], palette[], usePalette, references: [analysis] }
 * @returns { prompt, sections: [{ label, text }], changes: string[] }
 */
export function optimizePrompt({ description = '', style = 'photo', moods = [], palette = [], usePalette = true, references = [] } = {}) {
  const words = description.trim().replace(/\s+/g, ' ')
  const lower = words.toLowerCase()
  const refs = references.filter(Boolean)
  const changes = []
  const sections = []

  // Scene: the organizer's words first, then the named setting we recognised.
  const scene = SCENES.find((s) => s.k.test(lower))
  const subject = [words && `${words.replace(/[.!]+$/, '')}.`, scene && `Setting: ${scene.scene}.`].filter(Boolean).join(' ')
  if (scene) changes.push('Named the setting in detail')
  sections.push({ label: 'Scene', text: subject || 'A minimal, system-safe event background.' })

  sections.push({
    label: 'Composition',
    text: 'Ultra-wide 21:9 banner. Main subject and detail toward the left and right edges; a calm, uncluttered, darker center for a centered logo and headline; everything important inside the middle horizontal band so it also crops to a 6:1 strip.',
  })
  changes.push('Applied the Presto composition (calm center, safe band)')

  sections.push({ label: 'Camera', text: CAMERA[style] || CAMERA.photo })
  changes.push(style === 'photo' ? 'Added camera and lens' : 'Described the graphic technique')

  const lit = LIGHT.find((l) => l.k.test(lower))
  const light = (lit && (typeof lit.light === 'function' ? lit.light(lower) : lit.light))
    || (refs.length && refs.filter((r) => r.brightness === 'dark').length > refs.length / 2 && 'low-key lighting like the references: dark overall with selective highlights')
    || moods.map((m) => MOOD_LIGHT[m.toLowerCase()]).filter(Boolean).join(', ')
    || 'soft directional light from the sides, darker toward the center'
  if (style !== 'abstract') { sections.push({ label: 'Lighting', text: `${light[0].toUpperCase()}${light.slice(1)}.` }); changes.push('Added lighting') }

  // Colour: the organizer's own colour words win; then brand palette and what
  // the references actually look like.
  const saidColour = COLOUR_WORDS.test(lower)
  const brand = [...new Set(usePalette ? palette.slice(0, 3).map(colorName) : [])]
  const refColors = [...new Set(refs.flatMap((r) => r.colors.slice(0, 2)).map(colorName))].slice(0, 3)
  const temp = refs.length ? majority(refs.map((r) => r.temperature)) : null
  const sat = refs.length ? majority(refs.map((r) => r.saturation)) : null
  const colourBits = [
    saidColour && 'the colours described above',
    brand.length && (saidColour ? `brand colours ${list(brand)} only as subtle accents` : `brand colours ${list(brand)}`),
    refColors.length && `tones from the references (${list(refColors)})`,
    temp && temp !== 'neutral' && `a ${temp} overall cast`,
  ].filter(Boolean)
  sections.push({
    label: 'Colour',
    text: [
      colourBits.length && `Led by ${list(colourBits)}.`,
      `${sat === 'vivid' ? 'Rich but controlled saturation' : 'Muted, slightly desaturated'}; dark overall with deep shadows${moods.length ? `; mood: ${list(moods.map((m) => m.toLowerCase()))}` : ''}.`,
    ].filter(Boolean).join(' '),
  })
  if (brand.length) changes.push(saidColour ? 'Kept your colours first, brand colours as accents' : 'Named your brand colours')
  if (refs.length) changes.push(`Described ${refs.length === 1 ? 'the reference' : `the ${refs.length} references`} (colour, light, ${temp || 'tone'})`)

  if (refs.length) {
    const kind = majority(refs.map((r) => r.kind))
    sections.push({ label: 'References', text: `Follow the attached ${kind === 'graphic' ? 'graphic ' : ''}reference ${refs.length > 1 ? 'images' : 'image'} for setting, colour and mood; do not copy their text, logos or exact layout.` })
  }

  sections.push({ label: 'Finish', text: FINISH[style] || FINISH.photo })
  changes.push('Added finish and quality')
  sections.push({ label: 'Avoid', text: AVOID.replace('Avoid: ', '') })
  changes.push('Added an explicit avoid list')

  const prompt = sections.map((s) => `${s.label}: ${s.text}`).join('\n')
  return { prompt, sections, changes }
}

const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
function majority(xs) {
  const c = {}
  xs.forEach((x) => { c[x] = (c[x] || 0) + 1 })
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || null
}
