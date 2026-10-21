<script setup>
// HomeOptionE — alternate marketing homepage, "Group Booking" (structure modeled
// on a group-travel marketplace landing page, pitched as Presto's branded
// booking page): airy sunlit tile mosaic around a "paste your website" hero,
// fictional-organizer trust strip, illustrative voices, three steps, a
// placeholder stat grid, industry cards, a closing band and FAQ. Static.
// Mosaic generated with Higgsfield (assets/marketing/option-e). All organizers,
// figures and quotes are fictional placeholders.
// Steps are an accordion with a per-step mock (OptionESteps); the footer is
// switchable between concepts (OptionEFooter `footer` prop).
// Emits: start({ websiteUrl? }), sample(key), signin.
import { ref } from 'vue'
import BrandHero from '../../brand/BrandHero.vue'
import OptionESteps from './OptionESteps.vue'
import OptionEFooter from './OptionEFooter.vue'
import { OPTION_E_ART as ART } from '../../../assets/marketing/option-e/index.js'
import { sampleProject } from '../../../data/sampleEvents.js'
import { VERTICAL_EXAMPLES } from '../../../data/verticals/index.js'
import { heroProps } from '../../preview/previewModel.js'
import epLogo from '@lib/assets/eventpipe logos/eventpipe-logo.svg'

defineProps({
  // Footer concept: classic | brands | cascade | skyline | spectrum (OptionEFooter)
  // Footer concept (OptionEFooter variants); B · cascade was chosen.
  footer: { type: String, default: 'cascade' },
})
const emit = defineEmits(['start', 'sample', 'signin'])

const NAV = [
  { label: 'How it works', href: '#oe-how' },
  { label: 'Industries', href: '#oe-industries' },
  { label: 'FAQ', href: '#oe-faq' },
]

// Hero mosaic: tiles framing the headline. x/y = % of the hero, w = px,
// r = tilt, blur = depth (far tiles are small + soft), ratio = tile aspect.
const MOSAIC = [
  { art: 'tile-team', x: 3, y: 14, w: 210, r: -6, ratio: '3 / 4' },
  { art: 'tile-room', x: 18, y: 6, w: 130, r: 4, blur: 2, ratio: '4 / 3' },
  { art: 'tile-wedding', x: 9, y: 58, w: 250, r: 5, ratio: '4 / 3' },
  { art: 'tile-breakfast', x: 1, y: 86, w: 120, r: -8, blur: 2.5, ratio: '4 / 3' },
  { art: 'tile-festival', x: 25, y: 82, w: 110, r: 7, blur: 3, ratio: '3 / 4' },
  { art: 'tile-conference', x: 79, y: 8, w: 230, r: 6, ratio: '4 / 3' },
  { art: 'tile-nurses', x: 70, y: 4, w: 96, r: -5, blur: 3, ratio: '3 / 4' },
  { art: 'tile-crew', x: 82, y: 44, w: 200, r: -5, ratio: '3 / 4' },
  { art: 'tile-reunion', x: 70, y: 80, w: 150, r: 6, blur: 1.5, ratio: '3 / 4' },
  { art: 'tile-golf', x: 89, y: 84, w: 120, r: -4, blur: 2.5, ratio: '4 / 3' },
]
const MOBILE_TILES = ['tile-team', 'tile-wedding', 'tile-crew', 'tile-conference']

const BULLETS = ['Free to start', 'Your logo & colors on every page', 'Live in seconds']

const website = ref('')
const submitSite = () => emit('start', { websiteUrl: website.value.trim() })

// Example result under the hero field.
const demo = sampleProject('heartland')
const demoHero = heroProps(demo, { size: 'card' })

// Fictional organizers (vertical catalog examples) for the trust strip + cards.
const orgs = VERTICAL_EXAMPLES.map((v) => {
  const p = sampleProject(v.sampleKey)
  return { id: v.id, key: v.sampleKey, name: p.event.name, logo: p.brandKit.logo?.src, photo: p.brandKit.imagery?.find((a) => a.kind !== 'logo' && a.kind !== 'pattern')?.src, label: v.label, pitch: v.pitch }
}).filter((o) => o.logo)
const byId = Object.fromEntries(orgs.map((o) => [o.id, o]))

// Illustrative voices — org logos only, no people photos.
const VOICES = [
  { org: 'youth-sports', quote: 'Families found the team hotels in one tap, and it looked like our tournament, not a hotel portal.', who: 'Tournament director' },
  { org: 'weddings', quote: 'Our guests got one beautiful link with our colors. Nobody texted me asking where to stay.', who: 'Couple, wedding weekend' },
  { org: 'construction', quote: 'Crews book near the job site from their phones. I can see who is still unbooked before Monday.', who: 'Field operations lead' },
]

// Placeholder figures (marked in the docs and in the footnote).
const STATS = [
  { value: 'Seconds', label: 'To a branded page', sub: 'Paste a URL, get your booking page', icon: 'bolt', tone: 'amber' },
  { value: '3 pages', label: 'Branded automatically', sub: 'Homepage hero, hotel directory, hotel details', icon: 'web', tone: 'violet' },
  { value: '$0', label: 'To start', sub: 'Build and preview before you commit', icon: 'savings', tone: 'mint' },
  { value: '20+', label: 'Industries ready', sub: 'From tournaments to travel nurses', icon: 'diversity_3', tone: 'sky' },
  { value: '1 link', label: 'For every guest', sub: 'Text it, email it, print it on the QR', icon: 'link', tone: 'rose' },
  { value: 'Live', label: 'Room-block tracking', sub: 'Pickup by hotel, before the cutoff', icon: 'insights', tone: 'navy' },
]

// Industry cards: the airy Higgsfield tiles + each example's own logo.
const INDUSTRY_CARDS = [
  { id: 'youth-sports', tile: 'tile-team', pill: 'Sports teams', copy: 'Team blocks near the fields, in your tournament colors.' },
  { id: 'weddings', tile: 'tile-wedding', pill: 'Weddings', copy: 'One elegant page for every guest, near your venue.' },
  { id: 'construction', tile: 'tile-crew', pill: 'Construction crews', copy: 'Long-stay crew lodging near the job site, booked from a phone.' },
  { id: 'corporate', tile: 'tile-conference', pill: 'Conferences & offsites', copy: 'Attendee hotels with your company or conference brand.' },
  { id: 'family-reunion', tile: 'tile-reunion', pill: 'Family reunions', copy: 'Three generations, one link, rooms near the gathering.' },
]
const INDUSTRIES = INDUSTRY_CARDS.filter((c) => byId[c.id]).map((c) => ({ ...byId[c.id], ...c, photo: ART[c.tile] }))

const FAQ = [
  { q: 'What is a Presto booking page?', a: 'A hotel booking site for your event, in your brand: your logo, colors and banners on the homepage, the hotel directory and every hotel details page. Guests book your negotiated rates from one link.' },
  { q: 'How does “paste your website” work?', a: 'We read your public site for your logo, brand colors and fonts, then theme every page and generate matching banners. You can change anything in the Studio afterward.' },
  { q: 'Is it free to start?', a: 'Yes. Build, customize and preview your booking page before you commit to anything.' },
  { q: 'Can I track my room block?', a: 'Yes. See pickup by hotel in real time and nudge guests before the block releases.' },
  { q: 'Can sponsors advertise on my page?', a: 'Yes. Add sponsor display ads on the homepage, hotel directory and details pages to help offset costs.' },
  { q: 'Which events is this for?', a: 'Any group that travels: tournaments, conferences, weddings, reunions, job-site crews, hospital families, festivals and more.' },
]

// In-page anchors (#how, #top, footer links…) scroll instead of rewriting
// location.hash — the prototype app is hash-routed (#/home, #/studio…).
function onAnchor(e) {
  const a = e.target.closest?.('a[href^="#"]')
  if (!a) return
  e.preventDefault()
  const id = a.getAttribute('href').slice(1)
  const el = id && id !== 'top' ? document.getElementById(id) : null
  const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  if (el) {
    el.scrollIntoView({ behavior, block: 'start' })
    if (id === 'oe-main') { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }) }
  } else window.scrollTo({ top: 0, behavior })
}
</script>

<template>
  <div class="oe" @click="onAnchor">
    <a href="#oe-main" class="oe__skip">Skip to content</a>

    <header class="oe__nav">
      <a class="oe__brand" href="#top" aria-label="EventPipe Brand Studio home">
        <img :src="epLogo" alt="EventPipe" class="oe__ep" /><span>Brand Studio</span>
      </a>
      <nav class="oe__links" aria-label="Primary">
        <a v-for="n in NAV" :key="n.href" :href="n.href">{{ n.label }}</a>
      </nav>
      <div class="oe__nav-cta">
        <button type="button" class="oe__signin bs-focusable" @click="emit('signin')">Sign in</button>
        <q-btn unelevated no-caps rounded class="oe__btn oe__btn--dark" label="Create your booking page" @click="emit('start', {})" />
      </div>
    </header>

    <main id="oe-main">
      <!-- 1 · Hero: airy mosaic + paste-your-website -->
      <section class="oe__hero" aria-labelledby="oe-title">
        <div class="oe__mosaic" aria-hidden="true">
          <span
            v-for="t in MOSAIC" :key="t.art" class="oe__tile"
            :style="{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}px`, aspectRatio: t.ratio, transform: `translate(-0%, -0%) rotate(${t.r}deg)`, filter: t.blur ? `blur(${t.blur}px)` : undefined, zIndex: t.blur ? 0 : 1 }"
          ><img :src="ART[t.art]" alt="" loading="lazy" /></span>
        </div>
        <div class="oe__mtiles" aria-hidden="true">
          <img v-for="id in MOBILE_TILES" :key="id" :src="ART[id]" alt="" />
        </div>

        <div class="oe__hero-inner">
          <p class="oe__rating"><span class="oe__stars" aria-hidden="true">★★★★★</span> 4.8 from 1,200+ organizers <span class="oe__ph">placeholder</span></p>
          <h1 id="oe-title" class="oe__title">Your group’s hotel booking page. <span>In your brand.</span></h1>
          <ul class="oe__bullets">
            <li v-for="b in BULLETS" :key="b"><q-icon name="check" size="16px" /> {{ b }}</li>
          </ul>

          <form class="oe__field" role="search" aria-label="Brand my booking page" @submit.prevent="submitSite">
            <label class="oe__field-label" for="oe-site">
              <span>Your event website</span>
              <input id="oe-site" v-model="website" type="text" inputmode="url" spellcheck="false" autocapitalize="off" placeholder="yourevent.com" autocomplete="url" aria-label="Your event website" />
            </label>
            <q-btn type="submit" unelevated no-caps rounded class="oe__btn oe__btn--dark oe__btn--go" icon-right="arrow_forward" label="Brand my page" />
          </form>
          <button type="button" class="oe__scratch bs-focusable" @click="emit('start', {})">or start from scratch</button>

          <figure class="oe__result">
            <figcaption><q-icon name="auto_awesome" size="14px" /> What you’ll get · <strong>book.eventpipe.com/heartland</strong></figcaption>
            <brand-hero v-bind="demoHero" :heading-level="2" class="oe__result-hero" />
          </figure>
        </div>
      </section>

      <!-- 2 · Fictional organizer strip -->
      <section class="oe__trust" aria-label="Example organizers">
        <p>Example organizers branding their booking pages</p>
        <div class="oe__logos">
          <img v-for="o in orgs" :key="o.id" :src="o.logo" :alt="o.name" :title="o.name" />
        </div>
      </section>

      <!-- 3 · Illustrative voices -->
      <section class="oe__voices" aria-labelledby="oe-voices">
        <h2 id="oe-voices" class="oe__h3">Over 12,000 booking pages branded <span class="oe__ph">placeholder</span></h2>
        <ul class="oe__voice-list">
          <li v-for="v in VOICES" :key="v.org" class="oe__voice">
            <img :src="byId[v.org]?.logo" alt="" class="oe__voice-logo" />
            <div>
              <p class="oe__voice-q">“{{ v.quote }}”</p>
              <p class="oe__voice-who">{{ v.who }} · {{ byId[v.org]?.name }} <span class="oe__ph">illustrative</span></p>
            </div>
          </li>
        </ul>
      </section>

      <!-- 4 · Steps (accordion + per-step mock) -->
      <option-e-steps @start="emit('start', $event)" />

      <!-- 5 · Stats -->
      <section class="oe__stats" aria-labelledby="oe-stats-title">
        <h2 id="oe-stats-title" class="oe__display"><span>Branded in seconds.</span> Booked from one link.</h2>
        <ul class="oe__stat-grid">
          <li v-for="s in STATS" :key="s.label" class="oe__stat">
            <div>
              <p class="oe__stat-v">{{ s.value }}</p>
              <p class="oe__stat-l">{{ s.label }}</p>
              <p class="oe__stat-s">{{ s.sub }}</p>
            </div>
            <span class="oe__stat-icon" :class="`is-${s.tone}`" aria-hidden="true"><q-icon :name="s.icon" size="28px" /></span>
          </li>
        </ul>
        <p class="oe__foot-note">Figures shown are placeholders for this concept.</p>
      </section>

      <!-- 6 · Industries -->
      <section id="oe-industries" class="oe__ind" aria-labelledby="oe-ind-title">
        <div class="oe__ind-intro">
          <h2 id="oe-ind-title" class="oe__h2">From tournaments to weddings, every group gets its own page</h2>
          <q-btn unelevated no-caps rounded class="oe__btn oe__btn--dark" icon-right="arrow_forward" label="Get started" @click="emit('start', {})" />
        </div>
        <button v-for="o in INDUSTRIES" :key="o.id" type="button" class="oe__ind-card bs-focusable" :aria-label="`Open the ${o.label} example`" @click="emit('sample', o.key)">
          <img :src="o.photo" alt="" class="oe__ind-photo" loading="lazy" />
          <img :src="o.logo" alt="" class="oe__ind-logo" />
          <span class="oe__ind-desc">{{ o.copy }}</span>
          <span class="oe__ind-pill">{{ o.pill }}</span>
        </button>
      </section>

      <!-- 7 · Closing band -->
      <section class="oe__band" aria-labelledby="oe-band-title">
        <h2 id="oe-band-title">Booking group travel,<br />in your brand.</h2>
        <q-btn unelevated no-caps rounded class="oe__btn oe__btn--light" icon-right="arrow_forward" label="Brand my page" @click="emit('start', {})" />
      </section>

      <!-- FAQ -->
      <section id="oe-faq" class="oe__faq" aria-labelledby="oe-faq-title">
        <h2 id="oe-faq-title" class="oe__h2">Frequently asked questions</h2>
        <details v-for="(f, i) in FAQ" :key="f.q" class="oe__qa">
          <summary><span class="oe__qa-n">{{ String(i + 1).padStart(2, '0') }}</span> {{ f.q }} <q-icon name="expand_more" size="20px" class="oe__qa-chev" /></summary>
          <p>{{ f.a }}</p>
        </details>
      </section>
    </main>

    <option-e-footer :variant="footer" @start="emit('start', $event)" />
  </div>
</template>

<style scoped>
.oe {
  --oe-ink: #0B1220;
  --oe-soft: #5B6475;
  --oe-line: #E8EAF0;
  --oe-navy: #01113E;
  --oe-accent: var(--bs-accent, #7C3AED);
  /* Same type + buttons as the Brand Studio workflow (styles/studio.scss). */
  --oe-head: var(--bs-font, 'Inter', sans-serif);
  --oe-display: var(--bs-font, 'Inter', sans-serif);
  background: #fff;
  color: var(--oe-ink);
  font-family: var(--oe-head);
  overflow-x: clip;
}
.oe a { color: inherit; }
/* In-page anchors land below the sticky nav. */
.oe [id^='oe-'] { scroll-margin-top: 84px; }
.oe__skip { position: absolute; left: 12px; top: -60px; z-index: 100; padding: 10px 14px; border-radius: 6px; background: var(--oe-ink); color: #fff; font-weight: 700; text-decoration: none; }
.oe__skip:focus { top: 12px; }
.oe__ph { display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 99px; background: #FFF4D6; color: #8A5A00; font: 700 10px/1.6 var(--oe-head); letter-spacing: 0.04em; text-transform: uppercase; vertical-align: middle; }

/* Buttons */
.oe__btn { font: 700 0.9375rem var(--oe-head); padding: 0 20px; min-height: 44px; }
.oe__btn--dark { background: var(--bs-brand, #01113E); color: #fff; }
.oe__btn--dark:hover { background: var(--bs-brand-hover, #0B1F5C); }
.oe__btn--light { background: #fff; color: var(--oe-ink); }

/* Nav */
.oe__nav { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 24px; padding: 14px clamp(16px, 4vw, 48px); background: rgb(255 255 255 / 0.86); backdrop-filter: blur(12px); border-bottom: 1px solid var(--oe-line); }
.oe__brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 700; }
.oe__brand span { padding-left: 10px; border-left: 1px solid var(--oe-line); }
.oe__ep { height: 22px; width: auto; display: block; }
.oe__links { display: flex; gap: 22px; margin-left: 8px; }
.oe__links a { text-decoration: none; font-size: 0.9375rem; color: var(--oe-soft); }
.oe__links a:hover { color: var(--oe-ink); }
.oe__nav-cta { margin-left: auto; display: flex; align-items: center; gap: 14px; }
.oe__signin { border: 0; background: none; font: 700 0.9375rem var(--oe-head); color: var(--oe-ink); cursor: pointer; padding: 6px; }

/* Hero */
.oe__hero { position: relative; min-height: 760px; display: grid; place-items: center; padding: 72px 16px 64px; background: radial-gradient(1200px 520px at 50% 40%, #fff 40%, #F6F8FC 100%); overflow: hidden; }
.oe__mosaic { position: absolute; inset: 0; pointer-events: none; }
.oe__tile { position: absolute; display: block; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 40px rgb(15 23 42 / 0.14); }
.oe__tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.oe__mtiles { display: none; }
.oe__hero-inner { position: relative; z-index: 2; width: min(640px, 100%); display: grid; justify-items: center; text-align: center; gap: 16px; }
.oe__rating { margin: 0; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 99px; background: #fff; box-shadow: 0 2px 10px rgb(15 23 42 / 0.08); font-size: 0.8125rem; font-weight: 600; }
.oe__stars { color: #F5B301; letter-spacing: 1px; }
.oe__title { margin: 0; font: 800 clamp(2.25rem, 4.6vw, 3.75rem)/1.04 var(--oe-head); letter-spacing: -0.03em; text-wrap: balance; }
.oe__title span { color: var(--oe-accent); }
.oe__bullets { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 18px; font-size: 0.875rem; font-weight: 600; color: var(--oe-soft); }
.oe__bullets li { display: inline-flex; align-items: center; gap: 4px; }
.oe__bullets .q-icon { color: #16A34A; }
.oe__field { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 22px; border-radius: 999px; background: #fff; box-shadow: 0 10px 30px rgb(15 23 42 / 0.12), 0 0 0 1px var(--oe-line); margin-top: 6px; }
.oe__field-label { flex: 1; min-width: 0; display: grid; text-align: left; gap: 1px; cursor: text; }
.oe__field-label span { font-size: 0.75rem; font-weight: 700; }
.oe__field-label input { border: 0; outline: 0; padding: 0; font: 400 1rem var(--oe-head); color: var(--oe-ink); background: transparent; width: 100%; }
.oe__field:focus-within { box-shadow: 0 10px 30px rgb(15 23 42 / 0.12), 0 0 0 2px var(--oe-accent); }
.oe__btn--go { flex: none; min-height: 48px; }
.oe__scratch { border: 0; background: none; padding: 2px 4px; font: 600 0.8125rem var(--oe-head); color: var(--oe-soft); text-decoration: underline; cursor: pointer; }
.oe__result { margin: 10px 0 0; width: min(460px, 100%); padding: 10px; border-radius: 18px; background: #fff; box-shadow: 0 12px 34px rgb(15 23 42 / 0.12); display: grid; gap: 8px; }
.oe__result figcaption { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--oe-soft); text-align: left; }
.oe__result figcaption .q-icon { color: var(--oe-accent); }
.oe__result-hero { border-radius: 10px; overflow: hidden; pointer-events: none; }

/* Trust strip */
.oe__trust { padding: 40px 0 28px; text-align: center; border-top: 1px solid var(--oe-line); }
.oe__trust p { margin: 0 0 18px; font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--oe-soft); }
.oe__logos { display: flex; gap: 44px; align-items: center; justify-content: center; flex-wrap: nowrap; overflow: hidden; padding: 0 24px; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.oe__logos img { height: 44px; width: auto; max-width: 110px; object-fit: contain; flex: none; filter: grayscale(1) contrast(1.1); opacity: 0.72; }

/* Voices */
.oe__voices { max-width: 1080px; margin: 0 auto; padding: 24px 24px 72px; }
.oe__h3 { margin: 0 0 16px; font: 700 1.125rem var(--oe-head); }
.oe__voice-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.oe__voice { display: flex; gap: 12px; padding: 14px; border-radius: 14px; background: #F4F6FB; }
.oe__voice-logo { width: 54px; height: 54px; flex: none; object-fit: contain; background: #fff; border-radius: 10px; padding: 6px; }
.oe__voice-q { margin: 0; font-size: 0.9375rem; font-weight: 600; line-height: 1.35; }
.oe__voice-who { margin: 6px 0 0; font-size: 0.75rem; color: var(--oe-soft); }

/* Section headings */
.oe__h2 { margin: 0; font: 800 clamp(1.75rem, 3vw, 2.5rem)/1.1 var(--oe-head); letter-spacing: -0.025em; text-wrap: balance; }

/* Stats */
.oe__stats { max-width: 1080px; margin: 0 auto; padding: 24px 24px 96px; }
.oe__display { margin: 0 0 32px; text-align: center; font: 800 clamp(1.75rem, 3.6vw, 2.75rem)/1.05 var(--oe-display); text-transform: uppercase; letter-spacing: -0.01em; text-wrap: balance; }
.oe__display span { color: var(--oe-accent); }
.oe__stat-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.oe__stat { display: flex; justify-content: space-between; gap: 16px; padding: 24px 24px; border: 1px solid var(--oe-line); border-radius: 18px; background: #fff; }
.oe__stat-v { margin: 0 0 14px; font: 800 1.5rem var(--oe-display); text-transform: uppercase; letter-spacing: -0.01em; }
.oe__stat-l { margin: 0; font-weight: 700; }
.oe__stat-s { margin: 2px 0 0; font-size: 0.875rem; color: var(--oe-soft); }
.oe__stat-icon { align-self: center; flex: none; width: 64px; height: 64px; display: grid; place-items: center; border-radius: 18px; }
.is-amber { background: #FFF4D6; color: #B7791F; }
.is-violet { background: #F1EBFF; color: #6D28D9; }
.is-mint { background: #DCFCE7; color: #15803D; }
.is-sky { background: #E0F2FE; color: #0369A1; }
.is-rose { background: #FFE4E6; color: #BE123C; }
.is-navy { background: #E6E9F2; color: var(--oe-navy); }
.oe__foot-note { margin: 12px 0 0; text-align: center; font-size: 0.75rem; color: var(--oe-soft); }

/* Industries */
.oe__ind { max-width: 1180px; margin: 0 auto; padding: 0 24px 72px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.oe__ind-intro { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; gap: 24px; padding: 8px 8px 8px 0; }
.oe__ind-card { position: relative; aspect-ratio: 4 / 3.4; border: 0; padding: 0; border-radius: 18px; overflow: hidden; cursor: pointer; text-align: left; background: #ddd; }
.oe__ind-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 300ms ease; }
.oe__ind-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgb(0 0 0 / 0.55)); }
.oe__ind-logo { position: absolute; top: 14px; left: 14px; z-index: 1; width: 52px; height: 52px; object-fit: contain; background: rgb(255 255 255 / 0.92); border-radius: 12px; padding: 6px; }
.oe__ind-desc { position: absolute; left: 16px; right: 16px; bottom: 56px; z-index: 1; color: #fff; font-size: 0.875rem; line-height: 1.35; opacity: 0; transform: translateY(6px); transition: opacity 200ms ease, transform 200ms ease; }
.oe__ind-pill { position: absolute; left: 14px; bottom: 14px; z-index: 1; padding: 8px 14px; border-radius: 99px; background: #fff; font: 700 0.875rem var(--oe-head); color: var(--oe-ink); }
.oe__ind-card:hover .oe__ind-photo, .oe__ind-card:focus-visible .oe__ind-photo { transform: scale(1.04); }
.oe__ind-card:hover .oe__ind-desc, .oe__ind-card:focus-visible .oe__ind-desc { opacity: 1; transform: none; }

/* Band */
.oe__band { max-width: 1132px; margin: 0 auto 96px; padding: 36px 44px; border-radius: 20px; background: linear-gradient(120deg, var(--oe-accent), #A855F7); color: #fff; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.oe__band h2 { margin: 0; font: 800 clamp(1.5rem, 3vw, 2.25rem)/1.05 var(--oe-display); text-transform: uppercase; }

/* FAQ */
.oe__faq { background: #0E1220; color: #fff; padding: 88px max(24px, calc((100% - 1080px) / 2)) 72px; }
.oe__faq .oe__h2 { margin-bottom: 28px; }
.oe__qa { border-top: 1px solid rgb(255 255 255 / 0.14); }
.oe__qa:last-of-type { border-bottom: 1px solid rgb(255 255 255 / 0.14); }
.oe__qa summary { list-style: none; display: flex; align-items: center; gap: 12px; padding: 18px 0; font-weight: 700; cursor: pointer; }
.oe__qa summary::-webkit-details-marker { display: none; }
.oe__qa-n { color: #C4B5FD; font-variant-numeric: tabular-nums; }
.oe__qa-chev { margin-left: auto; transition: transform 150ms ease; opacity: 0.7; }
.oe__qa[open] .oe__qa-chev { transform: rotate(180deg); }
.oe__qa p { margin: 0 0 18px 34px; color: rgb(255 255 255 / 0.72); line-height: 1.55; max-width: 72ch; }

@media (prefers-reduced-motion: reduce) {
  .oe__ind-photo, .oe__ind-desc, .oe__qa-chev { transition: none; }
}

/* Tablet */
@media (max-width: 1080px) {
  .oe__links { display: none; }
  .oe__tile { opacity: 0.85; }
  .oe__ind { grid-template-columns: repeat(2, 1fr); }
  .oe__ind-intro { grid-column: 1 / -1; }
}

/* Phones */
@media (max-width: 700px) {
  .oe__nav { gap: 10px; padding: 10px 16px; }
  .oe__brand span { display: none; }
  .oe__nav-cta :deep(.oe__btn) { display: none; }
  .oe__mosaic { display: none; }
  .oe__mtiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; width: 100%; margin-bottom: 20px; }
  .oe__mtiles img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 18px rgb(15 23 42 / 0.12); }
  .oe__mtiles img:nth-child(odd) { transform: translateY(10px) rotate(-3deg); }
  .oe__mtiles img:nth-child(even) { transform: rotate(3deg); }
  .oe__hero { min-height: 0; display: block; padding: 24px 16px 40px; }
  .oe__rating { font-size: 0.75rem; gap: 6px; padding: 5px 10px; white-space: nowrap; }
  .oe__rating .oe__ph { margin-left: 0; }
  .oe__hero-inner { margin: 0 auto; }
  .oe__field { flex-direction: column; align-items: stretch; border-radius: 18px; padding: 12px; }
  .oe__field-label { padding: 2px 6px 8px; }
  .oe__btn--go { width: 100%; }
  .oe__logos { justify-content: flex-start; gap: 28px; }
  .oe__logos img { height: 36px; }
  .oe__voice-list { grid-template-columns: 1fr; }
  .oe__voices, .oe__stats { padding-bottom: 56px; }
  .oe__stat-grid { grid-template-columns: 1fr; }
  .oe__stat { padding: 18px; }
  .oe__ind { grid-template-columns: 1fr; padding: 0 16px 56px; }
  .oe__band { margin: 0 16px 64px; padding: 28px 22px; flex-direction: column; align-items: flex-start; }
  .oe__faq { padding: 64px 16px 48px; }
}
</style>
