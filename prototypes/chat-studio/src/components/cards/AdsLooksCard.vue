<script setup>
// Ads in the chat, 3 of 4: look and feel. For an event with its own brand
// directions (generated from its logo, colours and photos, each made for a
// kind of page on its site), those come first; the 15 general styles are one
// tap away. The directions for the pages picked start ticked; the agent puts
// each page's ad in the direction made for it.
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { AD_TYPES, directionsFor } from '../../imageModels.js'
import { KIND_LABEL } from '../../siteScrape.js'
import { chooseAdLooks, suggestedLooks, state } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const own = directionsFor(props.project.brand.id)
const done = computed(() => !!props.card.picked)
const suggested = suggestedLooks(props.project)
const picked = ref(props.card.picked ? [...props.card.picked] : [...suggested])
const on = (id) => (done.value ? props.card.picked : picked.value).includes(id)
function toggle(id) { if (!done.value) picked.value = on(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id] }
const more = ref(!own)
const all = computed(() => [...(own || []), ...AD_TYPES])
const types = computed(() => {
  const base = own ? [...own, ...(more.value ? AD_TYPES : [])] : [...AD_TYPES].sort((a, b) => suggested.includes(b.id) - suggested.includes(a.id))
  return done.value ? all.value.filter((t) => on(t.id)) : base
})
</script>

<template>
  <CardShell kicker="Advertisements" :title="own ? `Directions for ${project.brand.short}` : 'Pick a few looks'" :aside="done ? 'Confirmed' : `${picked.length} picked`">
    <p v-if="own && !done" class="al__intro">Generated from {{ project.brand.short }}’s crest, colours and photos. Each is made for a kind of page; I ticked the ones for the pages you picked.</p>
    <div class="al" role="group" aria-label="Ad looks">
      <button
        v-for="t in types" :key="t.id" type="button" class="al__look" :class="{ 'is-on': on(t.id) }"
        :aria-pressed="on(t.id)" :disabled="done" @click="toggle(t.id)"
      >
        <span class="al__img"><img :src="t.ref" :alt="`Reference: ${t.label}`" loading="lazy" /><span class="al__logo">{{ t.logo ? 'Logo' : 'No logo' }}</span><span class="al__check"><Icon v-if="on(t.id)" name="check" :size="16" /></span></span>
        <span class="al__text">
          <b>{{ t.label }}<em v-if="suggested.includes(t.id) && !done">Suggested</em></b>
          <small><template v-if="t.kind">For {{ KIND_LABEL[t.kind].toLowerCase() }} · </template>{{ t.note }}</small>
        </span>
      </button>
    </div>
    <button v-if="own && !done" type="button" class="cs-tab cs-tab--sm al__more" :aria-expanded="more" @click="more = !more"><Icon :name="more ? 'up' : 'down'" :size="16" /> {{ more ? 'Fewer styles' : `More styles (${AD_TYPES.length})` }}</button>
    <div v-if="!done" class="al__foot">
      <button type="button" class="cs-btn-dark" :disabled="!picked.length || state.working" @click="chooseAdLooks(project, all.filter((t) => picked.includes(t.id)).map((t) => t.id), card)">
        <Icon name="check" :size="16" /> Use {{ picked.length === 1 ? 'this look' : `these ${picked.length} looks` }}
      </button>
      <small>{{ own ? 'Each page’s ad uses the direction made for it; the rest are shared out.' : `A few works best: 1 to 3. These are references; your ads are made in ${project.brand.short}’s name and colours.` }}</small>
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
.al__logo { position: absolute; left: 6px; bottom: 6px; padding: 0 7px; border-radius: 999px; background: rgba(15, 23, 42, 0.72); color: #fff; font-size: 11px; font-weight: 700; line-height: 20px; }
.al__wait { display: block; width: 100%; height: 100%; background: linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0) 0 0 / 200% 100%; animation: shimmer 1.2s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
.al__text { display: grid; padding: 0 2px 2px; }
.al__text b { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.al__text em { padding: 0 6px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-style: normal; font-size: 11px; line-height: 18px; }
.al__text small { color: var(--ink-3); font-size: 12px; }
.al__check { position: absolute; right: 6px; bottom: 6px; display: grid; place-items: center; width: 22px; height: 22px; border: 1.5px solid #fff; border-radius: 4px; background: rgba(15, 23, 42, 0.35); color: var(--pill-ink); }
.al__look.is-on .al__check { background: var(--pill); border-color: var(--pill); }
.al__intro { margin: -4px 0 12px; color: var(--ink-2); font-size: 14px; }
.al__more { margin-top: 12px; }
.al__foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.al__foot small { color: var(--ink-3); font-size: 13px; }
@media (max-width: 640px) { .al { grid-template-columns: repeat(2, minmax(0, 1fr)); } .al__text small { display: none; } }
@media (prefers-reduced-motion: reduce) { .al__wait { animation: none; } }
</style>
