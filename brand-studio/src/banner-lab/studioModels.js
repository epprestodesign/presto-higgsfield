// Banner Lab Studio — the models the composer offers, what each is best at,
// and the "Auto" smart pick that chooses one from the prompt, the mode and the
// attachments (and says why). Pure, so it's unit-tested.

export const MODELS = [
  {
    id: 'auto',
    name: 'Auto',
    badge: 'Recommended',
    icon: 'rocket_launch',
    summary: 'Picks the best model for your prompt and attachments, and tells you why.',
    bestFor: 'Everything; switch only when you want a specific look',
  },
  {
    id: 'flare',
    name: 'Marketing Studio 2.5 Flare',
    endpoint: 'marketing-studio/image/flare',
    icon: 'photo_camera',
    summary: 'Campaign photography from your logo and reference photos. Up to 16 references, up to 4K.',
    bestFor: 'Photo banners that match reference images',
    speed: 'About 20 s',
    cost: 'Token-priced',
    modes: ['banner'],
  },
  {
    id: 'recraft',
    name: 'Recraft V4.1',
    endpoint: 'recraft/v4.1/text-to-image',
    icon: 'palette',
    summary: 'Locks the image to your brand palette. Graphic, abstract and illustrated backgrounds.',
    bestFor: 'Abstract, on-brand pattern banners',
    speed: 'About 10 s',
    cost: '$0.035 / image',
    modes: ['banner'],
  },
  {
    id: 'recraft-pro',
    name: 'Recraft V4.1 Pro',
    endpoint: 'recraft/v4.1-pro/text-to-image',
    icon: 'diamond',
    summary: 'Recraft with more detail and finer gradients; slower.',
    bestFor: 'Premium abstract banners',
    speed: 'About 25 s',
    cost: 'Higher',
    modes: ['banner'],
  },
  {
    id: 'soul',
    name: 'Higgsfield Soul',
    endpoint: 'higgsfield-ai/soul/standard',
    icon: 'groups',
    summary: 'Natural, editorial photography of people.',
    bestFor: 'Crowds, fans, families and lifestyle scenes',
    speed: 'About 15 s',
    cost: 'Per image',
    modes: ['banner'],
  },
  {
    id: 'ideogram',
    name: 'Ideogram 4.0',
    endpoint: 'ideogram/v4.0',
    icon: 'title',
    summary: 'Typography is the design: renders the headline into the art.',
    bestFor: 'Sponsor ads and promos with text',
    warning: 'Bakes text into the image, which Presto banners avoid (the headline is a live layer).',
    speed: 'About 10 s',
    cost: '$0.03 / image',
    modes: ['banner'],
  },
  {
    id: 'logo-local',
    name: 'Logo cleanup + vector',
    icon: 'auto_fix_high',
    summary: 'Cuts the logo out, traces an SVG and sizes it for every Presto placement. Runs in your browser.',
    bestFor: 'Logo extraction (free, instant)',
    speed: 'Instant',
    cost: 'Free',
    modes: ['logo'],
  },
]

export const getModel = (id) => MODELS.find((m) => m.id === id) || MODELS[0]

const has = (text, re) => re.test(text.toLowerCase())

const TEXT_WORD = String.raw`(?:headlines?|text|typography|lettering|words|titles?|slogans?)`
// Mentions that don't ask for text *in the art*: "no text", "without any
// lettering", and the page's own live text ("so the logo and text stand out").
const NOT_A_TEXT_ASK = [
  new RegExp(String.raw`\b(?:no|without|free of|avoid(?:ing)?|not?)\s+(?:any\s+)?${TEXT_WORD}\b`, 'g'),
  new RegExp(String.raw`\b${TEXT_WORD}[- ]free\b`, 'g'),
  new RegExp(String.raw`\b(?:logo|logos|headline|title)\s+and\s+${TEXT_WORD}\b`, 'g'),
  new RegExp(String.raw`\b${TEXT_WORD}\s+(?:stands?|pops?)\s+out\b`, 'g'),
  new RegExp(String.raw`\b(?:for|behind|under)\s+the\s+${TEXT_WORD}\b`, 'g'),
]
/** True when the prompt asks for text rendered into the image. */
export function wantsText(prompt) {
  const rest = NOT_A_TEXT_ASK.reduce((s, re) => s.replace(re, ' '), prompt.toLowerCase())
  return new RegExp(String.raw`\b(?:${TEXT_WORD}|sponsor ad)\b`).test(rest)
}

/**
 * The Auto pick.
 * @param {{ mode: 'banner'|'logo', prompt: string, references: number, hasLogo: boolean }} input
 * @returns {{ id, reason }}
 */
export function pickModel({ mode = 'banner', prompt = '', references = 0, hasLogo = false } = {}) {
  if (mode === 'logo') return { id: 'logo-local', reason: 'Logo mode: clean-up and vector tracing run in your browser.' }
  if (wantsText(prompt)) {
    return { id: 'ideogram', reason: 'You asked for text in the image; Ideogram renders typography best.' }
  }
  if (references > 0) {
    return { id: 'flare', reason: `You attached ${references} reference${references > 1 ? 's' : ''}; Flare is built to follow them.` }
  }
  if (has(prompt, /\b(abstract|pattern|halftone|gradient|geometric|waves?|shapes|texture|illustrat\w*|vector|minimal graphic)\b/)) {
    return { id: 'recraft', reason: hasLogo ? 'A graphic background; Recraft locks it to your logo’s colours.' : 'A graphic background; Recraft keeps it clean and on palette.' }
  }
  if (has(prompt, /\b(people|crowd|fans|families|family|kids|players|athletes|guests|portrait|team)\b/)) {
    return { id: 'soul', reason: 'People are the subject; Soul makes the most natural photography of them.' }
  }
  return { id: 'flare', reason: 'A photo banner; Flare gives the most polished campaign imagery.' }
}

/** The model a request will actually use (Auto resolved). */
export function resolveModel(selectedId, input) {
  if (selectedId !== 'auto') return { id: selectedId, reason: '' }
  return pickModel(input)
}
