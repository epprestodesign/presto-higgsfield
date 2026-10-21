<script setup>
// OptionESteps — "Group hotel booking, branded in three steps" as an accordion:
// one step open at a time (title + description), the others collapsed to greyed
// titles. The media card on the right swaps to that step's static mock — a
// softly blurred Higgsfield scene (assets/marketing/option-e step-1…3) with a
// crisp piece of UI and a pointer on top. Click, or ↑/↓/Home/End between steps.
// Static: nothing autoplays; the swap is a short crossfade (none with reduced motion).
import { ref, useId } from 'vue'
import BrandHero from '../../brand/BrandHero.vue'
import ChromeWindow from '../../devices/ChromeWindow.vue'
import IPhone from '../../devices/IPhone.vue'
import OptionEPhoneScreen from './OptionEPhoneScreen.vue'
import { OPTION_E_ART as ART } from '../../../assets/marketing/option-e/index.js'
import { sampleProject } from '../../../data/sampleEvents.js'
import { heroProps } from '../../preview/previewModel.js'
import { getFont } from '../../../theme/fonts.js'

const emit = defineEmits(['start'])

const STEPS = [
  { n: '01', title: 'Paste your website', body: 'Drop in your event or organization site. We pull your logo, colors and fonts automatically — or upload them yourself.', art: 'step-1' },
  { n: '02', title: 'We brand every page', body: 'Your homepage hero, hotel directory and hotel details pages are themed in seconds, with banners generated to match.', art: 'step-2' },
  { n: '03', title: 'Share one link, track the block', body: 'Send a single booking link. Guests book your negotiated rates; you watch pickup by hotel in real time.', art: 'step-3' },
]

const active = ref(0)
const uid = useId()
const tabs = ref([])
function onKey(e, i) {
  const last = STEPS.length - 1
  const next = { ArrowDown: Math.min(last, i + 1), ArrowUp: Math.max(0, i - 1), Home: 0, End: last }[e.key]
  if (next === undefined) return
  e.preventDefault()
  active.value = next
  tabs.value[next]?.focus()
}

const demo = sampleProject('heartland')
const hero = heroProps(demo)
const phoneHero = heroProps(demo, { size: 'compact' })
const colors = demo.brandKit.colors || {}
const primary = colors.primary || '#01113E'
const logo = demo.brandKit.logo?.src || ''
const font = getFont(demo.brandKit.typography?.heading)
</script>

<template>
  <section id="oe-how" class="oes" aria-labelledby="oes-title">
    <div class="oes__copy">
      <h2 id="oes-title" class="oes__h2">Group hotel booking,<br />branded in three steps</h2>
      <div class="oes__list">
        <div v-for="(s, i) in STEPS" :key="s.n" class="oes__item" :class="{ 'is-open': active === i }">
          <h3 class="oes__head">
            <button
              :ref="(el) => (tabs[i] = el)"
              type="button"
              class="oes__btn"
              :aria-expanded="active === i"
              :aria-controls="`${uid}-panel-${i}`"
              :id="`${uid}-tab-${i}`"
              @click="active = i"
              @keydown="onKey($event, i)"
            >
              <span class="oes__n">{{ s.n }}</span>
              <span>{{ s.title }}</span>
            </button>
          </h3>
          <div :id="`${uid}-panel-${i}`" class="oes__panel" role="region" :aria-labelledby="`${uid}-tab-${i}`" :hidden="active !== i">
            <p>{{ s.body }}</p>
          </div>
        </div>
      </div>
      <q-btn unelevated no-caps rounded class="oes__cta" icon-right="arrow_forward" label="Brand my page" @click="emit('start', {})" />
    </div>

    <div class="oes__media" :aria-label="`Example: ${STEPS[active].title}`" role="img">
      <div v-for="(s, i) in STEPS" :key="s.n" class="oes__scene" :class="{ 'is-on': active === i }" aria-hidden="true">
        <img :src="ART[s.art]" alt="" class="oes__bg" />

        <!-- 01 · Paste your website -->
        <div v-if="i === 0" class="oes__mock oes__mock--site">
          <div class="oes__pill">
            <span class="oes__pill-label">Your event website<b>heartland-cup.com</b></span>
            <span class="oes__pill-btn">Brand my page <q-icon name="arrow_forward" size="22px" /></span>
          </div>
          <svg class="oes__cursor oes__cursor--site" viewBox="0 0 32 32"><path d="M6 3l19 11.5-8.2 1.6 5 9.4-3.6 1.9-5-9.4L7 23.5z" /></svg>
          <ul class="oes__found">
            <li><img :src="logo" alt="" /> Logo found</li>
            <li><span v-for="c in [colors.primary, colors.secondary, colors.accent]" :key="c" class="oes__dot" :style="{ background: c }" /> 3 brand colors</li>
            <li><span class="oes__aa" :style="{ fontFamily: font.family }">Aa</span> {{ font.label }}</li>
          </ul>
        </div>

        <!-- 02 · We brand every page -->
        <div v-else-if="i === 1" class="oes__mock oes__mock--brand">
          <div class="oes__browser">
            <chrome-window url="book.eventpipe.com/heartland" :title="demo.event.name" :favicon="logo" :favicon-color="primary" :design-width="1000" label="Branded homepage">
              <brand-hero v-bind="hero" :heading-level="4" class="oes__hero" />
            </chrome-window>
          </div>
          <div class="oes__chip oes__chip--colors"><span v-for="c in [colors.primary, colors.secondary, colors.accent]" :key="c" class="oes__dot" :style="{ background: c }" /> Colors applied</div>
          <div class="oes__chip oes__chip--logo"><img :src="logo" alt="" /> Logo on every page</div>
          <div class="oes__chip oes__chip--font"><span class="oes__aa" :style="{ fontFamily: font.family }">Aa</span> {{ font.label }}</div>
          <svg class="oes__cursor oes__cursor--brand" viewBox="0 0 32 32"><path d="M6 3l19 11.5-8.2 1.6 5 9.4-3.6 1.9-5-9.4L7 23.5z" /></svg>
        </div>

        <!-- 03 · Share one link, track the block -->
        <div v-else class="oes__mock oes__mock--share">
          <div class="oes__phone">
            <i-phone :page-height="640" url="book.eventpipe.com/heartland" label="Room block on a phone">
              <option-e-phone-screen :hero="phoneHero" :primary="primary" />
            </i-phone>
          </div>
          <div class="oes__link">
            <q-icon name="link" size="20px" />
            <span>book.eventpipe.com/<b>heartland</b></span>
            <span class="oes__copy-btn">Copy link</span>
          </div>
          <div class="oes__toast"><q-icon name="check_circle" size="16px" /> Link copied · 6 new bookings today</div>
          <q-icon name="touch_app" size="64px" class="oes__hand" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.oes { --ink: #0B1220; --soft: #5B6475; --line: #E8EAF0; max-width: 1180px; margin: 0 auto; padding: 32px 24px 96px; display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 56px; align-items: center; }
.oes__h2 { margin: 0; font: 800 clamp(1.75rem, 3vw, 2.5rem)/1.1 var(--oe-head, 'Inter', sans-serif); letter-spacing: -0.025em; text-wrap: balance; }

/* Accordion */
.oes__list { margin: 28px 0; }
.oes__item { border-top: 1px solid var(--line); }
.oes__item:last-child { border-bottom: 1px solid var(--line); }
.oes__head { margin: 0; }
.oes__btn { width: 100%; display: flex; align-items: baseline; gap: 14px; padding: 20px 4px; border: 0; background: none; text-align: left; cursor: pointer; font: 700 1.3125rem/1.25 var(--oe-head, 'Inter', sans-serif); letter-spacing: -0.01em; color: #8A90A0; border-radius: 10px; transition: color 150ms ease; }
.oes__btn:hover { color: var(--ink); }
.oes__btn:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; }
.is-open .oes__btn { color: var(--ink); padding-bottom: 8px; }
.oes__n { font: 800 0.875rem var(--oe-display, 'Montserrat', sans-serif); color: #B7BCC8; }
.is-open .oes__n { color: var(--oe-accent, #7C3AED); }
.oes__panel p { margin: 0 0 20px 38px; color: var(--soft); line-height: 1.55; font-size: 1rem; max-width: 52ch; }
.oes__cta { background: var(--ink); color: #fff; font: 700 0.9375rem var(--oe-head, 'Inter', sans-serif); padding: 0 20px; min-height: 44px; }

/* Media card */
.oes__media { position: relative; aspect-ratio: 1 / 1; max-height: 640px; width: 100%; border-radius: 28px; overflow: hidden; background: #0B1220; box-shadow: 0 24px 60px rgb(15 23 42 / 0.18); container-type: inline-size; }
.oes__scene { position: absolute; inset: 0; opacity: 0; transition: opacity 320ms ease; pointer-events: none; }
.oes__scene.is-on { opacity: 1; }
.oes__bg { position: absolute; inset: -4%; width: 108%; height: 108%; object-fit: cover; filter: blur(7px) saturate(0.9); }
.oes__scene::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(11 18 32 / 0.18), rgb(11 18 32 / 0.45)); }
.oes__mock { position: absolute; inset: 0; z-index: 1; }

/* Pointers */
.oes__cursor { position: absolute; width: 11cqi; height: 11cqi; fill: #fff; stroke: #0B1220; stroke-width: 1.6; stroke-linejoin: round; filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.35)); }
.oes__hand { position: absolute; color: #fff; filter: drop-shadow(0 0 1px #0B1220) drop-shadow(0 0 1px #0B1220) drop-shadow(0 8px 12px rgb(0 0 0 / 0.4)); }

/* 01 */
.oes__pill { position: absolute; left: 6%; right: 6%; top: 40%; display: flex; align-items: center; gap: 3cqi; padding: 2.2cqi 2.2cqi 2.2cqi 5cqi; border-radius: 999px; background: #fff; box-shadow: 0 20px 50px rgb(0 0 0 / 0.3); }
.oes__pill-label { flex: 1; min-width: 0; display: grid; gap: 0.6cqi; font: 600 2.6cqi/1.1 var(--oe-head, 'Inter', sans-serif); color: #8A90A0; }
.oes__pill-label b { font: 500 4.4cqi/1.1 var(--oe-head, 'Inter', sans-serif); color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oes__pill-btn { flex: none; display: inline-flex; align-items: center; gap: 1.4cqi; padding: 3cqi 4cqi; border-radius: 999px; background: var(--ink); color: #fff; font: 700 3.2cqi var(--oe-head, 'Inter', sans-serif); }
.oes__pill-btn .q-icon { font-size: 3.6cqi !important; }
.oes__cursor--site { right: 8%; top: 49%; }
.oes__found { list-style: none; margin: 0; padding: 0; position: absolute; left: 8%; top: 62%; display: flex; flex-wrap: wrap; gap: 1.6cqi; }
.oes__found li { display: inline-flex; align-items: center; gap: 1.4cqi; padding: 1.4cqi 2.4cqi; border-radius: 999px; background: rgb(255 255 255 / 0.92); backdrop-filter: blur(6px); font: 700 2.3cqi var(--oe-head, 'Inter', sans-serif); color: var(--ink); box-shadow: 0 8px 20px rgb(0 0 0 / 0.18); }
.oes__found img { height: 4cqi; width: auto; }
.oes__dot { width: 2.8cqi; height: 2.8cqi; border-radius: 50%; box-shadow: 0 0 0 0.3cqi #fff, 0 0 0 0.45cqi rgb(0 0 0 / 0.08); }
.oes__dot + .oes__dot { margin-left: -0.6cqi; }
.oes__aa { font-size: 3cqi; line-height: 1; }

/* 02 */
.oes__browser { position: absolute; left: 7%; top: 18%; width: 86%; filter: drop-shadow(0 20px 36px rgb(0 0 0 / 0.35)); }
.oes__hero { pointer-events: none; }
.oes__chip { position: absolute; display: inline-flex; align-items: center; gap: 1.4cqi; padding: 1.6cqi 2.6cqi; border-radius: 999px; background: #fff; font: 700 2.4cqi var(--oe-head, 'Inter', sans-serif); color: var(--ink); box-shadow: 0 12px 28px rgb(0 0 0 / 0.25); }
.oes__chip img { height: 4.4cqi; width: auto; }
.oes__chip--colors { left: 4%; top: 64%; transform: rotate(-3deg); }
.oes__chip--logo { right: 5%; top: 9%; transform: rotate(3deg); }
.oes__chip--font { left: 36%; top: 76%; transform: rotate(2deg); }
.oes__cursor--brand { left: 56%; top: 80%; }

/* 03 */
.oes__phone { position: absolute; left: 50%; top: 8%; width: 46%; transform: translateX(-50%); filter: drop-shadow(0 24px 40px rgb(0 0 0 / 0.4)); }
.oes__link { position: absolute; left: 6%; right: 6%; bottom: 13%; display: flex; align-items: center; gap: 2cqi; padding: 2cqi 2cqi 2cqi 3.6cqi; border-radius: 999px; background: #fff; box-shadow: 0 20px 44px rgb(0 0 0 / 0.32); font: 500 3cqi var(--oe-head, 'Inter', sans-serif); color: var(--soft); }
.oes__link .q-icon { font-size: 4cqi !important; color: var(--ink); }
.oes__link b { color: var(--ink); font-weight: 700; }
.oes__link > span:first-of-type { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oes__copy-btn { flex: none; padding: 2cqi 3.4cqi; border-radius: 999px; background: var(--ink); color: #fff; font-weight: 700; }
.oes__toast { position: absolute; left: 5%; top: 30%; transform: rotate(-3deg); display: inline-flex; align-items: center; gap: 1.2cqi; padding: 1.6cqi 2.6cqi; border-radius: 12px; background: #0B1220; color: #fff; font: 600 2.3cqi var(--oe-head, 'Inter', sans-serif); box-shadow: 0 12px 28px rgb(0 0 0 / 0.35); }
.oes__toast .q-icon { color: #4ADE80; font-size: 3cqi !important; }
.oes__hand { right: 9%; bottom: 3%; font-size: 13cqi !important; transform: rotate(-12deg); }

@media (prefers-reduced-motion: reduce) { .oes__scene, .oes__btn { transition: none; } }

@media (max-width: 1080px) {
  .oes { grid-template-columns: 1fr; gap: 32px; }
  .oes__media { max-height: none; }
}
@media (max-width: 700px) {
  .oes { padding: 16px 16px 64px; }
  .oes__btn { font-size: 1.125rem; padding: 16px 2px; }
  .oes__panel p { margin-left: 32px; font-size: 0.9375rem; }
  .oes__media { border-radius: 20px; }
}
</style>
