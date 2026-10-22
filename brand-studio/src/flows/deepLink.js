// Deep links for the prototype (hash-routed): every screen's view state lives
// in the URL so any moment can be shared as feedback and reopened exactly.
//
//   #/<step>?<params>
//
//   example=heartland   load that industry example (overrides the saved draft)
//   concept=3           selected concept (0–5) when concepts are generated
//   step=2              intake wizard step (1-based)
//   page=browse         Studio page: landing | browse | details | checkout | confirmation
//   device=mobile       Studio canvas: desktop | tablet | mobile
//   panel=ads           Studio panel: brand | content | pages | ads | concept
//   dialog=export       Studio overlay: examples | export | preview
//   pdevice=mobile      device inside the full-screen preview (dialog=preview)
//
// e.g. #/studio?example=heartland&concept=0&page=browse&device=mobile&panel=ads&dialog=export

export const PARAM_ORDER = ['example', 'concept', 'step', 'page', 'device', 'panel', 'dialog', 'pdevice']

const ALLOWED = {
  page: ['landing', 'browse', 'details', 'checkout', 'confirmation'],
  device: ['desktop', 'tablet', 'mobile'],
  pdevice: ['desktop', 'tablet', 'mobile'],
  panel: ['brand', 'content', 'pages', 'ads', 'concept'],
  dialog: ['examples', 'export', 'preview'],
}

/** Drop unknown keys and values that aren't allowed, so a bad link degrades gracefully. */
export function cleanParams(params = {}) {
  const out = {}
  for (const key of PARAM_ORDER) {
    const v = params[key]
    if (v === undefined || v === null || v === '') continue
    const s = String(v)
    if (ALLOWED[key] && !ALLOWED[key].includes(s)) continue
    if ((key === 'concept' || key === 'step') && !/^\d+$/.test(s)) continue
    if (key === 'example' && !/^[a-z0-9-]+$/.test(s)) continue
    out[key] = s
  }
  return out
}

/** '#/studio?page=browse' → { step: 'studio', params: { page: 'browse' } } */
export function parseHash(hash = '') {
  const raw = String(hash).replace(/^#\/?/, '')
  const [path, query = ''] = raw.split('?')
  const params = Object.fromEntries(new URLSearchParams(query))
  return { step: decodeURIComponent(path || ''), params: cleanParams(params) }
}

/** Stable, readable hash: params in PARAM_ORDER, empty values dropped. */
export function buildHash(step, params = {}) {
  const clean = cleanParams(params)
  const q = PARAM_ORDER.filter((k) => k in clean).map((k) => `${k}=${encodeURIComponent(clean[k])}`).join('&')
  return `#/${step}${q ? `?${q}` : ''}`
}

/** Absolute URL for the current origin + path with the given hash. */
export const shareUrl = (hash) => `${window.location.origin}${window.location.pathname}${hash}`
