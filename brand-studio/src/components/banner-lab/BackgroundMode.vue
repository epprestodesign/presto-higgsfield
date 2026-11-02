<script setup>
// Background graphics mode, step by step:
//   1 References (WhatTheFont-style drop) → 2 Describe → 3 Prompt (optimize,
//   generate) → 4 Results (pick one) → 5 Fit & export (FitStage)
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useBannerLab, statusText, BG_STEPS } from '../../banner-lab/useBannerLab.js'
import { STYLES, MOODS, STANDARD_RULES } from '../../banner-lab/prompt.js'
import { GENERATION } from '../../banner-lab/standards.js'
import { hf } from '../../providers/higgsfield/client.js'
import LabStepper from './LabStepper.vue'
import StepNav from './StepNav.vue'
import DropHero from './DropHero.vue'
import FitStage from './FitStage.vue'

const lab = useBannerLab()
const s = lab.s
const n = computed(() => BG_STEPS.findIndex((st) => st.id === s.bgStep) + 1)
const toggle = { noCaps: true, unelevated: true, toggleColor: 'primary', color: 'white', textColor: 'dark' }

const TIPS = [
  'Photos of the venue, the sport or the city.',
  'Past banners, posters or ads you like.',
  'Mood boards or colour swatches.',
  `Up to ${GENERATION.maxReferences} images. They guide subject, colour and mood; they are never copied.`,
]

const EXAMPLES = [
  'Volleyball net close-up in deep blue, arena lights from the right',
  'Packed basketball arena at night, glossy hardwood',
  'Lakeside summer camp at golden hour, pine trees and canoes',
  'Abstract halftone waves in navy and teal',
]

function toggleMood(m) {
  const i = s.brief.moods.indexOf(m)
  if (i >= 0) s.brief.moods.splice(i, 1)
  else if (s.brief.moods.length < 3) s.brief.moods.push(m)
}

const refLabel = (a) => (a ? [a.brightness, a.temperature !== 'neutral' && a.temperature, a.saturation, a.kind].filter(Boolean).join(' · ') : 'Reading…')
const SOURCE = { brief: 'From your brief', optimized: 'Optimized', edited: 'Edited' }

// ── Cost (free estimate, only when live) ──────────────────────────────────
const estimate = ref(null)
let timer = null
watch([() => lab.prompt.value, () => lab.live.value], () => {
  clearTimeout(timer)
  if (!lab.live.value) { estimate.value = null; return }
  timer = setTimeout(async () => {
    try { estimate.value = await hf.estimate(GENERATION.endpoint, { prompt: lab.prompt.value, aspect_ratio: GENERATION.aspectRatio, resolution: GENERATION.resolution, quality: GENERATION.quality }) } catch { estimate.value = null }
  }, 700)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))
const costText = computed(() => {
  if (!lab.live.value) return 'Sample mode: stock results, no credits.'
  if (estimate.value?.credits) return `About ${Number(estimate.value.credits) * s.brief.variants} credits for ${s.brief.variants}.`
  if (estimate.value?.pricing_description) return 'Token-priced; settled when each image finishes.'
  return `${GENERATION.model}, ${GENERATION.aspectRatio}, ${GENERATION.resolution}.`
})

const hasBrief = computed(() => !!s.brief.description.trim() || s.references.length > 0)
const active = computed(() => s.jobs.filter((j) => !['completed', 'failed', 'nsfw', 'canceled', 'error'].includes(j.status)).length)
const logoUrl = computed(() => (lab.logoCanvas.value ? lab.logoCanvas.value.toDataURL('image/png') : ''))

// Results: newest batch first, older batches below it.
const batches = computed(() => {
  const out = []
  for (const j of s.jobs) {
    let b = out.find((x) => x.id === j.batch)
    if (!b) out.push((b = { id: j.batch, jobs: [], prompt: j.prompt, promptSource: j.promptSource, references: j.references, createdAt: j.createdAt }))
    b.jobs.push(j)
  }
  return out.map((b) => ({ ...b, jobs: [...b.jobs].sort((x, y) => x.n - y.n) }))
})
const time = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
</script>

<template>
  <div class="bm">
    <LabStepper :steps="BG_STEPS" :current="s.bgStep" :available="lab.bgAvailable" label="Background graphics steps" @go="lab.goBg" />

    <!-- 1 · References -->
    <section v-if="s.bgStep === 'references'" class="bl-step">
      <DropHero
        :eyebrow="`Step 1 of ${BG_STEPS.length}`"
        title="Show us what you like"
        lead="A Presto banner is one minimal background behind your logo. Start with a few reference images: venue photos, banners you like, a mood board. They’re optional, but they make the results much closer to what you have in mind."
        multiple :tips="TIPS" :error="s.refError" url-placeholder="Paste a reference image URL…"
        @files="lab.referencesFromFiles" @url="lab.referenceFromUrl"
      >
        <ul v-if="s.references.length" class="bm__refs" aria-label="Reference images">
          <li v-for="r in s.references" :key="r.id" class="bm__ref">
            <img :src="r.src" :alt="r.name" />
            <span class="bm__ref-meta">
              <span class="bm__ref-dots"><i v-for="c in r.analysis?.colors || []" :key="c" :style="{ background: c }" /></span>
              <small>{{ refLabel(r.analysis) }}</small>
            </span>
            <q-btn round dense flat size="sm" icon="close" class="bm__ref-x" :aria-label="`Remove ${r.name}`" @click="lab.removeReference(r.id)" />
          </li>
        </ul>
      </DropHero>
      <StepNav :next="s.references.length ? 'Describe the banner' : 'Skip: just describe it'" @next="lab.goBg('describe')">
        {{ s.references.length ? `${s.references.length} of ${GENERATION.maxReferences} references added.` : '' }}
      </StepNav>
    </section>

    <!-- 2 · Describe -->
    <section v-else-if="s.bgStep === 'describe'" class="bl-step" aria-labelledby="bm-describe">
      <header class="bl-step__head">
        <p class="bs-eyebrow">Step {{ n }} of {{ BG_STEPS.length }}</p>
        <h1 id="bm-describe" class="bs-title">Describe the banner</h1>
        <p class="bs-body">What should the background show? Keep it to the scene: your logo and event name go on top later.</p>
      </header>
      <div class="bs-card bm__card">
        <q-input
          v-model="s.brief.description" type="textarea" outlined autogrow class="bm__desc" maxlength="600" autofocus
          placeholder="e.g. A volleyball net close-up in deep blue with arena lights from the right"
          aria-label="Describe the banner"
        />
        <div class="bm__examples">
          <span class="bs-caption">Try:</span>
          <button v-for="e in EXAMPLES" :key="e" type="button" class="bs-pill bm__ex bs-focusable" @click="s.brief.description = e">{{ e }}</button>
        </div>
        <div class="bm__row">
          <div class="bm__field">
            <span class="bs-caption">Style</span>
            <q-btn-toggle v-model="s.brief.style" v-bind="toggle" :options="STYLES.map((st) => ({ value: st.value, label: st.label }))" />
          </div>
          <div class="bm__field">
            <span class="bs-caption">Mood (up to 3)</span>
            <div class="bm__chips">
              <button
                v-for="m in MOODS" :key="m" type="button" class="bs-pill bm__mood bs-focusable" :class="{ 'is-on': s.brief.moods.includes(m) }"
                :aria-pressed="s.brief.moods.includes(m)" @click="toggleMood(m)"
              >{{ m }}</button>
            </div>
          </div>
          <div class="bm__field">
            <span class="bs-caption">Brand colours</span>
            <div v-if="lab.palette.value.length" class="bm__brand">
              <span v-for="c in lab.palette.value" :key="c" class="bm__swatch" :style="{ background: c }" :title="c" />
              <q-toggle v-model="s.brief.usePalette" dense color="primary" label="Use them" />
            </div>
            <p v-else class="bs-caption">
              None yet. <a href="#/logo" @click.prevent="s.mode = 'logo'">Optimize your logo</a> and its colours steer the art.
            </p>
          </div>
        </div>
      </div>
      <StepNav back="References" next="Write the prompt" :next-disabled="!hasBrief" @back="lab.goBg('references')" @next="lab.goBg('prompt')">
        {{ hasBrief ? '' : 'Describe the banner or add a reference image to continue.' }}
      </StepNav>
    </section>

    <!-- 3 · Prompt -->
    <section v-else-if="s.bgStep === 'prompt'" class="bl-step" aria-labelledby="bm-prompt">
      <header class="bl-step__head">
        <p class="bs-eyebrow">Step {{ n }} of {{ BG_STEPS.length }}</p>
        <h1 id="bm-prompt" class="bs-title">Your prompt for Higgsfield</h1>
        <p class="bs-body">Written from your brief{{ s.references.length ? ` and ${s.references.length} reference${s.references.length > 1 ? 's' : ''}` : '' }}. Optimize it to get a more specific, higher-quality result, or edit it yourself.</p>
      </header>
      <div class="bm__pgrid">
        <div class="bs-card bm__card">
          <div class="bm__phead">
            <span class="bs-pill" :class="{ 'bs-pill--ai': s.promptSource === 'optimized' }">{{ SOURCE[s.promptSource] }}</span>
            <q-btn v-if="s.promptSource !== 'brief'" flat dense no-caps size="sm" icon="undo" label="Back to my brief" @click="lab.resetPrompt()" />
          </div>
          <q-input
            :model-value="lab.prompt.value" type="textarea" outlined autogrow class="bm__ptext" input-class="bm__ptext-in"
            aria-label="Prompt" @update:model-value="lab.editPrompt"
          />
          <q-btn unelevated no-caps class="bs-btn bs-btn--ai bm__opt" icon="auto_awesome" :label="s.promptSource === 'optimized' ? 'Optimize again' : 'Optimize prompt'" @click="lab.optimize()" />
        </div>

        <aside class="bm__side">
          <div v-if="s.optimization && s.promptSource === 'optimized'" class="bm__changes">
            <p class="bs-subtitle">What the optimizer added</p>
            <ul><li v-for="c in s.optimization.changes" :key="c" class="bs-caption"><q-icon name="add" size="14px" /> {{ c }}</li></ul>
          </div>
          <div v-else class="bs-card bm__hint">
            <p class="bs-subtitle"><q-icon name="auto_awesome" size="18px" /> Optimize prompt</p>
            <p class="bs-caption">Rewrites your brief the way image models respond best: the setting in detail, camera and lens, lighting, colour grade from your brand and references, finish, and a list of things to avoid.</p>
          </div>
          <div class="bs-card bm__hint">
            <q-toggle v-model="s.enhance" color="primary" label="Let Higgsfield refine it too" />
            <p class="bs-caption">Flare’s own prompt enhancer runs on top when it generates.</p>
          </div>
          <div class="bs-card bm__hint">
            <p class="bs-caption"><q-icon name="lock" size="14px" /> Presto banner standards, always in the prompt:</p>
            <div class="bm__chips"><span v-for="r in STANDARD_RULES" :key="r.id" class="bs-pill">{{ r.label }}</span></div>
          </div>
          <div class="bs-card bm__hint">
            <span class="bs-caption">How many variations?</span>
            <q-btn-toggle v-model="s.brief.variants" v-bind="toggle" :options="[1, 2, 3, 4].map((v) => ({ value: v, label: String(v) }))" />
          </div>
        </aside>
      </div>
      <StepNav
        back="Describe" :next="`Generate ${s.brief.variants}`" next-icon="bolt" :next-disabled="lab.prompt.value.trim().length < 20 || active > 0"
        @back="lab.goBg('describe')" @next="lab.generate()"
      >{{ active > 0 ? 'Still generating the last batch.' : costText }}</StepNav>
    </section>

    <!-- 4 · Results -->
    <section v-else-if="s.bgStep === 'results'" class="bl-step" aria-labelledby="bm-results">
      <header class="bl-step__head">
        <p class="bs-eyebrow">Step {{ n }} of {{ BG_STEPS.length }}</p>
        <h1 id="bm-results" class="bs-title">Pick a background</h1>
        <p class="bs-body">Each one is previewed as the 1440×400 landing banner{{ logoUrl ? ' with your logo' : '' }}. Pick one to fit it to both sizes and check it against the standard.</p>
      </header>
      <div v-for="(b, i) in batches" :key="b.id" class="bm__batch">
        <p class="bm__bmeta bs-caption">
          <strong>{{ i === 0 ? 'Latest' : 'Earlier' }}</strong> · {{ time(b.createdAt) }}
          <span v-if="b.jobs[0].sample" class="bs-pill">Sample</span>
          <span v-else-if="b.promptSource === 'optimized'" class="bs-pill bs-pill--ai">Optimized prompt</span>
          <span v-if="b.references">· {{ b.references }} reference{{ b.references > 1 ? 's' : '' }}</span>
        </p>
        <div class="bm__jobs">
          <article v-for="j in b.jobs" :key="j.id" class="bs-card bm__job" :class="{ 'is-picked': s.selected?.jobId === j.id }">
            <button type="button" class="bm__art bs-focusable" :disabled="!j.images.length" :aria-label="j.images.length ? `Use background ${j.n}` : statusText(j.status)" @click="lab.choose(j, j.images[0])">
              <template v-if="j.images.length">
                <img :src="j.images[0]" alt="" />
                <img v-if="logoUrl" :src="logoUrl" alt="" class="bm__art-logo" />
              </template>
              <span v-else-if="j.error" class="bm__art-msg bm__art-msg--err"><q-icon name="error_outline" size="22px" /> {{ j.error }}</span>
              <span v-else class="bm__art-msg"><q-spinner-dots size="28px" color="white" /> {{ statusText(j.status) }}</span>
            </button>
            <footer class="bm__jfoot">
              <span class="bs-caption">Variation {{ j.n }}</span>
              <span class="bm__jbtns">
                <q-btn v-if="j.requestId && !j.images.length && !j.error" flat dense no-caps size="sm" label="Cancel" @click="lab.cancel(j)" />
                <q-btn v-if="j.images.length" unelevated no-caps class="bs-btn bs-btn--primary" icon-right="arrow_forward" label="Use this one" @click="lab.choose(j, j.images[0])" />
              </span>
            </footer>
          </article>
        </div>
      </div>
      <StepNav back="Edit the prompt" @back="lab.goBg('prompt')">
        <q-btn flat no-caps class="bs-btn bm__more" icon="bolt" :label="`Generate ${s.brief.variants} more`" :disable="active > 0" @click="lab.generate()" />
      </StepNav>
    </section>

    <!-- 5 · Fit & export -->
    <FitStage v-else :step="n" :of="BG_STEPS.length" />
  </div>
</template>

<style scoped>
.bm { display: grid; gap: 28px; }
.bm__refs { list-style: none; padding: 0; margin: 24px 0 0; display: flex; flex-wrap: wrap; gap: 12px; }
.bm__ref { position: relative; width: 160px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: var(--bs-surface); overflow: hidden; }
.bm__ref img { display: block; width: 100%; height: 100px; object-fit: cover; }
.bm__ref-meta { display: grid; gap: 4px; padding: 6px 8px 8px; }
.bm__ref-meta small { font: 500 0.6875rem var(--bs-font); color: var(--bs-ink-soft); }
.bm__ref-dots { display: flex; gap: 3px; }
.bm__ref-dots i { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgb(0 0 0 / 0.08); }
.bm__ref-x { position: absolute; top: 4px; right: 4px; background: rgb(255 255 255 / 0.9); }
.bm__card { padding: 20px 22px; display: grid; gap: 16px; }
.bm__desc :deep(textarea) { min-height: 110px; font: 400 1.0625rem/1.5 var(--bs-font); }
.bm__examples { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.bm__ex { cursor: pointer; font-weight: 500; }
.bm__row { display: grid; grid-template-columns: auto 1fr auto; gap: 28px; align-items: start; }
.bm__field { display: grid; gap: 6px; }
.bm__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.bm__mood { cursor: pointer; }
.bm__mood.is-on { background: var(--bs-brand); color: #fff; border-color: var(--bs-brand); }
.bm__brand { display: flex; align-items: center; gap: 6px; }
.bm__swatch { width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgb(0 0 0 / 0.1); }
.bm__pgrid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr); gap: 20px; align-items: start; }
.bm__phead { display: flex; align-items: center; justify-content: space-between; }
.bm__ptext :deep(.bm__ptext-in) { min-height: 280px; font: 400 0.875rem/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; }
.bm__opt { justify-self: start; }
.bm__side { display: grid; gap: 12px; }
.bm__hint { padding: 14px 16px; display: grid; gap: 8px; }
.bm__hint .bs-subtitle { display: flex; align-items: center; gap: 6px; }
.bm__changes { padding: 14px 16px; border-radius: var(--bs-radius-lg); background: var(--bs-accent-soft); border: 1px solid var(--bs-accent-line); }
.bm__changes ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 3px; }
.bm__batch + .bm__batch { margin-top: 24px; }
.bm__bmeta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.bm__jobs { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 16px; }
.bm__job { overflow: hidden; }
.bm__job.is-picked { outline: 3px solid var(--bs-accent); }
.bm__art { position: relative; width: 100%; aspect-ratio: 1440 / 400; border: 0; padding: 0; background: #0b1736; display: grid; place-items: center; cursor: pointer; }
.bm__art:disabled { cursor: default; }
.bm__art > img:first-child { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bm__art-logo { position: relative; height: 30%; max-width: 49%; object-fit: contain; }
.bm__art-msg { display: flex; align-items: center; gap: 10px; color: #fff; font: 600 0.9375rem var(--bs-font); padding: 0 16px; }
.bm__art-msg--err { color: #fecaca; }
.bm__jfoot { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 14px; }
.bm__jbtns { display: flex; gap: 6px; }
.bm__more { color: var(--bs-accent); }
@media (max-width: 1000px) { .bm__pgrid, .bm__row { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .bm__jobs { grid-template-columns: 1fr; } }
</style>
