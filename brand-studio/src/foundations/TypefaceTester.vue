<script setup>
// TypefaceTester — a working type specimen for the Brand Studio font library.
// Pick a family, then tune size / weight / leading / tracking / case live; see
// it as a waterfall, a glyph set and a heading + body pairing, and copy the
// CSS. Every family and weight shown is actually loaded (theme/fonts.js), so
// what you see is what a branded booking page will render.
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { FONT_OPTIONS, getFont } from '../theme/fonts.js'

const props = defineProps({
  initialFont: { type: String, default: 'barlow-condensed' },
  initialBody: { type: String, default: 'inter' },
})
const emit = defineEmits(['apply'])
const $q = useQuasar()

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sans', label: 'Sans' },
  { id: 'display', label: 'Display' },
  { id: 'serif', label: 'Serif' },
]
const SAMPLES = [
  'Heartland Invitational Soccer Cup 2027',
  'Book your stay near the fields',
  'Official hotels · Special event rates',
  'The quick brown fox jumps over the lazy dog',
]
const CASES = [
  { id: 'none', label: 'Aa', aria: 'Sentence case' },
  { id: 'uppercase', label: 'AA', aria: 'Uppercase' },
  { id: 'lowercase', label: 'aa', aria: 'Lowercase' },
]
const WATERFALL = [72, 48, 32, 24, 16, 12]
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&@$%!?.,:;–—‘’“”()/#+'.split('')

const category = ref('all')
const fontId = ref(props.initialFont)
const bodyId = ref(props.initialBody)
const text = ref(SAMPLES[0])
const size = ref(64)
const weight = ref(700)
const leading = ref(1.1)
const tracking = ref(0)
const textCase = ref('none')
const italic = ref(false)

const fonts = computed(() => FONT_OPTIONS.filter((f) => category.value === 'all' || f.category === category.value))
const font = computed(() => getFont(fontId.value))
const body = computed(() => getFont(bodyId.value))

// Keep weight / italic valid for the chosen family.
watch(font, (f) => {
  if (!f.weights.includes(weight.value)) weight.value = f.weights[f.weights.length - 1]
  if (!f.italic) italic.value = false
}, { immediate: true })

const specimenStyle = computed(() => ({
  fontFamily: font.value.family,
  fontSize: `${size.value}px`,
  fontWeight: weight.value,
  lineHeight: leading.value,
  letterSpacing: `${tracking.value}em`,
  textTransform: textCase.value,
  fontStyle: italic.value ? 'italic' : 'normal',
}))
const faceStyle = (w = weight.value) => ({ fontFamily: font.value.family, fontWeight: w, fontStyle: italic.value ? 'italic' : 'normal' })

const css = computed(() => [
  `font-family: ${font.value.family};`,
  `font-size: ${size.value}px;`,
  `font-weight: ${weight.value};`,
  `line-height: ${leading.value};`,
  `letter-spacing: ${tracking.value}em;`,
  textCase.value !== 'none' && `text-transform: ${textCase.value};`,
  italic.value && 'font-style: italic;',
].filter(Boolean).join('\n'))

async function copyCss() {
  try {
    await navigator.clipboard.writeText(css.value)
    $q.notify({ message: 'CSS copied', icon: 'check', color: 'dark', timeout: 1400 })
  } catch {
    $q.notify({ message: 'Copy is blocked here. Select the CSS and copy it manually.', color: 'dark', timeout: 2200 })
  }
}
</script>

<template>
  <div class="tt">
    <header class="tt__head">
      <p class="bs-eyebrow">Foundations · Typography</p>
      <h1 class="bs-display-2 tt__title">Typeface tester</h1>
      <p class="bs-lead">Try every font a Brand Kit can use. Pick a family, then tune size, weight, leading, tracking and case. Pair it with a body face and copy the CSS.</p>
    </header>

    <!-- Family picker -->
    <section class="tt__families bs-card" aria-labelledby="tt-fam">
      <div class="tt__row">
        <h2 id="tt-fam" class="bs-subtitle">Family</h2>
        <div class="tt__seg" role="radiogroup" aria-label="Font category">
          <button v-for="c in CATEGORIES" :key="c.id" type="button" role="radio" class="tt__segbtn bs-focusable" :aria-checked="category === c.id" @click="category = c.id">{{ c.label }}</button>
        </div>
      </div>
      <div class="tt__fontlist" role="radiogroup" aria-label="Font family">
        <button
          v-for="f in fonts" :key="f.id" type="button" role="radio" class="tt__font bs-focusable"
          :aria-checked="fontId === f.id" @click="fontId = f.id"
        >
          <span class="tt__font-sample" :style="{ fontFamily: f.family, fontWeight: f.weights[f.weights.length - 1] }">Ag</span>
          <span class="tt__font-name">{{ f.label }}</span>
          <span class="tt__font-meta">{{ f.category }} · {{ f.weights.length }} {{ f.weights.length === 1 ? 'weight' : 'weights' }}</span>
        </button>
      </div>
    </section>

    <div class="tt__main">
      <!-- Controls -->
      <aside class="tt__controls bs-card" aria-label="Type controls">
        <p class="tt__label">Sample text</p>
        <div class="tt__samples">
          <button v-for="s in SAMPLES" :key="s" type="button" class="bs-pill tt__sample bs-focusable" :aria-pressed="text === s" @click="text = s">{{ s }}</button>
        </div>
        <q-input v-model="text" outlined dense autogrow label="Or type your own" class="tt__text" />

        <label class="tt__label" for="tt-size">Size <output>{{ size }}px</output></label>
        <q-slider id="tt-size" v-model="size" :min="12" :max="120" :step="1" color="primary" aria-label="Font size" />

        <p class="tt__label">Weight</p>
        <div class="tt__seg" role="radiogroup" aria-label="Font weight">
          <button v-for="w in font.weights" :key="w" type="button" role="radio" class="tt__segbtn bs-focusable" :aria-checked="weight === w" :style="{ fontWeight: w }" @click="weight = w">{{ w }}</button>
        </div>

        <label class="tt__label" for="tt-lead">Line height <output>{{ leading.toFixed(2) }}</output></label>
        <q-slider id="tt-lead" v-model="leading" :min="0.8" :max="2" :step="0.05" color="primary" aria-label="Line height" />

        <label class="tt__label" for="tt-track">Letter spacing <output>{{ tracking.toFixed(2) }}em</output></label>
        <q-slider id="tt-track" v-model="tracking" :min="-0.08" :max="0.3" :step="0.01" color="primary" aria-label="Letter spacing" />

        <p class="tt__label">Case & style</p>
        <div class="tt__row tt__row--start">
          <div class="tt__seg" role="radiogroup" aria-label="Text case">
            <button v-for="c in CASES" :key="c.id" type="button" role="radio" class="tt__segbtn bs-focusable" :aria-label="c.aria" :aria-checked="textCase === c.id" @click="textCase = c.id">{{ c.label }}</button>
          </div>
          <button type="button" class="tt__segbtn tt__italic bs-focusable" :aria-pressed="italic" :disabled="!font.italic" :title="font.italic ? 'Italic' : 'No italic loaded for this family'" @click="italic = !italic"><em>I</em></button>
        </div>

        <div class="tt__css">
          <div class="tt__row"><p class="tt__label">CSS</p><q-btn flat dense no-caps icon="content_copy" label="Copy" class="bs-btn" @click="copyCss" /></div>
          <pre>{{ css }}</pre>
        </div>
        <q-btn unelevated no-caps class="bs-btn bs-btn--primary full-width" icon="check" label="Use as heading font" @click="emit('apply', { heading: font.id, body: body.id })" />
      </aside>

      <!-- Specimen -->
      <section class="tt__stage" aria-label="Specimen">
        <div class="tt__specimen bs-card">
          <p class="tt__specimen-meta">{{ font.label }} · {{ weight }}{{ italic ? ' italic' : '' }} · {{ size }}px</p>
          <p class="tt__specimen-text" :style="specimenStyle">{{ text || ' ' }}</p>
        </div>

        <div class="tt__waterfall bs-card">
          <h2 class="bs-subtitle">Waterfall</h2>
          <div v-for="px in WATERFALL" :key="px" class="tt__wf-row">
            <span class="tt__wf-size">{{ px }}</span>
            <span class="tt__wf-text" :style="{ ...faceStyle(), fontSize: px + 'px', textTransform: textCase, letterSpacing: tracking + 'em' }">{{ text }}</span>
          </div>
        </div>

        <div class="tt__weights bs-card">
          <h2 class="bs-subtitle">Weights</h2>
          <div v-for="w in font.weights" :key="w" class="tt__wf-row">
            <span class="tt__wf-size">{{ w }}</span>
            <span class="tt__wf-text" :style="{ ...faceStyle(w), fontSize: '30px' }">Official event hotels</span>
          </div>
        </div>

        <div class="tt__glyphs bs-card">
          <h2 class="bs-subtitle">Glyphs</h2>
          <div class="tt__glyph-grid" :style="faceStyle()">
            <span v-for="(g, i) in GLYPHS" :key="i" class="tt__glyph">{{ g }}</span>
          </div>
        </div>

        <div class="tt__pairing bs-card">
          <div class="tt__row">
            <h2 class="bs-subtitle">Pairing</h2>
            <q-select v-model="bodyId" :options="FONT_OPTIONS" option-value="id" option-label="label" emit-value map-options dense outlined label="Body font" class="tt__body-select" />
          </div>
          <article class="tt__pair-card">
            <p class="tt__pair-eyebrow" :style="{ fontFamily: body.family }">JUN 16 – 19, 2027 · OVERLAND PARK, KS</p>
            <h3 class="tt__pair-title" :style="faceStyle()">Heartland Invitational Soccer Cup</h3>
            <p class="tt__pair-body" :style="{ fontFamily: body.family, fontWeight: body.weights[0] }">Join clubs from across the region for four days of competitive youth soccer. Book through the official hotel page for event rates at hotels minutes from the fields, with instant confirmation and easy changes.</p>
            <span class="tt__pair-cta" :style="{ fontFamily: body.family, fontWeight: body.weights[body.weights.length - 1] }">Find your hotel</span>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tt { padding: clamp(16px, 4vw, 40px); background: var(--bs-canvas); min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; font-family: var(--bs-font); }
.tt__head { max-width: 70ch; display: grid; gap: 10px; }
.tt__title { margin-top: 2px; }
.tt__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tt__row--start { justify-content: flex-start; }
.tt__label { display: flex; justify-content: space-between; margin: 14px 0 6px; font: 700 0.8125rem/1.2 var(--bs-font); color: var(--bs-ink); }
.tt__label output { font-weight: 400; color: var(--bs-ink-soft); font-variant-numeric: tabular-nums; }

.tt__families { padding: 16px 18px; min-width: 0; }
.tt__fontlist { display: flex; gap: 10px; overflow-x: auto; padding: 12px 2px 4px; scroll-snap-type: x mandatory; }
.tt__font { flex: 0 0 150px; scroll-snap-align: start; display: grid; gap: 2px; text-align: left; padding: 12px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: var(--bs-surface); cursor: pointer; color: var(--bs-ink); }
.tt__font[aria-checked='true'] { border-color: var(--bs-brand); box-shadow: inset 0 0 0 1px var(--bs-brand); background: var(--ds-palette-navy-50); }
.tt__font-sample { font-size: 40px; line-height: 1; }
.tt__font-name { font: 700 0.875rem/1.3 var(--bs-font); margin-top: 6px; }
.tt__font-meta { font-size: 0.75rem; color: var(--bs-ink-soft); text-transform: capitalize; }

.tt__seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: var(--bs-radius-sm); background: var(--bs-surface-2); border: 1px solid var(--bs-line); flex-wrap: wrap; }
.tt__segbtn { min-width: 44px; min-height: 36px; padding: 0 12px; border: 0; border-radius: 4px; background: transparent; font: 700 0.875rem var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.tt__segbtn[aria-checked='true'], .tt__segbtn[aria-pressed='true'] { background: var(--bs-surface); color: var(--bs-ink); box-shadow: var(--bs-shadow-1); }
.tt__segbtn:disabled { opacity: 0.4; cursor: not-allowed; }
.tt__italic { border: 1px solid var(--bs-line); background: var(--bs-surface-2); }

.tt__main { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 20px; align-items: start; }
.tt__controls { padding: 6px 18px 18px; position: sticky; top: 16px; }
.tt__samples { display: flex; flex-wrap: wrap; gap: 6px; }
.tt__sample { cursor: pointer; text-align: left; }
.tt__sample[aria-pressed='true'] { background: var(--bs-brand); color: #fff; border-color: var(--bs-brand); }
.tt__text { margin-top: 10px; }
.tt__css { margin: 16px 0 14px; }
.tt__css pre { margin: 4px 0 0; padding: 12px; border-radius: var(--bs-radius-sm); background: var(--bs-ink); color: #E2E8F0; font: 0.75rem/1.6 ui-monospace, Menlo, monospace; white-space: pre-wrap; }

.tt__stage { display: grid; gap: 20px; min-width: 0; }
.tt__specimen { padding: clamp(18px, 4vw, 40px); min-height: 260px; overflow: hidden; }
.tt__specimen-meta { margin: 0 0 14px; font-size: 0.75rem; color: var(--bs-ink-soft); letter-spacing: 0.04em; }
.tt__specimen-text { margin: 0; color: var(--bs-ink); overflow-wrap: anywhere; }
.tt__waterfall, .tt__weights, .tt__glyphs, .tt__pairing { padding: 18px 20px; }
.tt__wf-row { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 14px; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--bs-line); }
.tt__wf-row:last-child { border-bottom: 0; }
.tt__wf-size { font-size: 0.75rem; color: var(--bs-ink-soft); font-variant-numeric: tabular-nums; }
.tt__wf-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--bs-ink); line-height: 1.15; }
.tt__glyph-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 6px; margin-top: 12px; }
.tt__glyph { display: grid; place-items: center; aspect-ratio: 1; font-size: 28px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-sm); color: var(--bs-ink); background: var(--bs-surface); }
.tt__body-select { min-width: 200px; }
.tt__pair-card { margin-top: 14px; padding: clamp(18px, 4vw, 32px); border-radius: var(--bs-radius-md); background: #0E1B2C; color: #fff; display: grid; gap: 10px; }
.tt__pair-eyebrow { margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; color: #19C6B8; }
.tt__pair-title { margin: 0; font-size: clamp(28px, 5vw, 44px); line-height: 1.05; }
.tt__pair-body { margin: 0; font-size: 1rem; line-height: 1.6; opacity: 0.88; max-width: 60ch; }
.tt__pair-cta { justify-self: start; margin-top: 6px; padding: 10px 18px; border-radius: 6px; background: #F5B700; color: #0B1220; font-size: 0.9375rem; }

@media (max-width: 900px) {
  .tt__main { grid-template-columns: 1fr; }
  .tt__controls { position: static; }
}
</style>
