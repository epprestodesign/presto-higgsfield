<script setup>
// Prototype map (#/map): every deep link in the prototype, so feedback can
// point at an exact view ("on #/project/heartland/concepts/draft/2?device=mobile
// the headline is too big"). Click to open, or copy.
import { computed } from 'vue'
import Icon from './Icon.vue'
import { state, toast, logoOf } from '../mockAgent.js'
import { format, link, DEFAULTS } from '../router.js'
import { SUGGESTIONS } from '../mockData.js'

const SCREENS = [['landing', 'Landing'], ['browse', 'Browse'], ['details', 'Details']]
const L = (r) => ({ hash: format({ ...DEFAULTS, ...r }), url: link(r) })

const general = computed(() => [
  { label: 'Home', ...L({ view: 'home' }) },
  { label: 'Home · From your team', ...L({ view: 'home', at: 'team' }) },
  { label: 'From your team · Sports', ...L({ view: 'home', at: 'team', theme: 'Sports' }) },
  { label: 'From your team · a teammate’s work, mobile', ...L({ view: 'home', open: 'lakeshore-0', device: 'mobile' }) },
  { label: 'Banners', ...L({ view: 'library', library: 'banners' }) },
  { label: 'Logos', ...L({ view: 'library', library: 'logos' }) },
  { label: 'Pages', ...L({ view: 'library', library: 'pages' }) },
  { label: 'Advertisements', ...L({ view: 'library', library: 'ads' }) },
])
const MODE_LABEL = { logo: 'Logo only', banners: 'Banners', ads: 'Ads', full: 'Full suite' }
const starts = computed(() => ['full', 'logo', 'banners', 'ads'].map((m, i) => { const p = SUGGESTIONS.Popular[i]; return { label: `${MODE_LABEL[m]}: “${p}”`, ...L({ view: 'new', prompt: p, mode: m }) } }))
const projects = computed(() => [...state.projects].sort((a, b) => b.updated - a.updated).map((p) => ({
  p,
  main: [
    { label: 'Chat', ...L({ view: 'project', project: p.slug }) },
    { label: 'Chat · Setup', ...L({ view: 'project', project: p.slug, at: 'setup' }) },
    ...p.drafts.map((d) => ({ label: `Chat · Draft ${d.n}`, ...L({ view: 'project', project: p.slug, at: `draft-${d.n}` }) })),
    { label: 'Concepts', ...L({ view: 'project', project: p.slug, tab: 'concepts' }) },
    { label: 'Advertisements', ...L({ view: 'project', project: p.slug, tab: 'ads' }) },
    { label: 'Banners (this project)', ...L({ view: 'library', library: 'banners', filter: p.slug }) },
  ],
  drafts: p.drafts.map((d) => ({
    d,
    cells: ['desktop', 'mobile'].map((device) => ({
      device,
      links: SCREENS.map(([screen, label]) => ({ label, ...L({ view: 'project', project: p.slug, tab: 'concepts', draft: d.n, device, screen }) })),
    })),
  })),
})))

function copy(url) {
  navigator.clipboard?.writeText(url).catch(() => {})
  toast('Link copied')
}
</script>

<template>
  <section class="map" aria-labelledby="map-title">
    <div class="map__inner">
      <header>
        <h1 id="map-title" class="map__title"><Icon name="map" :size="28" /> Prototype map</h1>
        <p class="map__sub">Every view has its own link. Open one, or copy it and send it with your note so we’re looking at the same thing. The address bar always shows the link for wherever you are.</p>
      </header>

      <h2 class="map__h">Home and libraries</h2>
      <ul class="map__list">
        <li v-for="l in general" :key="l.hash"><a :href="l.hash">{{ l.label }}</a><code>{{ l.hash }}</code><button type="button" :aria-label="`Copy the link to ${l.label}`" @click="copy(l.url)"><Icon name="link" :size="16" /></button></li>
      </ul>

      <h2 class="map__h">Start a project (watch the agent)</h2>
      <ul class="map__list">
        <li v-for="l in starts" :key="l.hash"><a :href="l.hash">{{ l.label }}</a><code>{{ l.hash }}</code><button type="button" :aria-label="`Copy the link to ${l.label}`" @click="copy(l.url)"><Icon name="link" :size="16" /></button></li>
      </ul>

      <h2 class="map__h">Projects</h2>
      <article v-for="pr in projects" :key="pr.p.id" class="map__proj">
        <h3><span class="map__mark"><img :src="logoOf(pr.p)" alt="" /></span>{{ pr.p.brand.name }} <code>{{ pr.p.slug }}</code></h3>
        <ul class="map__list">
          <li v-for="l in pr.main" :key="l.hash"><a :href="l.hash">{{ l.label }}</a><code>{{ l.hash }}</code><button type="button" :aria-label="`Copy the link to ${l.label}`" @click="copy(l.url)"><Icon name="link" :size="16" /></button></li>
        </ul>
        <table v-if="pr.drafts.length" class="map__table">
          <thead><tr><th scope="col">Draft, full size</th><th scope="col">Desktop</th><th scope="col">Mobile</th></tr></thead>
          <tbody>
            <tr v-for="row in pr.drafts" :key="row.d.id">
              <th scope="row">Draft {{ row.d.n }} · {{ row.d.label }}</th>
              <td v-for="cell in row.cells" :key="cell.device">
                <span v-for="l in cell.links" :key="l.hash" class="map__cell"><a :href="l.hash">{{ l.label }}</a><button type="button" :aria-label="`Copy the link to draft ${row.d.n}, ${cell.device}, ${l.label}`" @click="copy(l.url)"><Icon name="link" :size="14" /></button></span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="map__none">No drafts yet: this project is waiting on its banners.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.map { height: 100%; overflow-y: auto; background: var(--surface-2); }
.map__inner { width: min(1100px, 100%); margin: 0 auto; padding: 40px 28px 72px; }
.map__title { display: flex; align-items: center; gap: 12px; margin: 0; font-size: 34px; }
.map__sub { margin: 6px 0 0; max-width: 720px; color: var(--ink-2); font-size: 16px; }
.map__h { margin: 32px 0 10px; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.map__list { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); }
.map__list li { display: grid; grid-template-columns: minmax(200px, 1fr) 1.4fr auto; align-items: center; gap: 12px; padding: 8px 12px; }
.map__list li + li { border-top: 1px solid var(--line); }
.map a { color: var(--ink); font-weight: 700; text-decoration: none; }
.map a:hover { text-decoration: underline; }
.map code { font-size: 12.5px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.map button { display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: var(--r); background: none; color: var(--ink-3); cursor: pointer; }
.map button:hover { background: var(--surface-3); color: var(--ink); }
.map__proj { margin-bottom: 24px; }
.map__proj h3 { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; font-size: 18px; }
.map__proj h3 code { font-weight: 400; }
.map__mark { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--line); border-radius: var(--r); background: #fff; }
.map__mark img { max-width: 24px; max-height: 24px; object-fit: contain; }
.map__table { width: 100%; margin-top: 10px; border-collapse: collapse; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); font-size: 14px; }
.map__table th, .map__table td { padding: 8px 12px; border-top: 1px solid var(--line); text-align: left; vertical-align: middle; }
.map__table thead th { border-top: 0; font-size: 12px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; }
.map__table tbody th { font-weight: 700; }
.map__cell { display: inline-flex; align-items: center; margin-right: 10px; }
.map__none { margin: 8px 0 0; color: var(--ink-3); font-size: 14px; }
@media (max-width: 760px) { .map__list li { grid-template-columns: 1fr auto; } .map__list code { display: none; } .map__inner { padding: 64px 16px 48px; } }
</style>
