// Banner Lab prompt: the organizer's own words, their reference images, and the
// Presto banner standards added automatically (shown to them, not editable).

export const STYLES = [
  { value: 'photo', label: 'Photo', prompt: 'Photorealistic, high detail, professional advertising photography.' },
  { value: 'abstract', label: 'Abstract graphic', prompt: 'Abstract graphic background of soft shapes, lines, halftone or texture; no photography, crisp and vector-like.' },
  { value: 'illustration', label: 'Illustration', prompt: 'Clean modern editorial illustration, flat shapes and subtle texture.' },
]

export const MOODS = ['Energetic', 'Premium', 'Family-friendly', 'Celebratory', 'Calm', 'Bold']

/** The standards every Presto banner meets, in the words sent to the model. */
export const STANDARD_RULES = [
  { id: 'background', label: 'Background only', prompt: 'This is a background: the event logo and headline are placed on top later.' },
  { id: 'center', label: 'Calm, dark center for the logo', prompt: 'Keep the center calm, low-detail and dark enough for a centered white logo and headline to read; put the main subject toward the left and right edges.' },
  { id: 'muted', label: 'Muted and slightly dark', prompt: 'Muted, slightly dark overall, minimal and system-safe.' },
  { id: 'band', label: 'Works as 1440×400 and 1440×240', prompt: 'Keep everything important inside the middle horizontal band so the image also crops to a thin 6:1 strip.' },
  { id: 'notext', label: 'No text, logos or watermarks', prompt: 'No text, no letters, no numbers, no logos, no signage, no watermarks.' },
]

/**
 * @param {object} brief
 *   description  the organizer's own words
 *   style        STYLES value
 *   moods        string[]
 *   references   number of reference images attached
 *   palette      brand hex colours (from the optimized logo)
 *   usePalette   steer colours toward the brand palette
 */
export function buildPrompt({ description = '', style = 'photo', moods = [], references = 0, palette = [], usePalette = true } = {}) {
  const words = description.trim().replace(/\s+/g, ' ')
  const parts = [
    'Wide website hero background banner for the official hotel booking page of an event.',
    words && `The organizer describes it as: "${words}".`,
    references > 0 && `Use the ${references === 1 ? 'attached reference image' : `${references} attached reference images`} for subject, setting, colour and mood only; do not copy any text, logos or watermarks from them.`,
    moods.length && `Mood: ${moods.map((m) => m.toLowerCase()).join(', ')}.`,
    usePalette && palette.length && `Colour palette leaning on the brand colours ${palette.slice(0, 4).join(', ')}.`,
    ...STANDARD_RULES.map((r) => r.prompt),
    (STYLES.find((s) => s.value === style) || STYLES[0]).prompt,
  ]
  return parts.filter(Boolean).join(' ')
}

/** Flare request body. `referenceUrls` are public URLs from the upload route. */
export function flareInput(prompt, referenceUrls, gen) {
  return {
    prompt,
    aspect_ratio: gen.aspectRatio,
    resolution: gen.resolution,
    quality: gen.quality,
    enhance_prompt: false,
    ...(referenceUrls.length ? { image_urls: referenceUrls.slice(0, gen.maxReferences) } : {}),
  }
}
