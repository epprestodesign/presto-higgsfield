<script setup>
// A Presto page — landing, hotel browse or hotel details — as the live Studio
// shows it: the REAL Presto template (PrestoFrame → Preview Host) in a Chrome
// window on desktop, or Chrome for iOS in the phone shell. `chrome: false`
// drops the browser frame (stack thumbnails).
import PrestoFrame from './PrestoFrame.vue'
import ChromeWindow from '../devices/ChromeWindow.vue'
import PhoneFrame from '../devices/PhoneFrame.vue'
import { PAGE_H } from '../devices/ChromeMobile.vue'
import { logoOf } from '../../mockAgent.js'

defineProps({
  project: { type: Object, required: true }, // a project or a draft snapshot
  screen: { type: String, default: 'landing' }, // landing | browse | details
  device: { type: String, default: 'desktop' }, // desktop | mobile
  chrome: { type: Boolean, default: true },
  phoneWidth: { type: Number, default: 280 },
})
const emit = defineEmits(['navigate'])
</script>

<template>
  <ChromeWindow v-if="chrome && device === 'desktop'" :title="project.brand.name" :favicon="logoOf(project)" :design-width="1280">
    <PrestoFrame :view="project" :page="screen" :width="1280" :height="760" @navigate="emit('navigate', $event)" />
  </ChromeWindow>

  <PhoneFrame v-else-if="chrome" :width="phoneWidth">
    <PrestoFrame :view="project" :page="screen" :width="390" :height="PAGE_H" :fit="false" @navigate="emit('navigate', $event)" />
  </PhoneFrame>

  <div v-else class="ps-bare">
    <PrestoFrame :view="project" :page="screen" :width="1280" :height="800" :interactive="false" />
  </div>
</template>

<style scoped>
.ps-bare { overflow: hidden; background: #fff; }
</style>
