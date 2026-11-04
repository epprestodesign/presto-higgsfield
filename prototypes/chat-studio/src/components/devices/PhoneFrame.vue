<script setup>
// The live Studio's phone: Chrome for iOS (390 × 844) inside the black phone
// shell PNG, mapped the way brand-studio's DevicePreview does it (the shell is
// stretched so its transparent opening covers the screen exactly).
import { computed } from 'vue'
import ChromeMobile, { SCREEN_W, SCREEN_H } from './ChromeMobile.vue'
import shell from '../../assets/devices/phone-black.png'

// Shell geometry (brand-studio/src/assets/devices/generated/shells.json, phone-black).
const SHELL = { w: 526, h: 1053, screen: { x: 17, y: 13, w: 493, h: 1026, r: 72 } }

const props = defineProps({ width: { type: Number, default: 280 } }) // screen width in px
const scale = computed(() => props.width / SCREEN_W)
const box = computed(() => {
  const sw = props.width
  const sh = SCREEN_H * scale.value
  const fx = SHELL.w / SHELL.screen.w
  const fy = SHELL.h / SHELL.screen.h
  return {
    device: { width: `${sw * fx}px`, height: `${sh * fy}px` },
    screen: {
      left: `${(SHELL.screen.x / SHELL.w) * sw * fx}px`,
      top: `${(SHELL.screen.y / SHELL.h) * sh * fy}px`,
      width: `${sw}px`,
      height: `${sh}px`,
      borderRadius: `${(SHELL.screen.r / SHELL.screen.w) * sw}px`,
    },
  }
})
</script>

<template>
  <div class="pf" :style="box.device">
    <div class="pf__screen" :style="box.screen">
      <ChromeMobile :scale="scale"><slot /></ChromeMobile>
    </div>
    <img class="pf__shell" :src="shell" alt="" aria-hidden="true" />
  </div>
</template>

<style scoped>
.pf { position: relative; margin: 0 auto; filter: drop-shadow(0 18px 36px rgba(3, 10, 38, 0.22)); }
.pf__screen { position: absolute; overflow: hidden; background: #fff; }
.pf__shell { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; pointer-events: none; user-select: none; }
</style>
