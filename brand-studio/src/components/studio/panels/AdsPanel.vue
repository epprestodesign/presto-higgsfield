<script setup>
// AdsPanel — sponsored advertising: master switch, per-page layout preset
// (schematic thumbnails), and the sponsor roster. Visual simulation only.
import { computed } from 'vue'
import { useProjectStore } from '../../../stores/project.js'
import { AD_LAYOUT_PRESETS } from '../../../models/ads.js'
import PanelGroup from './PanelGroup.vue'
import AdPresetThumb from './AdPresetThumb.vue'

const emit = defineEmits(['edit-sponsors', 'focus-page'])
const store = useProjectStore()
const ads = computed(() => store.ads)

const PAGES = [
  { id: 'landing', label: 'Event landing' },
  { id: 'browse', label: 'Browse hotels' },
  { id: 'details', label: 'Hotel details' },
]

const host = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return 'No link yet' }
}

function onPresetKey(e, page, i) {
  const list = AD_LAYOUT_PRESETS[page]
  const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (delta === undefined) return
  e.preventDefault()
  const j = (i + delta + list.length) % list.length
  store.applyAdPreset(page, list[j].id)
  e.currentTarget.parentElement.children[j]?.focus()
}
</script>

<template>
  <div class="ap">
    <PanelGroup title="Sponsored ads">
      <div class="ap__master">
        <div>
          <p class="ap__master-title">Show sponsor placements</p>
          <p class="ap__sub">Every unit is labelled “Sponsored”. Demo only — no ad server or tracking.</p>
        </div>
        <q-toggle :model-value="ads.enabled" aria-label="Show sponsor placements" @update:model-value="store.setAdsEnabled" />
      </div>
    </PanelGroup>

    <div :class="{ 'ap__disabled': !ads.enabled }" :aria-disabled="!ads.enabled">
      <PanelGroup v-for="pg in PAGES" :key="pg.id" :title="pg.label">
        <template #actions>
          <q-btn flat no-caps dense size="sm" label="View" icon-right="arrow_forward" class="ap__link" @click="emit('focus-page', pg.id)" />
        </template>
        <div class="ap__presets" role="radiogroup" :aria-label="`${pg.label} ad layout`">
          <button
            v-for="(preset, i) in AD_LAYOUT_PRESETS[pg.id]"
            :key="preset.id"
            type="button"
            role="radio"
            class="ap__preset bs-focusable"
            :class="{ 'is-selected': ads.presets[pg.id] === preset.id }"
            :aria-checked="ads.presets[pg.id] === preset.id"
            :tabindex="ads.presets[pg.id] === preset.id ? 0 : -1"
            :disabled="!ads.enabled"
            @click="store.applyAdPreset(pg.id, preset.id)"
            @keydown="onPresetKey($event, pg.id, i)"
          >
            <AdPresetThumb :page="pg.id" :placements="preset.placements" />
            <span class="ap__preset-label">{{ preset.label }}</span>
          </button>
        </div>
      </PanelGroup>
    </div>

    <PanelGroup title="Sponsors">
      <template #actions>
        <q-btn flat no-caps dense size="sm" icon="edit" label="Edit sponsors" class="ap__link" @click="emit('edit-sponsors')" />
      </template>
      <ul v-if="ads.sponsors.length" class="ap__sponsors">
        <li v-for="s in ads.sponsors" :key="s.id" class="ap__sponsor">
          <span class="ap__logo" :style="{ background: s.colors?.background }">
            <img v-if="s.logo" :src="s.logo.src" alt="" />
            <span v-else>{{ (s.name || '?').charAt(0) }}</span>
          </span>
          <div class="ap__sponsor-text">
            <span class="ap__sponsor-name">{{ s.name || 'Untitled sponsor' }}</span>
            <span class="ap__sub">{{ host(s.url) }}</span>
          </div>
          <q-btn flat round dense size="sm" icon="delete_outline" class="ap__remove" :aria-label="`Remove ${s.name}`" @click="store.removeSponsor(s.id)">
            <q-tooltip>Remove sponsor</q-tooltip>
          </q-btn>
        </li>
      </ul>
      <div v-else class="ap__empty">
        <q-icon name="campaign" size="24px" />
        <p>No sponsors yet. Add one to fill your ad placements.</p>
        <q-btn unelevated no-caps class="bs-btn bs-btn--ghost ap__add" icon="add" label="Add sponsor" @click="emit('edit-sponsors')" />
      </div>
    </PanelGroup>
  </div>
</template>

<style scoped>
.ap { font-family: var(--bs-font); }
.ap__master { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ap__master-title { margin: 0; font: 700 0.875rem/1.3 var(--bs-font); color: var(--bs-ink); }
.ap__sub { margin: 2px 0 0; font: 400 0.75rem/1.4 var(--bs-font); color: var(--bs-ink-soft); }
.ap__disabled { opacity: 0.5; }
.ap__link { color: var(--bs-brand); font-size: 0.75rem; }
.ap__presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 8px; }
.ap__preset { display: flex; flex-direction: column; gap: 6px; padding: 8px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: var(--bs-surface); cursor: pointer; text-align: left; transition: border-color var(--ds-duration-fast), box-shadow var(--ds-duration-fast); }
.ap__preset:hover:not(:disabled) { border-color: var(--bs-line-strong); }
.ap__preset.is-selected { border-color: var(--bs-brand); box-shadow: 0 0 0 1px var(--bs-brand); }
.ap__preset:disabled { cursor: not-allowed; }
.ap__preset-label { font: 700 0.75rem/1.3 var(--bs-font); color: var(--bs-ink); }
.ap__sponsors { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.ap__sponsor { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 6px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); }
.ap__logo { width: 36px; height: 36px; border-radius: var(--bs-radius-sm); display: grid; place-items: center; overflow: hidden; color: #fff; font-weight: 700; }
.ap__logo img { width: 100%; height: 100%; object-fit: contain; }
.ap__sponsor-text { display: flex; flex-direction: column; min-width: 0; }
.ap__sponsor-name { font: 700 0.875rem/1.25 var(--bs-font); color: var(--bs-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ap__remove { color: var(--bs-ink-faint); }
.ap__remove:hover { color: var(--bs-danger); }
.ap__empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 16px; border: 1px dashed var(--bs-line-strong); border-radius: var(--bs-radius-md); color: var(--bs-ink-soft); }
.ap__empty p { margin: 0; font: 400 0.8125rem/1.4 var(--bs-font); }
.q-btn.ap__add { min-height: 34px; font-size: 0.8125rem; margin-top: 4px; }
</style>
