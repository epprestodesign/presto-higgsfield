<script setup>
import { computed } from 'vue'
import CardShell from './CardShell.vue'
import LogoMark from '../LogoMark.vue'
import { LOGO_LOOKS } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true } })
// Shown over the chosen banner (or the brand's first image) so you judge it in place.
const bg = computed(() => props.project.selected || { src: props.project.brand.images[0].src, filter: '' })
</script>

<template>
  <CardShell kicker="Logo" title="Pick a logo look" aside="Cleaned up · background removed">
    <div class="lk" role="radiogroup" aria-label="Logo look">
      <button
        v-for="l in LOGO_LOOKS" :key="l.id" type="button" class="lk__opt" :class="{ 'is-on': project.look === l.id }"
        role="radio" :aria-checked="project.look === l.id" @click="project.look = l.id"
      >
        <span class="lk__stage" :style="{ backgroundImage: `url(${bg.src})`, filter: bg.filter || undefined }" />
        <span class="lk__mark"><LogoMark :project="project" :look="l.id" :size="78" /></span>
        <span class="lk__text"><b>{{ l.label }}</b><small>{{ l.note }}</small></span>
        <span v-if="project.look === l.id" class="lk__on">On your pages</span>
      </button>
    </div>
  </CardShell>
</template>

<style scoped>
.lk { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.lk__opt { position: relative; display: grid; gap: 10px; padding: 0; border: 0; background: none; text-align: left; cursor: pointer; }
.lk__stage { grid-area: 1 / 1; aspect-ratio: 4 / 3; border-radius: var(--r-card); background: center / cover; }
.lk__mark { grid-area: 1 / 1; display: grid; place-items: center; z-index: 1; }
.lk__opt.is-on .lk__stage { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--pill); }
.lk__text { display: grid; }
.lk__text b { font-weight: 700; font-size: 14px; }
.lk__text small { color: var(--ink-3); font-size: 12.5px; }
.lk__on { position: absolute; top: 10px; left: 10px; z-index: 2; padding: 3px 9px; border-radius: var(--r); background: var(--pill); color: var(--pill-ink); font-size: 12px; font-weight: 700; }
@media (max-width: 720px) { .lk { grid-template-columns: repeat(2, 1fr); } }
</style>
