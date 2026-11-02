<script setup>
// Logo mode, step by step:
//   1 Upload (WhatTheFont-style) → 2 Select (crop box) → 3 Clean up →
//   4 Vector (SVG) → 5 Sizes & download
import { computed } from 'vue'
import { useBannerLab, SAMPLE_LOGOS, LOGO_STEPS } from '../../banner-lab/useBannerLab.js'
import { useLogoOutputs } from '../../banner-lab/useLogoOutputs.js'
import { LOGO_SPEC } from '../../banner-lab/standards.js'
import LabStepper from './LabStepper.vue'
import StepNav from './StepNav.vue'
import DropHero from './DropHero.vue'
import CropSelect from './CropSelect.vue'
import LogoCleanStep from './LogoCleanStep.vue'
import LogoVectorStep from './LogoVectorStep.vue'
import LogoSizesStep from './LogoSizesStep.vue'

const lab = useBannerLab()
const s = lab.s
const out = useLogoOutputs()

const TIPS = [
  'PNG, JPG, WebP or SVG, up to 10 MB.',
  `At least ${LOGO_SPEC.crispLongEdge}px on the long edge for sharp results (SVG is best).`,
  'A transparent or plain background works best; a screenshot is fine, you’ll box the logo next.',
  'One logo per image.',
]

const n = computed(() => LOGO_STEPS.findIndex((st) => st.id === s.logoStep) + 1)
const baseUrl = computed(() => (s.upload ? s.upload.base.toDataURL('image/png') : ''))
const bgNote = computed(() => {
  const k = s.upload?.background.kind
  if (k === 'transparent') return { icon: 'check_circle', text: 'Transparent background: nothing to remove.' }
  if (k === 'solid') return { icon: 'auto_fix_high', text: 'Plain background detected. We’ll cut the logo out of it.', toggle: true }
  return { icon: 'info', text: 'Busy background (photo or gradient). Box the logo tightly; you can put it on a white badge in the next step.' }
})
</script>

<template>
  <div class="lm">
    <LabStepper :steps="LOGO_STEPS" :current="s.logoStep" :available="lab.logoAvailable" label="Logo steps" @go="lab.goLogo" />

    <!-- 1 · Upload -->
    <section v-if="s.logoStep === 'upload'" class="bl-step">
      <DropHero
        :eyebrow="`Step 1 of ${LOGO_STEPS.length}`"
        title="Make your logo Presto-ready"
        lead="Drop in any logo: a PNG on a white box, a screenshot, an SVG. We cut it out, turn it into a vector, and size it for every place Presto shows it."
        :tips="TIPS" :busy="s.busy" :error="s.logoError"
        @files="(f) => lab.logoFromFile(f[0])" @url="lab.logoFromUrl"
      >
        <div class="lm__samples">
          <p class="bs-caption">No logo handy? Try one:</p>
          <button
            v-for="l in SAMPLE_LOGOS" :key="l.id" type="button" class="lm__sample bs-focusable"
            @click="lab.startLogo({ src: l.src, name: l.name, type: l.type })"
          >
            <img :src="l.src" alt="" />
            <span><strong>{{ l.name }}</strong><small>{{ l.note }}</small></span>
          </button>
        </div>
      </DropHero>
      <StepNav v-if="s.upload" next="Back to your logo" @next="lab.goLogo('select')">You already have a logo in progress.</StepNav>
    </section>

    <!-- 2 · Select -->
    <section v-else-if="s.logoStep === 'select'" class="bl-step" aria-labelledby="lm-select">
      <header class="bl-step__head">
        <p class="bs-eyebrow">Step {{ n }} of {{ LOGO_STEPS.length }}</p>
        <h1 id="lm-select" class="bs-title">Is this your logo?</h1>
        <p class="bs-body">We found it and drew a box around it. Drag the box or its handles to adjust, or draw a new one.</p>
      </header>
      <CropSelect v-model="s.crop" :src="baseUrl" :width="s.upload.base.width" :height="s.upload.base.height" />
      <div class="lm__note bs-card">
        <q-icon :name="bgNote.icon" size="20px" />
        <span class="bs-body">{{ bgNote.text }}</span>
        <q-toggle v-if="bgNote.toggle" v-model="s.removeBg" color="primary" label="Remove it" left-label />
      </div>
      <p v-if="s.logoError" class="lm__error" role="alert">{{ s.logoError }}</p>
      <StepNav back="Choose another image" next="Optimize logo" :next-loading="!!s.busy" @back="lab.resetLogo()" @next="lab.runOptimize()">
        Next: cut out, trim, size to 200×200 and check it on dark banners.
      </StepNav>
    </section>

    <!-- 3 · Clean up -->
    <section v-else-if="s.logoStep === 'clean'" class="bl-step" aria-labelledby="lm-clean">
      <header class="bl-step__head">
        <p class="bs-eyebrow">Step {{ n }} of {{ LOGO_STEPS.length }}</p>
        <h1 id="lm-clean" class="bs-title">{{ s.logo.name }}, cleaned up</h1>
        <p class="bs-body">Transparent, trimmed and checked. Choose how it should read on Presto’s dark banners and nav bar.</p>
      </header>
      <LogoCleanStep />
      <StepNav back="Adjust the box" next="Vector version" @back="lab.goLogo('select')" @next="lab.goLogo('vector')" />
    </section>

    <!-- 4 · Vector -->
    <section v-else-if="s.logoStep === 'vector'" class="bl-step" aria-labelledby="lm-vector">
      <header class="bl-step__head">
        <p class="bs-eyebrow">Step {{ n }} of {{ LOGO_STEPS.length }}</p>
        <h1 id="lm-vector" class="bs-title">Vector version (SVG)</h1>
        <p class="bs-body">An SVG stays sharp at any size and is what developers and printers ask for. Compare it with your image up close.</p>
      </header>
      <LogoVectorStep />
      <StepNav back="Clean up" next="Sizes & download" @back="lab.goLogo('clean')" @next="lab.goLogo('sizes')" />
    </section>

    <!-- 5 · Sizes & download -->
    <section v-else class="bl-step" aria-labelledby="lm-sizes">
      <header class="bl-step__head">
        <p class="bs-eyebrow">Step {{ n }} of {{ LOGO_STEPS.length }}</p>
        <h1 id="lm-sizes" class="bs-title">Sized for Presto</h1>
      </header>
      <LogoSizesStep />
      <StepNav back="Vector" next="Download all (ZIP)" next-icon="download" :next-loading="out.zipping.value" @back="lab.goLogo('vector')" @next="out.downloadAll()">
        <q-btn flat no-caps class="bs-btn lm__bg" icon="wallpaper" label="Now make background graphics" @click="s.mode = 'background'" />
      </StepNav>
    </section>
  </div>
</template>

<style scoped>
.lm { display: grid; gap: 28px; }
.lm__samples { margin-top: 36px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.lm__samples .bs-caption { width: 100%; }
.lm__sample {
  display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 10px; border-radius: var(--bs-radius-md);
  border: 1px solid var(--bs-line); background: var(--bs-surface); cursor: pointer; text-align: left; font-family: var(--bs-font);
}
.lm__sample:hover { border-color: var(--bs-line-strong); box-shadow: var(--bs-shadow-1); }
.lm__sample img { width: 44px; height: 44px; object-fit: contain; }
.lm__sample strong { display: block; font-size: 0.875rem; color: var(--bs-ink); }
.lm__sample small { font-size: 0.75rem; color: var(--bs-ink-soft); }
.lm__note { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin-top: 16px; }
.lm__note .bs-body { flex: 1; }
.lm__error { color: var(--bs-danger); font: 600 0.9375rem var(--bs-font); }
.lm__bg { color: var(--bs-accent); }
</style>
