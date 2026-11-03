<script setup>
import CardShell from './CardShell.vue'
import { toast } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true } })
const b = props.project.brand
const ROLES = ['Main', 'Accent', 'Light', 'Dark']
function copy(hex) {
  navigator.clipboard?.writeText(hex).catch(() => {})
  toast(`Copied ${hex}`)
}
</script>

<template>
  <CardShell kicker="Brand kit" :title="b.name" :aside="b.website">
    <div class="bk">
      <div class="bk__logo"><img :src="b.logo" :alt="`${b.name} logo`" /></div>
      <div class="bk__info">
        <p class="bk__label">Colours</p>
        <ul class="bk__swatches">
          <li v-for="(c, i) in project.palette" :key="i">
            <button type="button" class="bk__sw" :aria-label="`${ROLES[i]} colour ${c}, copy`" @click="copy(c)">
              <span :style="{ background: c }" />
              <b>{{ ROLES[i] }}</b>
              <small>{{ c }}</small>
            </button>
          </li>
        </ul>
        <p class="bk__label">Fonts</p>
        <p class="bk__fonts"><b>{{ b.fonts.display }}</b> for headlines · {{ b.fonts.body }} for everything else</p>
      </div>
    </div>
  </CardShell>
</template>

<style scoped>
.bk { display: grid; grid-template-columns: 180px 1fr; gap: 24px; align-items: start; }
.bk__logo { display: grid; place-items: center; aspect-ratio: 1; border-radius: var(--r-card); background: #fff; border: 1px solid var(--line); padding: 22px; }
.bk__logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.bk__label { margin: 0 0 8px; font-size: 13px; color: var(--ink-3); }
.bk__swatches { list-style: none; margin: 0 0 18px; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.bk__sw { display: grid; gap: 2px; width: 100%; padding: 8px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); text-align: left; cursor: pointer; }
.bk__sw span { height: 44px; border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); margin-bottom: 6px; }
.bk__sw b { font-weight: 700; font-size: 13px; }
.bk__sw small { font-size: 12px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.bk__fonts { margin: 0; color: var(--ink-2); }
@media (max-width: 640px) { .bk { grid-template-columns: 1fr; } .bk__logo { width: 140px; } .bk__swatches { grid-template-columns: repeat(2, 1fr); } }
</style>
