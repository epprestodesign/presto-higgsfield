<script setup>
// Ads in the chat, 2 of 3: the approved placements (and their sizes) on the
// pages picked. The usual ones start ticked.
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { OFFERS, AD_SIZES, offerMobile, pageLabel } from '../../ads.js'
import { chooseAdPlacements, state } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const USUAL = ['landing-banners', 'browse-rail', 'details-bottom']
const done = computed(() => !!props.card.picked)
const pages = computed(() => props.card.pages.map((id) => ({ id, label: pageLabel(id), offers: OFFERS.filter((o) => o.page === id) })))
const picked = ref(props.card.picked ? [...props.card.picked] : OFFERS.filter((o) => props.card.pages.includes(o.page) && USUAL.includes(o.id)).map((o) => o.id))
const on = (id) => (done.value ? props.card.picked : picked.value).includes(id)
function toggle(id) { if (!done.value) picked.value = on(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id] }
const spots = computed(() => OFFERS.filter((o) => picked.value.includes(o.id)).reduce((n, o) => n + o.count, 0))
// The unit's shape, scaled to fit 56 × 40.
function shape(size) {
  const { width: w, height: h } = AD_SIZES[size]
  const s = Math.min(56 / w, 40 / h)
  return { width: `${Math.max(6, w * s)}px`, height: `${Math.max(4, h * s)}px` }
}
</script>

<template>
  <CardShell kicker="Advertisements" title="Placements and sizes" :aside="done ? 'Confirmed' : `${picked.length} placements · ${spots} spots`">
    <div class="az" :style="{ '--cols': pages.length }">
      <div v-for="pg in pages" :key="pg.id" class="az__page">
        <p class="az__label">{{ pg.label }}</p>
        <button
          v-for="o in pg.offers" :key="o.id" type="button" class="az__offer" :class="{ 'is-on': on(o.id) }"
          :aria-pressed="on(o.id)" :disabled="done" @click="toggle(o.id)"
        >
          <span class="az__shape"><i :style="shape(o.size)" /></span>
          <span class="az__text">
            <b>{{ o.label }}</b>
            <small>{{ o.size.replace('x', '×') }} {{ AD_SIZES[o.size].name }} · {{ offerMobile(o) ? `phones: ${offerMobile(o).replace('x', '×')}` : 'hidden on phones' }}</small>
          </span>
          <span class="az__check"><Icon v-if="on(o.id)" name="check" :size="16" /></span>
        </button>
      </div>
    </div>
    <div v-if="!done" class="az__foot">
      <button type="button" class="cs-btn-dark" :disabled="!picked.length || state.working" @click="chooseAdPlacements(project, OFFERS.filter((o) => picked.includes(o.id)).map((o) => o.id), card)">
        <Icon name="check" :size="16" /> Confirm {{ picked.length }} {{ picked.length === 1 ? 'placement' : 'placements' }} · {{ spots }} spots
      </button>
    </div>
  </CardShell>
</template>

<style scoped>
.az__foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.az { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 14px; }
.az__page { display: grid; gap: 8px; align-content: start; }
.az__label { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.az__offer { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
.az__offer:hover:not(:disabled) { border-color: var(--line-bold); }
.az__offer.is-on { border-color: var(--pill); background: var(--selected); }
.az__offer:disabled { cursor: default; }
.az__offer:disabled:not(.is-on) { opacity: 0.5; }
.az__shape { display: grid; place-items: center; width: 64px; height: 48px; flex: none; border-radius: var(--r); background: var(--surface-3); }
.az__shape i { display: block; border-radius: 1px; background: var(--navy-200); }
.az__offer.is-on .az__shape i { background: var(--pill); }
.az__text { flex: 1; min-width: 0; display: grid; }
.az__text b { font-size: 14px; }
.az__text small { color: var(--ink-3); font-size: 12px; }
.az__check { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border: 1.5px solid var(--line-bold); border-radius: 4px; color: var(--pill-ink); }
.az__offer.is-on .az__check { background: var(--pill); border-color: var(--pill); }
@media (max-width: 900px) { .az { grid-template-columns: 1fr; } }
</style>
