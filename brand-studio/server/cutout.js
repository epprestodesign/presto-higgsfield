// POST /hf-api/_cutout { data_url } — AI background removal (Photoroom's
// Remove Background API) for logos sitting on photos, smoke or gradients,
// where the colour-key clean-ups struggle. PHOTOROOM_API_KEY stays on the
// server; the cut-out comes back as a PNG data: URL.
const PHOTOROOM = 'https://sdk.photoroom.com/v1/segment'
export const MAX_CUTOUT_INPUT = 8 * 1024 * 1024

const fail = (status, detail, code) => Object.assign(new Error(detail), { status, code })

/**
 * @param {string} dataUrl  data:image/(png|jpeg|webp);base64,…
 * @param {{ apiKey?: string, fetchFn?: typeof fetch }} o
 * @returns {Promise<{ src: string, credits: number }>}
 */
export async function cutout(dataUrl, { apiKey, fetchFn = fetch } = {}) {
  if (!apiKey) throw fail(412, 'AI cut-out isn’t set up here yet (PHOTOROOM_API_KEY is missing).', 'photoroom_not_configured')
  const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(String(dataUrl || ''))
  if (!m) throw fail(400, 'Send the logo as a PNG, JPEG or WebP image.', 'bad_image')
  const buf = Buffer.from(m[2], 'base64')
  if (!buf.length || buf.length > MAX_CUTOUT_INPUT) throw fail(413, 'That image is too large for the AI cut-out.', 'too_large')

  const form = new FormData()
  form.append('image_file', new Blob([buf], { type: m[1] }), `logo.${m[1].split('/')[1]}`)
  form.append('format', 'png')
  const r = await fetchFn(PHOTOROOM, { method: 'POST', headers: { 'x-api-key': apiKey }, body: form })
  if (r.status === 401 || r.status === 403) throw fail(502, 'Photoroom didn’t accept the API key. Check PHOTOROOM_API_KEY.', 'photoroom_auth')
  if (r.status === 402) throw fail(402, 'Photoroom is out of credits.', 'photoroom_credits')
  if (r.status === 429) throw fail(429, 'Photoroom is busy. Try again in a moment.', 'photoroom_busy')
  const type = (r.headers.get('content-type') || '').split(';')[0].trim()
  if (!r.ok || !type.startsWith('image/')) {
    let detail = ''
    try { const j = await r.json(); detail = j.detail || j.message || j.error?.message || '' } catch { /* not JSON */ }
    throw fail(502, `Photoroom couldn’t cut this out${detail ? `: ${String(detail).slice(0, 120)}` : ` (${r.status}).`}`, 'photoroom_error')
  }
  const out = Buffer.from(await r.arrayBuffer())
  return { src: `data:${type};base64,${out.toString('base64')}`, credits: 1 }
}
