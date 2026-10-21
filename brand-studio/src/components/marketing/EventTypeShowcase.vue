<script setup>
// EventTypeShowcase — one booking engine, any kind of event. Tabs swap the
// live, themed preview between the four sample events.
import { ref, computed, nextTick } from 'vue'
import ProductPreview from './ProductPreview.vue'
import { SAMPLE_EVENTS } from '../../data/sampleEvents.js'
import { getDirection } from '../../models/brandKit.js'
import { getFont } from '../../theme/fonts.js'
import { formatDateRange, locationLabel } from '../../models/event.js'

const emit = defineEmits(['sample'])

const TABS = [
  { key: 'heartland', label: 'Sports tournaments', icon: 'sports_soccer', blurb: 'Team blocks, family rooms and urgency-driven design for club tournaments and leagues.' },
  { key: 'fintech', label: 'Conferences', icon: 'groups', blurb: 'Negotiated attendee rates near the convention center, presented with your conference brand.' },
  { key: 'wedding', label: 'Weddings', icon: 'favorite', blurb: 'An elegant guest page with your monogram, held rooms and a calm, editorial feel.' },
  { key: 'lakeshore', label: 'Races & festivals', icon: 'directions_run', blurb: 'Bold race-weekend branding with sponsor placements built in.' },
]

const active = ref('heartland')
const tabRefs = ref([])
const current = computed(() => SAMPLE_EVENTS.find((s) => s.key === active.value))
const tab = computed(() => TABS.find((t) => t.key === active.value))

const swatches = computed(() => {
  const c = current.value.brandKit.colors
  return [
    { label: 'Primary', hex: c.primary },
    { label: 'Secondary', hex: c.secondary },
    { label: 'Accent', hex: c.accent },
  ]
})

// Roving tabindex + arrow-key navigation (WAI-ARIA tabs pattern).
const onKey = (e, i) => {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!dir && e.key !== 'Home' && e.key !== 'End') return
  e.preventDefault()
  const n = TABS.length
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (i + dir + n) % n
  active.value = TABS[next].key
  nextTick(() => tabRefs.value[next]?.focus())
}
</script>

<template>
  <section id="examples" class="ets" aria-labelledby="ets-title">
    <div class="ets__head">
      <p class="bs-eyebrow">One booking engine, every event</p>
      <h2 id="ets-title" class="bs-display-2">Made for the way your attendees travel.</h2>
    </div>

    <div class="ets__tabs" role="tablist" aria-label="Event types">
      <button
        v-for="(t, i) in TABS"
        :id="`ets-tab-${t.key}`"
        :key="t.key"
        :ref="(el) => (tabRefs[i] = el)"
        type="button"
        role="tab"
        class="ets__tab bs-focusable"
        :class="{ 'is-active': active === t.key }"
        :aria-selected="active === t.key ? 'true' : 'false'"
        :aria-controls="'ets-panel'"
        :tabindex="active === t.key ? 0 : -1"
        @click="active = t.key"
        @keydown="onKey($event, i)"
      >
        <q-icon :name="t.icon" size="20px" /> {{ t.label }}
      </button>
    </div>

    <div id="ets-panel" class="ets__panel" role="tabpanel" :aria-labelledby="`ets-tab-${active}`">
      <div class="ets__preview">
        <transition name="ets-fade" mode="out-in">
          <div :key="active">
            <product-preview class="ets__desk" :sample="active" variant="desktop" :design-height="760" />
            <div class="ets__phone"><product-preview :sample="active" variant="mobile" :design-height="700" /></div>
          </div>
        </transition>
      </div>

      <aside class="ets__meta bs-card">
        <img :src="current.brandKit.logo.src" :alt="current.brandKit.logo.alt" class="ets__logo" />
        <h3 class="bs-title">{{ current.event.name }}</h3>
        <p class="bs-caption ets__when">{{ formatDateRange(current.event.startDate, current.event.endDate) }} · {{ locationLabel(current.event) }}</p>
        <p class="bs-body">{{ tab.blurb }}</p>

        <dl class="ets__facts">
          <div>
            <dt>Direction</dt>
            <dd>{{ getDirection(current.brandKit.direction).name }}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{{ getFont(current.brandKit.typography.heading).label }} / {{ getFont(current.brandKit.typography.body).label }}</dd>
          </div>
          <div>
            <dt>Palette</dt>
            <dd class="ets__swatches">
              <span v-for="s in swatches" :key="s.label" class="ets__swatch" :style="{ background: s.hex }" :title="`${s.label} ${s.hex}`">
                <span class="bs-sr-only">{{ s.label }} {{ s.hex }}</span>
              </span>
            </dd>
          </div>
        </dl>

        <q-btn unelevated no-caps class="bs-btn bs-btn--ghost ets__cta" icon-right="arrow_forward" :label="`Open this sample`" @click="emit('sample', active)" />
      </aside>
    </div>
  </section>
</template>

<style scoped>
.ets { max-width: 1240px; margin: 0 auto; padding: clamp(64px, 9vw, 120px) 24px 0; }
.ets__head { max-width: 720px; display: grid; gap: 14px; margin-bottom: 32px; }
.ets__tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.ets__tab {
  display: inline-flex; align-items: center; gap: 8px;
  min-height: 44px; padding: 0 18px;
  border-radius: 999px; border: 1px solid var(--bs-line-strong);
  background: var(--bs-surface); color: var(--bs-ink-soft);
  font: 700 0.9375rem/1 var(--bs-font); cursor: pointer;
  transition: background var(--ds-duration-fast) var(--ds-ease-standard), color var(--ds-duration-fast);
}
.ets__tab:hover { color: var(--bs-ink); border-color: var(--bs-ink-faint); }
.ets__tab.is-active { background: var(--bs-ink); color: #fff; border-color: var(--bs-ink); }

.ets__panel { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 28px; align-items: start; }
.ets__meta { padding: 24px; display: grid; gap: 12px; }
.ets__logo { height: 72px; width: auto; max-width: 220px; object-fit: contain; object-position: left; }
.ets__when { margin-top: -4px; }
.ets__facts { margin: 6px 0 0; display: grid; gap: 10px; border-top: 1px solid var(--bs-line); padding-top: 14px; }
.ets__facts div { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ets__facts dt { font: 400 0.8125rem/1 var(--bs-font); color: var(--bs-ink-soft); }
.ets__facts dd { margin: 0; font: 700 0.875rem/1.2 var(--bs-font); color: var(--bs-ink); text-align: right; }
.ets__swatches { display: flex; gap: 6px; }
.ets__swatch { width: 22px; height: 22px; border-radius: 6px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12); }
.ets__cta { margin-top: 6px; justify-self: start; }

.ets__phone { display: none; }
.ets-fade-enter-active, .ets-fade-leave-active { transition: opacity var(--ds-duration-base) var(--ds-ease-standard); }
.ets-fade-enter-from, .ets-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .ets-fade-enter-active, .ets-fade-leave-active { transition: none; } }

@media (max-width: 960px) {
  .ets__panel { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .ets { padding-inline: 16px; }
  .ets__tabs { flex-wrap: nowrap; overflow-x: auto; margin-inline: -16px; padding: 2px 16px 6px; scrollbar-width: none; }
  .ets__tab { flex: none; }
  .ets__desk { display: none; }
  .ets__phone { display: block; width: min(300px, 86%); margin: 0 auto; }
}
</style>
