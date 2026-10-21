<script setup>
// OptionEFooter — footer concepts for homepage Option E, each pushing the
// product's value props (your brand on every page · live in seconds · one link
// for every guest · room block tracked · sponsors pay back · 20+ industries):
//   classic   link columns + giant "presto" wordmark (the original)
//   brands    the wordmark is filled with a mosaic of customer brands' banners
//   cascade   the same booking page re-skinned for five brands, cascading in
//   skyline   Higgsfield dusk skyline of lit hotels with live-feeling chips
//   spectrum  the wordmark cut into bands of each industry's brand color over
//             Higgsfield silk textures, with value-prop columns
// Imagery: assets/marketing/option-e (footer-skyline · Flare; footer-texture-*
// · Recraft) + the Higgsfield vertical examples. Figures are placeholders.
import { computed } from 'vue'
import BrandHero from '../../brand/BrandHero.vue'
import { OPTION_E_ART as ART } from '../../../assets/marketing/option-e/index.js'
import { sampleProject } from '../../../data/sampleEvents.js'
import { VERTICAL_EXAMPLES } from '../../../data/verticals/index.js'
import { heroProps } from '../../preview/previewModel.js'
import epLogo from '@lib/assets/eventpipe logos/eventpipe-logo.svg'

const props = defineProps({
  variant: { type: String, default: 'classic' }, // classic | brands | cascade | skyline | spectrum
})
const emit = defineEmits(['start'])

const VALUE_PROPS = [
  { icon: 'palette', title: 'Your brand on every page', text: 'Logo, colors and banners on the homepage, directory and details.' },
  { icon: 'bolt', title: 'Live in seconds', text: 'Paste your website; your booking page is themed instantly.' },
  { icon: 'link', title: 'One link for every guest', text: 'Text it, email it, print it on the QR code.' },
  { icon: 'insights', title: 'Room block tracked', text: 'Pickup by hotel, in real time, before the cutoff.' },
  { icon: 'campaign', title: 'Sponsors pay back', text: 'Display ads on every page help offset the block.' },
  { icon: 'diversity_3', title: '20+ industries', text: 'Tournaments to travel nurses, ready-made themes.' },
]

const examples = VERTICAL_EXAMPLES.map((v) => {
  const p = sampleProject(v.sampleKey)
  const banner = p.brandKit.imagery?.find((a) => a.kind !== 'logo' && a.kind !== 'pattern' && !/abstract/.test(a.id))?.src
  const c = p.brandKit.colors || {}
  return { id: v.id, label: v.label, short: v.label.split(/ & |, | /)[0], name: p.event.name, logo: p.brandKit.logo?.src, primary: c.primary || '#01113E', vivid: c.accent || c.secondary || c.primary || '#7C3AED', banner, project: p }
}).filter((e) => e.logo && e.banner)

// brands: 10 × 2 grid of banner photos behind the wordmark letters.
const mosaicStyle = computed(() => {
  const tiles = examples.slice(0, 20)
  const cols = 10
  const rows = Math.ceil(tiles.length / cols)
  return {
    backgroundImage: tiles.map((t) => `url(${t.banner})`).join(', '),
    backgroundPosition: tiles.map((_, i) => `${((i % cols) / (cols - 1)) * 100}% ${(Math.floor(i / cols) / Math.max(1, rows - 1)) * 100}%`).join(', '),
    backgroundSize: tiles.map(() => `${100 / cols + 0.4}% ${100 / rows + 0.4}%`).join(', '),
    backgroundRepeat: 'no-repeat',
  }
})

// cascade: five brands, same page.
const CASCADE = ['youth-sports', 'weddings', 'conference', 'construction', 'music-festival']
const cascade = CASCADE.map((id, i) => {
  const e = examples.find((x) => x.id === id) || examples[i]
  // Mini pages: logo + name only, so the hero never clips at card size.
  return { ...e, hero: { ...heroProps(e.project, { size: 'card' }), dates: '', location: '', tagline: '' }, prop: VALUE_PROPS[i] }
})

// spectrum: bands of each industry's primary color.
const spectrumStyle = computed(() => {
  // Each industry's most vivid brand color (accent → secondary → primary).
  const cols = examples.slice(0, 12).map((e) => e.vivid)
  const step = 100 / cols.length
  const bands = cols.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')
  return {
    backgroundImage: `linear-gradient(180deg, ${bands}), url(${ART['footer-texture-warm']}), url(${ART['footer-texture-cool']})`,
    backgroundSize: '100% 100%, 100% 50%, 100% 50%',
    backgroundPosition: '0 0, 0 0, 0 100%',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: 'overlay, normal, normal',
  }
})

const SKY_CHIPS = [
  { icon: 'hotel', text: '128 rooms booked tonight', x: 8, y: 12 },
  { icon: 'insights', text: 'Block 84% picked up', x: 64, y: 10 },
  { icon: 'campaign', text: '3 sponsors live', x: 78, y: 32 },
  { icon: 'link', text: '1 link · 2,400 guests', x: 34, y: 24 },
]

const LINKS = [
  { title: 'Product', items: ['How it works', 'Industries', 'FAQ'] },
  { title: 'Organizers', items: ['Tournaments', 'Conferences', 'Weddings'] },
  { title: 'Company', items: ['About', 'Contact', 'Privacy'] },
]
</script>

<template>
  <footer class="oef" :class="`oef--${variant}`">
    <!-- brands: wordmark made of customer brands -->
    <template v-if="variant === 'brands'">
      <div class="oef__intro">
        <p class="oef__eyebrow">One page. Every brand.</p>
        <h2 class="oef__h2">Twenty organizers. Twenty looks. One booking platform.</h2>
        <q-btn unelevated no-caps rounded class="oef__btn oef__btn--light" icon-right="arrow_forward" label="Brand my page" @click="emit('start', {})" />
      </div>
      <p class="oef__mark oef__mark--brands" :style="mosaicStyle" aria-hidden="true">presto</p>
      <ul class="oef__logos" aria-label="Example organizers">
        <li v-for="e in examples" :key="e.id"><img :src="e.logo" :alt="e.name" :title="e.name" /></li>
      </ul>
    </template>

    <!-- cascade: same page, five brands -->
    <template v-else-if="variant === 'cascade'">
      <div class="oef__intro oef__intro--center">
        <p class="oef__eyebrow">Same page. Five brands.</p>
        <h2 class="oef__h2">Your booking page should look like you, not like a hotel portal.</h2>
      </div>
      <ul class="oef__cascade">
        <li v-for="(c, i) in cascade" :key="c.id" class="oef__card" :style="{ '--i': i, '--brand': c.primary }">
          <div class="oef__page">
            <div class="oef__page-nav"><img :src="c.logo" alt="" /><span /><span /></div>
            <brand-hero v-bind="c.hero" :heading-level="3" class="oef__page-hero" />
            <div class="oef__page-body"><span /><span /><span class="oef__page-btn" /></div>
          </div>
          <p class="oef__card-prop"><q-icon :name="c.prop.icon" size="16px" /> {{ c.prop.title }}</p>
          <p class="oef__card-label">{{ c.label }}</p>
        </li>
      </ul>
      <div class="oef__row-cta">
        <q-btn unelevated no-caps rounded class="oef__btn oef__btn--light" icon-right="arrow_forward" label="Brand my page" @click="emit('start', {})" />
      </div>
    </template>

    <!-- skyline: every hotel in town, one link -->
    <template v-else-if="variant === 'skyline'">
      <div class="oef__sky" :style="{ backgroundImage: `url(${ART['footer-skyline']})` }">
        <ul class="oef__chips" aria-label="Example activity (placeholder)">
          <li v-for="c in SKY_CHIPS" :key="c.text" :style="{ left: `${c.x}%`, top: `${c.y}%` }"><q-icon :name="c.icon" size="16px" /> {{ c.text }}</li>
        </ul>
        <div class="oef__sky-copy">
          <h2 class="oef__display">Every hotel in town.<br />One link. Your brand.</h2>
          <p>Live in seconds · Room block tracked · Sponsors pay back <span class="oef__ph">figures are placeholders</span></p>
          <q-btn unelevated no-caps rounded class="oef__btn oef__btn--light" icon-right="arrow_forward" label="Brand my page" @click="emit('start', {})" />
        </div>
      </div>
    </template>

    <!-- spectrum: the wordmark in every industry's color -->
    <template v-else-if="variant === 'spectrum'">
      <div class="oef__intro">
        <p class="oef__eyebrow">20+ industries · 20+ palettes</p>
        <h2 class="oef__h2">Whatever your colors, the page is yours.</h2>
      </div>
      <ul class="oef__props">
        <li v-for="p in VALUE_PROPS" :key="p.title"><q-icon :name="p.icon" size="22px" /><strong>{{ p.title }}</strong><span>{{ p.text }}</span></li>
      </ul>
      <p class="oef__mark oef__mark--spectrum" :style="spectrumStyle" aria-hidden="true">presto</p>
      <ul class="oef__swatches" aria-label="Brand colors of the example organizers">
        <li v-for="e in examples.slice(0, 12)" :key="e.id" :title="e.label"><span :style="{ background: e.vivid }" />{{ e.short }}</li>
      </ul>
    </template>

    <!-- Links (all variants) -->
    <div class="oef__top">
      <div>
        <img :src="epLogo" alt="EventPipe" class="oef__ep" />
        <p>Branded hotel booking pages for every group that travels.</p>
      </div>
      <nav aria-label="Footer">
        <div v-for="col in LINKS" :key="col.title"><strong>{{ col.title }}</strong><a v-for="l in col.items" :key="l" href="#top">{{ l }}</a></div>
      </nav>
    </div>
    <p v-if="variant === 'classic'" class="oef__mark" aria-hidden="true">presto</p>
    <p v-else class="oef__legal">© 2027 EventPipe · Concept — organizers, figures and brands shown are fictional.</p>
  </footer>
</template>

<style scoped>
.oef { --pad: max(24px, calc((100% - 1080px) / 2)); background: #0E1220; color: #fff; padding: 24px var(--pad) 0; overflow: hidden; font-family: var(--oe-head, 'Inter', sans-serif); }
.oef a { color: inherit; }
.oef__eyebrow { margin: 0 0 10px; font: 700 0.8125rem var(--oe-head, 'Inter', sans-serif); letter-spacing: 0.08em; text-transform: uppercase; color: #C4B5FD; }
.oef__h2 { margin: 0; font: 800 clamp(1.75rem, 3.4vw, 2.75rem)/1.08 var(--oe-head, 'Inter', sans-serif); letter-spacing: -0.025em; max-width: 22ch; text-wrap: balance; }
.oef__display { margin: 0; font: 800 clamp(2rem, 4.6vw, 3.75rem)/1.02 var(--oe-display, 'Montserrat', sans-serif); text-transform: uppercase; letter-spacing: -0.01em; text-wrap: balance; }
.oef__btn { font: 700 0.9375rem var(--oe-head, 'Inter', sans-serif); padding: 0 20px; min-height: 44px; }
.oef__btn--light { background: #fff; color: #0B1220; }
.oef__ph { display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 99px; background: #FFF4D6; color: #8A5A00; font: 700 10px/1.6 var(--oe-head, 'Inter', sans-serif); letter-spacing: 0.04em; text-transform: uppercase; vertical-align: middle; }

.oef__intro { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px 40px; padding: 64px 0 32px; }
.oef__intro--center { flex-direction: column; align-items: center; text-align: center; }
.oef__intro--center .oef__h2 { max-width: 26ch; }

/* Wordmark */
.oef__mark { margin: 0; font: 800 clamp(5rem, 22vw, 18rem)/0.8 var(--oe-head, 'Inter', sans-serif); letter-spacing: -0.06em; text-align: center; transform: translateY(12%); user-select: none; }
.oef__mark--brands, .oef__mark--spectrum { -webkit-background-clip: text; background-clip: text; color: transparent; transform: none; line-height: 0.86; padding-bottom: 0.04em; }
.oef__mark--brands { filter: brightness(1.45) saturate(1.25) contrast(1.05); -webkit-text-stroke: 1px rgb(255 255 255 / 0.28); }

/* Logos row */
.oef__logos { list-style: none; margin: 24px 0 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
.oef__logos li { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 12px; background: rgb(255 255 255 / 0.94); padding: 6px; }
.oef__logos img { max-width: 100%; max-height: 100%; object-fit: contain; }

/* Cascade */
.oef__cascade { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; align-items: start; }
.oef__card { transform: translateY(calc(var(--i) * 18px)) rotate(calc((var(--i) - 2) * 1.6deg)); transition: transform 200ms ease; }
.oef__card:hover { transform: translateY(calc(var(--i) * 18px - 8px)) rotate(0deg); }
.oef__page { border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 18px 40px rgb(0 0 0 / 0.45), 0 0 0 1px rgb(255 255 255 / 0.08); }
.oef__page-nav { display: flex; align-items: center; gap: 6px; padding: 7px 9px; border-bottom: 1px solid #EEF0F4; }
.oef__page-nav img { height: 18px; width: auto; max-width: 40px; object-fit: contain; margin-right: auto; }
.oef__page-nav span { width: 22px; height: 6px; border-radius: 3px; background: #E2E8F0; }
.oef__page-hero { pointer-events: none; }
.oef__page-hero :deep(.bh--card) { aspect-ratio: 4 / 3; }
.oef__page-hero :deep(.bh__content) { padding: 12px 10px; gap: 8px; }
.oef__page-hero :deep(.bh__logo) { height: 30px !important; }
.oef__page-hero :deep(.bh__headline) { font-size: 15px; line-height: 1.1; }
.oef__page-body { display: grid; gap: 6px; padding: 10px; }
.oef__page-body span { height: 6px; border-radius: 3px; background: #E2E8F0; }
.oef__page-body span:nth-child(2) { width: 70%; }
.oef__page-body .oef__page-btn { height: 16px; width: 54%; background: var(--brand); border-radius: 4px; margin-top: 2px; }
.oef__card-prop { margin: 14px 0 0; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.875rem; }
.oef__card-prop .q-icon { color: #C4B5FD; }
.oef__card-label { margin: 2px 0 0; font-size: 0.75rem; color: rgb(255 255 255 / 0.55); }
.oef__row-cta { display: flex; justify-content: center; padding: 72px 0 8px; }

/* Skyline */
.oef--skyline { padding: 0; }
.oef--skyline > .oef__top, .oef--skyline > .oef__legal { margin-inline: var(--pad); }
.oef__sky { position: relative; min-height: 560px; background-size: cover; background-position: center 60%; display: flex; align-items: flex-end; }
.oef__sky::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(14 18 32 / 0.35) 0%, rgb(14 18 32 / 0.1) 35%, rgb(14 18 32 / 0.85) 82%, #0E1220 100%); }
.oef__chips { list-style: none; margin: 0; padding: 0; position: absolute; inset: 0; }
.oef__chips li { position: absolute; display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; background: rgb(255 255 255 / 0.16); backdrop-filter: blur(10px); border: 1px solid rgb(255 255 255 / 0.28); font: 600 0.8125rem var(--oe-head, 'Inter', sans-serif); white-space: nowrap; box-shadow: 0 10px 24px rgb(0 0 0 / 0.25); }
.oef__chips .q-icon { color: #FDE68A; }
.oef__sky-copy { position: relative; z-index: 1; padding: 0 var(--pad) 48px; display: grid; gap: 14px; justify-items: start; }
.oef__sky-copy p { margin: 0; color: rgb(255 255 255 / 0.78); font-weight: 600; }

/* Spectrum */
.oef__props { list-style: none; margin: 0 0 40px; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px 32px; }
.oef__props li { display: grid; gap: 4px; align-content: start; }
.oef__props .q-icon { color: #C4B5FD; margin-bottom: 4px; }
.oef__props strong { font-size: 1rem; }
.oef__props span { color: rgb(255 255 255 / 0.62); font-size: 0.875rem; line-height: 1.45; }
.oef__swatches { list-style: none; margin: 18px 0 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 16px; font-size: 0.75rem; color: rgb(255 255 255 / 0.6); }
.oef__swatches li { display: inline-flex; align-items: center; gap: 6px; }
.oef__swatches span { width: 12px; height: 12px; border-radius: 3px; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.25); }

/* Links */
.oef__top { display: flex; justify-content: space-between; gap: 40px; padding: 40px 0; border-top: 1px solid rgb(255 255 255 / 0.12); flex-wrap: wrap; margin-top: 48px; }
.oef--classic .oef__top { margin-top: 0; }
.oef__top p { margin: 12px 0 0; color: rgb(255 255 255 / 0.62); font-size: 0.875rem; max-width: 30ch; }
.oef__ep { filter: brightness(0) invert(1); height: 24px; width: auto; display: block; }
.oef__top nav { display: flex; gap: 56px; flex-wrap: wrap; }
.oef__top nav div { display: grid; gap: 8px; align-content: start; font-size: 0.875rem; }
.oef__top nav strong { margin-bottom: 4px; }
.oef__top nav a { color: rgb(255 255 255 / 0.62); text-decoration: none; }
.oef__legal { margin: 0; padding: 0 0 28px; font-size: 0.75rem; color: rgb(255 255 255 / 0.45); }

@media (prefers-reduced-motion: reduce) { .oef__card { transition: none; } }

@media (max-width: 1080px) {
  .oef__cascade { grid-template-columns: repeat(3, 1fr); }
  .oef__cascade li:nth-child(n + 4) { display: none; }
  .oef__props { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .oef { --pad: 16px; }
  .oef__intro { padding: 48px 0 24px; }
  .oef__cascade { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .oef__cascade li:nth-child(n + 3) { display: none; }
  .oef__card { transform: translateY(calc(var(--i) * 14px)) rotate(calc((var(--i) - 0.5) * 2deg)); }
  .oef__sky { min-height: 520px; }
  .oef__chips li:nth-child(n + 3) { display: none; }
  .oef__chips li:nth-child(1) { left: 6% !important; top: 14% !important; }
  .oef__chips li:nth-child(2) { left: auto !important; right: 6%; top: 30% !important; }
  .oef__props { grid-template-columns: 1fr; gap: 18px; }
  .oef__logos li { width: 44px; height: 44px; }
  .oef__logos li:nth-child(n + 13) { display: none; }
  .oef__top nav { gap: 28px; }
  .oef__mark--brands, .oef__mark--spectrum { font-size: 27vw; }
}
</style>
