<script setup>
// Everything you've made, by kind (from the rail): every banner, every logo,
// or every project's pages (its drafts stacked), plus every ad. Search and
// browse by theme, style, size… (LibrarySearch); click a banner or logo to open
// its project, or pages to see them full size.
import { computed } from 'vue'
import Icon from './Icon.vue'
import LogoMark from './LogoMark.vue'
import DraftStack from './presto/DraftStack.vue'
import DraftViewer from './DraftViewer.vue'
import { state, openProject, draftView, LOGO_LOOKS, projectBySlug, logoOf } from '../mockAgent.js'
import { route, go } from '../router.js'
import AdPreview from './ads/AdPreview.vue'
import LibrarySearch from './LibrarySearch.vue'
import { readySizes, AD_SIZES, PURPOSES } from '../ads.js'
import { facetItems, facetCategories, applyFacets } from '../libraryFacets.js'

const props = defineProps({ kind: { type: String, required: true } })
const COPY = {
  banners: { title: 'Banners', sub: 'Every banner you’ve generated, newest first.', icon: 'image' },
  logos: { title: 'Logos', sub: 'Each project’s logo, cleaned up, and the look it uses on the pages.', icon: 'spark' },
  pages: { title: 'Pages', sub: 'Each project’s Presto pages, with earlier drafts behind.', icon: 'layers' },
  ads: { title: 'Advertisements', sub: 'Every ad across your events: sponsors, and links to each event’s own pages.', icon: 'megaphone' },
}

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
const filtered = computed(() => tags.value.length || !!route.q)
</script>

<template>
  <section class="lib" :aria-labelledby="`lib-${kind}`">
    <div class="lib__inner">
      <header class="lib__head">
        <h1 :id="`lib-${kind}`" class="lib__title"><Icon :name="COPY[kind].icon" :size="28" /> {{ COPY[kind].title }} <span>{{ count }}</span></h1>
        <p class="lib__sub">{{ COPY[kind].sub }}</p>
      </header>

      <LibrarySearch
        class="lib__search" :kind="kind" :kinds="KINDS" :categories="categories" :tags="tags" :q="q" :placeholder="SEARCH[kind]"
        @update:q="q = $event" @toggle="toggle" @clear="clear" @kind="switchKind"
      />

      <!-- Banners -->
      <ul v-if="kind === 'banners'" class="lib__grid">
        <li v-for="b in banners" :key="b.key">
          <button type="button" class="lib__card" :aria-label="`${b.project.name}, banner set ${b.set}`" @click="openProject(b.project.id)">
            <img class="lib__banner" :src="b.src" alt="" :style="{ filter: b.filter || undefined }" />
          </button>
          <div class="lib__meta">
            <span class="lib__mark"><img :src="logoOf(b.project)" alt="" /></span>
            <span><b>{{ b.project.name }}</b><small>Set {{ b.set }}<template v-if="b.mood"> · {{ b.mood }}</template> · {{ b.kind }}</small></span>
          </div>
        </li>
      </ul>

      <!-- Logos -->
      <ul v-else-if="kind === 'logos'" class="lib__grid is-logos">
        <li v-for="p in logos" :key="p.id">
          <button type="button" class="lib__card lib__logo" :aria-label="`Open ${p.name}`" @click="openProject(p.id)">
            <LogoMark :project="p" look="original" :size="130" />
          </button>
          <div class="lib__meta">
            <span><b>{{ p.brand.name }}</b><small>Shown as: {{ lookLabel(p) }}</small></span>
          </div>
        </li>
      </ul>

      <!-- Advertisements -->
      <ul v-else-if="kind === 'ads'" class="lib__grid">
        <li v-for="x in adList" :key="x.a.id">
          <button type="button" class="lib__card lib__ad" :aria-label="`${x.a.name} on ${x.p.name}`" @click="go({ view: 'project', project: x.p.slug, tab: 'ads' })">
            <AdPreview :ad="x.a" :size="x.size" :max-width="300" :max-height="170" />
          </button>
          <div class="lib__meta">
            <span class="lib__mark"><img :src="logoOf(x.p)" alt="" /></span>
            <span><b>{{ x.a.name }}</b><small>{{ purposeLabel(x.a.purpose) }} · {{ x.p.name }} · {{ readySizes(x.a).length }} {{ readySizes(x.a).length === 1 ? 'size' : 'sizes' }}</small></span>
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
.lib__title { display: flex; align-items: center; gap: 12px; margin: 0; font-size: 34px; }
.lib__title span { padding: 0 10px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-size: 15px; line-height: 26px; }
.lib__sub { margin: 6px 0 0; color: var(--ink-2); font-size: 16px; }
.lib__search { margin: 24px 0 28px; }
.lib__empty button { border: 0; background: none; padding: 0; font: inherit; color: var(--ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.lib__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px 24px; }
.lib__grid.is-logos { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.lib__grid.is-pages { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.lib__card { display: block; width: 100%; padding: 0; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface-3); overflow: hidden; cursor: pointer; }
.lib__card:hover { box-shadow: var(--shadow-overlay); border-color: var(--line-bold); }
.lib__banner { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.lib__logo { display: grid; place-items: center; aspect-ratio: 1; background: #fff; }
.lib__stack { padding: 6% 4% 0; }
.lib__ad { display: grid; place-items: center; aspect-ratio: 16 / 10; padding: 16px; }
.lib__meta { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.lib__meta b { display: block; font-size: 16px; }
.lib__meta small { color: var(--ink-3); font-size: 13px; }
.lib__mark { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border: 1px solid var(--line); border-radius: var(--r); background: #fff; }
.lib__mark img { max-width: 26px; max-height: 26px; object-fit: contain; }
.lib__empty { padding: 32px; border: 1px dashed var(--line-bold); border-radius: var(--r-card); text-align: center; color: var(--ink-2); }
@media (max-width: 1000px) { .lib__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lib__grid.is-logos { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 640px) { .lib__inner { padding: 64px 16px 48px; } .lib__grid, .lib__grid.is-pages { grid-template-columns: 1fr; } .lib__grid.is-logos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
