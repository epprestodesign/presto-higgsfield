<script setup>
// Canvas board · 1 Clean-up (logo projects): the upload as it came in, then the
// same logo cleaned several ways, each on a transparency grid with what it's
// good and bad at. Clicking one makes it the base for the looks.
import { computed } from 'vue'
import { rgbToHex } from '../../banner-lab/pixels.js'

const props = defineProps({
  lab: { type: Object, required: true }, // useLogoLab().state
  selected: { type: String, default: '' },
})
const emit = defineEmits(['select', 'tune', 'ai'])
// The AI cut-out costs money per image, so it's offered, not run: on photo /
// gradient backgrounds, or any logo that isn't already transparent.
const offerAi = computed(() => props.lab.background && props.lab.background.kind !== 'transparent' && !props.lab.methods.some((m) => m.id === 'ai'))

const bgNote = computed(() => {
  const b = props.lab.background
  if (!b) return ''
  if (b.kind === 'transparent') return 'Transparent already'
  if (b.kind === 'solid') return `Flat ${rgbToHex(b.color)} box behind the logo`
  return 'Photo or gradient behind the logo'
})
</script>

<template>
  <div class="lc">
    <div v-if="lab.loading" class="lc__loading"><q-spinner size="22px" /> Cleaning up the logo…</div>
    <p v-else-if="lab.error" class="lc__error">Couldn’t read this logo: {{ lab.error }}</p>
    <template v-else>
      <figure class="lc__before">
        <div class="lc__img lc__img--before"><img :src="lab.before" alt="The logo as uploaded" /></div>
        <figcaption><strong>As uploaded</strong><span>{{ bgNote }}</span></figcaption>
      </figure>

      <div class="lc__grid">
        <div v-for="m in lab.methods" :key="m.id" class="lc__item" :class="{ 'is-on': m.id === selected }">
        <button type="button" class="lc__card" :aria-pressed="m.id === selected" @click="emit('select', m.id)">
          <div class="lc__img"><img :src="m.url" :alt="`${m.label} result`" /></div>
          <div class="lc__meta">
            <p class="lc__title">
              <strong>{{ m.label }}</strong>
              <span v-if="m.id === lab.recommendedMethod" class="lc__tag lc__tag--rec"><q-icon name="auto_awesome" size="12px" /> Recommended</span>
              <span v-if="m.id === selected" class="lc__tag lc__tag--on"><q-icon name="check_circle" size="12px" /> Using</span>
            </p>
            <p class="lc__hint">{{ m.hint }}</p>
            <p class="lc__stats">
              <span v-for="s in m.stats" :key="s.label" class="lc__stat" :class="`is-${s.tone}`">{{ s.label }}</span>
            </p>
          </div>
        </button>
        <!-- Background removal can be tuned: re-cuts the logo when you let go -->
        <div v-if="m.tunable" class="lc__tune" @pointerdown.stop @dblclick.stop>
          <span>Remove less</span>
          <q-slider
            :model-value="m.strength" :min="0" :max="1" :step="0.05" dense color="deep-purple" :aria-label="`${m.label}: how much to remove`"
            @change="(v) => emit('tune', m.id, v)"
          />
          <span>Remove more</span>
        </div>
        </div>
        <div v-if="lab.vectorLoading" class="lc__card lc__card--wait"><q-spinner size="18px" /> Tracing an SVG…</div>
        <div v-if="offerAi" class="lc__item lc__ai" @pointerdown.stop @dblclick.stop>
          <div class="lc__ai-body">
            <p class="lc__title"><strong>AI cut-out</strong><span class="lc__tag lc__tag--rec"><q-icon name="auto_awesome" size="12px" /> Photoroom</span></p>
            <p class="lc__hint">Lets an AI find the logo and cut it out. Best when the logo sits on a photo, smoke or a gradient. About $0.02 per run.</p>
            <p v-if="lab.aiError" class="lc__ai-error" role="alert">{{ lab.aiError }}</p>
            <q-btn
              unelevated no-caps dense class="lc__ai-btn" :loading="lab.ai === 'running'" icon="auto_fix_high"
              :label="lab.aiError ? 'Try again' : 'Run AI cut-out'" @click="emit('ai')"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lc { padding: 18px; display: grid; gap: 16px; font-family: var(--bs-font); }
.lc__loading, .lc__error { margin: 0; display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: var(--bs-ink-soft); font-size: 0.875rem; }
.lc__before { margin: 0; display: grid; grid-template-columns: 200px 1fr; gap: 14px; align-items: center; }
.lc__before figcaption { display: grid; gap: 2px; font-size: 0.8125rem; color: var(--bs-ink-soft); }
.lc__before figcaption strong { color: var(--bs-ink); font-size: 0.875rem; }
.lc__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.lc__ai { align-content: center; border-style: dashed; }
.lc__ai-body { display: grid; gap: 8px; padding: 14px; }
.lc__ai-btn { justify-self: start; background: var(--bs-ink); color: #fff; padding: 4px 12px; border-radius: 999px; }
.lc__ai-error { margin: 0; font-size: 0.75rem; color: var(--bs-danger, #c62828); }
.lc__item { display: grid; border-radius: 14px; border: 1px solid var(--bs-line); background: #fff; overflow: hidden; transition: border-color 0.15s, background-color 0.15s; }
.lc__item:hover { border-color: var(--bs-ink-faint); }
.lc__item.is-on { border-color: var(--bs-accent); background: var(--bs-accent-soft); }
.lc__item .lc__card { border: 0; border-radius: 0; background: transparent; }
.lc__tune { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 0 12px 10px; font: 600 0.6875rem var(--bs-font); color: var(--bs-ink-soft); }
.lc__card { display: grid; gap: 10px; text-align: left; padding: 10px; border-radius: 14px; border: 1px solid var(--bs-line); background: #fff; cursor: pointer; font: inherit; color: inherit; transition: border-color 0.15s, background-color 0.15s; }
.lc__card:hover { border-color: var(--bs-ink-faint); }
.lc__card.is-on { border-color: var(--bs-accent); background: var(--bs-accent-soft); }
.lc__card--wait { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 200px; color: var(--bs-ink-soft); font-size: 0.8125rem; cursor: default; border-style: dashed; }
.lc__img { position: relative; height: 150px; border-radius: 10px; background: repeating-conic-gradient(#e8ebf0 0% 25%, #fff 0% 50%) 50% / 16px 16px; border: 1px solid var(--bs-line); overflow: hidden; }
.lc__img--before { background: #f1f2f5; }
/* Pinned to the box so the image can't stretch it (a % max-height in a grid row can) */
.lc__img img { position: absolute; inset: 10%; width: 80%; height: 80%; object-fit: contain; }
.lc__meta { display: grid; gap: 4px; }
.lc__title { margin: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 0.875rem; color: var(--bs-ink); }
.lc__hint { margin: 0; font-size: 0.75rem; line-height: 1.45; color: var(--bs-ink-soft); }
.lc__stats { margin: 2px 0 0; display: flex; flex-wrap: wrap; gap: 4px; }
.lc__stat { padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: 600; background: var(--bs-surface-2); color: var(--bs-ink-soft); }
.lc__stat.is-ok { background: #dcfce7; color: #166534; }
.lc__stat.is-warn { background: #fef3c7; color: #92400e; }
.lc__stat.is-bad { background: #fee2e2; color: #991b1b; }
.lc__tag { display: inline-flex; align-items: center; gap: 3px; padding: 1px 7px; border-radius: 999px; font-size: 0.6875rem; font-weight: 700; }
.lc__tag--rec { background: #ede9fe; color: #6d28d9; }
.lc__tag--on { color: var(--bs-accent); }
</style>
