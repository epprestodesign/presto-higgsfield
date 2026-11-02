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
export async function generateBanners({ text, previousBrief = '', palette = [], count = 3, onProgress } = {}) {
  const brief = composeBrief(text, previousBrief)
  // A brief that's already structured (the composer's ✨ optimize ran, or a
  // tweak on one) is sent as is; optimizing it again doubled "Scene:".
  const prompt = /^\s*Scene:/m.test(brief) ? brief : optimizePrompt({ description: brief, palette, usePalette: palette.length > 0 }).prompt
  const input = flareInput(prompt, [], GENERATION)
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
