<script setup>
// HomeOptionD — alternate marketing homepage, "Presto for Organizers".
// Airy white canvas, soft pastel glows, tilted poster collages, rounded media
// cards and small black CTAs. Static; concept imagery generated with Higgsfield
// (assets/marketing/option-d). Every org, person and quote is fictional.
// Emits: start, sample(key), signin.
import { computed } from 'vue'
import IPhone from '../../devices/IPhone.vue'
import OptionDPhoneScreen from './OptionDPhoneScreen.vue'
import { OPTION_D_ART as ART } from '../../../assets/marketing/option-d/index.js'
import { getImage } from '../../../assets/imagery/index.js'
import { sampleProject } from '../../../data/sampleEvents.js'
import { locationLabel } from '../../../models/event.js'
import epLogo from '@lib/assets/eventpipe logos/eventpipe-logo.svg'

const emit = defineEmits(['start', 'sample', 'signin'])

const NAV = [
  { label: 'Examples', href: '#od-organizers' },
  { label: 'Features', href: '#od-features' },
  { label: 'Sponsorships', href: '#od-ads' },
  { label: 'Get started', href: '#od-start' },
]

// Rotating hero word (CSS only; first word is the static / reduced-motion state).
const WORDS = ['Tournament', 'Conference', 'Reunion', 'Wedding', 'Job site', 'Festival']

// Hero collage — tilted poster tiles + org chips (all fictional).
const LEFT = [
  { art: 'poster-reunion', x: -2, y: 18, r: -14, s: 200, z: 2 },
  { art: 'poster-cup', x: 12, y: 46, r: 8, s: 230, z: 3 },
  { art: 'poster-crew', x: -6, y: 70, r: -6, s: 190, z: 1 },
]
const RIGHT = [
  { art: 'poster-summit', x: 10, y: 20, r: 12, s: 200, z: 2 },
  { art: 'poster-fest', x: 2, y: 48, r: -9, s: 230, z: 3 },
  { art: 'poster-wedding', x: 16, y: 74, r: 6, s: 190, z: 1 },
]
const CHIPS_LEFT = [
  { art: 'poster-reunion', name: 'Okafor Reunion', meta: '2 upcoming events', x: 6, y: 6 },
  { art: 'poster-cup', name: 'Prairie Cup', meta: '4 upcoming events', x: 24, y: 88 },
]
const CHIPS_RIGHT = [
  { art: 'poster-summit', name: 'Northstar Summit', meta: '3 upcoming events', x: 4, y: 6 },
  { art: 'poster-crew', name: 'Ironline Crew', meta: '12 job sites', x: 8, y: 88 },
]
const AVATARS = [
  { art: 'avatar-coach', side: 'left', x: 52, y: 22 },
  { art: 'avatar-host', side: 'right', x: 12, y: 50 },
]

const FACTS = [
  { icon: 'bolt', text: 'Live in seconds' },
  { icon: 'palette', text: 'Your logo, colors & fonts' },
  { icon: 'hotel', text: 'Room blocks tracked live' },
  { icon: 'campaign', text: 'Sponsor ads built in' },
  { icon: 'smartphone', text: 'Made for phones' },
]

// Illustrative quotes from fictional organizers (marked as such in the docs).
const VOICES = [
  { avatar: 'avatar-coach', badge: 'poster-cup', quote: '“Families booked in one tap. Our block sold out a month early.”', who: 'Dana · Prairie Cup' },
  { avatar: 'avatar-planner', badge: 'poster-summit', quote: '“It looks like our brand, not a hotel portal. Sponsors noticed.”', who: 'Ruth · Northstar Summit' },
  { avatar: 'avatar-host', badge: 'poster-reunion', quote: '“Three generations, one link. Nobody had to call me for the hotel.”', who: 'Grace · Okafor Reunion' },
]

const FEATURES = [
  {
    id: 'od-features', title: 'Your event and hotels, all in one place', cta: 'Get started',
    body: 'One branded link with your hotels, rates and room-block inventory, so every guest books in the right place.',
    scene: 'scene-lobby', phones: [{ variant: 'hotels', sample: 'heartland' }],
    float: { icon: 'hotel', title: 'Room block', lines: ['Fieldhouse Inn · 28/40 booked', 'Meridian Park · 34/60 booked'] },
  },
  {
    id: 'od-brand', title: 'Booking pages that match your brand', cta: 'Try it for free',
    body: 'Drop in your logo and colors. Presto themes the hero, the hotel directory and every detail page in seconds.',
    scene: 'scene-stadium', phones: [{ variant: 'brand', sample: 'wedding' }, { variant: 'brand', sample: 'fintech' }],
  },
  {
    id: 'od-updates', title: 'Share updates in real time', cta: 'Get started',
    body: 'Block extended? Shuttle moved? Send one update to everyone who booked, or nudge the guests who haven’t.',
    scene: 'scene-hall', phones: [{ variant: 'updates', sample: 'lakeshore' }],
    bubble: 'Shuttle leaves at 7:15! 🚌',
  },
  {
    id: 'od-ads', title: 'Sponsor ads that offset the block', cta: 'Try it for free',
    body: 'Sell display placements on your booking page. Sponsors get seen by every traveler, and you recover costs.',
    scene: 'scene-waterfront', phones: [{ variant: 'ads', sample: 'heartland', sponsorIndex: 1 }],
    float: { icon: 'payments', title: 'Sponsor revenue', lines: ['$4,800 this event', '3 sponsors · 12 placements'] },
  },
]

const PLANNING = [
  { id: 'team', title: 'Plan together', text: 'Invite co-organizers to edit pages and watch bookings, without sharing a login.' },
  { id: 'block', title: 'Track your room block', text: 'See rooms booked by hotel and night, so you can release or extend in time.' },
  { id: 'switch', title: 'Switch between events', text: 'Run every tournament, summit and reunion from one account.' },
]

// Organizer cards — existing Higgsfield vertical examples (open in the Studio).
const ORG_KEYS = ['golf', 'family-reunion', 'commencement']
const ORGS = computed(() =>
  ORG_KEYS.map((key) => {
    const p = sampleProject(key)
    return { key, name: p.event.name, place: locationLabel(p.event), img: getImage(`${key}-photo`)?.src || p.brandKit.imagery?.[0]?.src }
  }),
)

const posterStyle = (p, side = 'left') => ({ [side]: `${p.x}%`, top: `${p.y}%`, width: `${p.s}px`, transform: `translateY(-50%) rotate(${p.r}deg)`, zIndex: p.z })
const at = (c) => ({ left: `${c.x}%`, top: `${c.y}%` })
</script>

<template>
  <div class="od">
    <a href="#od-main" class="od__skip">Skip to content</a>

    <!-- Pill nav -->
    <header class="od__navwrap">
      <nav class="od__nav" aria-label="Primary">
        <a href="#top" class="od__brand bs-focusable" aria-label="Presto by EventPipe — home">
          <img :src="epLogo" alt="" class="od__brand-mark" />
          <span class="od__brand-name">presto</span>
        </a>
        <ul class="od__links">
          <li v-for="l in NAV" :key="l.href"><a :href="l.href" class="bs-focusable">{{ l.label }}</a></li>
        </ul>
        <div class="od__nav-cta">
          <button type="button" class="od__btn od__btn--dark od__btn--sm bs-focusable" @click="emit('start')">Create a page</button>
          <button type="button" class="od__btn od__btn--light od__btn--sm bs-focusable" @click="emit('signin')">Log in</button>
        </div>
      </nav>
    </header>

    <main id="od-main">
      <!-- Hero -->
      <section id="top" class="od__hero" aria-labelledby="od-title">
        <div class="od__glow od__glow--a" aria-hidden="true" />
        <div class="od__collage od__collage--left" aria-hidden="true">
          <img v-for="p in LEFT" :key="p.art" :src="ART[p.art]" alt="" class="od__poster" :style="posterStyle(p)" />
          <span v-for="c in CHIPS_LEFT" :key="c.name" class="od__chip" :style="at(c)">
            <img :src="ART[c.art]" alt="" /><span><strong>{{ c.name }} <em>Org</em></strong><small>{{ c.meta }}</small></span>
          </span>
          <img v-for="a in AVATARS.filter((a) => a.side === 'left')" :key="a.art" :src="ART[a.art]" alt="" class="od__avatar" :style="at(a)" />
        </div>
        <div class="od__collage od__collage--right" aria-hidden="true">
          <img v-for="p in RIGHT" :key="p.art" :src="ART[p.art]" alt="" class="od__poster" :style="posterStyle(p, 'right')" />
          <span v-for="c in CHIPS_RIGHT" :key="c.name" class="od__chip" :style="at(c)">
            <img :src="ART[c.art]" alt="" /><span><strong>{{ c.name }} <em>Org</em></strong><small>{{ c.meta }}</small></span>
          </span>
          <img v-for="a in AVATARS.filter((a) => a.side === 'right')" :key="a.art" :src="ART[a.art]" alt="" class="od__avatar" :style="at(a)" />
        </div>

        <div class="od__hero-copy">
          <p class="od__eyebrow">Presto for Organizers</p>
          <h1 id="od-title" class="od__h1">
            The best way to book rooms<br />
            for your <span class="od__rotor" aria-hidden="true"><span class="od__rotor-track"><span v-for="(w, i) in [...WORDS, WORDS[0]]" :key="i" class="od__word">{{ w }}</span></span></span><span class="bs-sr-only">event</span>
          </h1>
          <p class="od__lead">Branded hotel booking, room blocks and sponsor ads — one link for every guest. All for <strong>free</strong>.</p>
          <button type="button" class="od__btn od__btn--dark bs-focusable" @click="emit('start')">Try it out</button>
        </div>

        <div class="od__collage-mobile" aria-hidden="true">
          <img v-for="(p, i) in ['poster-cup', 'poster-summit', 'poster-reunion', 'poster-fest']" :key="p" :src="ART[p]" alt="" :style="{ transform: `rotate(${[-8, 6, -4, 9][i]}deg)` }" />
        </div>
      </section>

      <!-- Facts strip -->
      <section class="od__facts" aria-label="What you get">
        <ul>
          <li v-for="f in FACTS" :key="f.text"><q-icon :name="f.icon" size="18px" /> {{ f.text }}</li>
        </ul>
      </section>

      <!-- Voices -->
      <section class="od__section od__voices" aria-labelledby="od-voices">
        <div class="od__glow od__glow--b" aria-hidden="true" />
        <h2 id="od-voices" class="od__h2">A home for your events</h2>
        <ul class="od__voice-list">
          <li v-for="v in VOICES" :key="v.who" class="od__voice">
            <span class="od__voice-art" aria-hidden="true">
              <img :src="ART[v.avatar]" alt="" class="od__voice-avatar" />
              <img :src="ART[v.badge]" alt="" class="od__voice-badge" />
            </span>
            <blockquote>{{ v.quote }}</blockquote>
            <p class="od__voice-who">{{ v.who }}</p>
          </li>
        </ul>
      </section>

      <!-- Feature rows -->
      <section
        v-for="(f, i) in FEATURES"
        :id="f.id"
        :key="f.id"
        class="od__feature"
        :class="{ 'od__feature--flip': i % 2 === 1 }"
        :aria-labelledby="`${f.id}-t`"
      >
        <div class="od__feature-copy">
          <h2 :id="`${f.id}-t`" class="od__h3">{{ f.title }}</h2>
          <p>{{ f.body }}</p>
          <button type="button" class="od__btn od__btn--dark od__btn--sm bs-focusable" @click="emit('start')">{{ f.cta }}</button>
        </div>
        <div class="od__media" :style="{ backgroundImage: `url(${ART[f.scene]})` }">
          <div class="od__phones" :class="`od__phones--${f.phones.length}`">
            <div v-for="(ph, j) in f.phones" :key="j" class="od__phone">
              <i-phone :page-height="720" :url="`book.eventpipe.com/${ph.sample}`" :label="`${f.title} — phone preview`">
                <option-d-phone-screen :variant="ph.variant" :sample="ph.sample" :sponsor-index="ph.sponsorIndex || 0" />
              </i-phone>
            </div>
          </div>
          <div v-if="f.float" class="od__float" aria-hidden="true">
            <q-icon :name="f.float.icon" size="18px" />
            <span><strong>{{ f.float.title }}</strong><small v-for="l in f.float.lines" :key="l">{{ l }}</small></span>
          </div>
          <div v-if="f.bubble" class="od__bubble" aria-hidden="true">{{ f.bubble }}</div>
        </div>
      </section>

      <!-- Planning -->
      <section class="od__section od__planning" aria-labelledby="od-plan">
        <div class="od__glow od__glow--c" aria-hidden="true" />
        <h2 id="od-plan" class="od__h2">Take the stress out of planning</h2>
        <ul class="od__plan-list">
          <li v-for="p in PLANNING" :key="p.id" class="od__plan">
            <div class="od__plan-art" :class="`od__plan-art--${p.id}`" aria-hidden="true">
              <template v-if="p.id === 'team'">
                <img :src="ART['poster-cup']" alt="" class="od__plan-tile" />
                <span class="od__plan-faces"><img :src="ART['avatar-coach']" alt="" /><img :src="ART['avatar-planner']" alt="" /><img :src="ART['avatar-host']" alt="" /><b>+2</b></span>
              </template>
              <template v-else-if="p.id === 'block'">
                <span class="od__meter"><strong>186 / 240</strong><small>rooms booked</small><span><i style="width: 77%" /></span></span>
              </template>
              <template v-else>
                <span class="od__switch"><img :src="ART['poster-summit']" alt="" /><q-icon name="swap_horiz" size="22px" /><img :src="ART['poster-wedding']" alt="" /></span>
              </template>
            </div>
            <div class="od__plan-body">
              <h3>{{ p.title }}</h3>
              <p>{{ p.text }}</p>
            </div>
          </li>
        </ul>
        <button type="button" class="od__btn od__btn--dark od__btn--sm bs-focusable" @click="emit('start')">Get started, it’s free</button>
      </section>

      <!-- Organizers -->
      <section id="od-organizers" class="od__section od__orgs" aria-labelledby="od-orgs">
        <h2 id="od-orgs" class="od__h2">Join <em>thousands</em> of organizers booking rooms with Presto</h2>
        <ul class="od__org-list">
          <li v-for="o in ORGS" :key="o.key">
            <button type="button" class="od__org bs-focusable" :aria-label="`Open the ${o.name} example`" @click="emit('sample', o.key)">
              <img :src="o.img" alt="" />
              <span class="od__org-text"><strong>{{ o.name }}</strong><small>{{ o.place }}</small></span>
            </button>
          </li>
        </ul>
      </section>

      <!-- Get started -->
      <section id="od-start" class="od__section od__start" aria-labelledby="od-start-t">
        <div class="od__glow od__glow--d" aria-hidden="true" />
        <h2 id="od-start-t" class="od__h2">Get started for free</h2>
        <p class="od__sub">Build your first booking page in a few clicks. Choose how you want to start:</p>
        <div class="od__start-ctas">
          <button type="button" class="od__btn od__btn--soft bs-focusable" @click="emit('sample', 'heartland')">See an example</button>
          <button type="button" class="od__btn od__btn--dark bs-focusable" @click="emit('start')">Create a booking page</button>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="od__footer">
      <div class="od__footer-cols">
        <div><strong>Product</strong><a href="#od-features">Features</a><a href="#od-ads">Sponsorships</a><a href="#od-organizers">Examples</a></div>
        <div><strong>Company</strong><a href="#top">About EventPipe</a><a href="#top">Careers</a></div>
        <div><strong>Support</strong><a href="#top">Help center</a><a href="#top">Contact</a></div>
        <div><strong>Legal</strong><a href="#top">Terms</a><a href="#top">Privacy</a></div>
      </div>
      <p class="od__wordmark" aria-hidden="true">presto</p>
      <p class="od__copy">Presto by EventPipe · Demo content — all events, organizers and sponsors are fictional.</p>
    </footer>
  </div>
</template>

<style scoped>
.od {
  --od-ink: #0B0B0F;
  --od-soft: #5B6170;
  --od-line: #ECEDF1;
  --od-head: 'Poppins', 'Inter', sans-serif;
  --od-body: 'Inter', 'PT Sans', sans-serif;
  position: relative;
  overflow-x: clip;
  background: #fff;
  color: var(--od-ink);
  font-family: var(--od-body);
  min-height: 100vh;
}
.od__skip { position: absolute; left: 12px; top: -60px; z-index: 100; padding: 10px 14px; border-radius: 6px; background: var(--od-ink); color: #fff; font-weight: 700; text-decoration: none; }
.od__skip:focus { top: 12px; }

/* Buttons */
.od__btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 0 20px; border-radius: 8px; border: 0; font: 600 0.9375rem var(--od-body); cursor: pointer; transition: transform 120ms ease, box-shadow 120ms ease; }
.od__btn--sm { min-height: 38px; padding: 0 16px; font-size: 0.875rem; }
.od__btn--dark { background: var(--od-ink); color: #fff; }
.od__btn--dark:hover { box-shadow: 0 6px 18px rgb(11 11 15 / 0.22); transform: translateY(-1px); }
.od__btn--light { background: #fff; color: var(--od-ink); box-shadow: inset 0 0 0 1px var(--od-line); }
.od__btn--soft { background: #E9F7F2; color: var(--od-ink); }

/* Nav */
.od__navwrap { position: sticky; top: 12px; z-index: 50; display: flex; justify-content: center; padding: 12px 16px 0; }
.od__nav { display: flex; align-items: center; gap: 24px; padding: 8px 8px 8px 18px; border-radius: 999px; background: rgb(255 255 255 / 0.86); backdrop-filter: blur(14px); box-shadow: 0 0 0 1px var(--od-line), 0 8px 30px rgb(15 23 42 / 0.07); max-width: 100%; }
.od__brand { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: var(--od-ink); }
.od__brand-mark { height: 22px; width: auto; }
.od__brand-name { font: 700 1.125rem var(--od-head); letter-spacing: -0.02em; }
.od__links { display: flex; gap: 22px; margin: 0; padding: 0; list-style: none; }
.od__links a { color: var(--od-ink); text-decoration: none; font-size: 0.875rem; font-weight: 500; }
.od__links a:hover { color: #7C3AED; }
.od__nav-cta { display: flex; gap: 6px; }
.od__nav-cta .od__btn { border-radius: 999px; }

/* Glows */
.od__glow { position: absolute; z-index: 0; pointer-events: none; filter: blur(60px); opacity: 0.7; border-radius: 50%; }
.od__glow--a { width: 520px; height: 360px; left: 50%; top: 40%; transform: translate(-50%, -50%); background: radial-gradient(#F3E8FF, transparent 70%); }
.od__glow--b { width: 900px; height: 260px; left: 50%; top: 0; transform: translateX(-50%); background: radial-gradient(#E0F2FE, transparent 70%); }
.od__glow--c { width: 900px; height: 420px; left: 50%; top: 50%; transform: translate(-50%, -50%); background: radial-gradient(#DCFCE7, transparent 70%); }
.od__glow--d { width: 760px; height: 320px; left: 50%; top: 50%; transform: translate(-50%, -50%); background: radial-gradient(#D1FAE5, transparent 70%); }

/* Hero */
.od__hero { position: relative; min-height: 560px; display: grid; place-items: center; padding: 72px 16px 56px; max-width: 1600px; margin: 0 auto; }
.od__hero-copy { position: relative; z-index: 5; max-width: 620px; text-align: center; display: grid; justify-items: center; gap: 18px; }
.od__eyebrow { margin: 0; font-size: 0.9375rem; color: var(--od-soft); font-weight: 500; }
.od__h1 { margin: 0; font: 700 clamp(2rem, 3.6vw, 3.25rem) / 1.1 var(--od-head); letter-spacing: -0.03em; text-wrap: balance; }
.od__rotor { display: inline-block; height: 1.1em; overflow: hidden; vertical-align: bottom; }
.od__rotor-track { display: flex; flex-direction: column; animation: od-rotor 15s cubic-bezier(0.7, 0, 0.3, 1) infinite; }
.od__word { display: block; height: 1.1em; background: linear-gradient(90deg, #F97316, #EC4899 55%, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; padding-right: 2px; }
@keyframes od-rotor {
  0%, 13% { transform: translateY(0); }
  16.6%, 29.6% { transform: translateY(-1.1em); }
  33.3%, 46.3% { transform: translateY(-2.2em); }
  50%, 63% { transform: translateY(-3.3em); }
  66.6%, 79.6% { transform: translateY(-4.4em); }
  83.3%, 96.3% { transform: translateY(-5.5em); }
  100% { transform: translateY(-6.6em); }
}
.od__lead { margin: 0; max-width: 440px; font-size: 1.0625rem; line-height: 1.5; color: var(--od-soft); }
.od__lead strong { color: var(--od-ink); }

.od__collage { position: absolute; top: 0; bottom: 0; width: min(30vw, 440px); z-index: 1; }
.od__collage--left { left: -24px; }
.od__collage--right { right: -24px; }
.od__poster { position: absolute; aspect-ratio: 1; object-fit: cover; border-radius: 18px; box-shadow: 0 18px 40px rgb(15 23 42 / 0.16); }
.od__chip { position: absolute; z-index: 6; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; border-radius: 12px; background: rgb(255 255 255 / 0.92); backdrop-filter: blur(8px); box-shadow: 0 8px 24px rgb(15 23 42 / 0.12); white-space: nowrap; }
.od__chip img { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; }
.od__chip strong { display: block; font-size: 0.8125rem; }
.od__chip em { font-style: normal; font-size: 0.625rem; font-weight: 700; padding: 1px 6px; border-radius: 99px; background: var(--od-ink); color: #fff; margin-left: 4px; vertical-align: 1px; }
.od__chip small { display: block; font-size: 0.75rem; color: var(--od-soft); }
.od__avatar { position: absolute; z-index: 7; width: 74px; height: 74px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 8px 20px rgb(15 23 42 / 0.16); }
.od__collage-mobile { display: none; }

/* Facts */
.od__facts { position: relative; z-index: 2; border-block: 1px solid var(--od-line); background: #FAFAFB; }
.od__facts ul { list-style: none; margin: 0 auto; padding: 22px 24px; max-width: 1180px; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px 40px; }
.od__facts li { display: inline-flex; align-items: center; gap: 8px; font: 500 0.9375rem var(--od-head); color: #8A8F9C; letter-spacing: -0.01em; }

/* Sections */
.od__section { position: relative; max-width: 1180px; margin: 0 auto; padding: 96px 24px; text-align: center; }
.od__section > *:not(.od__glow) { position: relative; z-index: 1; }
.od__h2 { margin: 0 0 40px; font: 600 clamp(1.625rem, 2.6vw, 2.25rem) / 1.15 var(--od-head); letter-spacing: -0.025em; text-wrap: balance; }
.od__h2 em { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 600; }
.od__sub { margin: -24px 0 24px; color: var(--od-soft); }

/* Voices */
.od__voice-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.od__voice { display: grid; justify-items: center; gap: 14px; }
.od__voice-art { position: relative; width: 170px; height: 104px; }
.od__voice-avatar { position: absolute; left: 6px; top: 0; width: 100px; height: 100px; border-radius: 50%; object-fit: cover; z-index: 2; box-shadow: 0 0 0 4px #fff; }
.od__voice-badge { position: absolute; right: 0; top: -6px; width: 92px; height: 92px; border-radius: 12px; object-fit: cover; transform: rotate(8deg); box-shadow: 0 10px 24px rgb(15 23 42 / 0.14); }
.od__voice blockquote { margin: 0; font: 600 1.0625rem / 1.35 var(--od-head); letter-spacing: -0.01em; max-width: 300px; }
.od__voice-who { margin: 0; color: var(--od-soft); font-size: 0.875rem; }

/* Feature rows */
.od__feature { max-width: 1040px; margin: 0 auto; padding: 56px 24px; display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 56px; align-items: center; }
.od__feature--flip { grid-template-columns: 1.15fr 0.85fr; }
.od__feature--flip .od__feature-copy { order: 2; }
.od__feature-copy { display: grid; gap: 14px; justify-items: start; }
.od__h3 { margin: 0; font: 600 clamp(1.5rem, 2.2vw, 2rem) / 1.15 var(--od-head); letter-spacing: -0.025em; text-wrap: balance; }
.od__feature-copy p { margin: 0 0 6px; font-size: 1.0625rem; line-height: 1.55; color: var(--od-soft); max-width: 420px; }
.od__media { position: relative; aspect-ratio: 16 / 11; border-radius: 20px; background-size: cover; background-position: center; overflow: hidden; box-shadow: 0 1px 0 rgb(15 23 42 / 0.04); }
.od__phones { position: absolute; inset: 7% 0 -38%; display: flex; justify-content: center; gap: 4%; }
.od__phone { width: 38%; filter: drop-shadow(0 24px 30px rgb(15 23 42 / 0.28)); }
.od__phones--2 .od__phone { width: 34%; }
.od__phones--2 .od__phone:first-child { transform: rotate(-4deg) translateY(4%); }
.od__phones--2 .od__phone:last-child { transform: rotate(4deg); }
.od__float { position: absolute; right: 6%; top: 18%; display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 14px; background: rgb(255 255 255 / 0.94); backdrop-filter: blur(8px); box-shadow: 0 14px 32px rgb(15 23 42 / 0.18); max-width: 46%; text-align: left; }
.od__float small { white-space: nowrap; }
.od__float .q-icon { color: #7C3AED; margin-top: 2px; }
.od__float strong { display: block; font-size: 0.875rem; }
.od__float small { display: block; font-size: 0.75rem; color: var(--od-soft); line-height: 1.45; }
.od__bubble { position: absolute; left: 50%; bottom: 14%; transform: translateX(-20%); padding: 12px 18px; border-radius: 20px 20px 20px 6px; background: #fff; box-shadow: 0 14px 32px rgb(15 23 42 / 0.2); font: 600 1.125rem var(--od-head); letter-spacing: -0.01em; white-space: nowrap; }

/* Planning */
.od__plan-list { list-style: none; margin: 0 0 36px; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; text-align: left; }
.od__plan { border-radius: 16px; background: #fff; overflow: hidden; box-shadow: 0 0 0 1px var(--od-line), 0 10px 30px rgb(15 23 42 / 0.06); }
.od__plan-art { height: 156px; display: grid; place-items: center; background: linear-gradient(160deg, #F4F4F6, #E9EAEE); position: relative; }
.od__plan-art--block { background: linear-gradient(160deg, #F5F3FF, #EDE9FE); }
.od__plan-art--switch { background: linear-gradient(160deg, #ECFDF5, #E0F2FE); }
.od__plan-tile { width: 74px; height: 74px; border-radius: 12px; object-fit: cover; transform: rotate(-6deg); margin-bottom: 44px; box-shadow: 0 8px 20px rgb(15 23 42 / 0.14); }
.od__plan-faces { position: absolute; bottom: 20px; display: flex; align-items: center; }
.od__plan-faces img, .od__plan-faces b { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; margin-left: -8px; }
.od__plan-faces b { display: grid; place-items: center; background: var(--od-ink); color: #fff; font-size: 0.75rem; }
.od__meter { display: grid; gap: 4px; width: 64%; padding: 14px 16px; border-radius: 14px; background: #fff; box-shadow: 0 10px 24px rgb(91 33 182 / 0.12); }
.od__meter strong { font: 700 1.25rem var(--od-head); }
.od__meter small { color: var(--od-soft); font-size: 0.75rem; }
.od__meter > span { height: 8px; border-radius: 99px; background: #EDE9FE; overflow: hidden; margin-top: 4px; }
.od__meter i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8B5CF6, #EC4899); }
.od__switch { display: flex; align-items: center; gap: 12px; color: var(--od-soft); }
.od__switch img { width: 70px; height: 70px; border-radius: 12px; object-fit: cover; box-shadow: 0 8px 20px rgb(15 23 42 / 0.14); }
.od__switch img:first-child { transform: rotate(-6deg); }
.od__switch img:last-child { transform: rotate(6deg); }
.od__plan-body { padding: 16px 18px 20px; }
.od__plan-body h3 { margin: 0 0 6px; font: 600 1.0625rem var(--od-head); letter-spacing: -0.01em; }
.od__plan-body p { margin: 0; font-size: 0.9375rem; line-height: 1.5; color: var(--od-soft); }

/* Organizers */
.od__org-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.od__org { position: relative; display: block; width: 100%; padding: 0; border: 0; border-radius: 16px; overflow: hidden; aspect-ratio: 4 / 3; cursor: pointer; background: #111; }
.od__org img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 300ms ease; }
.od__org:hover img { transform: scale(1.04); }
.od__org::after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 45%, rgb(0 0 0 / 0.65)); }
.od__org-text { position: absolute; left: 16px; right: 16px; bottom: 14px; z-index: 1; display: grid; gap: 2px; text-align: left; color: #fff; }
.od__org-text strong { font: 700 1.125rem / 1.2 var(--od-head); letter-spacing: -0.02em; }
.od__org-text small { font-size: 0.8125rem; opacity: 0.85; }

/* Start */
.od__start { padding-bottom: 72px; }
.od__start .od__h2 { margin-bottom: 32px; }
.od__start-ctas { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

/* Footer */
.od__footer { margin: 0 16px 16px; padding: 48px clamp(24px, 5vw, 64px) 24px; border-radius: 24px; background: #111113; color: #fff; overflow: hidden; }
.od__footer-cols { display: grid; grid-template-columns: repeat(4, minmax(0, 160px)); gap: 24px; }
.od__footer-cols div { display: grid; gap: 8px; align-content: start; }
.od__footer-cols strong { font-size: 0.875rem; margin-bottom: 4px; }
.od__footer-cols a { color: rgb(255 255 255 / 0.72); text-decoration: none; font-size: 0.875rem; }
.od__footer-cols a:hover { color: #fff; }
.od__wordmark { margin: 48px 0 0; font: 700 clamp(5rem, 22vw, 20rem) / 0.8 var(--od-head); letter-spacing: -0.06em; text-align: center; color: #fff; user-select: none; }
.od__copy { margin: 28px 0 0; font-size: 0.75rem; color: rgb(255 255 255 / 0.5); text-align: center; }

/* Responsive */
@media (max-width: 1100px) {
  .od__collage { width: 26vw; }
  .od__chip { display: none; }
}
@media (max-width: 860px) {
  .od__links { display: none; }
  .od__collage { display: none; }
  .od__collage-mobile { display: flex; justify-content: center; gap: 0; margin-bottom: 8px; order: -1; }
  .od__collage-mobile img { width: 92px; height: 92px; border-radius: 14px; object-fit: cover; margin: 0 -6px; box-shadow: 0 10px 22px rgb(15 23 42 / 0.16); }
  .od__hero { min-height: 0; padding: 40px 16px 44px; display: flex; flex-direction: column; align-items: center; gap: 22px; }
  .od__feature, .od__feature--flip { grid-template-columns: 1fr; gap: 24px; padding: 36px 16px; }
  .od__feature--flip .od__feature-copy { order: 0; }
  .od__voice-list, .od__plan-list, .od__org-list { grid-template-columns: 1fr; }
  .od__section { padding: 64px 16px; }
  .od__footer-cols { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .od__nav { gap: 10px; padding-left: 14px; }
  .od__brand-mark { display: none; }
  .od__nav-cta .od__btn--light { display: none; }
  .od__phone { width: 52%; }
  .od__phones--2 .od__phone { width: 44%; }
  .od__float { display: none; }
  .od__bubble { font-size: 0.9375rem; transform: translateX(-30%); }
}
@media (prefers-reduced-motion: reduce) {
  .od__rotor-track { animation: none; }
  .od__btn, .od__org img { transition: none; }
}
</style>
