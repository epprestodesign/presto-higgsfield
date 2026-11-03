<script setup>
import { computed } from 'vue'
import CardShell from './CardShell.vue'
import LogoMark from '../LogoMark.vue'
import Icon from '../Icon.vue'
import { toast } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true } })
const bg = computed(() => props.project.selected || { src: props.project.brand.images[0].src, filter: '' })
const slug = computed(() => props.project.brand.id)
const files = computed(() => [
  { kind: 'logo', name: `${slug.value}-logo-hero.png`, size: 'Landing banner · 2x', w: 1 },
  { kind: 'logo', name: `${slug.value}-logo-listings.png`, size: 'Hotel pages · 2x', w: 1 },
  { kind: 'banner', name: `${slug.value}-banner-1440x400.jpg`, size: '1440 × 400', ratio: '1440 / 400' },
  { kind: 'banner', name: `${slug.value}-banner-1440x240.jpg`, size: '1440 × 240', ratio: '1440 / 240' },
])
const fake = (what) => toast(`Prototype: ${what} would download here`)
</script>

<template>
  <CardShell kicker="Files" title="Ready for Presto" aside="4 files">
    <ul class="ex">
      <li v-for="f in files" :key="f.name">
        <span class="ex__thumb">
          <LogoMark v-if="f.kind === 'logo'" :project="project" :size="40" />
          <img v-else :src="bg.src" alt="" :style="{ aspectRatio: f.ratio, filter: bg.filter || undefined }" />
        </span>
        <span class="ex__name"><b>{{ f.name }}</b><small>{{ f.size }}</small></span>
        <button type="button" class="ex__dl" :aria-label="`Download ${f.name}`" @click="fake(f.name)"><Icon name="download" :size="18" /></button>
      </li>
    </ul>
    <button type="button" class="cs-btn-dark ex__all" @click="fake('the .zip')"><Icon name="download" :size="18" /> Download all (.zip)</button>
  </CardShell>
</template>

<style scoped>
.ex { list-style: none; margin: 0 0 18px; padding: 0; display: grid; gap: 8px; }
.ex li { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); }
.ex__thumb { display: grid; place-items: center; width: 120px; height: 56px; flex: none; border-radius: var(--r); background: var(--surface-3); overflow: hidden; }
.ex__thumb img { width: 100%; object-fit: cover; }
.ex__name { flex: 1; display: grid; min-width: 0; }
.ex__name b { font-weight: 700; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ex__name small { color: var(--ink-3); font-size: 12.5px; }
.ex__dl { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); cursor: pointer; }
.ex__all { justify-content: center; }
</style>
