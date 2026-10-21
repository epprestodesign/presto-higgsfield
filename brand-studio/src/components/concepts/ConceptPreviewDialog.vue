<script setup>
// ConceptPreviewDialog — see a concept as the real landing hero, on desktop
// (browser frame) or mobile (390px phone frame), with live Presto content
// (the Booking Widget) beneath it in the customer's branding.
import { ref, computed, watch } from 'vue'
import BrandHero from '../brand/BrandHero.vue'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import BookingWidget from '@lib/components/BookingWidget.vue'
import { getDirection } from '../../models/brandKit.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  concept: { type: Object, default: null },
  brandKit: { type: Object, required: true },
  copy: { type: Object, default: () => ({}) },
  selected: { type: Boolean, default: false },
  showTeams: { type: Boolean, default: false },
  initialDevice: { type: String, default: 'desktop' },
  // Shown in the fake address bar.
  siteUrl: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'select'])

const device = ref(props.initialDevice)
watch(() => props.modelValue, (open) => { if (open) device.value = props.initialDevice })
const direction = computed(() => (props.concept ? getDirection(props.concept.direction) : null))
const host = computed(() => {
  try { return new URL(props.siteUrl || 'https://book.eventpipe.com').host } catch { return 'book.eventpipe.com' }
})
</script>

<template>
  <q-dialog :model-value="modelValue" maximized transition-show="fade" transition-hide="fade" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="concept" class="cpd" role="document" :aria-label="`Preview: ${concept.title}`">
      <header class="cpd__bar">
        <div class="cpd__title">
          <span class="bs-pill">{{ direction.name }}</span>
          <h2 class="bs-subtitle">{{ concept.title }}</h2>
        </div>
        <q-btn-toggle
          v-model="device"
          no-caps unelevated toggle-color="dark" color="white" text-color="dark"
          class="cpd__devices"
          :options="[
            { value: 'desktop', icon: 'desktop_windows', label: 'Desktop' },
            { value: 'mobile', icon: 'smartphone', label: 'Mobile' },
          ]"
          aria-label="Preview device"
        />
        <div class="cpd__actions">
          <q-btn
            unelevated no-caps class="bs-btn"
            :class="selected ? 'bs-btn--ghost' : 'bs-btn--primary'"
            :icon="selected ? 'check_circle' : undefined"
            :label="selected ? 'Selected' : 'Use this concept'"
            @click="emit('select', concept)"
          />
          <q-btn v-close-popup flat round icon="close" aria-label="Close preview" />
        </div>
      </header>

      <div class="cpd__stage" :class="`cpd__stage--${device}`">
        <!-- Desktop: browser chrome -->
        <div v-if="device === 'desktop'" class="cpd__browser">
          <div class="cpd__chrome" aria-hidden="true">
            <span class="cpd__dots"><i /><i /><i /></span>
            <span class="cpd__url"><q-icon name="lock" size="12px" /> {{ host }}</span>
          </div>
          <brand-theme-provider :brand-kit="brandKit" class="cpd__page">
            <brand-hero :concept="concept" :brand-kit="brandKit" v-bind="copy" size="landing" :heading-level="3" />
            <div class="cpd__widget"><booking-widget mode="" :tabs="false" :show-teams="showTeams" /></div>
          </brand-theme-provider>
        </div>

        <!-- Mobile: phone frame -->
        <div v-else class="cpd__phone">
          <div class="cpd__notch" aria-hidden="true" />
          <brand-theme-provider :brand-kit="brandKit" class="cpd__page cpd__page--phone">
            <brand-hero :concept="concept" :brand-kit="brandKit" v-bind="copy" size="landing" :heading-level="3" />
            <div class="cpd__widget cpd__widget--phone"><booking-widget mode="" :tabs="false" :show-teams="showTeams" /></div>
          </brand-theme-provider>
        </div>
      </div>
      <p class="cpd__note">
        <q-icon name="info" size="16px" aria-hidden="true" />
        Preview only — hotel search and rates are sample content.
      </p>
    </div>
  </q-dialog>
</template>

<style scoped>
.cpd { background: #0F1424; color: #fff; display: flex; flex-direction: column; min-height: 100%; font-family: var(--bs-font); }
.cpd__bar {
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;
  padding: 12px 20px; background: var(--bs-surface); color: var(--bs-ink); border-bottom: 1px solid var(--bs-line);
}
.cpd__title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cpd__title h2 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cpd__devices { border: 1px solid var(--bs-line-strong); border-radius: var(--bs-radius-sm); overflow: hidden; }
.cpd__actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }

.cpd__stage { flex: 1; display: flex; justify-content: center; align-items: flex-start; padding: 28px 24px 12px; overflow: auto; }
.cpd__browser { width: min(1200px, 100%); border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 30px 80px rgb(0 0 0 / 0.45); }
.cpd__chrome { display: flex; align-items: center; gap: 14px; padding: 10px 14px; background: #E9EBF0; color: #475569; font-size: 0.75rem; }
.cpd__dots { display: flex; gap: 6px; }
.cpd__dots i { width: 11px; height: 11px; border-radius: 50%; background: #CBD5E1; display: block; }
.cpd__dots i:first-child { background: #F87171; }
.cpd__dots i:nth-child(2) { background: #FBBF24; }
.cpd__dots i:nth-child(3) { background: #34D399; }
.cpd__url { flex: 1; max-width: 420px; margin: 0 auto; background: #fff; border-radius: 999px; padding: 4px 12px; display: flex; align-items: center; gap: 6px; }
.cpd__page { background: var(--ds-color-surface-canvas); color: var(--ds-color-text); }
.cpd__widget { max-width: 1040px; margin: -36px auto 0; padding: 0 24px 40px; position: relative; z-index: 2; }
.cpd__widget :deep(.bw) { background: #fff; box-shadow: var(--ds-shadow-2); }

.cpd__phone {
  position: relative; width: 390px; max-width: 100%; height: min(780px, calc(100vh - 150px)); border-radius: 44px; padding: 14px;
  background: #05070D; box-shadow: 0 0 0 2px #2A3142, 0 30px 80px rgb(0 0 0 / 0.5);
}
.cpd__notch { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); width: 120px; height: 26px; border-radius: 0 0 16px 16px; background: #05070D; z-index: 3; }
.cpd__page--phone { height: 100%; overflow-y: auto; border-radius: 32px; }
.cpd__widget--phone { margin-top: 0; padding: 16px 12px 24px; }
/* The frame is 390px but the window isn't, so BookingWidget's own phone media
   query never fires here — mirror its <600px rules inside the frame. (The
   Studio editor's device preview uses a real iframe instead.) */
.cpd__widget--phone :deep(.bw) { padding: 16px; }
.cpd__widget--phone :deep(.bw__fields) { flex-direction: column; align-items: stretch; gap: 10px; }
.cpd__widget--phone :deep(.bw__fields > *) { width: 100%; }
.cpd__widget--phone :deep(.bw__search) { width: 100%; height: 52px; }
.cpd__note { margin: 0; padding: 0 24px 18px; display: flex; justify-content: center; gap: 6px; font-size: 0.8125rem; color: #CBD5E1; }

@media (max-width: 760px) {
  .cpd__bar { grid-template-columns: 1fr auto; }
  .cpd__devices { grid-column: 1 / -1; grid-row: 2; justify-self: center; }
  .cpd__title .bs-pill { display: none; }
  .cpd__stage { padding: 16px 8px; }
  .cpd__phone { border-radius: 0; padding: 0; box-shadow: none; height: auto; }
  .cpd__notch { display: none; }
  .cpd__page--phone { border-radius: 12px; }
}
</style>
