<script setup>
// HomeOptionB — alternative marketing homepage, "Reasons to Travel".
// Bold, poster-led direction: black hero with condensed type, a three-phone
// "one link" walkthrough, and the centerpiece — a receding 3D stack of every
// industry example (Higgsfield banners + logos), then a big-type industry
// list, a sponsorships band and a closing CTA. Static (no JS animation).
// Emits: start, sample(key), signin — same contract as MarketingLanding.
import epLogoWhite from '@lib/assets/eventpipe logos/eventpipe-logo-fff.svg'
import BrandHero from '../../brand/BrandHero.vue'
import IPhone from '../../devices/IPhone.vue'
import OptionBPhoneScreen from './OptionBPhoneScreen.vue'
import { OPTION_B_POSTERS, OPTION_B_GROUPS, posterById } from './OptionBData.js'

const emit = defineEmits(['start', 'sample', 'signin'])

const NAV = [
  { label: 'How it works', href: '#ob-how' },
  { label: 'Industries', href: '#ob-industries' },
  { label: 'Sponsorships', href: '#ob-sponsors' },
]

const heroPoster = posterById('music-festival')

const VALUES = [
  { title: 'Live in seconds', text: 'Your logo and colors on every page, ready to share.' },
  { title: 'One booking link', text: 'Every hotel, every rate, one branded URL.', featured: true },
  { title: 'Blocks, tracked', text: 'See pickup by hotel before the cutoff hits.' },
  { title: 'Sponsors built in', text: 'Sell display placements to offset the block.' },
]

const STEPS = [
  { n: 1, title: 'Brand it', text: 'Drop in your logo. Colors, fonts and banners follow.', mode: 'brand', poster: 'youth-sports' },
  { n: 2, title: 'Share the link', text: 'Guests pick a hotel at your negotiated event rate.', mode: 'hotels', poster: 'youth-sports' },
  { n: 3, title: 'Watch the block fill', text: 'Pickup by property, in real time, before cutoff.', mode: 'block', poster: 'youth-sports' },
]

// Receding stack, bottom-left → top-right; each card overlaps the receding
// edge of the one before it, so its left side (logo + name) stays visible.
const stack = OPTION_B_POSTERS.slice(0, 14)
const shortName = (name) => name.replace(/\s*\d{4}$/, '').split(' · ')[0]
const rows = OPTION_B_GROUPS.filter((g) => g.posters.length)
const flankLeft = OPTION_B_POSTERS.slice(0, 5)
const flankRight = OPTION_B_POSTERS.slice(-5)
</script>

<template>
  <div class="ob">
    <a href="#ob-main" class="ob__skip">Skip to content</a>

    <!-- 1 · Hero -->
    <header class="ob-hero">
      <nav class="ob-nav" aria-label="Primary">
        <a href="#ob-main" class="ob-nav__brand bs-focusable" aria-label="Presto Brand Studio by EventPipe — home">
          <img :src="epLogoWhite" alt="" class="ob-nav__logo" />
          <span class="ob-nav__product">Brand Studio</span>
        </a>
        <ul class="ob-nav__links">
          <li v-for="l in NAV" :key="l.href"><a :href="l.href" class="bs-focusable">{{ l.label }}</a></li>
        </ul>
        <div class="ob-nav__actions">
          <q-btn unelevated no-caps no-wrap class="ob-btn ob-btn--light ob-btn--sm" label="Create your booking page" @click="emit('start')" />
          <q-btn flat no-caps no-wrap class="ob-btn ob-btn--ghost ob-btn--sm ob-nav__signin" label="Sign in" @click="emit('signin')" />
        </div>
      </nav>

      <div class="ob-hero__inner">
        <div class="ob-hero__copy">
          <h1 class="ob-display ob-hero__title">Every event<br />needs a<br />home base</h1>
          <p class="ob-hero__sub">Branded hotel booking pages for tournaments, conferences, weddings and crews, live in seconds.</p>
          <div class="ob-hero__ctas">
            <q-btn unelevated no-caps class="ob-btn ob-btn--light" label="Create your booking page" @click="emit('start')" />
            <q-btn outline no-caps class="ob-btn ob-btn--outline" label="See examples" href="#ob-industries" />
          </div>
        </div>
        <figure class="ob-hero__art">
          <img :src="heroPoster.photo" alt="" class="ob-hero__photo" />
          <brand-hero v-bind="heroPoster.hero" size="card" :heading-level="2" class="ob-hero__poster" />
          <figcaption class="ob-chip ob-chip--block" aria-label="Example: room block 82% booked">
            <q-icon name="hotel" size="18px" /> Room block · <strong>82% booked</strong>
          </figcaption>
          <span class="ob-chip ob-chip--guest" aria-hidden="true"><q-icon name="check_circle" size="16px" /> 3 rooms booked just now</span>
        </figure>
      </div>
    </header>

    <main id="ob-main">
      <!-- 2 · Value strip -->
      <section class="ob-values" aria-label="Why Brand Studio">
        <ul>
          <li v-for="v in VALUES" :key="v.title" :class="{ 'is-featured': v.featured }">
            <strong>{{ v.title }}</strong>
            <span>{{ v.text }}</span>
          </li>
        </ul>
      </section>

      <!-- 3 · One link -->
      <section id="ob-how" class="ob-how" aria-labelledby="ob-how-title">
        <h2 id="ob-how-title" class="ob-display ob-h2">One link. Every guest booked.</h2>
        <p class="ob-lead">Everything your attendees need to find a room, in one branded page.</p>
        <ol class="ob-how__steps">
          <li v-for="s in STEPS" :key="s.n" class="ob-how__step">
            <div class="ob-how__phone">
              <i-phone :page-height="600" :label="`${s.title} — phone preview`" url="book.eventpipe.com">
                <option-b-phone-screen :mode="s.mode" :poster="s.poster" />
              </i-phone>
            </div>
            <h3 class="ob-how__title"><span>{{ s.n }}</span> {{ s.title }}</h3>
            <p>{{ s.text }}</p>
          </li>
        </ol>
        <div class="ob-center">
          <q-btn unelevated no-caps class="ob-btn ob-btn--dark" label="Create for free" @click="emit('start')" />
          <p class="ob-fine">Takes about 30 seconds</p>
        </div>
      </section>

      <!-- 4 · Receding 3D stack (all 20 on mobile's scroll row via the list below) -->
      <section class="ob-stack" aria-labelledby="ob-stack-title">
        <div class="ob-stack__head">
          <h2 id="ob-stack-title" class="ob-display ob-h2 ob-h2--left">20 industries.<br />One booking page.</h2>
          <p class="ob-lead ob-lead--left">For any group that travels, big or small.</p>
        </div>
        <ul class="ob-stack__deck">
          <li v-for="(c, i) in stack" :key="c.id" class="ob-stack__slot" :style="{ '--i': i, '--n': stack.length }">
            <button type="button" class="ob-stack__card bs-focusable" :aria-label="`Open the ${c.label} example: ${c.eventName}`" @click="emit('sample', c.sampleKey)">
              <img :src="c.photo" alt="" class="ob-stack__photo" />
              <img v-if="c.logo" :src="c.logo" alt="" class="ob-stack__logo" />
              <span class="ob-stack__name">{{ shortName(c.eventName) }}</span>
              <span class="ob-stack__tag"><q-icon :name="c.icon" size="13px" /> {{ c.label }}</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 5 · Big-type industry list -->
      <section id="ob-industries" class="ob-list" aria-labelledby="ob-list-title">
        <h2 id="ob-list-title" class="ob-display ob-h2">Built for every kind of group travel</h2>
        <p class="ob-lead">Pick an industry to open a ready-made booking page.</p>
        <ul class="ob-list__rows">
          <li v-for="g in rows" :key="g.id">
            <button type="button" class="ob-list__item bs-focusable" @click="emit('sample', g.posters[0].sampleKey)">{{ g.label }}</button>
          </li>
        </ul>
        <div class="ob-list__last">
          <div class="ob-list__flank">
            <button v-for="c in flankLeft" :key="c.id" type="button" class="ob-tile bs-focusable" :aria-label="`Open the ${c.label} example`" @click="emit('sample', c.sampleKey)">
              <img :src="c.photo" alt="" />
            </button>
          </div>
          <div class="ob-list__every">
            <button type="button" class="ob-list__item bs-focusable" @click="emit('start')">Everyone else</button>
            <a href="#ob-stack-title" class="ob-list__more">Explore all 20 <q-icon name="north_east" size="14px" /></a>
          </div>
          <div class="ob-list__flank">
            <button v-for="c in flankRight" :key="c.id" type="button" class="ob-tile bs-focusable" :aria-label="`Open the ${c.label} example`" @click="emit('sample', c.sampleKey)">
              <img :src="c.photo" alt="" />
            </button>
          </div>
        </div>
      </section>

      <!-- 6 · Sponsorships (dark) -->
      <section id="ob-sponsors" class="ob-dark" aria-labelledby="ob-sponsors-title">
        <h2 id="ob-sponsors-title" class="ob-display ob-dark__title">Let sponsors<br />cover the block</h2>
        <div class="ob-dark__phone">
          <i-phone :page-height="660" label="Sponsor ads on a booking page — phone preview" url="book.eventpipe.com">
            <option-b-phone-screen mode="ads" poster="youth-sports" />
          </i-phone>
        </div>
        <div class="ob-dark__copy">
          <p>Sell display placements on your booking page, from rail skyscrapers to billboards between results.</p>
          <p>Every unit is labelled “Sponsored” and links where your partner wants.</p>
          <q-btn unelevated no-caps class="ob-btn ob-btn--light" icon-right="arrow_forward" label="Create your booking page" @click="emit('start')" />
        </div>
      </section>

      <!-- 7 · Closing CTA -->
      <section class="ob-close" aria-labelledby="ob-close-title">
        <h2 id="ob-close-title" class="ob-display ob-close__title">Get the block booked</h2>
        <p class="ob-lead">Your event’s hotel booking page, branded in seconds.</p>
        <div class="ob-hero__ctas ob-center">
          <q-btn unelevated no-caps class="ob-btn ob-btn--dark" label="Create your booking page" @click="emit('start')" />
          <q-btn flat no-caps class="ob-btn ob-btn--text" label="Sign in" @click="emit('signin')" />
        </div>
      </section>
    </main>

    <footer class="ob-foot">
      <div class="ob-foot__inner">
        <div class="ob-foot__brand">
          <img :src="epLogoWhite" alt="EventPipe" class="ob-foot__logo" />
          <span>Presto Brand Studio</span>
        </div>
        <nav aria-label="Footer">
          <a v-for="l in NAV" :key="l.href" :href="l.href" class="bs-focusable">{{ l.label }}</a>
        </nav>
        <p class="ob-foot__fine">Demo experience · rates and availability are illustrative.</p>
      </div>
      <p class="ob-foot__word ob-display" aria-hidden="true">Brand Studio</p>
    </footer>
  </div>
</template>

<style scoped>
.ob {
  --ob-ink: #0B0F1A;
  --ob-navy: #01113E;
  --ob-canvas: #F6F6F6;
  --ob-display: 'Barlow Condensed', 'Oswald', 'PT Sans', sans-serif;
  background: var(--ob-canvas);
  color: var(--ob-ink);
  font-family: var(--bs-font);
  overflow-x: clip;
}
.ob__skip { position: absolute; left: 12px; top: -60px; z-index: 100; padding: 10px 14px; border-radius: 6px; background: #fff; color: var(--ob-ink); font-weight: 700; text-decoration: none; }
.ob__skip:focus { top: 12px; }

.ob-display { font-family: var(--ob-display); font-weight: 700; text-transform: uppercase; letter-spacing: -0.005em; line-height: 0.92; margin: 0; }
.ob-h2 { font-size: clamp(36px, 5.4vw, 72px); text-align: center; text-wrap: balance; }
.ob-h2--left { text-align: left; }
.ob-lead { margin: 10px auto 0; max-width: 56ch; text-align: center; font-size: clamp(15px, 1.3vw, 18px); color: #5B6475; }
.ob-lead--left { margin-left: 0; text-align: left; }
.ob-center { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ob-fine { margin: 0; font-size: 0.8125rem; color: #8A93A3; }

/* Buttons */
.q-btn.ob-btn { min-height: 46px; padding: 0 20px; border-radius: 8px; font-weight: 700; font-size: 0.9375rem; }
.q-btn.ob-btn--sm { min-height: 38px; padding: 0 16px; font-size: 0.875rem; border-radius: 999px; }
.q-btn.ob-btn--light { background: #fff; color: var(--ob-ink); }
.q-btn.ob-btn--dark { background: var(--ob-ink); color: #fff; }
.q-btn.ob-btn--outline { color: #fff; border-color: rgb(255 255 255 / 0.4); }
.q-btn.ob-btn--ghost { color: #fff; }
.q-btn.ob-btn--text { color: var(--ob-ink); }

/* ── 1 · Hero ─────────────────────────────────────────────────────────── */
.ob-hero { background: #000; color: #fff; padding: 20px clamp(16px, 4vw, 48px) clamp(56px, 8vw, 110px); }
.ob-nav {
  max-width: 980px; margin: 0 auto; display: flex; align-items: center; gap: 20px;
  padding: 8px 8px 8px 20px; border-radius: 999px; background: rgb(255 255 255 / 0.1);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.14); backdrop-filter: blur(12px);
}
.ob-nav__brand { display: inline-flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; flex: none; }
.ob-nav__logo { height: 20px; width: auto; display: block; }
.ob-nav__product { font-weight: 700; font-size: 0.9375rem; padding-left: 10px; border-left: 1px solid rgb(255 255 255 / 0.3); }
.ob-nav__links { list-style: none; margin: 0 auto; padding: 0; display: flex; gap: 22px; }
.ob-nav__links a { color: rgb(255 255 255 / 0.85); text-decoration: none; font-size: 0.875rem; }
.ob-nav__links a:hover { color: #fff; }
.ob-nav__actions { display: flex; gap: 6px; flex: none; }

.ob-hero__inner { max-width: 1180px; margin: clamp(40px, 6vw, 80px) auto 0; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: clamp(28px, 5vw, 72px); align-items: center; }
.ob-hero__title { font-size: clamp(56px, 9vw, 132px); }
.ob-hero__sub { margin: 20px 0 0; max-width: 40ch; font-size: clamp(16px, 1.5vw, 20px); line-height: 1.45; color: rgb(255 255 255 / 0.8); }
.ob-hero__ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.ob-hero__ctas.ob-center { flex-direction: row; justify-content: center; }
.ob-hero__art { position: relative; margin: 0; aspect-ratio: 4 / 5; max-height: 560px; justify-self: end; width: min(100%, 440px); }
.ob-hero__photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 78%; border-radius: 22px; filter: saturate(1.05); }
.ob-hero__poster { position: absolute; left: -10%; bottom: 14%; width: 74%; border-radius: 14px; overflow: hidden; box-shadow: 0 24px 60px rgb(0 0 0 / 0.55); transform: rotate(-4deg); }
.ob-hero__poster :deep(.bh--card) { aspect-ratio: 1; }
.ob-chip { position: absolute; display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 999px; background: #fff; color: var(--ob-ink); font-size: 0.875rem; box-shadow: 0 10px 30px rgb(0 0 0 / 0.35); white-space: nowrap; }
.ob-chip--block { top: 8%; right: -6%; }
.ob-chip--guest { bottom: 4%; right: 6%; background: rgb(20 24 34 / 0.85); color: #fff; backdrop-filter: blur(8px); font-size: 0.8125rem; }
.ob-chip--guest .q-icon { color: #4ADE80; }

/* ── 2 · Value strip ──────────────────────────────────────────────────── */
.ob-values { background: #fff; padding: 36px clamp(16px, 4vw, 48px); border-bottom: 1px solid #ECECEC; }
.ob-values ul { list-style: none; margin: 0 auto; padding: 0; max-width: 1180px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; align-items: center; }
.ob-values li { display: grid; gap: 4px; padding: 18px 20px; text-align: center; border-radius: 14px; }
.ob-values strong { font-family: var(--ob-display); text-transform: uppercase; font-size: 1.5rem; letter-spacing: 0.01em; line-height: 1; }
.ob-values span { font-size: 0.875rem; color: #6B7280; }
.ob-values li.is-featured { background: var(--ob-canvas); box-shadow: 0 1px 0 #E5E7EB, 0 12px 28px rgb(15 23 42 / 0.06); }

/* ── 3 · How (three phones) ───────────────────────────────────────────── */
.ob-how { padding: clamp(64px, 9vw, 120px) clamp(16px, 4vw, 48px); }
.ob-how__steps { list-style: none; margin: 48px auto 40px; padding: 0; max-width: 1080px; display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(20px, 4vw, 56px); }
.ob-how__step { display: grid; gap: 10px; justify-items: center; text-align: center; }
.ob-how__phone { width: min(100%, 270px); filter: drop-shadow(0 30px 40px rgb(15 23 42 / 0.16)); }
.ob-how__step:nth-child(2) .ob-how__phone { transform: translateY(-18px); }
.ob-how__title { margin: 10px 0 0; display: inline-flex; align-items: center; gap: 10px; font-family: var(--ob-display); text-transform: uppercase; font-size: 1.75rem; line-height: 1; }
.ob-how__title span { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--ob-ink); color: #fff; font: 700 0.875rem/1 var(--bs-font); }
.ob-how__step p { margin: 0; max-width: 30ch; color: #5B6475; font-size: 0.9375rem; }

/* ── 4 · Receding stack ───────────────────────────────────────────────── */
.ob-stack {
  --card: clamp(150px, 17vw, 260px);
  position: relative; overflow: hidden; container-type: inline-size;
  padding: clamp(56px, 7vw, 100px) 0 0;
  min-height: calc(var(--card) * 3.05);
}
.ob-stack__head { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 48px); pointer-events: none; }
.ob-stack__head > * { max-width: 56%; }
.ob-stack__deck {
  list-style: none; margin: 0; padding: 0;
  position: absolute; left: 0; right: 0; bottom: -4%; top: 0;
  perspective: 1600px; perspective-origin: 20% 10%;
}
.ob-stack__slot {
  --stepx: calc((100cqi - var(--card) * 0.4) / (var(--n) - 1));
  --stepy: calc(var(--card) * 0.125);
  position: absolute;
  left: calc(var(--i) * var(--stepx) - var(--card) * 0.08);
  bottom: calc(var(--i) * var(--stepy));
  width: var(--card); height: var(--card);
  z-index: calc(1 + var(--i));
  transform-style: preserve-3d;
}
.ob-stack__card {
  position: relative; display: block; width: 100%; height: 100%; padding: 0; border: 0; border-radius: 10px; overflow: hidden; cursor: pointer; background: #111; color: #fff; text-align: left;
  transform: rotateY(40deg) translateZ(calc(var(--i) * -10px));
  transform-origin: left center;
  box-shadow: -10px 14px 34px rgb(15 23 42 / 0.28);
  transition: transform 220ms ease, box-shadow 220ms ease;
}
.ob-stack__card:hover, .ob-stack__card:focus-visible { transform: rotateY(28deg) translateZ(calc(var(--i) * -10px + 30px)) translateY(-14px); box-shadow: -14px 24px 44px rgb(15 23 42 / 0.36); }
.ob-stack__card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, rgb(0 0 0 / 0.05) 30%, rgb(0 0 0 / 0.55)); }
.ob-stack__photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ob-stack__logo { position: absolute; z-index: 1; top: 9%; left: 8%; height: 26%; max-width: 40%; width: auto; object-fit: contain; filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.35)); }
.ob-stack__name { position: absolute; z-index: 1; left: 8%; right: 50%; bottom: 17%; font: 700 clamp(14px, 1.4vw, 21px)/0.95 var(--ob-display); text-transform: uppercase; text-wrap: balance; text-shadow: 0 2px 10px rgb(0 0 0 / 0.4); }
.ob-stack__tag { position: absolute; z-index: 1; left: 8%; bottom: 7%; display: inline-flex; align-items: center; gap: 4px; max-width: 46%; font-size: 10px; font-weight: 700; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── 5 · Big-type list ────────────────────────────────────────────────── */
.ob-list { background: #fff; padding: clamp(64px, 9vw, 120px) clamp(16px, 4vw, 48px); text-align: center; }
.ob-list__rows { list-style: none; margin: 40px 0 0; padding: 0; display: grid; gap: clamp(6px, 1.2vw, 14px); }
.ob-list__item { border: 0; background: none; padding: 4px 10px; cursor: pointer; font: 400 clamp(30px, 4.4vw, 60px)/1.1 var(--bs-font); letter-spacing: -0.02em; color: var(--ob-ink); transition: color 150ms ease; }
.ob-list__item:hover { color: var(--bs-accent); }
.ob-list__last { margin-top: clamp(6px, 1.2vw, 14px); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: clamp(10px, 2vw, 24px); }
.ob-list__flank { display: grid; grid-template-columns: repeat(5, 1fr); gap: clamp(6px, 0.8vw, 12px); }
.ob-list__every { display: grid; justify-items: center; }
.ob-list__more { display: inline-flex; align-items: center; gap: 4px; font-size: 0.875rem; color: #6B7280; text-decoration: none; }
.ob-tile { aspect-ratio: 1; padding: 0; border: 0; border-radius: 6px; overflow: hidden; cursor: pointer; background: #E5E7EB; }
.ob-tile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 200ms ease; }
.ob-tile:hover img { transform: scale(1.06); }

/* ── 6 · Dark sponsorships ────────────────────────────────────────────── */
.ob-dark { background: #111; color: #fff; padding: clamp(72px, 10vw, 140px) clamp(16px, 4vw, 48px); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: clamp(24px, 5vw, 72px); }
.ob-dark__title { font-size: clamp(40px, 5vw, 68px); justify-self: end; text-align: left; }
.ob-dark__phone { width: clamp(220px, 22vw, 300px); }
.ob-dark__copy { display: grid; gap: 14px; justify-items: start; max-width: 36ch; color: rgb(255 255 255 / 0.82); font-size: 1rem; line-height: 1.5; }
.ob-dark__copy p { margin: 0; }

/* ── 7 · Close + footer ───────────────────────────────────────────────── */
.ob-close { padding: clamp(72px, 10vw, 140px) clamp(16px, 4vw, 48px); text-align: center; }
.ob-close__title { font-size: clamp(52px, 9vw, 128px); }
.ob-close .ob-hero__ctas { margin-top: 28px; }
.ob-foot { margin: 0 clamp(8px, 1.5vw, 16px) clamp(8px, 1.5vw, 16px); border-radius: 18px; background: #111; color: rgb(255 255 255 / 0.8); overflow: hidden; }
.ob-foot__inner { max-width: 1180px; margin: 0 auto; padding: 40px clamp(20px, 4vw, 48px) 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; }
.ob-foot__brand { display: inline-flex; align-items: center; gap: 12px; font-weight: 700; color: #fff; }
.ob-foot__logo { height: 22px; width: auto; }
.ob-foot nav { display: flex; gap: 20px; flex-wrap: wrap; }
.ob-foot nav a { color: inherit; text-decoration: none; font-size: 0.875rem; }
.ob-foot__fine { margin: 0; flex-basis: 100%; font-size: 0.75rem; color: rgb(255 255 255 / 0.5); }
.ob-foot__word { margin: 12px 0 -0.12em; padding: 0 clamp(12px, 3vw, 40px); font-size: clamp(64px, 15.5vw, 230px); color: #fff; white-space: nowrap; text-align: center; }

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 1000px) {
  .ob-nav__links { display: none; }
  .ob-nav { justify-content: space-between; }
  .ob-values ul { grid-template-columns: repeat(2, 1fr); }
  .ob-dark { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .ob-dark__title { justify-self: center; text-align: center; }
  .ob-dark__copy { justify-items: center; }
}
@media (max-width: 760px) {
  .ob-hero__inner { grid-template-columns: 1fr; }
  .ob-hero__art { justify-self: center; width: min(86%, 380px); margin-top: 8px; aspect-ratio: 1; }
  .ob-chip--block { right: -4%; }
  .ob-how__steps { grid-template-columns: 1fr; gap: 44px; }
  .ob-how__step:nth-child(2) .ob-how__phone { transform: none; }
  .ob-how__phone { width: min(72%, 260px); }

  /* Stack → horizontal snap row of slightly-turned posters */
  .ob-stack { min-height: 0; padding-bottom: 48px; }
  .ob-stack__deck { position: static; display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 28px 16px 16px; perspective: 1200px; scrollbar-width: none; }
  .ob-stack__deck::-webkit-scrollbar { display: none; }
  .ob-stack__head > * { max-width: none; }
  .ob-stack__slot { position: relative; left: auto; bottom: auto; flex: none; width: 62vw; height: 62vw; max-width: 280px; max-height: 280px; z-index: auto; scroll-snap-align: center; }
  .ob-stack__card { transform: rotateY(16deg); transform-origin: center; }
  .ob-stack__name { right: 10%; font-size: 22px; }
  .ob-stack__tag { max-width: 84%; }
  .ob-stack__card:hover, .ob-stack__card:focus-visible { transform: rotateY(0) translateY(-6px); }

  .ob-list__last { grid-template-columns: 1fr; }
  .ob-list__flank { grid-template-columns: repeat(5, 1fr); }
  .ob-list__every { order: -1; }
}
@media (max-width: 520px) {
  .ob-nav { padding-left: 14px; }
  .ob-nav__product { display: none; }
  .ob-nav__signin { display: none; }
  .ob-values ul { grid-template-columns: 1fr; }
  .ob-chip--block { right: 0; top: 4%; }
  .ob-hero__poster { left: -6%; }
  .ob-foot__word { font-size: 17vw; }
}
@media (prefers-reduced-motion: reduce) {
  .ob-stack__card, .ob-tile img, .ob-list__item { transition: none; }
}
</style>
