<script setup>
// Canvas board · 2 Looks on dark banners (logo projects): the cleaned logo in
// every look, each shown at its real landing-banner size on the system navy
// and on a photo banner, with its edge-contrast score. Click one to use it.
defineProps({
  lab: { type: Object, required: true }, // useLogoLab().state
  selected: { type: String, default: '' },
})
const emit = defineEmits(['select'])

const tone = (s) => (!s ? '' : s.verdict === 'good' ? 'ok' : s.verdict === 'partial' ? 'warn' : 'bad')
const mark = (s) => (s?.verdict === 'good' ? '✓' : s?.verdict === 'partial' ? '~' : '✕')
</script>

<template>
  <div class="ll">
    <p class="ll__intro">
      Each look sits at its real size on the center of a landing banner: the Presto navy, then a photo. The score is how much the logo’s edge stands out from what’s right around it
      (3:1 or more reads well).
    </p>
    <div v-if="lab.loading || (lab.looksLoading && !lab.looks.length)" class="ll__loading"><q-spinner size="22px" /> Trying looks on dark banners…</div>
    <div v-else class="ll__grid" :class="{ 'is-busy': lab.looksLoading }">
      <button
        v-for="l in lab.looks" :key="l.id" type="button" class="ll__card" :class="{ 'is-on': l.id === selected }"
        :aria-pressed="l.id === selected" @click="emit('select', l.id)"
      >
        <div class="ll__tiles">
          <img :src="l.navyUrl" :alt="`${l.label} on the Presto navy`" />
          <img v-if="l.photoUrl" :src="l.photoUrl" :alt="`${l.label} on a photo banner`" />
        </div>
        <p class="ll__title">
          <i v-if="l.swatch" class="ll__swatch" :style="{ background: l.swatch }" />
          <strong>{{ l.label }}</strong>
          <span v-if="l.id === lab.recommendedLook" class="ll__tag ll__tag--rec"><q-icon name="auto_awesome" size="12px" /> Recommended</span>
          <span v-if="l.id === selected" class="ll__tag ll__tag--on"><q-icon name="check_circle" size="12px" /> Using</span>
        </p>
        <p class="ll__hint">{{ l.hint }}<template v-if="l.keeps"> · keeps brand colours</template></p>
        <p class="ll__scores">
          <span class="ll__score" :class="`is-${tone(l.navy)}`">{{ mark(l.navy) }} Navy {{ l.navy.ratio }}:1</span>
          <span v-if="l.photo" class="ll__score" :class="`is-${tone(l.photo)}`">{{ mark(l.photo) }} Photo {{ l.photo.ratio }}:1</span>
        </p>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ll { padding: 18px; display: grid; gap: 14px; font-family: var(--bs-font); }
.ll__intro { margin: 0; font-size: 0.8125rem; line-height: 1.5; color: var(--bs-ink-soft); }
.ll__loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px; color: var(--bs-ink-soft); font-size: 0.875rem; }
.ll__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; transition: opacity 0.2s; }
.ll__grid.is-busy { opacity: 0.55; }
.ll__card { display: grid; gap: 8px; text-align: left; padding: 10px; border-radius: 14px; border: 1px solid var(--bs-line); background: #fff; cursor: pointer; font: inherit; color: inherit; transition: border-color 0.15s, background-color 0.15s; }
.ll__card:hover { border-color: var(--bs-ink-faint); }
.ll__card.is-on { border-color: var(--bs-accent); background: var(--bs-accent-soft); }
.ll__tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.ll__tiles img { width: 100%; aspect-ratio: 560 / 267; object-fit: cover; border-radius: 6px; display: block; }
.ll__title { margin: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 0.875rem; color: var(--bs-ink); }
.ll__swatch { width: 12px; height: 12px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15); }
.ll__hint { margin: 0; font-size: 0.75rem; line-height: 1.45; color: var(--bs-ink-soft); }
.ll__scores { margin: 0; display: flex; flex-wrap: wrap; gap: 4px; }
.ll__score { padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: 700; background: var(--bs-surface-2); color: var(--bs-ink-soft); }
.ll__score.is-ok { background: #dcfce7; color: #166534; }
.ll__score.is-warn { background: #fef3c7; color: #92400e; }
.ll__score.is-bad { background: #fee2e2; color: #991b1b; }
.ll__tag { display: inline-flex; align-items: center; gap: 3px; padding: 1px 7px; border-radius: 999px; font-size: 0.6875rem; font-weight: 700; }
.ll__tag--rec { background: #ede9fe; color: #6d28d9; }
.ll__tag--on { color: var(--bs-accent); }
</style>
