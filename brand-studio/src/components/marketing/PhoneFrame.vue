<script setup>
// PhoneFrame — a minimal handset bezel for mobile mockups. The slot renders at
// a 390px design width and is scaled to the frame's width.
import ScaledFrame from './ScaledFrame.vue'

defineProps({
  label: { type: String, default: 'Mobile preview' },
  screenHeight: { type: Number, default: 780 },
})
</script>

<template>
  <figure class="pf" :aria-label="label">
    <div class="pf__screen">
      <span class="pf__notch" aria-hidden="true" />
      <scaled-frame :design-width="390" :design-height="screenHeight">
        <slot />
      </scaled-frame>
    </div>
  </figure>
</template>

<style scoped>
.pf {
  margin: 0;
  padding: 10px;
  border-radius: 38px;
  background: #0b0f19;
  box-shadow: var(--bs-shadow-3), inset 0 0 0 1px rgb(255 255 255 / 0.08);
}
.pf__screen { position: relative; border-radius: 29px; overflow: hidden; background: #fff; }
.pf__notch {
  position: absolute;
  z-index: 5;
  top: 8px;
  left: 50%;
  width: 34%;
  height: 22px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #0b0f19;
}
</style>
