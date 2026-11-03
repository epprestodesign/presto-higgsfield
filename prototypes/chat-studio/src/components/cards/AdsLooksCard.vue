<script setup>
// Ads in the chat, 3 of 4: inspiration. Fifteen ad types, each shown as a
// sample ad already made in that look with the event's own name, colours and
// logo. Three that suit the event start ticked; the agent spreads the picks
// across the spots.
import { computed, onMounted, reactive, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { AD_TYPES, mockGenerate, suggestTypes, modelById } from '../../imageModels.js'
import { purposeDefaults } from '../../ads.js'
import { chooseAdLooks, state } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const done = computed(() => !!props.card.picked)
const suggested = suggestTypes(props.project.brand.id)
const picked = ref(props.card.picked ? [...props.card.picked] : [...suggested])
const on = (id) => (done.value ? props.card.picked : picked.value).includes(id)
function toggle(id) { if (!done.value) picked.value = on(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id] }
// Suggested first, then the rest in their usual order.
const types = computed(() => [...AD_TYPES].sort((a, b) => (suggested.includes(b.id) - suggested.includes(a.id))))
const shown = computed(() => (done.value ? types.value.filter((t) => on(t.id)) : types.value))

// The sample ads, drawn once per card.
const src = reactive({})
onMounted(async () => {
  const p = props.project
  const b = p.brand
  const sample = { ...purposeDefaults('about', b), purpose: 'about', logo: p.logo || b.logo, colors: { background: p.palette[0], foreground: '#FFFFFF', accent: p.palette[1] } }
  const info = { photo: p.selected?.src || b.images[0]?.src, photos: b.images.map((i) => i.src), dates: b.dates, place: b.place }
  for (const t of AD_TYPES) src[t.id] = await mockGenerate({ ad: sample, size: '340x215', model: t.model, type: t.id, info })
})
</script>

<template>
  <CardShell kicker="Advertisements" title="Pick a few looks" :aside="done ? 'Confirmed' : `${picked.length} picked · ${AD_TYPES.length} looks`">
    <div class="al" role="group" aria-label="Ad looks">
      <button
        v-for="t in shown" :key="t.id" type="button" class="al__look" :class="{ 'is-on': on(t.id) }"
        :aria-pressed="on(t.id)" :disabled="done" @click="toggle(t.id)"
      >
        <span class="al__img"><img v-if="src[t.id]" :src="src[t.id]" alt="" /><span v-else class="al__wait" /><span class="al__check"><Icon v-if="on(t.id)" name="check" :size="16" /></span></span>
        <span class="al__text">
          <b>{{ t.label }}<em v-if="suggested.includes(t.id) && !done">Suggested</em></b>
          <small>{{ t.note }} · {{ modelById(t.model).label }}</small>
        </span>
      </button>
    </div>
    <div v-if="!done" class="al__foot">
      <button type="button" class="cs-btn-dark" :disabled="!picked.length || state.working" @click="chooseAdLooks(project, AD_TYPES.filter((t) => picked.includes(t.id)).map((t) => t.id), card)">
        <Icon name="check" :size="16" /> Use {{ picked.length === 1 ? 'this look' : `these ${picked.length} looks` }}
      </button>
      <small>A few works best: 1 to 3. You can change any ad’s look later.</small>
    </div>
  </CardShell>
</template>

<style scoped>
.al { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.al__look { position: relative; display: grid; gap: 8px; padding: 8px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
.al__look:hover:not(:disabled) { border-color: var(--line-bold); }
.al__look.is-on { border-color: var(--pill); background: var(--selected); box-shadow: 0 0 0 1px var(--pill); }
.al__look:disabled { cursor: default; }
.al__img { position: relative; display: block; aspect-ratio: 340 / 215; border-radius: 4px; overflow: hidden; background: var(--surface-3); }
.al__img img { display: block; width: 100%; height: 100%; object-fit: cover; }
.al__wait { display: block; width: 100%; height: 100%; background: linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0) 0 0 / 200% 100%; animation: shimmer 1.2s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
.al__text { display: grid; padding: 0 2px 2px; }
.al__text b { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.al__text em { padding: 0 6px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-style: normal; font-size: 11px; line-height: 18px; }
.al__text small { color: var(--ink-3); font-size: 12px; }
.al__check { position: absolute; right: 6px; bottom: 6px; display: grid; place-items: center; width: 22px; height: 22px; border: 1.5px solid #fff; border-radius: 4px; background: rgba(15, 23, 42, 0.35); color: var(--pill-ink); }
.al__look.is-on .al__check { background: var(--pill); border-color: var(--pill); }
.al__foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.al__foot small { color: var(--ink-3); font-size: 13px; }
@media (max-width: 640px) { .al { grid-template-columns: repeat(2, minmax(0, 1fr)); } .al__text small { display: none; } }
@media (prefers-reduced-motion: reduce) { .al__wait { animation: none; } }
</style>
