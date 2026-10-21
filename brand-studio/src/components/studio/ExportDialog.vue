<script setup>
// ExportDialog — the asset preview sheet. Renders every exportable file
// (export/assetPackage.js) to its real pixels first, so what you see is exactly
// what's zipped: Presto banner backgrounds (1440×400, 1440×240), banner
// previews with logo + copy, sponsor display ads, and the brand kit. Pick
// files, then "Download ZIP".
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { buildAssetPackage, packageZip, downloadBlob, EXPORT_GROUPS } from '../../export/assetPackage.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  project: { type: Object, required: true },
  // Inline (stories) instead of a maximized dialog.
  inline: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'downloaded'])

const pkg = ref({ slug: 'event', items: [] })
const blobs = new Map()
const urls = ref({}) // id → object URL
const sizes = ref({}) // id → bytes
const failed = ref({}) // id → message
const selected = ref(new Set())
const rendering = ref(false)
const zipping = ref(false)
let run = 0

const done = computed(() => Object.keys(sizes.value).length + Object.keys(failed.value).length)
const total = computed(() => pkg.value.items.length)
const chosen = computed(() => pkg.value.items.filter((it) => selected.value.has(it.id) && !failed.value[it.id]))
const chosenBytes = computed(() => chosen.value.reduce((n, it) => n + (sizes.value[it.id] || 0), 0))
const groups = computed(() =>
  EXPORT_GROUPS.map((g) => ({ ...g, items: pkg.value.items.filter((it) => it.group === g.id) })).filter((g) => g.items.length || g.id === 'ads'),
)
const zipName = computed(() => `${pkg.value.slug}-brand-assets.zip`)

function clearRendered() {
  Object.values(urls.value).forEach((u) => URL.revokeObjectURL(u))
  blobs.clear()
  urls.value = {}
  sizes.value = {}
  failed.value = {}
}

async function renderAll() {
  const id = ++run
  clearRendered()
  // Snapshot: edits made while the sheet is open don't change files mid-render.
  pkg.value = buildAssetPackage(JSON.parse(JSON.stringify(props.project)))
  selected.value = new Set(pkg.value.items.map((it) => it.id))
  rendering.value = true
  for (const it of pkg.value.items) {
    try {
      const blob = await it.render()
      if (id !== run) return
      blobs.set(it.id, blob)
      sizes.value = { ...sizes.value, [it.id]: blob.size }
      if (it.preview) urls.value = { ...urls.value, [it.id]: URL.createObjectURL(blob) }
    } catch (e) {
      if (id !== run) return
      failed.value = { ...failed.value, [it.id]: e.message || 'Could not render' }
    }
  }
  if (id === run) rendering.value = false
}

const active = computed(() => props.inline || props.modelValue)
watch(active, (open) => { if (open) renderAll(); else { run++; clearRendered() } }, { immediate: true })
onBeforeUnmount(() => { run++; clearRendered() })

function toggle(id) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}
const allOn = computed(() => chosen.value.length === pkg.value.items.filter((it) => !failed.value[it.id]).length)
function toggleAll() {
  selected.value = allOn.value ? new Set() : new Set(pkg.value.items.map((it) => it.id))
}

async function download() {
  if (!chosen.value.length || rendering.value) return
  zipping.value = true
  try {
    const zip = await packageZip(chosen.value, blobs)
    downloadBlob(zip, zipName.value)
    emit('downloaded', { name: zipName.value, files: chosen.value.map((it) => it.path), bytes: zip.size })
  } finally {
    zipping.value = false
  }
}

const fileName = (it) => (it.resolvePath && blobs.get(it.id) ? it.resolvePath(blobs.get(it.id)) : it.path).split('/').pop()
function fmtBytes(n) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <component
    :is="inline ? 'div' : 'q-dialog'"
    :model-value="modelValue"
    maximized
    transition-show="fade"
    transition-hide="fade"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <section class="exd" :class="{ 'exd--inline': inline }" role="region" aria-labelledby="exd-title">
      <header class="exd__head">
        <div class="exd__title">
          <p class="bs-eyebrow">Export</p>
          <h2 id="exd-title" class="bs-title">Asset preview sheet</h2>
          <p class="bs-caption">
            Every file below is rendered at its real size; this is exactly what goes in
            <strong>{{ zipName }}</strong>.
          </p>
        </div>
        <q-btn v-if="!inline" v-close-popup flat round dense icon="close" aria-label="Close export" />
      </header>

      <div class="exd__body">
        <section v-for="g in groups" :key="g.id" class="exd__group" :aria-labelledby="`exd-g-${g.id}`">
          <div class="exd__group-head">
            <h3 :id="`exd-g-${g.id}`" class="exd__group-title">{{ g.label }} <span>{{ g.items.length }}</span></h3>
            <p class="bs-caption">{{ g.hint }}</p>
          </div>

          <p v-if="!g.items.length" class="exd__empty bs-caption">
            <q-icon name="campaign" size="18px" /> No sponsor ads are placed yet. Add sponsors in the <strong>Ads</strong> panel to include them.
          </p>

          <ul class="exd__grid" :class="`exd__grid--${g.id}`">
            <li v-for="it in g.items" :key="it.id" class="exd__item" :class="[`exd__item--${it.kind || 'image'}`, { 'is-off': !selected.has(it.id) }]">
              <label class="exd__check">
                <input type="checkbox" :checked="selected.has(it.id)" :disabled="!!failed[it.id]" :aria-label="`Include ${it.path}`" @change="toggle(it.id)" />
                <span class="exd__name">{{ it.label }}</span>
                <span v-if="it.width" class="exd__dims">{{ it.width }}×{{ it.height }}</span>
              </label>

              <div
                class="exd__thumb"
                :class="{ 'exd__thumb--logo': it.kind === 'logo', 'exd__thumb--dark': it.dark, 'exd__thumb--file': !it.preview }"
                :style="it.width && it.preview && it.kind !== 'logo' ? { aspectRatio: `${it.width} / ${it.height}`, maxWidth: g.id === 'ads' ? `${it.width}px` : undefined } : undefined"
              >
                <img v-if="urls[it.id]" :src="urls[it.id]" :alt="`${it.label} preview`" />
                <span v-else-if="failed[it.id]" class="exd__err"><q-icon name="error_outline" /> {{ failed[it.id] }}</span>
                <span v-else-if="!it.preview" class="exd__file"><q-icon :name="it.kind === 'json' ? 'data_object' : 'description'" size="26px" /></span>
                <q-skeleton v-else class="exd__skel" square animation="wave" />
              </div>

              <p class="exd__path" :title="it.path">{{ fileName(it) }} <span v-if="sizes[it.id]">· {{ fmtBytes(sizes[it.id]) }}</span></p>
            </li>
          </ul>
        </section>
      </div>

      <footer class="exd__foot">
        <button type="button" class="exd__all bs-focusable" @click="toggleAll">{{ allOn ? 'Select none' : 'Select all' }}</button>
        <span class="exd__status" aria-live="polite">
          <template v-if="rendering"><q-spinner size="16px" /> Rendering {{ done }} of {{ total }}…</template>
          <template v-else>{{ chosen.length }} of {{ total }} files · {{ fmtBytes(chosenBytes) }}</template>
        </span>
        <q-btn
          unelevated no-caps
          class="bs-btn bs-btn--lg bs-btn--primary"
          icon="folder_zip"
          :label="`Download ZIP (${chosen.length} ${chosen.length === 1 ? 'file' : 'files'})`"
          :loading="zipping"
          :disable="rendering || !chosen.length"
          data-export-download
          @click="download"
        />
      </footer>
    </section>
  </component>
</template>

<style scoped>
/* Quasar only re-enables pointer events on `.q-dialog__inner > div`; this root is a <section>. */
.exd { pointer-events: all; display: flex; flex-direction: column; width: 100vw; height: 100vh; height: 100dvh; background: var(--bs-canvas); font-family: var(--bs-font); color: var(--bs-ink); }
.exd--inline { width: 100%; height: auto; min-height: 100vh; }
.exd__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 20px clamp(16px, 3vw, 40px) 12px; border-bottom: 1px solid var(--bs-line); background: var(--bs-surface); }
.exd__title .bs-title { margin-top: 4px; }
.exd__title .bs-caption { margin-top: 4px; }
.exd__body { flex: 1; overflow: auto; padding: 8px clamp(16px, 3vw, 40px) 32px; }
.exd__group { max-width: 1280px; margin: 0 auto; padding-top: 24px; }
.exd__group-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.exd__group-title { margin: 0; font: 700 1.0625rem var(--bs-font); }
.exd__group-title span { font-weight: 400; color: var(--bs-ink-soft); margin-left: 4px; }
.exd__empty { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border: 1.5px dashed var(--bs-line-strong); border-radius: var(--bs-radius-md); }

.exd__grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.exd__grid--banners, .exd__grid--previews { grid-template-columns: 1fr; }
.exd__grid--ads { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 20px; }
.exd__grid--brand { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.exd__item { display: grid; gap: 6px; min-width: 0; transition: opacity 120ms ease; }
.exd__grid--ads .exd__item { max-width: 100%; }
.exd__item.is-off { opacity: 0.45; }
.exd__check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.875rem; min-width: 0; }
.exd__check input { width: 16px; height: 16px; accent-color: var(--bs-accent); flex: none; }
.exd__name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.exd__dims { color: var(--bs-ink-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
.exd__thumb { position: relative; width: 100%; overflow: hidden; border-radius: 4px; background: var(--bs-surface); box-shadow: 0 0 0 1px var(--bs-line); }
.exd__thumb img { display: block; width: 100%; height: 100%; object-fit: contain; }
.exd__thumb--logo { aspect-ratio: 4 / 3; padding: 16px; background: repeating-conic-gradient(#EEF1F5 0% 25%, #fff 0% 50%) 50% / 16px 16px; }
.exd__thumb--dark { background: #0F172A; }
.exd__thumb--file { aspect-ratio: 4 / 3; display: grid; place-items: center; color: var(--bs-ink-soft); }
.exd__skel { position: absolute; inset: 0; width: 100%; height: 100%; }
.exd__err { position: absolute; inset: 0; display: grid; place-items: center; padding: 8px; color: var(--ds-color-text-danger, #B91C1C); font-size: 0.8125rem; text-align: center; }
.exd__path { margin: 0; font: 400 0.75rem/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--bs-ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.exd__foot { display: flex; align-items: center; gap: 16px; padding: 12px clamp(16px, 3vw, 40px); padding-bottom: calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid var(--bs-line); background: var(--bs-surface); }
.exd__all { border: 0; background: none; padding: 6px 4px; font: 700 0.875rem var(--bs-font); color: var(--bs-accent); cursor: pointer; }
.exd__status { flex: 1; display: inline-flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 0.875rem; color: var(--bs-ink-soft); }
.exd--inline .exd__foot { position: sticky; bottom: 0; }

@media (max-width: 600px) {
  .exd__foot { flex-wrap: wrap; gap: 8px; }
  .exd__status { order: -1; flex-basis: 100%; justify-content: flex-start; }
  .exd__foot .bs-btn--lg { flex: 1; }
}
@media (prefers-reduced-motion: reduce) { .exd__item { transition: none; } }
</style>
