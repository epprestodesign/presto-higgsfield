<script setup>
// DropHero — the WhatTheFont-style entry: one big headline, one row to paste an
// image URL or upload a file, the reminder that you can drop anywhere on the
// page (the app listens for that) or paste from the clipboard, and upload tips
// beside it. Used by both Banner Lab modes.
import { ref } from 'vue'

const props = defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  lead: { type: String, default: '' },
  tips: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: false },
  accept: { type: String, default: 'image/png,image/jpeg,image/webp,image/svg+xml' },
  busy: { type: String, default: '' },
  error: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  urlPlaceholder: { type: String, default: 'Type or paste an image URL…' },
})
const emit = defineEmits(['files', 'url'])

const url = ref('')
const input = ref(null)
function submitUrl() {
  const v = url.value.trim()
  if (!/^https?:\/\//i.test(v)) return
  emit('url', v)
  url.value = ''
}
function onPick(e) {
  if (e.target.files?.length) emit('files', [...e.target.files])
  e.target.value = ''
}
const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
defineExpose({ open: () => input.value?.click() })
</script>

<template>
  <section class="dh" :class="{ 'dh--compact': props.compact }">
    <div class="dh__main">
      <p v-if="eyebrow" class="bs-eyebrow">{{ eyebrow }}</p>
      <h1 v-if="!compact" class="bs-display-2 dh__title">{{ title }}</h1>
      <h2 v-else class="bs-title dh__title">{{ title }}</h2>
      <p v-if="lead" class="bs-lead dh__lead">{{ lead }}</p>

      <form class="dh__row" @submit.prevent="submitUrl">
        <label class="bs-sr-only" for="dh-url">Image URL</label>
        <input id="dh-url" v-model="url" class="dh__url bs-focusable" type="url" :placeholder="urlPlaceholder" autocomplete="off" />
        <q-btn v-if="url.trim()" type="submit" unelevated no-caps class="bs-btn bs-btn--primary" label="Use URL" />
        <span class="dh__or">or</span>
        <q-btn unelevated no-caps class="bs-btn bs-btn--primary" :icon="multiple ? 'add_photo_alternate' : 'upload'" :label="multiple ? 'Upload images' : 'Upload an image'" @click="input.click()" />
        <input ref="input" class="bs-sr-only" type="file" :accept="accept" :multiple="multiple" tabindex="-1" @change="onPick" />
      </form>
      <p class="bs-caption dh__hint">
        <q-icon name="pan_tool_alt" size="16px" /> or drag and drop {{ multiple ? 'images' : 'an image' }} anywhere on the page · or paste with {{ isMac ? '⌘V' : 'Ctrl+V' }}
      </p>
      <p v-if="busy" class="dh__busy" role="status"><q-spinner size="18px" /> {{ busy }}</p>
      <p v-if="error" class="dh__error" role="alert"><q-icon name="error_outline" size="18px" /> {{ error }}</p>
      <slot />
    </div>

    <aside v-if="tips.length" class="dh__tips" aria-label="Tips for upload">
      <p class="bs-subtitle">Tips for upload</p>
      <ul>
        <li v-for="t in tips" :key="t" class="bs-caption">{{ t }}</li>
      </ul>
    </aside>
  </section>
</template>

<style scoped>
.dh { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 40px; align-items: start; }
.dh--compact { grid-template-columns: minmax(0, 1fr) 240px; gap: 28px; }
.dh__title { margin-top: 8px; }
.dh__lead { margin-top: 12px; max-width: 640px; }
.dh--compact .dh__lead { font-size: 1rem; }
.dh__row { display: flex; align-items: center; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
.dh--compact .dh__row { margin-top: 18px; }
.dh__url {
  flex: 1 1 320px; min-width: 0; height: 52px; padding: 0 18px; border-radius: 999px;
  border: 1px solid var(--bs-line-strong); background: var(--bs-surface); font: 400 1rem var(--bs-font); color: var(--bs-ink);
}
.dh__or { font: 600 0.875rem var(--bs-font); color: var(--bs-ink-faint); }
.dh__hint { margin-top: 12px; display: flex; align-items: center; gap: 6px; }
.dh__busy, .dh__error { margin: 14px 0 0; display: flex; align-items: center; gap: 8px; font: 600 0.9375rem var(--bs-font); }
.dh__busy { color: var(--bs-accent); }
.dh__error { color: var(--bs-danger); }
.dh__tips { background: var(--bs-surface); border: 1px solid var(--bs-line); border-radius: var(--bs-radius-lg); padding: 18px 20px; }
.dh__tips ul { margin: 10px 0 0; padding-left: 18px; display: grid; gap: 6px; }
@media (max-width: 900px) {
  .dh, .dh--compact { grid-template-columns: 1fr; gap: 20px; }
}
</style>
