// Real banner generation for Banner Lab Studio: a chat prompt becomes one
// explicit Higgsfield prompt (the organizer's words first, then scene, light,
// colour and the Presto rules: calm dark center, subject at the edges, no
// text), sent as `count` Flare requests (21:9, 2K) in parallel and polled until
// they finish. Storybook keeps the simulated sets; the standalone app and the
// Vercel site pass this to revise() / makeBanners().
import { hf } from '../providers/higgsfield/client.js'
import { optimizePrompt } from './optimizePrompt.js'
import { flareInput } from './prompt.js'
import { GENERATION } from './standards.js'
import { loadImage, canvasOf } from './canvas.js'

// A follow-up that changes the last set ("make it darker", "more space in the
// center") rather than describing a new scene.
const TWEAK = /^(make|more|less|darker|brighter|lighter|moodier|warmer|cooler|try|add more|remove|keep|give it|it|this|that)\b|\b(it|this one|that one)\b/i

/** The brief for a set: the new words, built on the previous set's brief when it's a tweak. */
export function composeBrief(text, previousBrief = '') {
  const t = text.trim()
  return previousBrief && TWEAK.test(t) ? `${previousBrief.replace(/[.\s]+$/, '')}. Change: ${t}` : t
}

const friendly = (e) => {
  if (e?.status === 401 || e?.code === 'unauthorized') {
    // The server says why (no-token, token-expired, jwk-kid-mismatch…): show it
    // so "but I'm logged in" can be traced.
    return e?.reason && e.reason !== 'no-token'
      ? `We couldn’t verify your session (${e.reason}). Try signing out and back in.`
      : 'You need to be logged in to generate banners.'
  }
  if (e?.code === 'auth_not_configured' || e?.status === 503) return 'Generation isn’t set up on this site yet.'
  if (e?.code === 'concurrency') return 'Higgsfield is busy with other requests. Wait a moment and try again.'
  if (e?.code === 'offline') return 'Couldn’t reach the generation service. Check your connection.'
  return e?.message || 'Higgsfield couldn’t make these banners.'
}

/**
 * @returns {{ brief, prompt, images: string[], errors: string[] }}
 */
/** Higgsfield takes PNG, JPEG or WebP references: redraw anything else (SVG, GIF) as a PNG. */
async function uploadable(src) {
  if (/^data:image\/(png|jpeg|jpg|webp);base64,/.test(src)) return src
  const img = await loadImage(src)
  const scale = Math.min(1, 2048 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height))
  const c = canvasOf(Math.round((img.naturalWidth || img.width) * scale), Math.round((img.naturalHeight || img.height) * scale))
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/png')
}

/** Upload reference images once (shared by every request in the set). */
export async function uploadReferences(references = [], upload = (d) => hf.uploadDataUrl(d)) {
  const urls = []
  for (const r of references.slice(0, GENERATION.maxReferences)) urls.push(await upload(await uploadable(r.src || r)))
  return urls
}

export const REFERENCE_NOTE = 'Use the attached reference images for the venue, mood, light and colour; do not copy any text, logos or people from them.'

export async function generateBanners({ text, previousBrief = '', palette = [], count = 3, references = [], onProgress } = {}) {
  const brief = composeBrief(text, previousBrief)
  let referenceUrls = []
  if (references.length) {
    try { referenceUrls = await uploadReferences(references) } catch (e) {
      return { brief, prompt: '', images: [], errors: [`Couldn’t upload the reference images: ${friendly(e)}`] }
    }
  }
  // A brief that's already structured (the composer's ✨ optimize ran, or a
  // tweak on one) is sent as is; optimizing it again doubled "Scene:".
  const base = /^\s*Scene:/m.test(brief) ? brief : optimizePrompt({ description: brief, palette, usePalette: palette.length > 0 }).prompt
  const prompt = referenceUrls.length ? `${base.trim()}\n${REFERENCE_NOTE}` : base
  const input = flareInput(prompt, referenceUrls, GENERATION)
  let finished = 0
  const one = async () => {
    try {
      const sub = await hf.submit(GENERATION.endpoint, input)
      const done = await hf.waitFor(sub.request_id)
      onProgress?.(++finished, count)
      if (done.status !== 'completed') return { error: done.error || `The request ended as “${done.status}”.` }
      return { urls: (done.images || []).map((i) => i.url).filter(Boolean) }
    } catch (e) {
      onProgress?.(++finished, count)
      return { error: friendly(e) }
    }
  }
  const results = await Promise.all(Array.from({ length: count }, one))
  return {
    brief,
    prompt,
    images: results.flatMap((r) => r.urls || []),
    errors: [...new Set(results.map((r) => r.error).filter(Boolean))],
  }
}
