<script setup>
// HoldTimerPill — a floating "Time left to book" countdown for group-block holds.
// Group rooms are held temporarily the moment the first room is added to the
// cart, so the hold timer must be visible for the rest of the workflow no matter
// where the guest goes (browse → details → checkout). This pill anchors to a
// screen corner and stays put while they navigate.
//
// Controlled by default: the parent owns the countdown (a single shared timer
// that survives screen changes) and passes the remaining `seconds` each tick.
// Pass `running` to let the pill count down from `seconds` on its own — handy
// for a standalone demo.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  seconds: { type: Number, default: 900 },
  label: { type: String, default: 'Time left to book' },
  sub: { type: String, default: 'Rooms are held while the timer runs' },
  // Corner to anchor to: bottom-right | bottom-left | top-right | top-left.
  position: { type: String, default: 'bottom-right' },
  // Threshold (seconds) at or below which the pill turns urgent (amber).
  urgentAt: { type: Number, default: 60 },
  // Self-run the countdown from `seconds` instead of tracking the prop.
  running: { type: Boolean, default: false },
})
const emit = defineEmits(['expire'])

const internal = ref(props.seconds)
let tick = null
const secs = computed(() => (props.running ? internal.value : props.seconds))
const clock = computed(() => {
  const s = Math.max(0, secs.value)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const urgent = computed(() => secs.value <= props.urgentAt)

// Keep the self-run seed in sync if the parent changes `seconds` while running.
watch(() => props.seconds, (v) => { if (props.running) internal.value = v })
watch(secs, (v, prev) => { if (v <= 0 && prev > 0) emit('expire') })

onMounted(() => {
  if (props.running) {
    tick = setInterval(() => { if (internal.value > 0) internal.value--; else clearInterval(tick) }, 1000)
  }
})
onBeforeUnmount(() => clearInterval(tick))
</script>

<template>
  <div class="htp" :class="[`htp--${position}`, { 'htp--urgent': urgent }]" role="status" aria-live="polite">
    <span class="htp__icon"><q-icon name="timer" size="20px" /></span>
    <span class="htp__body">
      <span class="htp__label">{{ label }}</span>
      <span v-if="sub" class="htp__sub">{{ sub }}</span>
    </span>
    <span class="htp__clock">{{ clock }}</span>
  </div>
</template>

<style scoped>
.htp {
  position: fixed;
  z-index: 2000;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: var(--ds-radius-pill);
  background: var(--ds-palette-blue-100);
  border: 1px solid var(--ds-palette-blue-200, #BFDBFE);
  color: var(--ds-palette-blue-800);
  box-shadow: var(--ds-shadow-2, 0 10px 30px rgba(2, 16, 63, 0.18));
  animation: htp-in var(--ds-duration-medium, 260ms) var(--ds-ease-standard, ease-out);
}
.htp--bottom-right { right: 24px; bottom: 24px; }
.htp--bottom-left { left: 24px; bottom: 24px; }
.htp--top-right { right: 24px; top: 24px; }
.htp--top-left { left: 24px; top: 24px; }

.htp__icon { display: inline-flex; flex: none; }
.htp__body { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
.htp__label { font-weight: 700; font-size: 0.9375rem; }
.htp__sub { font-size: 0.75rem; opacity: 0.85; margin-top: 1px; }
.htp__clock { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 1.125rem; margin-left: 4px; flex: none; }

/* Under a minute — nudge toward urgency. */
.htp--urgent {
  background: var(--ds-color-background-warning, #FEF3C7);
  border-color: var(--ds-palette-amber-200, #FDE68A);
  color: var(--ds-palette-amber-800);
}

@keyframes htp-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Small screens: span the width with a small inset so it never overflows. */
@media (max-width: 520px) {
  .htp { left: 16px; right: 16px; bottom: 16px; }
  .htp--top-right, .htp--top-left { top: 16px; bottom: auto; }
}
</style>
