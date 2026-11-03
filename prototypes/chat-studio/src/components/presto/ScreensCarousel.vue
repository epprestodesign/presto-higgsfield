<script setup>
// The three default Presto screens (landing, hotel listings, hotel details) in
// a carousel, on desktop or phone. `view` is a project or a draft snapshot.
import { nextTick, onMounted, ref, watch } from 'vue'
import Icon from '../Icon.vue'
import PrestoScreen from './PrestoScreen.vue'

const props = defineProps({
  view: { type: Object, required: true },
  device: { type: String, default: 'desktop' },
  /** Optional v-model:screen ('landing' | 'listings' | 'details') — used by the viewer for deep links. */
  screen: { type: String, default: '' },
})
const emit = defineEmits(['edit', 'update:screen'])

const SCREENS = [
  { id: 'landing', label: 'Landing page' },
  { id: 'listings', label: 'Hotel listings' },
  { id: 'details', label: 'Hotel details' },
]
const index = ref(Math.max(0, SCREENS.findIndex((s) => s.id === props.screen)))
const track = ref(null)
function go(i) {
  index.value = (i + SCREENS.length) % SCREENS.length
  track.value?.scrollTo({ left: track.value.clientWidth * index.value, behavior: 'smooth' })
}
function onScroll() {
  const el = track.value
  if (el) index.value = Math.round(el.scrollLeft / el.clientWidth)
}
watch(index, (i) => { if (props.screen && SCREENS[i].id !== props.screen) emit('update:screen', SCREENS[i].id) })
watch(() => props.screen, (id) => { const i = SCREENS.findIndex((s) => s.id === id); if (i >= 0 && i !== index.value) go(i) })
onMounted(() => nextTick(() => track.value?.scrollTo({ left: track.value.clientWidth * index.value })))
watch(() => props.device, () => nextTick(() => track.value?.scrollTo({ left: track.value.clientWidth * index.value })))
const uid = Math.random().toString(36).slice(2, 7)
</script>

<template>
  <div class="sc">
    <div class="sc__tabs" role="tablist" aria-label="Screens">
      <button
        v-for="(s, i) in SCREENS" :id="`sc-${uid}-${s.id}`" :key="s.id" type="button" role="tab" class="sc__tab"
        :class="{ 'is-on': index === i }" :aria-selected="index === i" :aria-controls="`sc-${uid}-panel`" @click="go(i)"
      >{{ i + 1 }}. {{ s.label }}</button>
    </div>
    <div class="sc__carousel" :class="`is-${device}`">
      <div :id="`sc-${uid}-panel`" ref="track" class="sc__track" role="tabpanel" :aria-labelledby="`sc-${uid}-${SCREENS[index].id}`" @scroll.passive="onScroll">
        <div v-for="(s, i) in SCREENS" :key="s.id" class="sc__slide" :aria-hidden="index !== i">
          <PrestoScreen :project="view" :screen="s.id" :device="device" @edit="emit('edit')" />
        </div>
      </div>
      <button type="button" class="sc__arrow is-prev" :aria-label="`Previous: ${SCREENS[(index + 2) % 3].label}`" @click="go(index - 1)"><Icon name="left" :size="20" /></button>
      <button type="button" class="sc__arrow is-next" :aria-label="`Next: ${SCREENS[(index + 1) % 3].label}`" @click="go(index + 1)"><Icon name="right" :size="20" /></button>
    </div>
    <div class="sc__dots" aria-hidden="true"><i v-for="(s, i) in SCREENS" :key="s.id" :class="{ 'is-on': index === i }" /></div>
  </div>
</template>

<style scoped>
.sc__tabs { display: flex; gap: 4px; margin-bottom: 14px; border-bottom: 1px solid var(--line); overflow-x: auto; }
.sc__tab { position: relative; flex: none; min-height: 40px; padding: 6px 12px; border: 0; background: none; color: var(--ink-2); font-size: 14px; font-weight: 700; cursor: pointer; }
.sc__tab:hover { color: var(--ink); }
.sc__tab.is-on { color: var(--ink); }
.sc__tab.is-on::after { content: ''; position: absolute; left: 6px; right: 6px; bottom: -1px; height: 3px; border-radius: 3px 3px 0 0; background: var(--pill); }
.sc__carousel { position: relative; }
.sc__track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: var(--r-card); }
.sc__track::-webkit-scrollbar { display: none; }
.sc__slide { flex: 0 0 100%; scroll-snap-align: start; padding: 2px; }
.sc__carousel.is-mobile .sc__slide { padding: 18px 0; border-radius: var(--r-card); background: var(--surface-3); }
.sc__arrow { position: absolute; z-index: 3; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); color: var(--ink); box-shadow: var(--shadow); cursor: pointer; }
.sc__arrow:hover { background: var(--surface-3); }
.sc__arrow.is-prev { left: -14px; }
.sc__arrow.is-next { right: -14px; }
.sc__dots { display: flex; justify-content: center; gap: 6px; margin-top: 12px; }
.sc__dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--line-bold); }
.sc__dots i.is-on { width: 22px; border-radius: 4px; background: var(--pill); }
@media (max-width: 640px) { .sc__arrow.is-prev { left: -6px; } .sc__arrow.is-next { right: -6px; } }
</style>
