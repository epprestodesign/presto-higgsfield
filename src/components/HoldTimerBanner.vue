<script setup>
// HoldTimerBanner — the group-block "Time left to book" hold countdown shown as a
// full-width strip appended under the app bar, plus a floating HoldTimerPill that
// appears once the strip scrolls out of view. Shared across the checkout + browse
// screens so an active hold reads consistently wherever the guest is.
//
// Render it as a full-width element directly under the app bar; its inner content
// aligns to the page column via `--col` (falls back to 1040px).
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import HoldTimerPill from './HoldTimerPill.vue'

const props = defineProps({
  seconds: { type: Number, default: 900 },
  label: { type: String, default: 'Time left to book' },
  note: { type: String, default: "Book before the timer runs out to secure this rate. If the timer expires, you'll need to run your search again." },
})

const clock = computed(() => {
  const s = Math.max(0, props.seconds)
  return `${Math.floor(s / 60)} min : ${String(s % 60).padStart(2, '0')} sec`
})

const strip = ref(null)
const showPill = ref(false)
let observer = null
onMounted(() => {
  if (strip.value && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { showPill.value = !entry.isIntersecting }, { threshold: 0 })
    observer.observe(strip.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="strip" class="htb">
    <div class="htb__inner">
      <div class="htb__main">
        <span class="htb__label"><q-icon name="timer" size="18px" /> {{ label }}</span>
        <span class="htb__clock">{{ clock }}</span>
      </div>
      <p v-if="note" class="htb__note">{{ note }}</p>
    </div>
  </div>
  <hold-timer-pill v-if="showPill" :seconds="seconds" position="bottom-right" />
</template>

<style scoped>
.htb { width: 100%; background: var(--ds-palette-blue-100); border-bottom: 1px solid var(--ds-palette-blue-200, #BFDBFE); color: var(--ds-palette-blue-800); }
.htb__inner { max-width: var(--col, 1040px); margin: 0 auto; padding: 12px 24px; box-sizing: border-box; }
.htb__main { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.htb__label { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1rem; }
.htb__clock { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 1.0625rem; }
.htb__note { margin: 4px 0 0; font-size: 0.875rem; line-height: 1.4; }
</style>
