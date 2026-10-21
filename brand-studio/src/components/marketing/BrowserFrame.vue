<script setup>
// BrowserFrame — desktop mockup shell: a realistic Google Chrome window
// (devices/ChromeWindow). Kept as the marketing-facing wrapper so callers
// don't change.
import ChromeWindow from '../devices/ChromeWindow.vue'

defineProps({
  url: { type: String, default: 'demo.eventpipe.com' },
  title: { type: String, default: 'Presto booking page' },
  favicon: { type: String, default: '' },
  faviconColor: { type: String, default: '#01113E' },
  // Design width of the page inside, so the chrome scales with it.
  designWidth: { type: Number, default: 1200 },
  label: { type: String, default: 'Desktop preview' },
})
</script>

<template>
  <chrome-window :url="url" :title="title" :favicon="favicon" :favicon-color="faviconColor" :design-width="designWidth" :label="label">
    <slot />
  </chrome-window>
</template>
