<script setup>
// Everything you've made, by kind (from the rail): every banner, every logo,
// or every project's pages (its drafts stacked), plus every ad. Search and
// browse by theme, style, size… (LibrarySearch); click a banner or logo to open
// its project, or pages to see them full size.
import { computed } from 'vue'
import LogoMark from './LogoMark.vue'
import DraftStack from './presto/DraftStack.vue'
import DraftViewer from './DraftViewer.vue'
import { state, openProject, draftView, LOGO_LOOKS, projectBySlug, logoOf } from '../mockAgent.js'
import { route, go } from '../router.js'
import AdMosaic from './ads/AdMosaic.vue'
import LibrarySearch from './LibrarySearch.vue'
import BannerStack from './BannerStack.vue'
import { readySizes, AD_SIZES, PURPOSES, spotLabel } from '../ads.js'
import { facetItems, facetCategories, applyFacets } from '../libraryFacets.js'

const props = defineProps({ kind: { type: String, required: true } })
// No page heading: the library chips say where you are. Instead, a line under
// the search on what's here and how to get around it.
const COPY = {
  banners: { title: 'Banners', how: 'Each project’s landing-page banners, newest in front. Hover a stack to peek at the ones behind, move across it to flip through, and click to open the project.' },
  logos: { title: 'Logos', how: 'Every version of each project’s logo. Hover to flip through the looks; the green tag marks the one on the pages. Click to open the project.' },
  pages: { title: 'Pages', how: 'Each project’s Presto pages, with earlier drafts behind. Click a stack to see them full size.' },
  ads: { title: 'Advertisements', how: 'Each ad in the spot it fills, in that spot’s size and its phone size. Hover a size to bring it forward; dashed outlines aren’t designed yet. Click to change it in the project’s Advertisements.' },
}
const NOUN = { banners: ['project', 'projects'], logos: ['project', 'projects'], pages: ['project', 'projects'], ads: ['ad', 'ads'] }

const KINDS = [
  { id: 'banners', label: 'Banners', icon: 'image' },
  { id: 'logos', label: 'Logos', icon: 'spark' },
  { id: 'ads', label: 'Advertisements', icon: 'megaphone' },
  { id: 'pages', label: 'Pages', icon: 'layers' },
]
const SEARCH = { banners: 'Search banners: night, golden hour, soccer…', logos: 'Search logos: badge, uploaded, a website…', ads: 'Search ads: sponsor, FAQ, billboard…', pages: 'Search pages: wedding, fintech…' }

// Search, filters and the open project live in the route (deep links). The
// project filter keeps its own ?project= param; the rest are ?tags=.
const projects = computed(() => [...state.projects].sort((a, b) => b.updated - a.updated))
const tags = computed(() => [...(route.filter !== 'all' ? [`project:${route.filter}`] : []), ...(route.tags ? route.tags.split('|') : [])])
function toggle(key) {
  if (key.startsWith('project:')) { const id = key.slice(8); route.filter = route.filter === id ? 'all' : id; return }
  const list = route.tags ? route.tags.split('|') : []
  route.tags = (list.includes(key) ? list.filter((t) => t !== key) : [...list, key]).join('|')
}
function clear() { route.filter = 'all'; route.tags = ''; route.q = '' }
const q = computed({ get: () => route.q, set: (v) => { route.q = v } })
function switchKind(k) { go({ view: 'library', library: k }) }

const allBanners = computed(() => projects.value.flatMap((p) => p.messages
  .filter((m) => m.card?.type === 'banners')
  .reverse()
  .flatMap((m) => m.card.images.map((img) => ({ ...img, project: p, set: m.card.set, mood: m.card.mood })))))

const all = computed(() => ({
  banners: facetItems('banners', allBanners.value),
  logos: facetItems('logos', projects.value.map((p) => ({ id: p.id, project: p }))),
  pages: facetItems('pages', projects.value.filter((p) => p.drafts.length).map((p) => ({ id: p.id, project: p }))),
  ads: facetItems('ads', allAds.value),
})[props.kind])
const categories = computed(() => facetCategories(props.kind, all.value, projects.value))
const shown = computed(() => applyFacets(all.value, tags.value, route.q))
const banners = computed(() => props.kind === 'banners' ? shown.value : [])
// Banners are shown per project, as a stack (newest in front).
const bannerGroups = computed(() => {
  const by = new Map()
  for (const b of banners.value) { if (!by.has(b.project.id)) by.set(b.project.id, { project: b.project, items: [] }); by.get(b.project.id).items.push(b) }
  return [...by.values()]
})
const setsOf = (g) => new Set(g.items.map((b) => b.set)).size
// Logos: every version tried, as a stack — each look, on the logo in use and
// (after an upload) on the logo from the website. The look in use is in front.
function logoVersions(p) {
  const sources = p.logo ? [{ view: p, from: p.logoName ? `Uploaded · ${p.logoName}` : 'Uploaded' }, { view: { brand: p.brand, logo: null }, from: `From ${p.brand.website}` }] : [{ view: p, from: `From ${p.brand.website}` }]
  const bg = p.selected?.src || p.brand.images[0].src
  return sources.flatMap((s, si) => LOGO_LOOKS.map((l) => ({
    key: `${si}-${l.id}`, view: s.view, look: l.id, bg, inUse: si === 0 && l.id === p.look,
    caption: `${l.label}${si === 0 && l.id === p.look ? ' · on the pages' : ''} · ${s.from}`,
  })))
}
const logoStart = (p) => Math.max(0, LOGO_LOOKS.findIndex((l) => l.id === p.look))
const logos = computed(() => props.kind === 'logos' ? shown.value.map((x) => x.project) : [])
const pages = computed(() => props.kind === 'pages' ? shown.value.map((x) => x.project) : [])
const adList = computed(() => props.kind === 'ads' ? shown.value : [])
const viewing = computed({
  get: () => (props.kind === 'pages' && route.project ? projectBySlug(route.project) : null),
  set: (p) => { route.project = p?.slug || ''; route.draft = 0; if (!p) { route.device = 'desktop'; route.screen = 'landing' } },
})
const viewingDraft = computed(() => viewing.value && (viewing.value.drafts[route.draft - 1] || viewing.value.drafts.at(-1)))
const lookLabel = (p) => LOGO_LOOKS.find((l) => l.id === p.look)?.label
// Ads: every ad with at least one finished size, shown at its largest finished size.
const allAds = computed(() => projects.value.flatMap((p) => p.ads.items.filter((a) => readySizes(a).length).map((a) => { const sizes = readySizes(a).sort((x, y) => AD_SIZES[y].width * AD_SIZES[y].height - AD_SIZES[x].width * AD_SIZES[x].height); return { id: a.id, a, p, sizes, size: sizes[0] } })))
const purposeLabel = (id) => PURPOSES.find((x) => x.id === id)?.label
const count = computed(() => shown.value.length)
const groups = computed(() => (props.kind === 'banners' ? bannerGroups.value.length : count.value))
const filtered = computed(() => tags.value.length || !!route.q)
</script>

<template>
  <section class="lib" :aria-labelledby="`lib-${kind}`">
    <div class="lib__inner">
      <h1 :id="`lib-${kind}`" class="lib__vh">{{ COPY[kind].title }}</h1>

      <LibrarySearch
        class="lib__search" :kind="kind" :kinds="KINDS" :categories="categories" :tags="tags" :q="q" :placeholder="SEARCH[kind]"
        @update:q="q = $event" @toggle="toggle" @clear="clear" @kind="switchKind"
      />
      <p class="lib__how" aria-live="polite"><b>{{ groups }} {{ NOUN[kind][groups === 1 ? 0 : 1] }}<template v-if="kind === 'banners'"> · {{ count }} {{ count === 1 ? 'banner' : 'banners' }}</template><template v-if="filtered"> match</template></b> {{ COPY[kind].how }}</p>

      <!-- Banners -->
      <ul v-if="kind === 'banners'" class="lib__grid is-pages">
        <li v-for="g in bannerGroups" :key="g.project.id">
          <BannerStack :banners="g.items" :label="g.project.name" @open="openProject(g.project.id)" />
          <div class="lib__meta">
            <span class="lib__mark"><img :src="logoOf(g.project)" alt="" /></span>
            <span><b>{{ g.project.brand.name }}</b><small>{{ g.items.length }} {{ g.items.length === 1 ? 'banner' : 'banners' }} · {{ setsOf(g) }} {{ setsOf(g) === 1 ? 'set' : 'sets' }}<template v-if="g.items[0].mood"> · latest: {{ g.items[0].mood.replace(/^./, (c) => c.toUpperCase()) }}</template></small></span>
          </div>
        </li>
      </ul>

      <!-- Logos -->
      <ul v-else-if="kind === 'logos'" class="lib__grid is-pages">
        <li v-for="p in logos" :key="p.id">
          <BannerStack :banners="logoVersions(p)" :start="logoStart(p)" :label="`${p.name} logo`" @open="openProject(p.id)">
            <template #default="{ item }">
              <span class="lib__lv" :class="`is-${item.look}`">
                <img v-if="item.look === 'badge' || item.look === 'white'" class="lib__lvbg" :src="item.bg" alt="" />
                <LogoMark :project="item.view" :look="item.look" :size="item.look === 'white' ? 92 : 84" />
                <em v-if="item.inUse">On the pages</em>
              </span>
            </template>
          </BannerStack>
          <div class="lib__meta">
            <span class="lib__mark"><img :src="logoOf(p)" alt="" /></span>
            <span><b>{{ p.brand.name }}</b><small>{{ logoVersions(p).length }} versions · on the pages: {{ lookLabel(p) }}</small></span>
          </div>
        </li>
      </ul>

      <!-- Advertisements -->
      <ul v-else-if="kind === 'ads'" class="lib__grid is-pages">
        <li v-for="x in adList" :key="x.a.id">
          <AdMosaic :ad="x.a" :project="x.p" :label="`${x.a.name} on ${x.p.name}`" @open="go({ view: 'project', project: x.p.slug, tab: 'ads' })" />
          <div class="lib__meta">
            <span class="lib__mark"><img :src="logoOf(x.p)" alt="" /></span>
            <span><b>{{ x.a.name }}</b><small>{{ purposeLabel(x.a.purpose) }} · {{ x.p.name }}<template v-if="spotLabel(x.p.ads, x.a)"> · {{ spotLabel(x.p.ads, x.a) }}</template></small></span>
          </div>
        </li>
      </ul>

      <!-- Pages -->
      <ul v-else class="lib__grid is-pages">
        <li v-for="p in pages" :key="p.id">
          <button type="button" class="lib__card lib__stack" :aria-label="`See ${p.name}'s pages`" @click="viewing = p">
            <DraftStack :views="[...p.drafts].reverse().map((d) => draftView(p, d))" />
          </button>
          <div class="lib__meta">
            <span class="lib__mark"><img :src="logoOf(p)" alt="" /></span>
            <span><b>{{ p.brand.name }}</b><small>{{ p.drafts.length }} {{ p.drafts.length === 1 ? 'draft' : 'drafts' }} · latest: {{ p.drafts.at(-1).label }}</small></span>
          </div>
        </li>
      </ul>

      <p v-if="!count" class="lib__empty">
        <template v-if="filtered">Nothing matches. <button type="button" @click="clear">Clear the search and filters</button></template>
        <template v-else>Nothing here yet.</template>
      </p>
    </div>

    <DraftViewer v-if="viewing && viewingDraft" :project="viewing" :draft="viewingDraft" @close="viewing = null" @go="route.draft = $event.n" @restored="viewing = null" />
  </section>
</template>

<style scoped>
.lib { height: 100%; overflow-y: auto; scrollbar-gutter: stable; background: var(--surface-2); }
.lib__inner { width: min(1180px, 100%); margin: 0 auto; padding: 40px 28px 72px; }
.lib__vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.lib__search { margin: 0 0 16px; }
.lib__how { max-width: 860px; margin: 0 0 24px; color: var(--ink-2); font-size: 15px; line-height: 1.5; }
.lib__how b { margin-right: 4px; color: var(--ink); }
.lib__empty button { border: 0; background: none; padding: 0; font: inherit; color: var(--ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.lib__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px 24px; }
.lib__grid.is-logos { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.lib__grid.is-pages { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.lib__card { display: block; width: 100%; padding: 0; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface-3); overflow: hidden; cursor: pointer; }
.lib__card:hover { box-shadow: var(--shadow-overlay); border-color: var(--line-bold); }
.lib__lv { position: relative; display: grid; place-items: center; width: 100%; height: 100%; background: #fff; }
.lib__lv.is-dark { background: #1f2937; }
.lib__lvbg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.55); }
.lib__lv > :deep(.lm) { position: relative; }
.lib__lv em { position: absolute; top: 8px; left: 8px; padding: 0 8px; border-radius: 999px; background: #dcfce7; color: #15803d; font-style: normal; font-size: 11px; font-weight: 700; line-height: 20px; }
.lib__stack { padding: 6% 4% 0; }
.lib__meta { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.lib__meta b { display: block; font-size: 16px; }
.lib__meta small { color: var(--ink-3); font-size: 13px; }
.lib__mark { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border: 1px solid var(--line); border-radius: var(--r); background: #fff; }
.lib__mark img { max-width: 26px; max-height: 26px; object-fit: contain; }
.lib__empty { padding: 32px; border: 1px dashed var(--line-bold); border-radius: var(--r-card); text-align: center; color: var(--ink-2); }
@media (max-width: 1000px) { .lib__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lib__grid.is-logos { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 640px) { .lib__inner { padding: 64px 16px 48px; } .lib__grid, .lib__grid.is-pages { grid-template-columns: 1fr; } .lib__grid.is-logos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
