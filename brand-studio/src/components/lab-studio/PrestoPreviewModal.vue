<script setup>
// PrestoPreviewModal — the real Presto booking pages, branded with this
// project's logo and selected banner, at full size; switch page, device and
// banner. The right panel itemizes every graphic made for the chosen concept
// (the logo look at the two Presto banner sizes, both banner crops), each previewable and
// downloadable, or all as a ZIP.
import { computed, markRaw, nextTick, ref, watch } from 'vue'
import BrandedSite from '../preview/BrandedSite.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import BrowserFrame from '../marketing/BrowserFrame.vue'
import ScaledFrame from '../marketing/ScaledFrame.vue'
import DevicePreview from '../studio/DevicePreview.vue'
import { toPrestoProject, setBanners } from '../../banner-lab/studioProjects.js'
import { conceptGraphics, zipEntries } from '../../banner-lab/conceptGraphics.js'
import { useHScroll } from './useHScroll.js'
import { saveZip, saveCanvas, saveText, slug } from '../../banner-lab/download.js'

const props = defineProps({
  project: { type: Object, required: true },
  modelValue: { type: Boolean, default: false },
  initialPage: { type: String, default: 'landing' },
  initialPanel: { type: Boolean, default: true },
  initialDevice: { type: String, default: 'desktop' },
})
const emit = defineEmits(['update:modelValue'])

const PAGES = [
  { id: 'landing', label: 'Landing', icon: 'home', hint: 'The event’s booking page, with the banner' },
  { id: 'browse', label: 'Hotel listings', icon: 'view_list', hint: 'Every hotel, with the listings banner' },
  { id: 'details', label: 'Hotel details', icon: 'hotel', hint: 'One hotel’s photos, rooms and rates' },
]
const page = ref(props.initialPage)
const current = computed(() => PAGES.find((p) => p.id === page.value) || PAGES[0])
const device = ref(props.initialDevice)
const showPanel = ref(props.initialPanel)
const bannerId = ref(props.project.selectedBannerId)
watch(() => props.project.selectedBannerId, (id) => { bannerId.value = id })

const presto = computed(() => toPrestoProject(props.project, bannerId.value))
const kit = computed(() => presto.value.brandKit)
const banner = computed(() => props.project.banners.find((b) => b.id === bannerId.value) || null)

// Banner choices: a strip above the preview, grouped by set (oldest → newest).
const thumbs = useHScroll({ drag: true })
const strip = computed(() => {
  const sets = props.project.sets || []
  if (!sets.length) return [{ id: 'all', label: '', banners: [...props.project.banners].reverse() }]
  return sets.filter((s) => s.status !== 'building').map((s) => ({ id: s.id, label: `Set ${s.n}`, prompt: s.prompt, banners: setBanners(props.project, s.id) }))
})
const thumbEls = {}
function revealChosen(smooth = true) { nextTick(() => thumbs.reveal(thumbEls[bannerId.value], { smooth })) }
watch(() => props.modelValue, (open) => { if (open) setTimeout(() => revealChosen(false), 60) }, { immediate: true })
watch(bannerId, () => revealChosen())
const url = computed(() => `demo.eventpipe.com/${presto.value.publishing?.slug || slug(props.project.name)}`)

// ── Graphics for the chosen concept ───────────────────────────────────────
const items = ref([])
const loading = ref(false)
const picked = ref(new Set())
const lightbox = ref(null)
const exporting = ref(false)
const done = ref('')
let token = 0
const lookLabel = computed(() => props.project.logoLab?.lookLabel || '')
async function build() {
  if (!showPanel.value) return
  const mine = ++token
  loading.value = true
  done.value = ''
  try {
    const list = await conceptGraphics(props.project, banner.value, { lookLabel: lookLabel.value })
    if (mine !== token) return
    items.value = list.map(markRaw)
    picked.value = new Set(list.map((i) => i.id))
  } finally {
    if (mine === token) loading.value = false
  }
}
watch([showPanel, bannerId, () => props.project.logo?.src, () => props.project.logo?.onDarkSrc], build, { immediate: true })

const groups = computed(() => {
  const g = new Map()
  for (const it of items.value) g.set(it.group, [...(g.get(it.group) || []), it])
  return [...g.entries()].map(([name, list]) => ({ name, list }))
})
const chosen = computed(() => items.value.filter((i) => picked.value.has(i.id)))
const fileCount = computed(() => chosen.value.reduce((n, i) => n + (i.retina ? 2 : 1), 0))
function toggle(id) {
  const next = new Set(picked.value)
  next.has(id) ? next.delete(id) : next.add(id)
  picked.value = next
}
const allPicked = computed(() => items.value.length && picked.value.size === items.value.length)
function toggleAll() { picked.value = new Set(allPicked.value ? [] : items.value.map((i) => i.id)) }

// What the concept is: which set and variation, which logo look.
const concept = computed(() => {
  const b = banner.value
  if (!b) return null
  const set = props.project.sets?.find((x) => x.id === b.setId)
  const k = set ? setBanners(props.project, set.id).findIndex((x) => x.id === b.id) + 1 : 0
  return { thumb: b.src, title: set ? `Set ${set.n} · Variation ${k}` : 'Banner', prompt: set?.prompt || b.prompt }
})

async function download(it) {
  const base = it.file.split('/').pop()
  if (it.text != null) saveText(it.text, base)
  else await saveCanvas(it.canvas, base, it.type || 'image/png', it.type === 'image/jpeg' ? 0.9 : undefined)
}
async function exportZip() {
  exporting.value = true
  done.value = ''
  const entries = zipEntries(chosen.value)
  entries.push({ name: 'README.txt', text: `${props.project.name}\nExported from Banner Lab Studio.\n\nConcept: ${concept.value?.title || ''}\nPrompt: ${concept.value?.prompt || props.project.prompt}\nLogo look: ${lookLabel.value || 'original'}\n` })
  await saveZip(entries, `${slug(props.project.name)}-presto.zip`)
  exporting.value = false
  done.value = `Exported ${entries.length - 1} files.`
}
</script>

<template>
  <q-dialog :model-value="modelValue" maximized transition-show="fade" transition-hide="fade" @update:model-value="emit('update:modelValue', $event)">
    <div class="pm">
      <header class="pm__top">
        <q-btn flat round dense icon="close" aria-label="Close preview" @click="emit('update:modelValue', false)" />
        <strong class="pm__title">{{ project.name }}</strong>
        <q-btn unelevated no-caps class="pm__page" :aria-label="`Page: ${current.label}. Change page`">
          <q-icon :name="current.icon" size="18px" />
          <span>{{ current.label }}</span>
          <q-icon name="expand_more" size="18px" class="pm__page-caret" />
          <q-menu anchor="bottom left" self="top left" :offset="[0, 6]" class="pm__page-menu">
            <q-list style="min-width: 280px" role="menu" aria-label="Pages">
              <q-item v-for="p in PAGES" :key="p.id" v-close-popup clickable :active="page === p.id" active-class="pm__page-on" role="menuitemradio" :aria-checked="page === p.id" @click="page = p.id">
                <q-item-section avatar><q-icon :name="p.icon" /></q-item-section>
                <q-item-section>
                  <q-item-label>{{ p.label }}</q-item-label>
                  <q-item-label caption>{{ p.hint }}</q-item-label>
                </q-item-section>
                <q-item-section v-if="page === p.id" side><q-icon name="check" size="18px" /></q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <nav class="pm__seg" aria-label="Device">
          <button type="button" :class="{ 'is-on': device === 'desktop' }" :aria-pressed="device === 'desktop'" @click="device = 'desktop'"><q-icon name="desktop_windows" size="16px" /> Desktop</button>
          <button type="button" :class="{ 'is-on': device === 'phone' }" :aria-pressed="device === 'phone'" @click="device = 'phone'"><q-icon name="smartphone" size="16px" /> Phone</button>
        </nav>
        <span class="pm__spacer" />
        <q-btn unelevated no-caps class="bs-btn" :class="showPanel ? 'bs-btn--ghost' : 'bs-btn--primary'" icon="collections" :label="showPanel ? 'Hide graphics' : 'Graphics & export'" @click="showPanel = !showPanel" />
      </header>

      <div class="pm__body" :class="{ 'has-panel': showPanel }">
        <div class="pm__main">
        <div v-if="project.banners.length" class="pm__strip">
          <span class="pm__strip-label"><q-icon name="wallpaper" size="16px" /> Banner</span>
          <div
            :ref="(el) => (thumbs.el.value = el)" class="pm__strip-row hs" :class="thumbs.classes.value" role="radiogroup" aria-label="Banner for the preview"
            @scroll="thumbs.onScroll" @wheel="thumbs.onWheel" @pointerdown="thumbs.onPointerDown"
          >
            <div v-for="g in strip" :key="g.id" class="pm__set" :title="g.prompt">
              <span v-if="g.label" class="pm__set-name">{{ g.label }}</span>
              <button
                v-for="(b, i) in g.banners" :key="b.id" :ref="(el) => (thumbEls[b.id] = el)" type="button" role="radio" class="pm__bthumb" :class="{ 'is-on': b.id === bannerId }"
                :aria-checked="b.id === bannerId" :aria-label="`${g.label ? g.label + ', ' : ''}variation ${i + 1}`" @click="bannerId = b.id"
              ><img :src="b.src" alt="" draggable="false" /></button>
            </div>
          </div>
        </div>
        <div class="pm__stage">
          <div v-if="device === 'desktop'" class="pm__desktop">
            <BrowserFrame :url="url" :title="`${project.name} · Official Hotels`" :favicon="kit.logo?.src || ''" :favicon-color="kit.colors?.primary" :design-width="1280" :label="`${project.name} booking page`">
              <ScaledFrame :design-width="1280">
                <BrandThemeProvider :brand-kit="kit">
                  <BrandedSite :project="presto" :page="page" :show-demo-notice="false" @navigate="(p) => (page = PAGES.some((x) => x.id === p) ? p : page)" />
                </BrandThemeProvider>
              </ScaledFrame>
            </BrowserFrame>
          </div>
          <!-- Real 390px viewport (iframe preview host): Presto's true phone layouts. -->
          <div v-else class="pm__phone">
            <DevicePreview :project="presto" :page="page" device="mobile" :padding="0" @update:page="(p) => (page = PAGES.some((x) => x.id === p) ? p : page)" />
          </div>
        </div>
        </div>

        <aside v-if="showPanel" class="pm__panel" aria-label="Graphics for this concept">
          <div class="pm__head">
            <p class="bs-subtitle">Graphics for this concept</p>
            <div v-if="concept" class="pm__concept">
              <img :src="concept.thumb" alt="" />
              <span><strong>{{ concept.title }}</strong><small>Logo: {{ lookLabel || 'original colours' }}</small></span>
            </div>
            <p class="bs-caption">The selected logo look at its two Presto banner sizes, and this banner at 1440×400 and 1440×240. Click one to preview it.</p>
          </div>

          <div v-if="loading" class="pm__loading"><q-spinner size="20px" /> Making the graphics…</div>
          <template v-else>
            <section v-for="g in groups" :key="g.name" class="pm__group">
              <p class="pm__gname">{{ g.name }} <span>{{ g.list.length }}</span></p>
              <div v-for="it in g.list" :key="it.id" class="pm__item" :class="{ 'is-off': !picked.has(it.id) }">
                <q-checkbox :model-value="picked.has(it.id)" dense :aria-label="`Include ${it.label}`" @update:model-value="toggle(it.id)" />
                <button type="button" class="pm__thumb" :class="`is-${it.bg}`" :aria-label="`Preview ${it.label}`" @click="lightbox = it">
                  <img :src="it.thumb" alt="" />
                </button>
                <span class="pm__meta">
                  <strong>{{ it.label }}</strong>
                  <small>{{ it.w }}×{{ it.h }} · {{ it.format }}<template v-if="it.retina"> + 2x</template></small>
                  <small class="pm__detail">{{ it.detail }}</small>
                </span>
                <q-btn round flat dense size="sm" icon="download" :aria-label="`Download ${it.label}`" @click="download(it)"><q-tooltip>Download {{ it.file.split('/').pop() }}</q-tooltip></q-btn>
              </div>
            </section>
          </template>

          <div class="pm__actions">
            <button type="button" class="pm__all" @click="toggleAll">{{ allPicked ? 'Clear selection' : 'Select all' }}</button>
            <q-btn unelevated no-caps class="bs-btn bs-btn--primary" icon="download" :label="`Export ZIP · ${fileCount} files`" :loading="exporting" :disable="!fileCount || loading" @click="exportZip" />
            <p v-if="done" class="pm__done" role="status"><q-icon name="check_circle" size="16px" /> {{ done }}</p>
          </div>
        </aside>

        <q-dialog :model-value="!!lightbox" @update:model-value="(v) => { if (!v) lightbox = null }">
          <div v-if="lightbox" class="pm__lb">
            <header class="pm__lb-top">
              <span class="pm__lb-name"><strong>{{ lightbox.label }}</strong><small>{{ lightbox.w }}×{{ lightbox.h }} · {{ lightbox.format }} · {{ lightbox.file.split('/').pop() }}</small></span>
              <q-btn unelevated no-caps dense class="bs-btn bs-btn--ghost" icon="download" label="Download" @click="download(lightbox)" />
              <q-btn v-close-popup round flat dense icon="close" aria-label="Close" />
            </header>
            <div class="pm__lb-art" :class="`is-${lightbox.bg}`"><img :src="lightbox.canvas ? lightbox.canvas.toDataURL(lightbox.type || 'image/png', 0.92) : lightbox.thumb" :alt="lightbox.label" /></div>
          </div>
        </q-dialog>
      </div>
    </div>
  </q-dialog>
</template>

<style scoped>
.pm { display: flex; flex-direction: column; width: 100vw; height: 100vh; background: #e9ebf0; font-family: var(--bs-font); }
.pm__top { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #fff; border-bottom: 1px solid var(--bs-line); }
.pm__top > .q-btn, .pm__top > nav, .pm__title { flex: none; }
@media (max-width: 900px) { .pm__top { flex-wrap: wrap; } }
.pm__title { font-size: 0.9375rem; color: var(--bs-ink); margin-right: 8px; }
.pm__page { min-height: 36px; padding: 0 10px 0 12px; border-radius: 10px; background: var(--bs-surface-2); color: var(--bs-ink); font: 600 0.8125rem var(--bs-font); }
.pm__page :deep(.q-btn__content) { gap: 6px; flex-wrap: nowrap; }
.pm__page-caret { color: var(--bs-ink-soft); }
.pm__seg { display: inline-flex; padding: 3px; border-radius: 10px; background: var(--bs-surface-2); }
.pm__seg button { display: inline-flex; align-items: center; gap: 4px; border: 0; background: transparent; padding: 6px 12px; border-radius: 8px; font: 600 0.8125rem var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.pm__seg button.is-on { background: #fff; color: var(--bs-ink); box-shadow: var(--bs-shadow-1); }
.pm__main { min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.pm__strip { flex: none; display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 28px; background: #f4f5f8; border-bottom: 1px solid var(--bs-line); }
.pm__strip-label { flex: none; display: inline-flex; align-items: center; gap: 6px; font: 600 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
.pm__strip-row { flex: 1; min-width: 0; display: flex; gap: 18px; }
.pm__set { flex: none; display: flex; align-items: center; gap: 6px; padding-right: 18px; border-right: 1px solid var(--bs-line); }
.pm__set:last-child { border-right: 0; padding-right: 0; }
.pm__set-name { font: 700 0.6875rem var(--bs-font); letter-spacing: 0.04em; text-transform: uppercase; color: var(--bs-ink-faint); white-space: nowrap; margin-right: 2px; }
.pm__bthumb { flex: none; width: 122px; height: 34px; padding: 0; border-radius: 6px; border: 2px solid transparent; outline: 1px solid var(--bs-line); outline-offset: -1px; overflow: hidden; cursor: pointer; background: #0b1736; transition: border-color 0.15s, transform 0.15s; }
.pm__bthumb:hover { transform: translateY(-1px); }
.pm__bthumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pm__bthumb.is-on { border-color: var(--bs-accent); outline-color: transparent; }
.pm__spacer { flex: 1; }
.pm__body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr; }
.pm__body.has-panel { grid-template-columns: minmax(0, 1fr) 400px; }
.pm__stage { flex: 1; min-height: 0; overflow: auto; padding: 28px; }
.pm__desktop { max-width: 1280px; margin: 0 auto; }
.pm__phone { height: calc(100vh - 186px); min-height: 520px; }
.pm__panel { background: #fff; border-left: 1px solid var(--bs-line); padding: 18px 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
.pm__head { display: grid; gap: 8px; }
.pm__head .bs-caption { margin: 0; }
.pm__concept { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 12px; background: var(--bs-surface-2); }
.pm__concept img { width: 92px; height: 26px; object-fit: cover; border-radius: 4px; }
.pm__concept > span { display: grid; min-width: 0; font-size: 0.8125rem; }
.pm__concept small { color: var(--bs-ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pm__loading { display: flex; align-items: center; gap: 10px; padding: 30px 0; justify-content: center; color: var(--bs-ink-soft); font-size: 0.875rem; }
.pm__group { display: grid; gap: 4px; }
.pm__gname { margin: 0 0 2px; display: flex; align-items: center; gap: 6px; font: 700 0.6875rem var(--bs-font); letter-spacing: 0.06em; text-transform: uppercase; color: var(--bs-ink-faint); }
.pm__gname span { padding: 0 6px; border-radius: 999px; background: var(--bs-surface-2); color: var(--bs-ink-soft); }
.pm__item { display: grid; grid-template-columns: auto 84px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 6px; border-radius: 10px; }
.pm__item:hover { background: var(--bs-surface-2); }
.pm__item.is-off .pm__thumb, .pm__item.is-off .pm__meta { opacity: 0.45; }
.pm__thumb { position: relative; height: 52px; padding: 0; border: 1px solid var(--bs-line); border-radius: 8px; overflow: hidden; cursor: zoom-in; }
.pm__thumb.is-light { background: repeating-conic-gradient(#eceef2 0% 25%, #fff 0% 50%) 50% / 10px 10px; }
.pm__thumb.is-dark { background: #0b1736; }
.pm__thumb img { position: absolute; inset: 6%; width: 88%; height: 88%; object-fit: contain; }
.pm__meta { display: grid; gap: 1px; min-width: 0; font-size: 0.8125rem; color: var(--bs-ink); }
.pm__meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.pm__meta small { color: var(--bs-ink-soft); font-size: 0.75rem; }
.pm__meta .pm__detail { color: var(--bs-ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pm__actions { position: sticky; bottom: -18px; display: grid; gap: 8px; margin: auto -16px -18px; padding: 12px 16px 16px; background: #fff; border-top: 1px solid var(--bs-line); }
.pm__all { justify-self: start; border: 0; background: none; padding: 0; font: 600 0.8125rem var(--bs-font); color: var(--bs-accent); cursor: pointer; }
.pm__done { margin: 0; display: flex; align-items: center; gap: 6px; font: 600 0.8125rem var(--bs-font); color: var(--bs-success); }
.pm__lb { width: min(1100px, calc(100vw - 48px)); max-width: none !important; background: #fff; border-radius: 16px; overflow: hidden; font-family: var(--bs-font); }
.pm__lb-top { display: flex; align-items: center; gap: 10px; padding: 12px 14px 12px 18px; border-bottom: 1px solid var(--bs-line); }
.pm__lb-name { flex: 1; display: grid; font-size: 0.9375rem; }
.pm__lb-name small { color: var(--bs-ink-soft); font-size: 0.75rem; }
.pm__lb-art { display: grid; place-items: center; padding: 32px; min-height: 320px; max-height: calc(100vh - 160px); }
.pm__lb-art.is-light { background: repeating-conic-gradient(#eceef2 0% 25%, #fff 0% 50%) 50% / 18px 18px; }
.pm__lb-art.is-dark { background: #0b1736; }
.pm__lb-art img { max-width: 100%; max-height: calc(100vh - 230px); object-fit: contain; image-rendering: auto; }
</style>

<style>
/* The page menu renders outside this component (Quasar portal). */
.pm__page-on { color: var(--bs-ink); background: var(--bs-surface-2); font-weight: 600; }
</style>
