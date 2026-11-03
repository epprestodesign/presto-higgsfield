// Deep links: every view of the prototype has its own #/ URL, so feedback can
// point at an exact screen. The route is the source of truth for navigation;
// components read and write `route`, and the URL follows (Back / Forward work).
//
//   #/                                          Home
//   #/home/team?theme=Sports&show=pages         Home, scrolled to From your team
//   #/home/team?open=heartland-0                … with a teammate's work open
//   #/new?prompt=Half%20marathon…               Start a project (watch the agent)
//   #/project/heartland                         A project's chat
//   #/project/heartland?at=draft-2              … scrolled to Draft 2
//   #/project/heartland/concepts                Concepts tab
//   #/project/heartland/concepts/draft/2?device=mobile&screen=listings
//                                               A draft, full size
//   #/library/banners?project=heartland         Banners / Logos / Pages libraries
//   #/library/pages/heartland/draft/2?screen=details   A project's pages, full size
//   #/map                                       Every link, for this prototype
import { reactive, watch } from 'vue'

const DEFAULTS = Object.freeze({
  view: 'home', // home | new | project | library | map
  project: '', // project slug
  tab: 'chat', // chat | concepts
  draft: 0, // open in the viewer (0 = closed)
  device: 'desktop',
  screen: 'landing',
  library: '', // banners | logos | pages
  filter: 'all', // library: project slug
  at: '', // home: 'team' · chat: 'draft-2' | 'setup'
  theme: 'All', // team feed
  show: 'banners', // team feed: banners | logos | pages
  open: '', // team feed: item id
  prompt: '', // new
  mode: 'full', // new
})
export const route = reactive({ ...DEFAULTS })

export function parse(hash) {
  const [path, qs = ''] = (hash || '').replace(/^#/, '').split('?')
  const q = new URLSearchParams(qs)
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent)
  const r = { ...DEFAULTS }
  const [head, a, b, c] = parts
  if (head === 'home' && a === 'team') r.at = 'team'
  else if (head === 'new') { r.view = 'new'; r.prompt = q.get('prompt') || ''; r.mode = q.get('mode') || 'full' }
  else if (head === 'project' && a) {
    r.view = 'project'
    r.project = a
    let rest = parts.slice(2)
    if (rest[0] === 'concepts') { r.tab = 'concepts'; rest = rest.slice(1) }
    if (rest[0] === 'draft') r.draft = Number(rest[1]) || 0
    r.at = q.get('at') || ''
  } else if (head === 'library' && a) {
    r.view = 'library'
    r.library = a
    if (b) r.project = b
    if (c === 'draft') r.draft = Number(parts[4]) || 0
    r.filter = q.get('project') || 'all'
  } else if (head === 'map') r.view = 'map'
  for (const k of ['device', 'screen', 'theme', 'show', 'open']) if (q.get(k)) r[k] = q.get(k)
  return r
}

export function format(r) {
  const q = new URLSearchParams()
  const viewer = (r.view === 'project' && r.draft) || (r.view === 'library' && r.library === 'pages' && r.project)
  let path = '/'
  if (r.view === 'home') {
    if (r.at === 'team' || r.open || r.theme !== 'All' || r.show !== 'banners') path = '/home/team'
    if (r.theme !== 'All') q.set('theme', r.theme)
    if (r.show !== 'banners') q.set('show', r.show)
    if (r.open) q.set('open', r.open)
  } else if (r.view === 'new') {
    path = '/new'
    if (r.prompt) q.set('prompt', r.prompt)
    if (r.mode !== 'full') q.set('mode', r.mode)
  } else if (r.view === 'project') {
    path = `/project/${r.project}${r.tab === 'concepts' ? '/concepts' : ''}${r.draft ? `/draft/${r.draft}` : ''}`
    if (r.at && r.tab === 'chat' && !r.draft) q.set('at', r.at)
  } else if (r.view === 'library') {
    path = `/library/${r.library}${r.library === 'pages' && r.project ? `/${r.project}${r.draft ? `/draft/${r.draft}` : ''}` : ''}`
    if (r.filter !== 'all') q.set('project', r.filter)
  } else if (r.view === 'map') path = '/map'
  if (viewer || r.open) {
    if (r.device !== 'desktop') q.set('device', r.device)
    if (r.screen !== 'landing') q.set('screen', r.screen)
  }
  const s = q.toString().replace(/\+/g, '%20')
  return `#${path}${s ? `?${s}` : ''}`
}

/** A URL for a view: `link({ view: 'project', project: 'heartland', tab: 'concepts' })`. */
export function link(partial) {
  return `${location.origin}${location.pathname}${location.search}${format({ ...DEFAULTS, ...partial })}`
}

/** Go somewhere (resets everything not given). */
export function go(partial) { Object.assign(route, DEFAULTS, partial) }

export function startRouter() {
  const apply = () => Object.assign(route, parse(location.hash))
  if (location.hash) apply()
  window.addEventListener('hashchange', apply)
  // Write the route into the URL: a new history entry when the page changes,
  // a replace for small things (device, screen, filters).
  watch(() => format(route), (hash) => {
    if (hash === location.hash) return
    const page = (h) => h.split('?')[0]
    if (page(hash) !== page(location.hash || '#/')) history.pushState(null, '', hash)
    else history.replaceState(null, '', hash)
  }, { immediate: true })
}

export { DEFAULTS }
