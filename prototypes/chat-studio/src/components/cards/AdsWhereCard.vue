<script setup>
// Ads in the chat, 1 of 3: which Presto pages should carry ads.
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { PAGES, OFFERS } from '../../ads.js'
import { chooseAdPages, state } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const ABOUT = {
  landing: { icon: 'layout', note: 'The event’s own page, below its description' },
  browse: { icon: 'grid', note: 'The list of hotels near the event' },
  details: { icon: 'file', note: 'A hotel’s page, with its rooms' },
}
const done = computed(() => !!props.card.picked)
const picked = ref(props.card.picked ? [...props.card.picked] : [])
const on = (id) => (done.value ? props.card.picked : picked.value).includes(id)
function toggle(id) { if (!done.value) picked.value = on(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id] }
const count = (id) => OFFERS.filter((o) => o.page === id).length
</script>

<template>
  <CardShell kicker="Advertisements" title="Where should ads run?" :aside="done ? 'Confirmed' : `${picked.length} of ${PAGES.length} pages`">
    <div class="aw" role="group" aria-label="Pages with ads">
      <button
        v-for="pg in PAGES" :key="pg.id" type="button" class="aw__page" :class="{ 'is-on': on(pg.id) }"
        :aria-pressed="on(pg.id)" :disabled="done" @click="toggle(pg.id)"
      >
        <span class="aw__icon"><Icon :name="ABOUT[pg.id].icon" :size="20" /></span>
        <span class="aw__text"><b>{{ pg.label }}</b><small>{{ ABOUT[pg.id].note }} · {{ count(pg.id) }} placements</small></span>
        <span class="aw__check"><Icon v-if="on(pg.id)" name="check" :size="16" /></span>
      </button>
    </div>
    <div v-if="!done" class="aw__foot">
      <button type="button" class="cs-btn-dark" :disabled="!picked.length || state.working" @click="chooseAdPages(project, PAGES.filter((p) => picked.includes(p.id)).map((p) => p.id), card)">
        <Icon name="check" :size="16" /> Confirm {{ picked.length === 1 ? 'this page' : picked.length ? `these ${picked.length} pages` : 'pages' }}
      </button>
      <small class="aw__hint">Pick one or more.</small>
    </div>
  </CardShell>
</template>

<style scoped>
.aw__foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.aw { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.aw__page { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
.aw__page:hover:not(:disabled) { border-color: var(--line-bold); }
.aw__page.is-on { border-color: var(--pill); background: var(--selected); }
.aw__page:disabled { cursor: default; }
.aw__page:disabled:not(.is-on) { opacity: 0.55; }
.aw__icon { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: var(--r); background: var(--surface-3); color: var(--ink-2); }
.aw__page.is-on .aw__icon { background: var(--pill); color: var(--pill-ink); }
.aw__text { flex: 1; min-width: 0; display: grid; }
.aw__text b { font-size: 15px; }
.aw__text small { color: var(--ink-3); font-size: 12px; }
.aw__check { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border: 1.5px solid var(--line-bold); border-radius: 4px; color: var(--pill-ink); }
.aw__page.is-on .aw__check { background: var(--pill); border-color: var(--pill); }
.aw__hint { color: var(--ink-3); font-size: 13px; }
@media (max-width: 900px) { .aw { grid-template-columns: 1fr; } }
</style>
