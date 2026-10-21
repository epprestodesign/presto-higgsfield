// Live-preview bridge between the Studio editor (parent) and the branded
// booking page rendered inside an <iframe> (child, the "Preview Host").
//
// Why an iframe: Presto's pages switch to their phone layouts via CSS media
// queries and Quasar's $q.screen, both of which read the *window* width. An
// iframe gives the mobile preview a real 390px window, so what organizers see
// is exactly what their attendees will see on a phone.
//
// Protocol (same-origin postMessage only):
//   child  → parent  { type: 'bs-preview:ready' }
//   parent → child   { type: 'bs-preview:render', project, page }
//   child  → parent  { type: 'bs-preview:navigate', page }   (user clicked through inside the preview)
//
// In Storybook the host is the story below; in the future app it is the
// /preview route. Both read the same message.
export const PREVIEW_HOST_STORY_ID = 'brand-studio-branded-preview-preview-host--host'

export const PREVIEW_PAGES = ['landing', 'browse', 'details', 'checkout', 'confirmation']

/** URL of the preview host. `base` lets the future app point at /preview instead. */
export function previewHostUrl({ base } = {}) {
  if (base) return base
  return `iframe.html?id=${PREVIEW_HOST_STORY_ID}&viewMode=story`
}

const sameOrigin = (e) => e.origin === window.location.origin

/**
 * Parent side. Call once the iframe element exists.
 *   const link = connectPreviewFrame(iframeEl, () => ({ project, page }), { onNavigate })
 *   link.send()      // push the latest payload (e.g. from a watcher)
 *   link.destroy()
 */
export function connectPreviewFrame(iframe, getPayload, { onNavigate } = {}) {
  let ready = false
  const post = () => {
    if (!ready || !iframe?.contentWindow) return
    const { project, page } = getPayload()
    // Structured-clone a plain copy (Pinia state is a Proxy).
    iframe.contentWindow.postMessage({ type: 'bs-preview:render', project: JSON.parse(JSON.stringify(project)), page }, window.location.origin)
  }
  const onMessage = (e) => {
    if (!sameOrigin(e) || e.source !== iframe?.contentWindow) return
    if (e.data?.type === 'bs-preview:ready') { ready = true; post() }
    if (e.data?.type === 'bs-preview:navigate') onNavigate?.(e.data.page)
  }
  window.addEventListener('message', onMessage)
  return {
    send: post,
    get ready() { return ready },
    destroy: () => window.removeEventListener('message', onMessage),
  }
}

/**
 * Child side (Preview Host). `onRender({ project, page })` fires for every
 * update. Returns { navigate(page), embedded, destroy }.
 */
export function listenAsPreviewHost(onRender) {
  const embedded = typeof window !== 'undefined' && window.parent !== window
  const onMessage = (e) => {
    if (!sameOrigin(e) || e.data?.type !== 'bs-preview:render') return
    onRender({ project: e.data.project, page: e.data.page })
  }
  window.addEventListener('message', onMessage)
  if (embedded) window.parent.postMessage({ type: 'bs-preview:ready' }, window.location.origin)
  return {
    embedded,
    navigate: (page) => embedded && window.parent.postMessage({ type: 'bs-preview:navigate', page }, window.location.origin),
    destroy: () => window.removeEventListener('message', onMessage),
  }
}
