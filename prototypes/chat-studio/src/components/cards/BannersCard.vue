<script setup>
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { selectBanner, state } from '../../mockAgent.js'

defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const emit = defineEmits(['ask'])
</script>

<template>
  <CardShell :kicker="card.mood ? `Banner set ${card.set} · ${card.mood}` : `Banner set ${card.set}`" title="Pick a banner" :aside="`3 banners · ${card.credits} credits`">
    <div class="bn" role="radiogroup" :aria-label="`Banner set ${card.set}`">
      <button
        v-for="(img, i) in card.images" :key="img.key" type="button" class="bn__tile" :class="{ 'is-on': project.selected?.key === img.key, 'is-wide': i === 0 }"
        role="radio" :aria-checked="project.selected?.key === img.key" :aria-label="`${img.kind} banner ${i + 1}`" @click="selectBanner(project, img)"
      >
        <img :src="img.src" alt="" :style="{ filter: img.filter || undefined }" />
        <span class="bn__tag">{{ img.kind }}</span>
        <span v-if="project.selected?.key === img.key" class="bn__on"><Icon name="check" :size="14" /> On your pages</span>
        <span v-else class="bn__use">Use this banner</span>
      </button>
    </div>
    <template #foot>
      <button type="button" class="cs-btn-ghost bn__more" :disabled="state.working" @click="emit('ask', 'Make 3 more')">Make 3 more <Icon name="down" :size="16" /></button>
    </template>
  </CardShell>
</template>

<style scoped>
.bn { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.bn__tile { position: relative; padding: 0; border: 0; border-radius: var(--r-card); overflow: hidden; background: var(--surface-3); cursor: pointer; aspect-ratio: 16 / 7; }
.bn__tile.is-wide { grid-column: 1 / -1; aspect-ratio: 1440 / 400; }
.bn__tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.bn__tile:hover img { transform: scale(1.02); }
.bn__tile.is-on { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--pill); }
.bn__tag { position: absolute; left: 12px; bottom: 12px; padding: 3px 9px; border-radius: var(--r); background: rgba(1, 17, 62, 0.7); color: #fff; font-size: 12px; backdrop-filter: blur(6px); }
.bn__on, .bn__use { position: absolute; top: 12px; right: 12px; display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: var(--r); font-size: 13px; font-weight: 700; }
.bn__on { background: var(--navy-900); color: #fff; }
.bn__use { background: rgba(255, 255, 255, 0.92); color: var(--navy-900); opacity: 0; transition: opacity 0.15s; }
.bn__tile:hover .bn__use, .bn__tile:focus-visible .bn__use { opacity: 1; }
.bn__more { box-shadow: var(--shadow); padding: 8px 18px; }
.bn__more:disabled { opacity: 0.6; cursor: default; }
@media (max-width: 640px) { .bn { grid-template-columns: 1fr; } }
</style>
