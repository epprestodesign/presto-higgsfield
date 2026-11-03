// Library search: what each library can be browsed by (the categories in the
// search panel), built from what's actually in it, with counts. Each item
// carries `facets` ({ theme: ['Sports'], mood: [...] }) and `text` for search.
import { themeOf } from './mockData.js'
import { LOGO_LOOKS } from './mockAgent.js'
import { AD_SIZES, PURPOSES } from './ads.js'

export const FACET_LABEL = {
  theme: 'Theme', type: 'Image', mood: 'Mood', set: 'Set', look: 'Logo look', source: 'Source',
  purpose: 'Links to', size: 'Size', how: 'Made with', project: 'Project', drafts: 'Drafts',
}
const HOW = { package: 'Higgsfield · whole package', single: 'Higgsfield · one size at a time', upload: 'Re-fitted upload' }
const mobile = (s) => AD_SIZES[s].width <= 320 && AD_SIZES[s].height <= 100
const theme = (p) => themeOf(p.brand.id)

/** Normalise a library's items: `{ id, facets, text, ...item }`. */
export function facetItems(kind, list) {
  return list.map((it) => {
    const p = it.project || it.p || it
    const f = { theme: [theme(p)], project: [p.id] }
    if (kind === 'banners') Object.assign(f, { type: [it.kind], mood: [it.mood || 'As generated'], set: [`Set ${it.set}`] })
    if (kind === 'logos') Object.assign(f, { look: [p.look || 'original'], source: [p.logoName ? 'Uploaded' : `From ${p.brand.website}`] })
    if (kind === 'ads') Object.assign(f, { purpose: [it.a.purpose], how: [it.a.how], size: it.sizes })
    if (kind === 'pages') Object.assign(f, { drafts: [p.drafts.length > 1 ? 'With earlier drafts' : 'One draft'] })
    const words = [p.name, p.brand.name, p.brand.place, ...Object.entries(f).flatMap(([k, v]) => v.map((x) => optionLabel(k, x)))]
    if (it.a) words.push(it.a.name, it.a.tagline, it.a.url)
    return { ...it, facets: f, text: words.filter(Boolean).join(' ').toLowerCase() }
  })
}

export function optionLabel(facet, value, projects = []) {
  if (facet === 'look') return LOGO_LOOKS.find((l) => l.id === value)?.label || value
  if (facet === 'purpose') return PURPOSES.find((x) => x.id === value)?.label || value
  if (facet === 'how') return HOW[value] || value
  if (facet === 'size') return AD_SIZES[value] ? `${AD_SIZES[value].name}` : value
  if (facet === 'mood') return value.charAt(0).toUpperCase() + value.slice(1)
  if (facet === 'project') return projects.find((p) => p.id === value)?.name || value
  return value
}

function options(items, facet, projects, filter = () => true) {
  const counts = new Map()
  for (const it of items) for (const v of it.facets[facet] || []) if (filter(v)) counts.set(v, (counts.get(v) || 0) + 1)
  return [...counts].map(([value, count]) => ({ key: `${facet}:${value}`, facet, value, label: optionLabel(facet, value, projects), count, hint: facet === 'size' ? value.replace('x', '×') : '' }))
}
const group = (label, opts) => ({ label, options: opts.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)) })

/** The search panel's categories for a library: `[{ id, label, icon, groups: [{ label, options }] }]`. */
export function facetCategories(kind, items, projects) {
  const o = (f, filter) => options(items, f, projects, filter)
  const themes = { id: 'themes', label: 'Themes', icon: 'grid', tone: 'amber', groups: [group('Event themes', o('theme'))] }
  const proj = { id: 'projects', label: 'Projects', icon: 'layers', tone: 'navy', groups: [group('Your projects', o('project'))] }
  const cats = {
    banners: [
      themes,
      { id: 'styles', label: 'Styles', icon: 'palette', tone: 'rose', groups: [group('Image', o('type')), group('Mood', o('mood'))] },
      { id: 'sets', label: 'Sets', icon: 'image', tone: 'sky', groups: [group('Banner sets', o('set'))] },
      proj,
    ],
    logos: [
      themes,
      { id: 'looks', label: 'Logo looks', icon: 'spark', tone: 'rose', groups: [group('Shown on the pages as', o('look'))] },
      { id: 'source', label: 'Source', icon: 'link', tone: 'sky', groups: [group('Where it came from', o('source'))] },
      proj,
    ],
    ads: [
      { id: 'purpose', label: 'Links to', icon: 'megaphone', tone: 'rose', groups: [group('Sponsors', o('purpose', (v) => v === 'sponsor')), group('Event pages', o('purpose', (v) => v !== 'sponsor'))] },
      { id: 'sizes', label: 'Sizes', icon: 'monitor', tone: 'sky', groups: [group('Desktop', o('size', (v) => !mobile(v))), group('Phones', o('size', mobile))] },
      { id: 'how', label: 'Made with', icon: 'spark', tone: 'violet', groups: [group('How it was designed', o('how'))] },
      themes,
      proj,
    ],
    pages: [themes, { id: 'drafts', label: 'Drafts', icon: 'refresh', tone: 'sky', groups: [group('History', o('drafts'))] }, proj],
  }[kind] || []
  return cats.map((c) => ({ ...c, groups: c.groups.filter((g) => g.options.length) })).filter((c) => c.groups.length)
}

/** Items matching the picked tags (AND across facets, OR within one) and the search words. */
export function applyFacets(items, tags, q) {
  const by = {}
  for (const t of tags) { const [f, ...v] = t.split(':'); (by[f] ||= []).push(v.join(':')) }
  const words = (q || '').toLowerCase().split(/\s+/).filter(Boolean)
  return items.filter((it) => Object.entries(by).every(([f, vals]) => vals.some((v) => (it.facets[f] || []).includes(v)))
    && words.every((w) => it.text.includes(w)))
}
