<script setup>
// HowItWorks — the five-step path from intake to a shareable demo, each step
// illustrated with a miniature of the real UI it leads to.
import { computed } from 'vue'
import BrandHero from '../brand/BrandHero.vue'
import { sampleProject } from '../../data/sampleEvents.js'
import { buildConcept } from '../../providers/ai/conceptFactory.js'
import { getFont } from '../../theme/fonts.js'

const emit = defineEmits(['start'])

const p = sampleProject('heartland')
const concept = computed(() => buildConcept({ direction: 'energy', templateIndex: 1, brandKit: p.brandKit, event: p.event }))
const heading = getFont(p.brandKit.typography.heading).family

const steps = [
  { n: 1, title: 'Tell us about your event', text: 'Name, dates, location and an optional website. About two minutes, no account required.' },
  { n: 2, title: 'Bring your brand', text: 'Upload a logo and photos or enter your colors. We suggest a starting palette and typography.', },
  { n: 3, title: 'Choose a creative direction', text: 'Three directions and six concepts: Brand Signature, Event Energy or Premium Experience.', ai: true },
  { n: 4, title: 'Customize every page', text: 'Edit copy, buttons, sections and sponsor ads on the landing, hotel search and hotel detail pages.' },
  { n: 5, title: 'Share a live demo', text: 'Pick a URL, check desktop and mobile, and publish a demo your team can click through.' },
]
</script>

<template>
  <section id="how-it-works" class="hiw" aria-labelledby="hiw-title">
    <div class="hiw__inner">
      <div class="hiw__head">
        <p class="bs-eyebrow hiw__eyebrow">How it works</p>
        <h2 id="hiw-title" class="bs-display-2 hiw__title">From event details to a branded booking site in five steps.</h2>
      </div>

      <ol class="hiw__steps">
        <li v-for="s in steps" :key="s.n" class="hiw__step">
          <div class="hiw__art" aria-hidden="true">
            <!-- 1 · intake -->
            <div v-if="s.n === 1" class="v v--form">
              <span class="v__label">Booking page name</span>
              <span class="v__field">Heartland Invitational Soccer Cup 2027</span>
              <div class="v__row">
                <span class="v__field v__field--sm">Jun 16 – 19, 2027</span>
                <span class="v__field v__field--sm">Overland Park, KS</span>
              </div>
            </div>
            <!-- 2 · brand -->
            <div v-else-if="s.n === 2" class="v v--brand">
              <img :src="p.brandKit.logo.src" alt="" class="v__logo" />
              <div class="v__swatches">
                <i :style="{ background: p.brandKit.colors.primary }" />
                <i :style="{ background: p.brandKit.colors.secondary }" />
                <i :style="{ background: p.brandKit.colors.accent }" />
              </div>
              <span class="v__aa" :style="{ fontFamily: heading }">Aa</span>
            </div>
            <!-- 3 · concepts -->
            <div v-else-if="s.n === 3" class="v v--concept">
              <brand-hero :concept="concept" :brand-kit="p.brandKit" :headline="'Heartland Cup'" size="card" :show-dates="false" :heading-level="4" />
              <div class="v__chips"><span>Signature</span><span class="is-on">Energy</span><span>Premium</span></div>
            </div>
            <!-- 4 · customize -->
            <div v-else-if="s.n === 4" class="v v--toggles">
              <div v-for="row in ['Hotel search', 'Event description', 'Sponsor ads']" :key="row" class="v__toggle">
                <span>{{ row }}</span><i class="v__switch" />
              </div>
              <div class="v__devices"><q-icon name="desktop_windows" size="16px" /><q-icon name="smartphone" size="16px" /></div>
            </div>
            <!-- 5 · publish -->
            <div v-else class="v v--publish">
              <span class="v__badge"><q-icon name="public" size="14px" /> Published demo</span>
              <span class="v__url">demo.eventpipe.com/<b>heartland-cup-2027</b></span>
            </div>
          </div>

          <div class="hiw__text">
            <span class="hiw__n">{{ String(s.n).padStart(2, '0') }}</span>
            <h3 class="hiw__step-title">
              {{ s.title }}
              <span v-if="s.ai" class="bs-pill bs-pill--ai hiw__ai"><q-icon name="auto_awesome" size="12px" /> AI</span>
            </h3>
            <p class="hiw__step-text">{{ s.text }}</p>
          </div>
        </li>
      </ol>

      <div class="hiw__foot">
        <q-btn unelevated no-caps class="bs-btn bs-btn--lg hiw__cta" label="Start with step one" icon-right="arrow_forward" @click="emit('start')" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hiw { margin-top: clamp(64px, 9vw, 120px); background: var(--bs-ink); color: #fff; }
.hiw__inner { max-width: 1240px; margin: 0 auto; padding: clamp(64px, 8vw, 104px) 24px; }
.hiw__head { max-width: 760px; display: grid; gap: 14px; margin-bottom: 48px; }
.hiw__eyebrow { color: #C4B5FD; }
.hiw__title { color: #fff; }

.hiw__steps { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
.hiw__step { display: flex; flex-direction: column; gap: 18px; padding: 14px; border-radius: var(--bs-radius-lg); background: rgb(255 255 255 / 0.04); border: 1px solid rgb(255 255 255 / 0.08); }
.hiw__art { height: 150px; border-radius: var(--bs-radius-md); background: #fff; color: var(--bs-ink); overflow: hidden; display: flex; }
.hiw__text { padding: 0 4px 6px; display: grid; gap: 8px; }
.hiw__n { font: 700 0.75rem/1 var(--bs-font); letter-spacing: 0.12em; color: rgb(255 255 255 / 0.55); }
.hiw__step-title { margin: 0; font: 700 1.0625rem/1.25 var(--bs-font); color: #fff; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.hiw__ai { padding: 2px 8px; }
.hiw__step-text { margin: 0; font: 400 0.9rem/1.5 var(--bs-font); color: rgb(255 255 255 / 0.74); }
.hiw__foot { margin-top: 40px; }
.q-btn.hiw__cta { background: #fff; color: var(--bs-ink); }

/* Vignettes */
.v { flex: 1; padding: 14px; display: flex; flex-direction: column; gap: 8px; font: 400 11px/1.2 var(--bs-font); }
.v__label { font-weight: 700; color: var(--bs-ink-soft); }
.v__field { display: block; padding: 8px 10px; border: 1px solid var(--bs-line-strong); border-radius: 6px; color: var(--bs-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v__row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.v__field--sm { font-size: 10px; }
.v--brand { flex-direction: row; align-items: center; justify-content: space-around; }
.v__logo { height: 76px; width: auto; }
.v__swatches { display: grid; gap: 6px; }
.v__swatches i { display: block; width: 34px; height: 22px; border-radius: 5px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1); }
.v__aa { font-size: 42px; font-weight: 700; color: var(--bs-ink); }
.v--concept { padding: 10px; gap: 8px; justify-content: center; }
.v--concept :deep(.bh) { border-radius: 6px; }
.v__chips { display: flex; gap: 4px; }
.v__chips span { flex: 1; text-align: center; padding: 5px 0; border-radius: 999px; background: var(--bs-surface-2); color: var(--bs-ink-soft); font-weight: 700; font-size: 10px; }
.v__chips .is-on { background: var(--bs-accent); color: #fff; }
.v--toggles { justify-content: center; }
.v__toggle { display: flex; justify-content: space-between; align-items: center; padding: 6px 2px; border-bottom: 1px solid var(--bs-line); color: var(--bs-ink); font-weight: 700; }
.v__switch { width: 26px; height: 14px; border-radius: 999px; background: var(--bs-brand); position: relative; }
.v__switch::after { content: ''; position: absolute; right: 2px; top: 2px; width: 10px; height: 10px; border-radius: 50%; background: #fff; }
.v__devices { display: flex; gap: 8px; color: var(--bs-ink-soft); margin-top: 4px; }
.v--publish { justify-content: center; align-items: flex-start; gap: 10px; background: linear-gradient(180deg, #F0FDF4, #fff); }
.v__badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px; background: #DCFCE7; color: #166534; font-weight: 700; }
.v__url { padding: 8px 10px; border-radius: 6px; border: 1px solid var(--bs-line-strong); background: #fff; color: var(--bs-ink-soft); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v__url b { color: var(--bs-ink); }

@media (max-width: 1100px) {
  .hiw__steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hiw__step:last-child { grid-column: span 2; }
}
@media (max-width: 640px) {
  .hiw__inner { padding-inline: 16px; }
  .hiw__steps { grid-template-columns: 1fr; }
  .hiw__step:last-child { grid-column: auto; }
  .hiw__step { flex-direction: row; align-items: center; }
  .hiw__art { flex: 0 0 132px; height: 120px; }
  .hiw__cta { width: 100%; }
}
@media (max-width: 400px) {
  .hiw__step { flex-direction: column; align-items: stretch; }
  .hiw__art { flex: none; height: 140px; }
}
</style>
