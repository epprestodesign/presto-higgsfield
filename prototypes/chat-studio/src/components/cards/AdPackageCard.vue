<script setup>
// In the chat, after "Looks good, package it" / "Package all ads": each ad as
// a zip of its sizes, ready to upload to Presto.
import { computed } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import AdPreview from '../ads/AdPreview.vue'
import { toast } from '../../mockAgent.js'
import { readySizes, thumbSize, AD_SIZES } from '../../ads.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const area = (s) => AD_SIZES[s].width * AD_SIZES[s].height
const files = computed(() => props.card.adIds.map((id) => props.project.ads.items.find((a) => a.id === id)).filter(Boolean).map((a) => {
  const sizes = readySizes(a).sort((x, y) => area(y) - area(x))
  return { a, sizes, thumb: thumbSize(sizes), name: `${props.project.brand.id}-ad-${a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.zip` }
}))
const total = computed(() => files.value.reduce((n, f) => n + f.sizes.length, 0))
const fake = (what) => toast(`Prototype: ${what} would download here`)
</script>

<template>
  <CardShell kicker="Files" :title="files.length === 1 ? 'Ad package' : 'Ad packages'" :aside="`${total} ${total === 1 ? 'file' : 'files'}`">
    <ul v-if="files.length" class="ap">
      <li v-for="f in files" :key="f.a.id">
        <span class="ap__thumb"><AdPreview v-if="f.sizes.length" :ad="f.a" :size="f.thumb" :max-width="128" :max-height="56" /></span>
        <span class="ap__name"><b>{{ f.name }}</b><small>{{ f.a.name }} · {{ f.sizes.length }} {{ f.sizes.length === 1 ? 'size' : 'sizes' }}: {{ f.sizes.map((s) => s.replace('x', '×')).join(', ') }}</small></span>
        <button type="button" class="ap__dl" :aria-label="`Download ${f.name}`" @click="fake(f.name)"><Icon name="download" :size="18" /></button>
      </li>
    </ul>
    <p v-else class="ap__gone">These ads were deleted.</p>
    <button v-if="files.length > 1" type="button" class="cs-btn-dark ap__all" @click="fake('every ad (.zip)')"><Icon name="download" :size="18" /> Download all ads (.zip)</button>
  </CardShell>
</template>

<style scoped>
.ap { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ap li { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); }
.ap__thumb { display: grid; place-items: center; width: 136px; height: 60px; flex: none; border-radius: var(--r); background: var(--surface-3); overflow: hidden; }
.ap__name { flex: 1; display: grid; min-width: 0; }
.ap__name b { font-size: 14px; overflow-wrap: anywhere; }
.ap__name small { color: var(--ink-3); font-size: 13px; }
.ap__dl { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); color: var(--ink); cursor: pointer; }
.ap__dl:hover { border-color: var(--navy-900); }
.ap__all { margin-top: 14px; }
.ap__gone { margin: 0; color: var(--ink-3); font-size: 14px; }
@media (max-width: 640px) { .ap__thumb { width: 88px; } }
</style>
