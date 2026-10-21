<script setup>
// DateRangeCalendar — custom two-month range picker (Expedia-style).
// Global edge arrows move BOTH months together (no per-calendar nav, no slide).
// Past dates disabled. Primary-navy endpoint circles + light-navy range band
// that flows under the circles (Google-style). v-model = { from, to } ('YYYY/MM/DD').
import { ref, computed } from 'vue'

const props = defineProps({ modelValue: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue'])

const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}/${pad(m)}/${pad(d)}`
const parse = (s) => { if (!s) return null; const [y, m, d] = s.split('/').map(Number); const dt = new Date(y, m - 1, d); dt.setHours(0, 0, 0, 0); return dt }

const today = new Date(); today.setHours(0, 0, 0, 0)
const start = { y: today.getFullYear(), m: today.getMonth() + 1 }
const view = ref({ ...start }) // left month (1-based)

const nextMo = (y, m) => (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 })
const prevMo = (y, m) => (m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 })

function cells (y, m) {
  const lead = new Date(y, m - 1, 1).getDay()
  const days = new Date(y, m, 0).getDate()
  const out = []
  for (let i = 0; i < lead; i++) out.push(null)
  for (let d = 1; d <= days; d++) out.push({ d, ymd: ymd(y, m, d), date: new Date(y, m - 1, d) })
  return out
}

const rightView = computed(() => nextMo(view.value.y, view.value.m))
const months = computed(() => [
  { ...view.value, cells: cells(view.value.y, view.value.m) },
  { ...rightView.value, cells: cells(rightView.value.y, rightView.value.m) },
])

const from = computed(() => parse(props.modelValue?.from))
const to = computed(() => parse(props.modelValue?.to))
const canPrev = computed(() => { const p = prevMo(view.value.y, view.value.m); return p.y > start.y || (p.y === start.y && p.m >= start.m) })
const prev = () => { if (canPrev.value) view.value = prevMo(view.value.y, view.value.m) }
const next = () => { view.value = nextMo(view.value.y, view.value.m) }

const isPast = (c) => c.date < today
const state = (c) => {
  if (!c) return ''
  const t = c.date.getTime(); const f = from.value?.getTime(); const e = to.value?.getTime()
  if (f && t === f) return 'start'
  if (e && t === e) return 'end'
  if (f && e && t > f && t < e) return 'between'
  return ''
}
const isToday = (c) => c && c.date.getTime() === today.getTime()
const hasRange = computed(() => !!(from.value && to.value))
function pick (c) {
  if (!c || isPast(c)) return
  const f = from.value, e = to.value
  if (!f || (f && e)) emit('update:modelValue', { from: c.ymd, to: null })
  else if (c.date.getTime() >= f.getTime()) emit('update:modelValue', { from: props.modelValue.from, to: c.ymd })
  else emit('update:modelValue', { from: c.ymd, to: null })
}
</script>

<template>
  <div class="drc">
    <button class="drc__nav drc__nav--prev" :disabled="!canPrev" @click="prev"><q-icon name="chevron_left" size="20px" /></button>
    <button class="drc__nav drc__nav--next" @click="next"><q-icon name="chevron_right" size="20px" /></button>
    <div class="drc__months">
      <div v-for="(mo, idx) in months" :key="idx" class="drc__month">
        <div class="drc__title">{{ MON[mo.m - 1] }} {{ mo.y }}</div>
        <div class="drc__dow"><span v-for="d in DOW" :key="d">{{ d }}</span></div>
        <div class="drc__grid">
          <template v-for="(c, i) in mo.cells" :key="i">
            <span v-if="!c" class="drc__cell drc__cell--empty" />
            <button v-else type="button" class="drc__cell"
              :class="[state(c) ? 'is-' + state(c) : '', { 'is-past': isPast(c), 'is-today': isToday(c), 'has-range': hasRange }]"
              :disabled="isPast(c)" @click="pick(c)"><span class="drc__n">{{ c.d }}</span></button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drc { position: relative; display: flex; justify-content: center; }
.drc__nav { position: absolute; top: 2px; width: 32px; height: 32px; border-radius: 999px; border: 1px solid var(--ds-color-border); background: var(--ds-color-surface); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.drc__nav:disabled { opacity: 0.35; cursor: default; }
.drc__nav--prev { left: 4px; }
.drc__nav--next { right: 4px; }
.drc__months { display: flex; gap: 40px; }
/* Phones: the two months stack (side-by-side is ~640px, well over a phone). */
@media (max-width: 600px) {
  .drc__months { flex-direction: column; gap: 20px; align-items: center; }
  .drc__month { width: 100%; max-width: 320px; }
}
.drc__month { width: 300px; padding: 0 12px; }
.drc__title { text-align: center; font-weight: 700; font-size: 1.125rem; margin-bottom: 24px; }
.drc__dow { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; color: var(--ds-color-text-subtlest); font-size: 0.75rem; margin-bottom: 6px; }
.drc__grid { display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 2px; }
.drc__cell { position: relative; height: 40px; border: 0; background: transparent; font: inherit; cursor: pointer; color: var(--ds-color-text); display: flex; align-items: center; justify-content: center; border-radius: 999px; }
.drc__cell--empty { background: transparent; cursor: default; }
.drc__n { position: relative; z-index: 2; } /* number sits above the band + endpoint circle */
.drc__cell:hover:not(:disabled):not(.is-start):not(.is-end):not(.is-between) { background: var(--ds-palette-navy-50); }
.drc__cell.is-past { color: var(--ds-color-text-disabled); cursor: default; }
.drc__cell.is-today { box-shadow: inset 0 0 0 2px var(--ds-palette-navy-300); }

/* Range bar — light-navy band that runs continuously through the row and flows
   UNDER the endpoint circles (Google-style seamless connection). */
.drc__cell.is-between { background: var(--ds-palette-navy-100); color: var(--ds-palette-navy-900); border-radius: 0; }
/* Half-bands on the endpoints so the bar meets the circle centre (only when the
   range is complete — a lone start shows just its circle). */
.drc__cell.is-start.has-range { background: linear-gradient(to right, transparent 50%, var(--ds-palette-navy-100) 50%); border-radius: 0; }
.drc__cell.is-end.has-range { background: linear-gradient(to right, var(--ds-palette-navy-100) 50%, transparent 50%); border-radius: 0; }

/* Endpoint circles — primary navy, layered on top of the band. */
.drc__cell.is-start::before, .drc__cell.is-end::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; right: 0; margin: auto;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--ds-color-background-brand-bold); z-index: 1;
}
.drc__cell.is-start, .drc__cell.is-end { color: #fff; font-weight: 700; }
</style>
