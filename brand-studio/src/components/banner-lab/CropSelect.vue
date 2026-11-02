<script setup>
// CropSelect — the image with a selection box, like WhatTheFont's crop box.
// The box starts around the detected logo; drag inside it to move it, drag a
// handle to resize it, or draw a new box anywhere on the image. Arrow keys
// nudge it (Shift = 10px). v-model is in the image's own pixels.
import { computed, ref } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  width: { type: Number, required: true }, // natural size of src
  height: { type: Number, required: true },
  modelValue: { type: Object, required: true }, // { x, y, w, h }
})
const emit = defineEmits(['update:modelValue'])

const frame = ref(null)
const MIN = 12
const box = computed(() => props.modelValue)
const pct = computed(() => ({
  left: `${(box.value.x / props.width) * 100}%`,
  top: `${(box.value.y / props.height) * 100}%`,
  width: `${(box.value.w / props.width) * 100}%`,
  height: `${(box.value.h / props.height) * 100}%`,
}))

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
function toImage(e) {
  const r = frame.value.getBoundingClientRect()
  return { x: ((e.clientX - r.left) / r.width) * props.width, y: ((e.clientY - r.top) / r.height) * props.height }
}
function set(b) {
  const x = clamp(b.x, 0, props.width - MIN)
  const y = clamp(b.y, 0, props.height - MIN)
  emit('update:modelValue', { x, y, w: clamp(b.w, MIN, props.width - x), h: clamp(b.h, MIN, props.height - y) })
}

let drag = null
function start(e, mode) {
  e.preventDefault()
  e.stopPropagation()
  const p = toImage(e)
  drag = { mode, start: p, box: { ...box.value } }
  if (mode === 'draw') set({ x: p.x, y: p.y, w: MIN, h: MIN })
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end, { once: true })
}
function move(e) {
  if (!drag) return
  const p = toImage(e)
  const dx = p.x - drag.start.x
  const dy = p.y - drag.start.y
  const b = drag.box
  if (drag.mode === 'move') return set({ ...b, x: clamp(b.x + dx, 0, props.width - b.w), y: clamp(b.y + dy, 0, props.height - b.h) })
  if (drag.mode === 'draw') {
    const x0 = Math.min(drag.start.x, p.x)
    const y0 = Math.min(drag.start.y, p.y)
    return set({ x: x0, y: y0, w: Math.abs(dx), h: Math.abs(dy) })
  }
  // Resize from a corner/edge: m holds which sides move.
  let { x, y, w, h } = b
  if (drag.mode.includes('w')) { x = clamp(b.x + dx, 0, b.x + b.w - MIN); w = b.x + b.w - x }
  if (drag.mode.includes('e')) w = b.w + dx
  if (drag.mode.includes('n')) { y = clamp(b.y + dy, 0, b.y + b.h - MIN); h = b.y + b.h - y }
  if (drag.mode.includes('s')) h = b.h + dy
  set({ x, y, w, h })
}
function end() {
  drag = null
  window.removeEventListener('pointermove', move)
}
function key(e) {
  const step = e.shiftKey ? 10 : 1
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
  if (!d) return
  e.preventDefault()
  set({ ...box.value, x: box.value.x + d[0], y: box.value.y + d[1] })
}
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
</script>

<template>
  <div ref="frame" class="cs" :style="{ aspectRatio: `${width} / ${height}`, width: `min(100%, calc(62vh * ${width / height}))` }" @pointerdown="start($event, 'draw')">
    <img :src="src" alt="Your upload" class="cs__img" draggable="false" />
    <div class="cs__shade" :style="pct" aria-hidden="true" />
    <div
      class="cs__box bs-focusable" :style="pct" tabindex="0" role="slider"
      :aria-label="`Logo selection, ${Math.round(box.w)} by ${Math.round(box.h)} pixels. Arrow keys move it.`"
      :aria-valuetext="`${Math.round(box.x)}, ${Math.round(box.y)}`"
      @pointerdown="start($event, 'move')" @keydown="key"
    >
      <span v-for="h in HANDLES" :key="h" class="cs__handle" :class="`cs__handle--${h}`" @pointerdown="start($event, h)" />
      <span class="cs__size">{{ Math.round(box.w) }} × {{ Math.round(box.h) }}</span>
    </div>
  </div>
</template>

<style scoped>
.cs {
  position: relative; margin: 0 auto; touch-action: none; user-select: none; cursor: crosshair;
  background: repeating-conic-gradient(#e7e9ef 0% 25%, #fff 0% 50%) 50% / 20px 20px; border-radius: var(--bs-radius-md); overflow: hidden;
}
.cs__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
/* Dim everything outside the box with one huge shadow. */
.cs__shade { position: absolute; box-shadow: 0 0 0 9999px rgb(3 10 38 / 0.45); pointer-events: none; }
.cs__box { position: absolute; border: 2px solid #3B82F6; cursor: move; box-sizing: border-box; }
.cs__handle { position: absolute; width: 14px; height: 14px; background: #fff; border: 2px solid #3B82F6; border-radius: 50%; transform: translate(-50%, -50%); }
.cs__handle--nw { left: 0; top: 0; cursor: nwse-resize; }
.cs__handle--n { left: 50%; top: 0; cursor: ns-resize; }
.cs__handle--ne { left: 100%; top: 0; cursor: nesw-resize; }
.cs__handle--e { left: 100%; top: 50%; cursor: ew-resize; }
.cs__handle--se { left: 100%; top: 100%; cursor: nwse-resize; }
.cs__handle--s { left: 50%; top: 100%; cursor: ns-resize; }
.cs__handle--sw { left: 0; top: 100%; cursor: nesw-resize; }
.cs__handle--w { left: 0; top: 50%; cursor: ew-resize; }
.cs__size { position: absolute; left: 0; bottom: 100%; margin-bottom: 6px; padding: 2px 8px; border-radius: 999px; background: #3B82F6; color: #fff; font: 600 0.75rem var(--bs-font); white-space: nowrap; }
</style>
