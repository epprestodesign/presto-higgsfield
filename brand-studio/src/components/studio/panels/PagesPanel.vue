<script setup>
// PagesPanel — which pages the demo includes and their page-level settings.
// Checkout + confirmation are simulated screens: they never take payment.
import { computed } from 'vue'
import { useProjectStore } from '../../../stores/project.js'
import { PAGE_IDS, PAGE_META } from '../../../models/pageConfig.js'
import { HOTELS } from '../../../data/upstream/hotels.js'
import PanelGroup from './PanelGroup.vue'

const emit = defineEmits(['focus-page'])
const store = useProjectStore()
const pages = computed(() => store.pages)

const RESULT_STATES = [
  { value: 'full', label: 'Full results' },
  { value: 'partial', label: 'Partial matches' },
  { value: 'empty', label: 'No results' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]
const hotelOptions = HOTELS.slice(0, 12).map((h, i) => ({ value: i, label: h.name, caption: `${h.city} · ${h.stars}★` }))
</script>

<template>
  <div class="pp">
    <PanelGroup title="Pages in this demo">
      <ul class="pp__list">
        <li v-for="id in PAGE_IDS" :key="id" class="pp__page">
          <q-icon :name="PAGE_META[id].icon" size="20px" class="pp__icon" />
          <div class="pp__page-text">
            <span class="pp__page-name">{{ PAGE_META[id].label }}</span>
            <span v-if="PAGE_META[id].required" class="pp__page-sub">Always included</span>
            <span v-else class="pp__page-sub">Shows the flow; never takes payment</span>
          </div>
          <q-btn
            flat round dense size="sm" icon="visibility"
            :disable="!pages[id].enabled"
            :aria-label="`Preview ${PAGE_META[id].label}`"
            class="pp__view"
            @click="emit('focus-page', id)"
          />
          <q-icon v-if="PAGE_META[id].required" name="lock" size="16px" class="pp__lock" aria-hidden="true" />
          <q-toggle
            v-else
            :model-value="pages[id].enabled"
            dense
            size="sm"
            :aria-label="`Include ${PAGE_META[id].label}`"
            @update:model-value="(v) => store.updatePage(id, { enabled: v })"
          />
        </li>
      </ul>
    </PanelGroup>

    <PanelGroup title="Browse hotels">
      <template #actions>
        <q-btn flat no-caps dense size="sm" label="View" icon-right="arrow_forward" class="pp__link" @click="emit('focus-page', 'browse')" />
      </template>
      <q-input :model-value="pages.browse.cardCta" outlined dense label="Hotel card button" maxlength="28" @update:model-value="(v) => store.updatePage('browse', { cardCta: v })" />
      <q-select
        :model-value="pages.browse.resultsState"
        :options="RESULT_STATES"
        emit-value
        map-options
        outlined
        dense
        options-dense
        label="Results state to preview"
        hint="Show organizers how empty, loading and error states look"
        @update:model-value="(v) => store.updatePage('browse', { resultsState: v })"
      />
    </PanelGroup>

    <PanelGroup title="Hotel details">
      <template #actions>
        <q-btn flat no-caps dense size="sm" label="View" icon-right="arrow_forward" class="pp__link" @click="emit('focus-page', 'details')" />
      </template>
      <q-select
        :model-value="pages.details.hotelIndex"
        :options="hotelOptions"
        emit-value
        map-options
        outlined
        dense
        options-dense
        label="Featured sample hotel"
        @update:model-value="(v) => store.updatePage('details', { hotelIndex: v })"
      >
        <template #option="{ itemProps, opt, selected }">
          <q-item v-bind="itemProps" :active="selected">
            <q-item-section>
              <q-item-label>{{ opt.label }}</q-item-label>
              <q-item-label caption>{{ opt.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input :model-value="pages.details.roomsTitle" outlined dense label="Rooms heading" @update:model-value="(v) => store.updatePage('details', { roomsTitle: v })" />
    </PanelGroup>

    <div class="pp__notice" role="note">
      <q-icon name="info" size="18px" />
      <p>Sample hotels, rooms and rates are for demonstration. Published demos never show live availability or accept bookings.</p>
    </div>
  </div>
</template>

<style scoped>
.pp { font-family: var(--bs-font); }
.pp :deep(.q-field--outlined .q-field__control) { border-radius: var(--bs-radius-sm); }
.pp__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.pp__page { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto auto; align-items: center; gap: 8px; padding: 8px 4px 8px 6px; border-radius: var(--bs-radius-sm); }
.pp__page:hover { background: var(--bs-surface-2); }
.pp__icon { color: var(--bs-ink-soft); }
.pp__page-text { display: flex; flex-direction: column; min-width: 0; }
.pp__page-name { font: 700 0.875rem/1.25 var(--bs-font); color: var(--bs-ink); }
.pp__page-sub { font: 400 0.75rem/1.3 var(--bs-font); color: var(--bs-ink-soft); }
.pp__view { color: var(--bs-ink-soft); }
.pp__lock { color: var(--bs-ink-faint); margin: 0 10px 0 6px; }
.pp__link { color: var(--bs-brand); font-size: 0.75rem; }
.pp__notice { display: flex; gap: 8px; margin: 12px 16px 20px; padding: 10px 12px; border-radius: var(--bs-radius-md); background: var(--bs-surface-2); color: var(--bs-ink-soft); }
.pp__notice p { margin: 0; font: 400 0.8125rem/1.45 var(--bs-font); }
.pp__notice .q-icon { flex: none; margin-top: 1px; }
</style>
