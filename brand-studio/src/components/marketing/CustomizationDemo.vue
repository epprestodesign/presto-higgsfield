<script setup>
// CustomizationDemo — a working miniature of the Studio editor. Every control
// re-themes the real Presto preview instantly, proving the core promise:
// change the brand once, and every element updates.
import { ref, reactive, computed } from 'vue'
import ProductPreview from './ProductPreview.vue'
import { sampleProject } from '../../data/sampleEvents.js'
import { buildConcept, prestoBannerConcept } from '../../providers/ai/conceptFactory.js'
import { getImage } from '../../assets/imagery/index.js'
import { CREATIVE_DIRECTIONS } from '../../models/brandKit.js'
import { getFont } from '../../theme/fonts.js'
import { onColor } from '../../theme/color.js'

const base = sampleProject('heartland')

const PALETTES = [
  { id: 'midnight', name: 'Midnight teal', primary: '#0E1B2C', secondary: '#19C6B8', accent: '#F5B700' },
  { id: 'crimson', name: 'Crimson', primary: '#8A1538', secondary: '#E04F5F', accent: '#FFD166' },
  { id: 'forest', name: 'Forest', primary: '#14532D', secondary: '#4ADE80', accent: '#FDE047' },
  { id: 'royal', name: 'Royal blue', primary: '#1E3A8A', secondary: '#38BDF8', accent: '#FB923C' },
  { id: 'plum', name: 'Plum', primary: '#4C1D95', secondary: '#F472B6', accent: '#FCD34D' },
  { id: 'clay', name: 'Clay', primary: '#7C2D12', secondary: '#FDBA74', accent: '#FEF3C7' },
]
const FONTS = ['barlow-condensed', 'montserrat', 'oswald', 'playfair']
const DIRECTION_TEMPLATE = { signature: 1, energy: 0, premium: 0 }

const state = reactive({
  palette: 'midnight',
  font: 'barlow-condensed',
  direction: 'energy',
  headline: 'Heartland Invitational Soccer Cup 2027',
})

const palette = computed(() => PALETTES.find((p) => p.id === state.palette))
const kit = computed(() => ({
  ...base.brandKit,
  colors: { ...base.brandKit.colors, primary: palette.value.primary, secondary: palette.value.secondary, accent: palette.value.accent },
  typography: { ...base.brandKit.typography, heading: state.font },
  direction: state.direction,
}))
// Every palette × direction has a Higgsfield-generated background (scripts/
// hf-generate-banners.mjs --set demo) shown in the Presto banner standard.
const concept = computed(() => {
  const bg = getImage(`demo-${state.palette}-${state.direction}`)
  return bg
    ? prestoBannerConcept(kit.value, bg)
    : buildConcept({ direction: state.direction, templateIndex: DIRECTION_TEMPLATE[state.direction], brandKit: kit.value, event: base.event })
})

const announce = ref('')
const set = (key, value, label) => {
  state[key] = value
  announce.value = `Preview updated: ${label}`
}
</script>

<template>
  <section id="customize" class="cd" aria-labelledby="cd-title">
    <div class="cd__head">
      <p class="bs-eyebrow">Customization</p>
      <h2 id="cd-title" class="bs-display-2">Change it once. Every page follows.</h2>
      <p class="bs-lead">
        Your brand kit is stored separately from the booking pages, so a new color or typeface updates the landing page,
        hotel search and hotel details together. Logos, headlines and buttons stay live text, never baked into an image.
      </p>
    </div>

    <div class="cd__body">
      <form class="cd__controls bs-card" aria-label="Try the customization controls" @submit.prevent>
        <fieldset class="cd__group">
          <legend class="cd__legend">Brand colors</legend>
          <div class="cd__palettes">
            <button
              v-for="p in PALETTES" :key="p.id" type="button"
              class="cd__palette bs-focusable" :class="{ 'is-on': state.palette === p.id }"
              :aria-pressed="state.palette === p.id ? 'true' : 'false'"
              @click="set('palette', p.id, `${p.name} palette`)"
            >
              <span class="cd__chip" :style="{ background: p.primary }"><q-icon v-if="state.palette === p.id" name="check" size="14px" :style="{ color: onColor(p.primary) }" /></span>
              <span class="cd__chip cd__chip--sm" :style="{ background: p.secondary }" />
              <span class="cd__chip cd__chip--sm" :style="{ background: p.accent }" />
              <span class="bs-sr-only">{{ p.name }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset class="cd__group">
          <legend class="cd__legend">Headline typeface</legend>
          <div class="cd__seg">
            <button
              v-for="f in FONTS" :key="f" type="button"
              class="cd__seg-btn bs-focusable" :class="{ 'is-on': state.font === f }"
              :aria-pressed="state.font === f ? 'true' : 'false'"
              :style="{ fontFamily: getFont(f).family }"
              @click="set('font', f, getFont(f).label)"
            >{{ getFont(f).label }}</button>
          </div>
        </fieldset>

        <fieldset class="cd__group">
          <legend class="cd__legend">Creative direction</legend>
          <div class="cd__dirs">
            <button
              v-for="d in CREATIVE_DIRECTIONS" :key="d.id" type="button"
              class="cd__dir bs-focusable" :class="{ 'is-on': state.direction === d.id }"
              :aria-pressed="state.direction === d.id ? 'true' : 'false'"
              @click="set('direction', d.id, d.name)"
            >
              <q-icon :name="d.icon" size="18px" />
              <span><b>{{ d.name }}</b><small>{{ d.summary }}</small></span>
            </button>
          </div>
        </fieldset>

        <div class="cd__group">
          <q-input v-model="state.headline" outlined dense label="Headline" maxlength="80" counter @update:model-value="announce = 'Preview updated: headline'" />
        </div>
        <p class="bs-sr-only" aria-live="polite">{{ announce }}</p>
      </form>

      <div class="cd__preview">
        <product-preview class="cd__desk" sample="heartland" :brand-kit="kit" :concept="concept" :headline="state.headline" :design-height="700" />
        <div class="cd__phone">
          <product-preview sample="heartland" variant="mobile" :brand-kit="kit" :concept="concept" :headline="state.headline" :design-height="640" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cd { max-width: 1240px; margin: 0 auto; padding: clamp(64px, 9vw, 120px) 24px 0; }
.cd__head { max-width: 780px; display: grid; gap: 14px; margin-bottom: 36px; }
.cd__body { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 28px; align-items: start; }
.cd__controls { padding: 22px; display: grid; gap: 22px; position: sticky; top: 92px; }
.cd__group { border: 0; padding: 0; margin: 0; display: grid; gap: 10px; min-width: 0; }
.cd__legend { padding: 0; margin-bottom: 10px; font: 700 0.8125rem/1 var(--bs-font); color: var(--bs-ink); }
.cd__palettes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.cd__palette { display: flex; align-items: center; gap: 4px; padding: 6px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-sm); background: #fff; cursor: pointer; min-height: 44px; }
.cd__palette.is-on { border-color: var(--bs-ink); box-shadow: 0 0 0 1px var(--bs-ink); }
.cd__chip { width: 30px; height: 30px; border-radius: 6px; display: grid; place-items: center; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1); }
.cd__chip--sm { width: 12px; height: 30px; border-radius: 4px; }
.cd__seg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.cd__seg-btn { min-height: 44px; padding: 0 10px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-sm); background: #fff; color: var(--bs-ink); font-size: 1rem; font-weight: 700; cursor: pointer; }
.cd__seg-btn.is-on { background: var(--bs-ink); color: #fff; border-color: var(--bs-ink); }
.cd__dirs { display: grid; gap: 6px; }
.cd__dir { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; text-align: left; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-sm); background: #fff; color: var(--bs-ink); cursor: pointer; font-family: var(--bs-font); }
.cd__dir span { display: grid; gap: 2px; }
.cd__dir b { font-size: 0.9375rem; }
.cd__dir small { font-size: 0.8125rem; color: var(--bs-ink-soft); }
.cd__dir .q-icon { margin-top: 2px; color: var(--bs-ink-soft); }
.cd__dir.is-on { border-color: var(--bs-accent); background: var(--bs-accent-soft); }
.cd__dir.is-on .q-icon { color: var(--bs-accent); }

@media (max-width: 960px) {
  .cd__body { grid-template-columns: 1fr; }
  .cd__controls { position: static; order: 2; }
  .cd__preview { order: 1; }
}
.cd__phone { display: none; }
@media (max-width: 640px) {
  .cd { padding-inline: 16px; }
  .cd__desk { display: none; }
  .cd__phone { display: block; width: min(300px, 86%); margin: 0 auto; }
}
</style>
