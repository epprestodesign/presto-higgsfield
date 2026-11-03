<script setup>
// A stack of Presto landing pages: the newest design in front and earlier
// ones fanned out behind it, so you can see how a project got here.
// `views` is newest-first (a project's drafts, or one draft's look). With a
// single view, its three screens (landing, listings, details) are stacked.
import { computed } from 'vue'
import PrestoScreen from './PrestoScreen.vue'

const props = defineProps({
  views: { type: Array, required: true },
  small: { type: Boolean, default: false },
})
// Back to front: up to two earlier designs, then the newest.
const layers = computed(() => {
  const v = props.views.slice(0, 3)
  if (props.small) return [{ view: v[0], screen: 'landing' }]
  if (v.length === 1) return [{ view: v[0], screen: 'details' }, { view: v[0], screen: 'listings' }, { view: v[0], screen: 'landing' }]
  return v.reverse().map((view) => ({ view, screen: 'landing' }))
})
const pos = computed(() => ({ 1: ['is-only'], 2: ['is-mid', 'is-front'], 3: ['is-back', 'is-mid', 'is-front'] })[layers.value.length])
</script>

<template>
  <div class="ds" :class="{ 'is-small': small }" aria-hidden="true">
    <div v-for="(l, i) in layers" :key="i" class="ds__layer" :class="pos[i]">
      <PrestoScreen :project="l.view" :screen="l.screen" device="desktop" :chrome="false" />
    </div>
  </div>
</template>

<style scoped>
.ds { position: relative; aspect-ratio: 16 / 12; pointer-events: none; }
.ds__layer { position: absolute; left: 50%; overflow: hidden; border-radius: var(--r-card); border: 1px solid rgba(15, 23, 42, 0.08); box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08), 0 14px 34px rgba(15, 23, 42, 0.14); transform: translateX(-50%); transition: transform 0.3s ease; }
.ds__layer :deep(.ps-bare) { aspect-ratio: 16 / 10; }
.ds__layer.is-back { top: 2%; width: 68%; }
.ds__layer.is-mid { top: 16%; width: 76%; }
.ds__layer.is-front { top: 32%; width: 84%; }
.ds.is-small { aspect-ratio: 1440 / 552; }
.ds__layer.is-only { top: 0; width: 100%; border-radius: 3px; box-shadow: none; }
.ds__layer.is-only :deep(.ps-bare) { aspect-ratio: 1440 / 552; }
</style>
