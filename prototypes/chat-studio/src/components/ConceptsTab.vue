<script setup>
// Concepts: every draft of the project, newest first, as a stack of its
// screens. Click one to see it full size (desktop, then mobile).
import { computed } from 'vue'
import DraftStack from './presto/DraftStack.vue'
import { draftView } from '../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true } })
const emit = defineEmits(['open', 'chat'])
const drafts = computed(() => [...props.project.drafts].reverse())
// A draft in front, the drafts before it behind (newest first).
const history = (d) => props.project.drafts.slice(0, d.n).reverse().map((x) => draftView(props.project, x))
function when(t) {
  const m = Math.round((Date.now() - t) / 6e4)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}
</script>

<template>
  <div class="ct">
    <div class="ct__inner">
      <header class="ct__head">
        <h2>Concepts</h2>
        <p>Every draft you’ve tried on {{ project.name }}. Open one to see its pages, or bring it back.</p>
      </header>
      <ul v-if="drafts.length" class="ct__grid">
        <li v-for="d in drafts" :key="d.id">
          <button type="button" class="ct__card ds-hover" :aria-label="`Open draft ${d.n}: ${d.label}`" @click="emit('open', d)">
            <span class="ct__stage"><DraftStack :views="history(d)" /></span>
            <span v-if="!d.snap" class="ct__live">Current</span>
          </button>
          <div class="ct__meta">
            <span class="ct__logo"><img :src="project.brand.logo" alt="" /></span>
            <span>
              <b>Draft {{ d.n }} · {{ d.label }}</b>
              <small>on {{ project.name }} · {{ when(d.at) }}</small>
            </span>
          </div>
        </li>
      </ul>
      <div v-else class="ct__empty">
        <p><b>No drafts yet.</b> Your first draft appears when the agent puts everything on the Presto pages.</p>
        <button type="button" class="cs-btn-ghost" @click="emit('chat')">Back to the chat</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ct { height: 100%; overflow-y: auto; scrollbar-gutter: stable; background: var(--surface-2); }
.ct__inner { width: min(1180px, 100%); margin: 0 auto; padding: 28px 28px 64px; }
.ct__head h2 { margin: 0; font-size: 24px; }
.ct__head p { margin: 4px 0 24px; color: var(--ink-2); }
.ct__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 28px 24px; }
.ct__card { position: relative; display: block; width: 100%; padding: 0; border: 1px solid var(--line); border-radius: 12px; background: var(--surface-3); cursor: pointer; overflow: hidden; }
.ct__card:hover { border-color: var(--line-bold); box-shadow: var(--shadow); }
.ct__stage { display: block; padding: 6% 4% 0; }
.ct__live { position: absolute; top: 12px; left: 12px; padding: 2px 8px; border-radius: var(--r); background: var(--pill); color: var(--pill-ink); font-size: 12px; font-weight: 700; }
.ct__meta { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.ct__meta b { display: block; font-size: 16px; }
.ct__meta small { color: var(--ink-3); font-size: 13px; }
.ct__logo { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border: 1px solid var(--line); border-radius: var(--r); background: #fff; }
.ct__logo img { max-width: 26px; max-height: 26px; object-fit: contain; }
.ct__empty { padding: 32px; border: 1px dashed var(--line-bold); border-radius: var(--r-card); text-align: center; color: var(--ink-2); }
@media (max-width: 640px) { .ct__inner { padding: 20px 14px 48px; } .ct__grid { grid-template-columns: 1fr; } }
</style>
