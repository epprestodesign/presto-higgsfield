<script setup>
// PhoneFrame — mobile mockup shell: a realistic iPhone with Safari
// (devices/IPhone). The slot renders at a 390px design width and the whole
// handset scales to the frame's width.
import IPhone from '../devices/IPhone.vue'

defineProps({
  label: { type: String, default: 'Mobile preview' },
  screenHeight: { type: Number, default: 780 },
  url: { type: String, default: 'demo.eventpipe.com' },
  safari: { type: Boolean, default: true },
})
</script>

<template>
  <i-phone :page-height="screenHeight" :url="url" :safari="safari" :label="label">
    <slot />
  </i-phone>
</template>
