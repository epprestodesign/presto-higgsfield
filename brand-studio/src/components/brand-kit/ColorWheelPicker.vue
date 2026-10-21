<script setup>
// ColorWheelPicker — a calm, compact take on Adobe Color's wheel for the Brand
// Kit. Drag Primary (the ringed base), Secondary and Accent around a
// hue/saturation wheel; a harmony rule moves the others with the base; one
// brightness slider per selected swatch; hex entry; live WCAG checks with a
// one-click fix. Writes go through the project store (rAF-throttled while
// dragging) so the live preview re-themes as you move.
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { normalizeHex, contrast, ensureContrast, onColor } from '../../theme/color.js'
import { paletteChecks } from '../../theme/brandTheme.js'
import {
  hexToHsv, hsvToHex, hsvToPoint, pointToHs, HARMONIES, getHarmony, applyHarmony, baseFromHandle, shufflePalette, WHEEL_ROLES,
} from './colorWheel.js'

const props = defineProps({
  initialRule: { type: String, default: 'custom' },
  // Apply the initial rule to the palette on mount (stories / onboarding presets).
  applyOnMount: { type: Boolean, default: false },
})

const store = useProjectStore()
const colors = computed(() => store.brandKit.colors)

const ROLES = [
  { id: 'primary', label: 'Primary', hint: 'Buttons, hero, links' },
  { id: 'secondary', label: 'Secondary', hint: 'Supporting color' },
  { id: 'accent', label: 'Accent', hint: 'Highlights' },
  { id: 'ink', label: 'Text', hint: 'Body copy' },
]

// ── Local HSV state mirrors the store (store stays the source of truth) ──
const hsv = reactive({})
const sync = () => ROLES.forEach((r) => { if (hsvToHex(hsv[r.id] || { h: 0, s: 0, v: 0 }) !== colors.value[r.id]) hsv[r.id] = hexToHsv(colors.value[r.id]) })
sync()
watch(colors, sync, { deep: true }) // undo/redo, hex edits elsewhere, samples

const rule = ref(props.initialRule)
const active = ref('primary')
const hexOf = (role) => hsvToHex(hsv[role])

// rAF-throttled store writes while dragging.
let frame = 0
const pending = new Set()
function commit(roles) {
  roles.forEach((r) => pending.add(r))
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    pending.forEach((r) => { const hex = hexOf(r); if (hex !== colors.value[r]) store.setColor(r, hex) })
    pending.clear()
  })
}
onBeforeUnmount(() => cancelAnimationFrame(frame))

function setRule(id) {
  rule.value = id
  if (id === 'custom') return
  Object.assign(hsv, applyHarmony(id, { ...hsv }))
  commit(WHEEL_ROLES)
  announce(`${getHarmony(id).label} harmony applied`)
}

/** Move a wheel handle to a hue/saturation, honoring the active rule. */
function moveHandle(role, hs) {
  if (rule.value === 'custom' || role === 'primary') {
    hsv[role] = { ...hsv[role], ...hs }
  } else {
    hsv.primary = { ...hsv.primary, ...baseFromHandle(rule.value, role, hs) }
  }
  if (rule.value !== 'custom') Object.assign(hsv, applyHarmony(rule.value, { ...hsv }))
  commit(rule.value === 'custom' ? [role] : WHEEL_ROLES)
}

onMounted(() => { if (props.applyOnMount && props.initialRule !== 'custom') setRule(props.initialRule) })

// ── Wheel geometry + pointer drag ──
const wheel = ref(null)
const SIZE = 220
const R = SIZE / 2
const pointOf = (role) => hsvToPoint(hsv[role], R)
let dragRole = null
function hsFromEvent(e) {
  const rect = wheel.value.getBoundingClientRect()
  const scale = SIZE / rect.width
  return pointToHs((e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale, R)
}
function onWheelDown(e) {
  const handle = e.target.closest('[data-role]')
  dragRole = handle ? handle.dataset.role : WHEEL_ROLES.includes(active.value) ? active.value : 'primary'
  active.value = dragRole
  wheel.value.setPointerCapture(e.pointerId)
  moveHandle(dragRole, hsFromEvent(e))
  ;(handle || wheel.value.querySelector(`[data-role="${dragRole}"]`))?.focus({ preventScroll: true })
  e.preventDefault()
}
function onWheelMove(e) { if (dragRole) moveHandle(dragRole, hsFromEvent(e)) }
function onWheelUp(e) { dragRole = null; wheel.value?.releasePointerCapture?.(e.pointerId) }

function onHandleKey(e, role) {
  const big = e.shiftKey
  const dh = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
  const ds = { ArrowDown: -1, ArrowUp: 1 }[e.key]
  if (dh === undefined && ds === undefined) return
  e.preventDefault()
  const cur = hsv[role]
  moveHandle(role, {
    h: dh ? (cur.h + dh * (big ? 15 : 3) + 360) % 360 : cur.h,
    s: ds ? Math.min(1, Math.max(0, cur.s + ds * (big ? 0.1 : 0.02))) : cur.s,
  })
}

// ── Brightness ──
const brightness = computed({
  get: () => Math.round(hsv[active.value].v * 100),
  set: (val) => {
    hsv[active.value] = { ...hsv[active.value], v: val / 100 }
    commit([active.value])
  },
})
const brightTrack = computed(() => `linear-gradient(90deg, #000, ${hsvToHex({ ...hsv[active.value], v: 1 })})`)

// ── Hex entry for the active swatch ──
const hexDraft = ref('')
const hexError = ref(false)
watch([active, () => colors.value[active.value]], () => { hexDraft.value = colors.value[active.value]; hexError.value = false }, { immediate: true })
function onHex(v) {
  hexDraft.value = v
  const hex = normalizeHex(v)
  hexError.value = !hex && v.replace('#', '').length >= 3
  if (!hex) return
  hsv[active.value] = hexToHsv(hex)
  if (active.value === 'primary' && rule.value !== 'custom') Object.assign(hsv, applyHarmony(rule.value, { ...hsv }))
  commit(active.value === 'primary' && rule.value !== 'custom' ? WHEEL_ROLES : [active.value])
}
const copied = ref(false)
async function copyHex() {
  try { await navigator.clipboard.writeText(colors.value[active.value]); copied.value = true; setTimeout(() => (copied.value = false), 1200) } catch { /* blocked */ }
}

// ── Shuffle ──
function shuffle() {
  Object.assign(hsv, shufflePalette(rule.value, { ...hsv }))
  commit(WHEEL_ROLES)
  announce('New palette')
}

// ── WCAG ──
const checks = computed(() => paletteChecks(colors.value).filter((c) => !c.label.includes('(raw)')))
const failing = computed(() => checks.value.filter((c) => !c.pass))
function makeAccessible() {
  const c = colors.value
  if (contrast(onColor(c.primary), c.primary) < 4.5) store.setColor('primary', ensureContrast(c.primary, '#FFFFFF', 4.5))
  if (contrast(onColor(c.secondary), c.secondary) < 4.5) store.setColor('secondary', ensureContrast(c.secondary, '#FFFFFF', 4.5))
  announce('Adjusted colors to pass WCAG AA')
}

// ── Screen-reader announcements ──
const live = ref('')
function announce(msg) { live.value = ''; requestAnimationFrame(() => (live.value = msg)) }

// Harmony chip icon: dots on a ring at the rule's offsets.
function chipDots(r) {
  if (r.icon) return r.icon.map(([x, y]) => ({ x: x * 20, y: y * 20 }))
  return [0, ...r.offsets].map((o, i) => {
    const s = i === 0 ? 1 : r.sat[i - 1]
    const a = (o * Math.PI) / 180
    return { x: 10 + Math.sin(a) * 7.5 * s, y: 10 - Math.cos(a) * 7.5 * s }
  })
}
const labelOf = (role) => ROLES.find((r) => r.id === role).label
</script>

<template>
  <div class="cwp">
    <!-- Harmony rules -->
    <div class="cwp__head">
      <div class="cwp__rules" role="radiogroup" aria-label="Color harmony">
        <button
          v-for="r in HARMONIES" :key="r.id" type="button" role="radio" class="cwp__rule bs-focusable"
          :aria-checked="rule === r.id" :aria-label="`${r.label} harmony`" :title="r.label" @click="setRule(r.id)"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8.5" class="ring" />
            <line v-for="(d, i) in chipDots(r).slice(r.icon ? 3 : 1)" :key="'l' + i" x1="10" y1="10" :x2="d.x" :y2="d.y" class="spoke" />
            <circle v-for="(d, i) in chipDots(r)" :key="i" :cx="d.x" :cy="d.y" :r="i === 0 ? 2.4 : 1.8" class="dot" />
          </svg>
        </button>
      </div>
    </div>
    <div class="cwp__rule-row">
      <p class="cwp__rule-name">Harmony · <strong>{{ getHarmony(rule).label }}</strong></p>
      <button type="button" class="cwp__shuffle bs-focusable" aria-label="Shuffle palette" @click="shuffle">
        <q-icon name="shuffle" size="16px" /> Shuffle
      </button>
    </div>

    <!-- Wheel -->
    <div
      ref="wheel" class="cwp__wheel" :class="{ 'is-dimmed': active === 'ink' }"
      @pointerdown="onWheelDown" @pointermove="onWheelMove" @pointerup="onWheelUp" @pointercancel="onWheelUp"
    >
      <svg class="cwp__spokes" :viewBox="`0 0 ${SIZE} ${SIZE}`" aria-hidden="true">
        <line v-for="role in WHEEL_ROLES" :key="role" :x1="R" :y1="R" :x2="pointOf(role).x" :y2="pointOf(role).y" />
      </svg>
      <button
        v-for="role in WHEEL_ROLES" :key="role" type="button" :data-role="role"
        class="cwp__handle" :class="[`cwp__handle--${role}`, { 'is-active': active === role }]"
        :style="{ left: `${(pointOf(role).x / SIZE) * 100}%`, top: `${(pointOf(role).y / SIZE) * 100}%`, background: hexOf(role) }"
        role="slider" :aria-label="`${labelOf(role)} color`"
        aria-valuemin="0" aria-valuemax="359" :aria-valuenow="Math.round(hsv[role].h)"
        :aria-valuetext="`${labelOf(role)} ${hexOf(role)}, hue ${Math.round(hsv[role].h)}°, saturation ${Math.round(hsv[role].s * 100)}%`"
        @focus="active = role" @keydown="onHandleKey($event, role)"
      />
    </div>

    <!-- Brightness -->
    <label class="cwp__label" for="cwp-bright">{{ labelOf(active) }} brightness <output>{{ brightness }}%</output></label>
    <input id="cwp-bright" v-model.number="brightness" type="range" min="0" max="100" step="1" class="cwp__range" :style="{ '--track': brightTrack }" />

    <!-- Swatch strip -->
    <div class="cwp__strip" role="radiogroup" aria-label="Color role">
      <button
        v-for="r in ROLES" :key="r.id" type="button" role="radio" class="cwp__swatch bs-focusable"
        :aria-checked="active === r.id" :style="{ background: colors[r.id], color: onColor(colors[r.id]) }"
        @click="active = r.id"
      >
        <q-icon v-if="active === r.id" name="check" size="14px" />
        <span class="bs-sr-only">{{ r.label }} {{ colors[r.id] }}</span>
      </button>
    </div>
    <div class="cwp__names" aria-hidden="true"><span v-for="r in ROLES" :key="r.id" :class="{ 'is-on': active === r.id }">{{ r.label }}</span></div>

    <!-- Hex for the active swatch -->
    <div class="cwp__hexrow">
      <div class="cwp__hexmeta">
        <label for="cwp-hex" class="cwp__hexlabel">{{ labelOf(active) }}</label>
        <span class="cwp__hint">{{ ROLES.find((r) => r.id === active).hint }}</span>
      </div>
      <input
        id="cwp-hex" class="cwp__hex bs-focusable" :class="{ 'is-error': hexError }" :value="hexDraft"
        spellcheck="false" maxlength="7" :aria-invalid="hexError" @input="onHex($event.target.value)"
      />
      <button type="button" class="cwp__copy bs-focusable" :aria-label="`Copy ${labelOf(active)} hex`" @click="copyHex">
        <q-icon :name="copied ? 'check' : 'content_copy'" size="16px" />
      </button>
    </div>

    <!-- WCAG -->
    <ul class="cwp__checks" aria-label="Contrast checks">
      <li v-for="c in checks" :key="c.label" :class="{ 'is-fail': !c.pass }">
        <q-icon :name="c.pass ? 'check_circle' : 'error'" size="16px" />
        <span>{{ c.label.replace(' (adjusted)', '') }}</span>
        <b>{{ c.ratio }}:1</b>
      </li>
    </ul>
    <q-btn
      v-if="failing.length" unelevated no-caps dense class="bs-btn bs-btn--primary cwp__fix" icon="contrast"
      label="Make it accessible" @click="makeAccessible"
    />
    <p class="bs-sr-only" aria-live="polite">{{ live }}</p>
  </div>
</template>

<style scoped>
.cwp { display: grid; gap: 10px; font-family: var(--bs-font); }
.cwp__head { display: flex; align-items: center; gap: 8px; }
.cwp__rules { flex: 1; display: flex; justify-content: space-between; gap: 2px; }
.cwp__rule {
  flex: 1 1 0; max-width: 34px; aspect-ratio: 1; min-width: 26px; display: grid; place-items: center; padding: 0;
  border: 1px solid var(--bs-line); border-radius: var(--bs-radius-sm); background: var(--bs-surface); color: var(--bs-ink-soft); cursor: pointer;
}
.cwp__rule-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: -2px; }
.cwp__shuffle { display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0 10px; border: 1px solid var(--bs-line); border-radius: 999px; background: var(--bs-surface); font: 700 0.75rem var(--bs-font); cursor: pointer; }
.cwp__rule svg { width: 20px; height: 20px; }
.cwp__rule .ring { fill: none; stroke: currentColor; stroke-width: 1.2; opacity: 0.45; }
.cwp__rule .spoke { stroke: currentColor; stroke-width: 1; opacity: 0.6; }
.cwp__rule .dot { fill: currentColor; }
.cwp__rule[aria-checked='true'] { background: var(--bs-ink); border-color: var(--bs-ink); color: #fff; }
.cwp__shuffle { color: var(--bs-ink); }
.cwp__shuffle:hover, .cwp__rule:hover { border-color: var(--bs-line-strong); }
.cwp__rule-name { margin: 0; font-size: 0.75rem; color: var(--bs-ink-soft); }
.cwp__rule-name strong { color: var(--bs-ink); }

.cwp__wheel {
  position: relative; width: min(100%, 240px); aspect-ratio: 1; justify-self: center; border-radius: 50%;
  background:
    radial-gradient(closest-side, #fff 0%, rgb(255 255 255 / 0.6) 45%, rgb(255 255 255 / 0) 100%),
    conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06), var(--bs-shadow-1);
  touch-action: none; cursor: crosshair; margin: 4px 0;
}
.cwp__wheel.is-dimmed { opacity: 0.45; }
.cwp__spokes { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.cwp__spokes line { stroke: rgb(255 255 255 / 0.9); stroke-width: 1.5; filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.35)); }
.cwp__handle {
  position: absolute; width: 24px; height: 24px; margin: -12px 0 0 -12px; padding: 0; border-radius: 50%;
  border: 3px solid #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / 0.25), 0 2px 6px rgb(0 0 0 / 0.25); cursor: grab;
  transition: transform var(--ds-duration-fast) var(--ds-ease-standard);
}
.cwp__handle--primary { width: 32px; height: 32px; margin: -16px 0 0 -16px; box-shadow: 0 0 0 1px rgb(0 0 0 / 0.25), 0 0 0 5px rgb(255 255 255 / 0.55), 0 2px 8px rgb(0 0 0 / 0.3); }
.cwp__handle.is-active { transform: scale(1.12); }
.cwp__handle:focus-visible { outline: none; box-shadow: 0 0 0 1px rgb(0 0 0 / 0.25), var(--bs-ring), 0 2px 6px rgb(0 0 0 / 0.25); }
.cwp__handle:active { cursor: grabbing; }

.cwp__label { display: flex; justify-content: space-between; font: 700 0.8125rem var(--bs-font); color: var(--bs-ink); }
.cwp__label output { font-weight: 400; color: var(--bs-ink-soft); font-variant-numeric: tabular-nums; }
.cwp__range { -webkit-appearance: none; appearance: none; width: 100%; height: 12px; border-radius: 999px; background: var(--track); outline: none; margin: 2px 0 4px; }
.cwp__range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 1px solid rgb(0 0 0 / 0.25); box-shadow: 0 1px 4px rgb(0 0 0 / 0.3); cursor: pointer; }
.cwp__range::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 1px solid rgb(0 0 0 / 0.25); box-shadow: 0 1px 4px rgb(0 0 0 / 0.3); cursor: pointer; }
.cwp__range:focus-visible { box-shadow: var(--bs-ring); }

.cwp__strip { display: grid; grid-template-columns: repeat(4, 1fr); height: 44px; border-radius: var(--bs-radius-md); overflow: hidden; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08); }
.cwp__swatch { border: 0; display: grid; place-items: center; cursor: pointer; padding: 0; position: relative; }
.cwp__swatch[aria-checked='true'] { box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px rgb(0 0 0 / 0.55); }
.cwp__names { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: -4px; font-size: 0.6875rem; color: var(--bs-ink-soft); text-align: center; }
.cwp__names .is-on { color: var(--bs-ink); font-weight: 700; }

.cwp__hexrow { display: grid; grid-template-columns: minmax(0, 1fr) 96px 34px; gap: 8px; align-items: center; }
.cwp__hexmeta { display: flex; flex-direction: column; min-width: 0; }
.cwp__hexlabel { font: 700 0.875rem/1.2 var(--bs-font); color: var(--bs-ink); }
.cwp__hint { font-size: 0.75rem; color: var(--bs-ink-soft); }
.cwp__hex { width: 100%; height: 34px; padding: 0 8px; border: 1px solid var(--bs-line-strong); border-radius: var(--bs-radius-sm); font: 400 0.8125rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; color: var(--bs-ink); background: var(--bs-surface); }
.cwp__hex.is-error { border-color: var(--bs-danger); }
.cwp__copy { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-sm); background: var(--bs-surface); color: var(--bs-ink-soft); cursor: pointer; padding: 0; }

.cwp__checks { list-style: none; margin: 2px 0 0; padding: 0; display: grid; gap: 4px; }
.cwp__checks li { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; gap: 6px; align-items: center; font-size: 0.75rem; color: var(--bs-ink-soft); }
.cwp__checks li .q-icon { color: #15803D; }
.cwp__checks li b { color: var(--bs-ink); font-variant-numeric: tabular-nums; }
.cwp__checks li.is-fail { color: #92400E; }
.cwp__checks li.is-fail .q-icon { color: #B45309; }
.q-btn.cwp__fix { justify-self: start; min-height: 34px; font-size: 0.8125rem; }

@media (prefers-reduced-motion: reduce) { .cwp__handle { transition: none; } }
</style>
