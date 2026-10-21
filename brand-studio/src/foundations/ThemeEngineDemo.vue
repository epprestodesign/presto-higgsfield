<script setup>
// Interactive demo of the brand theme engine: pick a Brand Kit (or edit its
// colors / fonts) and watch real, unmodified Presto components re-skin.
import { computed, reactive, watch } from 'vue'
import BrandThemeProvider from '../theme/BrandThemeProvider.vue'
import { brandThemeVars, paletteChecks } from '../theme/brandTheme.js'
import { FONT_OPTIONS } from '../theme/fonts.js'
import { SAMPLE_EVENTS } from '../data/sampleEvents.js'
import BookingWidget from '@lib/components/BookingWidget.vue'
import HotelCardGroup from '@lib/components/browse/HotelCardGroup.vue'
import BrandHero from '../components/brand/BrandHero.vue'
import { formatDateRange, locationLabel } from '../models/event.js'

const props = defineProps({ sample: { type: String, default: 'lakeshore' } })

const kit = reactive({ colors: {}, typography: {}, logo: null, logoOnDark: null, imagery: [], heroImageId: null })
const current = computed(() => SAMPLE_EVENTS.find((e) => e.key === kit.key) || SAMPLE_EVENTS[0])
const load = (key) => {
  const s = SAMPLE_EVENTS.find((e) => e.key === key) || SAMPLE_EVENTS[0]
  Object.assign(kit, JSON.parse(JSON.stringify(s.brandKit)), { key })
}
watch(() => props.sample, load, { immediate: true })

const ROLES = [
  { id: 'primary', label: 'Primary' },
  { id: 'secondary', label: 'Secondary' },
  { id: 'accent', label: 'Accent' },
]
const checks = computed(() => paletteChecks(kit.colors))
const vars = computed(() => brandThemeVars(kit))
const tokenRows = computed(() =>
  ['--ds-color-background-brand-bold', '--ds-color-text-brand', '--ds-color-background-selected', '--q-primary', '--q-secondary', '--brand-font-heading'].map((k) => ({ k, v: vars.value[k] })),
)
</script>

<template>
  <div class="ted">
    <aside class="ted__controls bs-card">
      <p class="bs-eyebrow">Brand Kit</p>
      <div class="ted__samples" role="radiogroup" aria-label="Sample brand kit">
        <button
          v-for="e in SAMPLE_EVENTS" :key="e.key" type="button" role="radio"
          class="ted__sample bs-focusable" :aria-checked="kit.key === e.key" @click="load(e.key)"
        >
          <span class="ted__dot" :style="{ background: e.brandKit.colors.primary, boxShadow: `inset -8px 0 0 ${e.brandKit.colors.secondary}` }" />
          {{ e.event.name.replace(/ 2027$/, '') }}
        </button>
      </div>

      <div v-for="r in ROLES" :key="r.id" class="ted__row">
        <label :for="`ted-${r.id}`" class="ted__label">{{ r.label }}</label>
        <input :id="`ted-${r.id}`" v-model="kit.colors[r.id]" type="color" class="ted__swatch" />
        <code>{{ kit.colors[r.id] }}</code>
      </div>
      <q-select v-model="kit.typography.heading" :options="FONT_OPTIONS" option-value="id" option-label="label" emit-value map-options dense outlined label="Heading font" class="q-mt-md" />
      <q-select v-model="kit.typography.body" :options="FONT_OPTIONS" option-value="id" option-label="label" emit-value map-options dense outlined label="Body font" class="q-mt-sm" />

      <p class="bs-eyebrow ted__h">WCAG checks</p>
      <ul class="ted__checks">
        <li v-for="c in checks" :key="c.label">
          <q-icon :name="c.pass ? 'check_circle' : 'error'" :color="c.pass ? 'positive' : 'negative'" size="18px" />
          <span>{{ c.label }}</span><code>{{ c.ratio }}:1</code>
        </li>
      </ul>

      <p class="bs-eyebrow ted__h">Resolved tokens</p>
      <dl class="ted__tokens">
        <template v-for="t in tokenRows" :key="t.k"><dt>{{ t.k }}</dt><dd>{{ t.v }}</dd></template>
      </dl>
    </aside>

    <brand-theme-provider :brand-kit="kit" class="ted__preview">
      <brand-hero
        :brand-kit="kit" :headline="current.event.name" tagline="Official hotels, special rates."
        :dates="formatDateRange(current.event.startDate, current.event.endDate)" :location="locationLabel(current.event)"
        size="compact" :heading-level="2"
      />
      <div class="ted__stage">
        <p class="bs-caption">Unmodified Presto components inside <code>BrandThemeProvider</code>:</p>
        <booking-widget mode="reservations" :tabs="false" :show-mode="false" :show-teams="false" :show-dates="true" />
        <hotel-card-group
          name="Courtyard by Marriott Downtown" city="Overland Park, KS" :stars="4" distance="0.6 mi from venue"
          preferred refundable :starting-price="179" :from-nightly="179" :total="537" availability="matches" :rooms-available="8" flow="reserve"
          cta-label="Choose your room"
        />
        <div class="ted__buttons">
          <q-btn unelevated color="primary" label="Primary action" />
          <q-btn outline color="primary" label="Secondary" />
          <q-btn flat color="primary" label="Text link" />
          <q-chip color="secondary" :style="{ color: vars['--brand-on-secondary'] }" label="Secondary chip" />
        </div>
      </div>
    </brand-theme-provider>
  </div>
</template>

<style scoped>
.ted { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 24px; padding: 24px; background: var(--bs-canvas); min-height: 100vh; align-items: start; }
.ted__controls { padding: 20px; position: sticky; top: 24px; }
.ted__samples { display: grid; gap: 6px; margin: 10px 0 18px; }
.ted__sample { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-sm); background: var(--bs-surface); font: 700 0.875rem/1.2 var(--bs-font); color: var(--bs-ink); text-align: left; cursor: pointer; }
.ted__sample[aria-checked='true'] { border-color: var(--bs-brand); box-shadow: inset 0 0 0 1px var(--bs-brand); }
.ted__dot { width: 22px; height: 22px; border-radius: 50%; flex: none; }
.ted__row { display: grid; grid-template-columns: 80px 40px 1fr; align-items: center; gap: 10px; margin-top: 8px; }
.ted__label { font: 700 0.875rem var(--bs-font); color: var(--bs-ink); }
.ted__swatch { width: 40px; height: 32px; border: 1px solid var(--bs-line); border-radius: 6px; padding: 2px; background: #fff; cursor: pointer; }
.ted__checks { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 6px; font-size: 0.8125rem; }
.ted__checks li { display: grid; grid-template-columns: 20px 1fr auto; gap: 6px; align-items: center; }
.ted__h { margin-top: 22px; }
.ted__tokens { display: grid; gap: 2px; margin: 8px 0 0; font: 0.75rem/1.4 ui-monospace, Menlo, monospace; color: var(--bs-ink-soft); }
.ted__tokens dd { margin: 0 0 6px; color: var(--bs-ink); font-weight: 700; }
.ted__preview { border-radius: var(--bs-radius-lg); overflow: hidden; background: var(--ds-color-surface-sunken); box-shadow: var(--bs-shadow-2); }
.ted__stage { padding: 20px; display: grid; gap: 18px; }
.ted__buttons { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
@media (max-width: 900px) { .ted { grid-template-columns: 1fr; } .ted__controls { position: static; } }
</style>
