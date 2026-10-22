<script setup>
// HomeOptionC — alternate marketing homepage, "Templates" direction: a soft,
// pastel template-gallery page (layout reference: a consumer invite-template
// landing page). Static. Every poster is a real Presto banner rendered from
// the industry examples (data/verticals) with Higgsfield-generated imagery.
// Emits: start (Create free booking page), sample(key), signin.
import { computed } from 'vue'
import epLogo from '@lib/assets/eventpipe logos/eventpipe-logo.svg'
import BrandHero from '../../brand/BrandHero.vue'
import IPhone from '../../devices/IPhone.vue'
import { VERTICAL_EXAMPLES } from '../../../data/verticals/index.js'
import { sampleProject } from '../../../data/sampleEvents.js'
import { formatDateRange, locationLabel } from '../../../models/event.js'
import { getImage } from '../../../assets/imagery/index.js'

const emit = defineEmits(['start', 'sample', 'signin'])

// Short theme names for the 3×3 grid (vertical id → label).
const THEMES = [
  ['youth-sports', 'Youth Sports'],
  ['weddings', 'Wedding'],
  ['conference', 'Summit'],
  ['esports', 'Esports'],
  ['golf', 'Charity Golf'],
  ['music-festival', 'Festival'],
  ['construction', 'Crew Housing'],
  ['endurance', 'Race Weekend'],
  ['faith', 'Retreat'],
]
const CIRCLES = [
  ['youth-sports', 'Youth sports', 'booking pages'],
  ['conference', 'Conference', 'booking pages'],
  ['weddings', 'Wedding', 'room blocks'],
  ['utility-crews', 'Crew & job-site', 'lodging'],
  ['hospital-families', 'Hospital family', 'stays'],
  ['music-festival', 'Festival', 'hotel pages'],
]

const byId = Object.fromEntries(VERTICAL_EXAMPLES.map((v) => [v.id, v]))

function example(id) {
  const v = byId[id]
  const p = sampleProject(v.sampleKey)
  const photo = getImage(p.brandKit.heroImageId) || p.brandKit.imagery?.find((a) => a.kind !== 'logo' && a.kind !== 'pattern') || null
  return {
    id,
    key: v.sampleKey,
    label: v.label,
    photo: photo?.src || '',
    hero: {
      brandKit: p.brandKit,
      headline: p.event.name,
      tagline: p.pages.landing.hero.tagline,
      dates: formatDateRange(p.event.startDate, p.event.endDate),
      location: locationLabel(p.event),
    },
  }
}

const themes = computed(() => THEMES.map(([id, name]) => ({ ...example(id), name })))
const circles = computed(() => CIRCLES.map(([id, l1, l2]) => {
  const e = example(id)
  return { ...e, l1, l2, logo: e.hero.brandKit.logoOnDark?.src || e.hero.brandKit.logo?.src || '' }
}))
const phoneA = computed(() => example('youth-sports'))
const phoneB = computed(() => example('weddings'))
const heroBg = getImage('music-festival-photo2')?.src || getImage('heartland-photo')?.src

// Collage band — a warm, varied mix of the generated event photography.
const COLLAGE_IDS = [
  'wedding-photo2', 'music-festival-photo', 'camps-photo', 'golf-photo2', 'family-reunion-photo', 'heartland-photo2', 'destinations-photo', 'corporate-photo',
  'commencement-photo', 'lakeshore-photo2', 'faith-photo', 'esports-photo', 'film-production-photo2', 'trade-show-photo', 'hospital-families-photo', 'funeral-photo2',
]
const collage = COLLAGE_IDS.map(getImage).filter(Boolean)

const STATEMENTS = [
  ['Live in seconds', 'Your logo, colors and hotels on one page'],
  ['One shareable link', 'Text it, email it, print it on the QR'],
  ['Real-time room block', 'See every booking as it lands'],
  ['Your brand, every page', 'Homepage, hotel directory, hotel details'],
]

const STEPS = [
  { n: 1, title: 'Pick a theme', text: 'Start from an industry template or your own logo. Colors, fonts and banner art follow your brand automatically.' },
  { n: 2, title: 'Add your event details', text: 'Dates, venue and the hotels in your block. Add sponsors, shuttle notes or a group code if you need them.' },
  { n: 3, title: 'Share and track', text: 'Send one link to every attendee. Watch rooms book in real time and nudge everyone before the block releases.' },
]

const COMPARE = {
  generic: [
    ['warn', 'Someone else’s branding'],
    ['x', 'One hotel at a time'],
    ['x', 'No room-block view'],
    ['x', 'No mobile booking flow'],
    ['warn', 'Attendees book off-block'],
    ['x', 'No sponsor placements'],
    ['x', 'Dated look'],
  ],
  presto: [
    ['ok', 'Your logo, colors and fonts'],
    ['ok', 'Every hotel in one search'],
    ['ok', 'Live room-block tracking'],
    ['ok', 'Built for phones first'],
    ['ok', 'Group rates, kept on-block'],
    ['ok', 'Sponsor ads that pay back'],
    ['ok', 'Modern, on-brand pages'],
  ],
  sheet: [
    ['warn', 'Copy-paste booking links'],
    ['warn', 'Manual hotel lists'],
    ['x', 'Counts updated by hand'],
    ['x', 'Not mobile friendly'],
    ['warn', 'Easy to miss the deadline'],
    ['x', 'No sponsor placements'],
    ['x', 'Inbox chaos'],
  ],
}
const ICON = { ok: 'check_circle', x: 'cancel', warn: 'error' }

const FAQ = [
  ['Is a Presto booking page really free to start?', 'Yes. Pick a template, add your event and preview a fully branded booking page without signing up or entering a card.'],
  ['Can I change the page after I share it?', 'Any time. Update hotels, dates or copy and the same link stays live — attendees always see the latest version.'],
  ['How do attendees book?', 'They open your link on any phone or laptop, search the hotels in your block and book at your group rate. No app to download.'],
  ['Does it work for more than sports?', 'Built for every kind of group travel: tournaments, conferences, weddings, crews, hospital families, festivals and more.'],
  ['Can I use my own logo and imagery?', 'Upload your logo and we build the palette, fonts and banners around it. Or start from one of the generated industry themes.'],
  ['What about sponsors?', 'Add sponsor display ads to the homepage, hotel directory and hotel details pages to offset your event costs.'],
]
</script>

<template>
  <div id="top" class="oc">
    <!-- Floating pill nav -->
    <header class="oc__navwrap">
      <nav class="oc__nav" aria-label="Primary">
        <a href="#top" class="oc__brand bs-focusable" aria-label="Presto Brand Studio by EventPipe — home">
          <img :src="epLogo" alt="" />
        </a>
        <ul class="oc__links">
          <li><a href="#templates">Templates</a></li>
          <li><a href="#industries">Industries</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div class="oc__nav-actions">
          <button type="button" class="oc__pill oc__pill--dark bs-focusable" @click="emit('start')">Create a page</button>
          <button type="button" class="oc__pill oc__pill--light bs-focusable" @click="emit('signin')">Log in</button>
        </div>
      </nav>
    </header>

    <main>
      <!-- 1 · Hero -->
      <section class="oc__hero" aria-labelledby="oc-title">
        <div class="oc__hero-copy">
          <h1 id="oc-title" class="oc__h1">Free branded hotel booking pages</h1>
          <p class="oc__lede">Create a branded booking page for your event in seconds. Share by link. Track your room block in real time.</p>
          <button type="button" class="oc__cta bs-focusable" @click="emit('start')">Create free booking page</button>
          <p class="oc__note">No sign up required to start.</p>
        </div>
        <div class="oc__hero-art" :style="{ backgroundImage: `url(${heroBg})` }">
          <div class="oc__phone oc__phone--a">
            <i-phone :page-height="640" :safari="false" :url="`${phoneA.id}.example.com`" label="Youth sports booking page on a phone">
              <div class="oc__mini">
                <brand-hero v-bind="phoneA.hero" size="landing" :heading-level="3" />
                <div class="oc__mini-search"><span>Check-in – Check-out</span><b>Search</b></div>
                <div v-for="n in 3" :key="n" class="oc__mini-hotel"><i :style="{ backgroundImage: `url(${phoneA.photo})` }" /><span><b /><em /></span></div>
              </div>
            </i-phone>
          </div>
          <div class="oc__phone oc__phone--b">
            <i-phone :page-height="640" :safari="false" :url="`${phoneB.id}.example.com`" label="Wedding booking page on a phone">
              <div class="oc__mini">
                <brand-hero v-bind="phoneB.hero" size="landing" :heading-level="3" />
                <div class="oc__mini-search"><span>Check-in – Check-out</span><b>Search</b></div>
                <div v-for="n in 3" :key="n" class="oc__mini-hotel"><i :style="{ backgroundImage: `url(${phoneB.photo})` }" /><span><b /><em /></span></div>
              </div>
            </i-phone>
          </div>
          <span class="oc__bubble" aria-hidden="true"><q-icon name="hotel" size="16px" /> 18 rooms booked today</span>
        </div>
      </section>

      <!-- 2 · Statement band -->
      <section class="oc__band" aria-label="Highlights">
        <ul class="oc__statements">
          <li v-for="[label, line] in STATEMENTS" :key="label">
            <strong>{{ label }}</strong>
            <span>{{ line }}</span>
          </li>
        </ul>
      </section>

      <!-- 3 · Templates -->
      <section id="templates" class="oc__section" aria-labelledby="oc-templates">
        <header class="oc__head">
          <h2 id="oc-templates" class="oc__h2">Booking page templates</h2>
          <p>Each design is a complete branded booking page. Pick the vibe that matches your event.</p>
        </header>
        <ul class="oc__grid">
          <li v-for="t in themes" :key="t.id">
            <button type="button" class="oc__tile bs-focusable" :aria-label="`Open the ${t.name} theme`" @click="emit('sample', t.key)">
              <span class="oc__tile-bg" :style="{ backgroundImage: `url(${t.photo})` }" aria-hidden="true" />
              <span class="oc__poster"><brand-hero v-bind="t.hero" tagline="" dates="" location="" size="card" :heading-level="3" /></span>
            </button>
            <p class="oc__tile-name">{{ t.name }} Theme</p>
          </li>
        </ul>
      </section>

      <!-- 4 · Browse by industry -->
      <section id="industries" class="oc__section oc__section--tight" aria-labelledby="oc-industries">
        <header class="oc__head">
          <h2 id="oc-industries" class="oc__h2">Browse by industry</h2>
          <p>Every kind of group travel has its own designs. Each one opens as a ready-made booking page.</p>
        </header>
        <ul class="oc__circles">
          <li v-for="c in circles" :key="c.id">
            <button type="button" class="oc__circle bs-focusable" :aria-label="`${c.l1} ${c.l2}`" @click="emit('sample', c.key)">
              <span class="oc__circle-img" :style="{ backgroundImage: `url(${c.photo})` }" aria-hidden="true">
                <img v-if="c.logo" :src="c.logo" alt="" />
              </span>
              <span class="oc__circle-label">{{ c.l1 }}<br />{{ c.l2 }}</span>
            </button>
          </li>
        </ul>
        <div class="oc__center">
          <button type="button" class="oc__cta oc__cta--sm bs-focusable" @click="emit('sample', 'heartland')">Browse all booking page templates →</button>
        </div>
      </section>

      <!-- 5 · Steps -->
      <section id="how" class="oc__section oc__glow" aria-labelledby="oc-how">
        <header class="oc__head">
          <h2 id="oc-how" class="oc__h2">We’re not like other hotel links</h2>
          <p>A Presto booking page is live and interactive — attendees book in your block, you see who’s coming in real time.</p>
        </header>
        <ol class="oc__steps">
          <li v-for="s in STEPS" :key="s.n" class="oc__step">
            <div class="oc__step-art" :class="`oc__step-art--${s.n}`" aria-hidden="true">
              <template v-if="s.n === 1">
                <span class="oc__fan oc__fan--l"><brand-hero v-bind="themes[3].hero" tagline="" dates="" location="" size="card" :heading-level="4" /></span>
                <span class="oc__fan oc__fan--r"><brand-hero v-bind="themes[1].hero" tagline="" dates="" location="" size="card" :heading-level="4" /></span>
                <span class="oc__fan oc__fan--c"><brand-hero v-bind="themes[0].hero" tagline="" dates="" location="" size="card" :heading-level="4" /></span>
                <span class="oc__swatches"><i style="background:#0B3D2E" /><i style="background:#F2B705" /><i style="background:#7C3AED" /><i style="background:#E11D48" /><i style="background:#0EA5E9" /></span>
              </template>
              <template v-else-if="s.n === 2">
                <span class="oc__form">
                  <span class="oc__field"><small>Event name</small>{{ themes[2].hero.headline }}</span>
                  <span class="oc__field"><small>Dates</small>{{ themes[2].hero.dates }}</span>
                  <span class="oc__field"><small>Hotels in your block</small>6 hotels · 420 rooms</span>
                </span>
              </template>
              <template v-else>
                <span class="oc__track">
                  <span class="oc__track-head">Room block</span>
                  <span class="oc__track-num">312 <small>of 420 booked</small></span>
                  <span class="oc__track-bar"><i style="width:74%" /></span>
                </span>
                <span class="oc__chat">Block releases Friday — book your room tonight!</span>
              </template>
            </div>
            <div class="oc__step-body">
              <h3>{{ s.n }}. {{ s.title }}</h3>
              <p>{{ s.text }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- 6 · Comparison -->
      <section class="oc__section" aria-labelledby="oc-compare">
        <header class="oc__head">
          <h2 id="oc-compare" class="oc__h2">Why organizers choose Presto</h2>
          <p>Same group rates, a far better booking experience — and you can see your block fill up.</p>
        </header>
        <div class="oc__compare" role="table" aria-label="Presto compared with a generic hotel link and a spreadsheet">
          <div class="oc__col oc__col--side" role="rowgroup">
            <p class="oc__col-head" role="columnheader">Generic hotel link</p>
            <p v-for="[k, t] in COMPARE.generic" :key="t" role="cell" :class="`is-${k}`"><q-icon :name="ICON[k]" size="16px" /> {{ t }}</p>
          </div>
          <div class="oc__col oc__col--presto" role="rowgroup">
            <p class="oc__col-head" role="columnheader"><img :src="epLogo" alt="" /> Presto Booking Page</p>
            <p v-for="[k, t] in COMPARE.presto" :key="t" role="cell" :class="`is-${k}`"><q-icon :name="ICON[k]" size="16px" /> {{ t }}</p>
          </div>
          <div class="oc__col oc__col--side oc__col--sheet" role="rowgroup">
            <p class="oc__col-head" role="columnheader">Spreadsheet + email</p>
            <p v-for="[k, t] in COMPARE.sheet" :key="t" role="cell" :class="`is-${k}`"><q-icon :name="ICON[k]" size="16px" /> {{ t }}</p>
          </div>
        </div>
        <div class="oc__center">
          <button type="button" class="oc__cta oc__cta--sm bs-focusable" @click="emit('start')">Create free booking page</button>
        </div>
      </section>

      <!-- 7 · Collage -->
      <section class="oc__collage" aria-label="Events booked with Presto">
        <div class="oc__collage-row">
          <img v-for="(img, i) in collage.slice(0, 8)" :key="img.id" :src="img.src" :alt="img.alt" :style="{ '--r': `${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg` }" loading="lazy" />
        </div>
        <div class="oc__collage-row oc__collage-row--b">
          <img v-for="(img, i) in collage.slice(8, 16)" :key="img.id" :src="img.src" :alt="img.alt" :style="{ '--r': `${(i % 2 ? -1 : 1) * (2 + (i % 3))}deg` }" loading="lazy" />
        </div>
      </section>

      <!-- 8 · FAQ + closing CTA -->
      <section id="faq" class="oc__section" aria-labelledby="oc-faq">
        <header class="oc__head">
          <h2 id="oc-faq" class="oc__h2 oc__h2--lg">Frequently asked questions</h2>
        </header>
        <dl class="oc__faq">
          <div v-for="[q, a] in FAQ" :key="q">
            <dt>{{ q }}</dt>
            <dd>{{ a }}</dd>
          </div>
        </dl>
      </section>

      <section class="oc__final oc__glow" aria-labelledby="oc-final">
        <h2 id="oc-final" class="oc__h2 oc__h2--lg">Your event deserves a great booking page.</h2>
        <p>Create yours in seconds — no credit card, no app, no catch.</p>
        <button type="button" class="oc__cta bs-focusable" @click="emit('start')">Create my booking page — free</button>
      </section>
    </main>

    <footer class="oc__foot">
      <img :src="epLogo" alt="EventPipe" class="oc__foot-logo" />
      <nav aria-label="Footer">
        <a href="#templates">Templates</a>
        <a href="#industries">Industries</a>
        <a href="#how">How it works</a>
        <a href="#faq">FAQ</a>
      </nav>
      <p>© {{ new Date().getFullYear() }} EventPipe · Presto Brand Studio</p>
    </footer>
  </div>
</template>

<style scoped>
.oc {
  --oc-ink: #111216;
  --oc-soft: #5B6170;
  --oc-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow-x: clip;
  min-height: 100vh;
  font-family: var(--oc-font);
  color: var(--oc-ink);
  background:
    radial-gradient(60% 40% at 15% 0%, #EBD9FF 0%, transparent 70%),
    radial-gradient(50% 30% at 90% 4%, #FCE1F1 0%, transparent 70%),
    radial-gradient(60% 35% at 50% 55%, #E4EEFF 0%, transparent 70%),
    radial-gradient(50% 30% at 85% 90%, #FFE6F4 0%, transparent 70%),
    #FBFAFF;
}
.oc a { color: inherit; }
.oc h1, .oc h2, .oc h3, .oc p { margin: 0; }

/* ── Nav ─────────────────────────────────────────────────────────────── */
.oc__navwrap { position: sticky; top: 12px; z-index: 50; padding: 12px 16px 0; }
.oc__nav {
  max-width: 820px; margin: 0 auto; display: flex; align-items: center; gap: 16px;
  padding: 8px 8px 8px 18px; border-radius: 999px;
  background: rgb(255 255 255 / 0.78); backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.9) inset, 0 6px 24px rgb(40 20 90 / 0.08);
}
.oc__brand img { height: 22px; display: block; }
.oc__links { list-style: none; margin: 0 auto; padding: 0; display: flex; gap: 22px; font-size: 0.875rem; font-weight: 500; }
.oc__links a { text-decoration: none; opacity: 0.8; }
.oc__links a:hover { opacity: 1; }
.oc__nav-actions { display: flex; gap: 6px; }
.oc__pill { border: 0; border-radius: 999px; padding: 9px 16px; font: 600 0.8125rem var(--oc-font); cursor: pointer; white-space: nowrap; }
.oc__pill--dark { background: var(--oc-ink); color: #fff; }
.oc__pill--light { background: #fff; color: var(--oc-ink); box-shadow: 0 0 0 1px rgb(0 0 0 / 0.08); }

/* ── Buttons ─────────────────────────────────────────────────────────── */
.oc__cta { border: 0; border-radius: 8px; background: var(--oc-ink); color: #fff; padding: 14px 22px; font: 600 0.9375rem var(--oc-font); cursor: pointer; transition: transform 120ms ease, box-shadow 120ms ease; }
.oc__cta:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgb(0 0 0 / 0.18); }
.oc__cta--sm { padding: 11px 18px; font-size: 0.875rem; }
.oc__center { display: flex; justify-content: center; margin-top: 32px; }

/* ── Hero ────────────────────────────────────────────────────────────── */
.oc__hero { max-width: 1120px; margin: 0 auto; padding: 64px 24px 56px; display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr); gap: 48px; align-items: center; }
.oc__hero-copy { display: grid; gap: 18px; justify-items: start; }
.oc__h1 { font: 700 clamp(2.25rem, 4.4vw, 3.5rem)/1.04 var(--oc-font); letter-spacing: -0.035em; text-wrap: balance; }
.oc__lede { font: 500 clamp(1.0625rem, 1.5vw, 1.25rem)/1.4 var(--oc-font); color: var(--oc-soft); max-width: 30ch; }
.oc__note { font-size: 0.8125rem; color: var(--oc-soft); }
.oc__hero-art {
  position: relative; aspect-ratio: 16 / 10.5; border-radius: 22px; overflow: hidden;
  background-size: cover; background-position: center; box-shadow: 0 24px 60px rgb(60 20 120 / 0.22);
  display: flex; justify-content: center; align-items: center; gap: 4%;
}
.oc__hero-art::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgb(124 58 237 / 0.35), rgb(236 72 153 / 0.18) 60%, rgb(14 165 233 / 0.25)); }
.oc__phone { position: relative; width: 31%; filter: drop-shadow(0 18px 30px rgb(0 0 0 / 0.35)); }
.oc__phone--a { transform: rotate(-6deg) translateY(4%); }
.oc__phone--b { transform: rotate(5deg) translateY(-3%); }
.oc__bubble { position: absolute; right: 6%; bottom: 8%; display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 999px; background: #fff; font: 600 0.8125rem var(--oc-font); box-shadow: 0 8px 24px rgb(0 0 0 / 0.2); }
.oc__bubble .q-icon { color: #7C3AED; }

/* phone page mock (390-wide design px) */
.oc__mini { background: #F4F5F8; height: 100%; }
.oc__mini :deep(.bh) { min-height: 300px; }
.oc__mini-search { display: flex; justify-content: space-between; align-items: center; margin: -22px 16px 14px; position: relative; padding: 12px 14px; background: #fff; border-radius: 10px; box-shadow: 0 6px 18px rgb(0 0 0 / 0.1); font-size: 14px; color: #64748B; }
.oc__mini-search b { background: #01113E; color: #fff; padding: 9px 14px; border-radius: 6px; }
.oc__mini-hotel { display: flex; gap: 12px; margin: 0 16px 12px; padding: 10px; border-radius: 12px; background: #fff; }
.oc__mini-hotel i { width: 92px; height: 72px; border-radius: 8px; background-size: cover; background-position: center; flex: none; }
.oc__mini-hotel span { flex: 1; display: grid; gap: 8px; align-content: center; }
.oc__mini-hotel b { height: 14px; width: 80%; border-radius: 4px; background: #CBD5E1; }
.oc__mini-hotel em { height: 10px; width: 50%; border-radius: 4px; background: #E2E8F0; }

/* ── Statement band ──────────────────────────────────────────────────── */
.oc__band { padding: 22px 24px; background: rgb(255 255 255 / 0.55); border-block: 1px solid rgb(255 255 255 / 0.8); }
.oc__statements { list-style: none; margin: 0 auto; padding: 0; max-width: 1180px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; text-align: center; }
.oc__statements li { display: grid; gap: 4px; }
.oc__statements strong { font: 800 0.8125rem var(--oc-font); letter-spacing: 0.08em; text-transform: uppercase; }
.oc__statements span { font: 500 1.0625rem/1.3 var(--oc-font); color: #8A8FA0; }

/* ── Sections ────────────────────────────────────────────────────────── */
.oc__section { max-width: 1040px; margin: 0 auto; padding: 72px 24px 24px; }
.oc__section--tight { padding-top: 40px; }
.oc__head { text-align: center; display: grid; gap: 8px; margin-bottom: 28px; }
.oc__head p { color: var(--oc-soft); font-size: 1.0625rem; max-width: 60ch; margin-inline: auto; }
.oc__h2 { font: 700 clamp(1.5rem, 2.4vw, 1.875rem)/1.15 var(--oc-font); letter-spacing: -0.02em; }
.oc__h2--lg { font-size: clamp(1.875rem, 3.2vw, 2.5rem); }
.oc__glow { position: relative; }
.oc__glow::before { content: ''; position: absolute; inset: 0 -20vw; z-index: -1; background: radial-gradient(50% 60% at 50% 40%, rgb(205 190 255 / 0.45), transparent 70%); pointer-events: none; }

/* templates grid */
.oc__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px 18px; }
.oc__tile { position: relative; display: grid; place-items: center; width: 100%; aspect-ratio: 3 / 2; padding: 0; border: 0; border-radius: 8px; overflow: hidden; cursor: pointer; background: #ddd; isolation: isolate; transition: transform 160ms ease, box-shadow 160ms ease; }
.oc__tile:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgb(60 20 120 / 0.18); }
.oc__tile-bg { position: absolute; inset: -14%; z-index: -1; background-size: cover; background-position: center; filter: blur(16px) saturate(1.2); opacity: 0.9; }
.oc__poster { width: 58%; aspect-ratio: 1; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 24px rgb(0 0 0 / 0.32); pointer-events: none; display: flex; }
.oc__poster :deep(.bh) { width: 100%; height: 100%; aspect-ratio: auto; }
.oc__poster :deep(.bh__content) { padding: 14px 10px; gap: 8px; }
.oc__poster :deep(.bh__logo) { height: clamp(28px, 22cqi, 48px); }
.oc__poster :deep(.bh__headline) { font-size: clamp(13px, 10cqi, 20px); }
.oc__tile-name { margin-top: 10px; text-align: center; font: 600 0.9375rem var(--oc-font); }

/* industry circles */
.oc__circles { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, 1fr); gap: 18px; }
.oc__circle { width: 100%; display: grid; justify-items: center; gap: 10px; padding: 0; border: 0; background: none; cursor: pointer; font-family: var(--oc-font); color: var(--oc-ink); }
.oc__circle-img { position: relative; width: min(132px, 100%); aspect-ratio: 1; border-radius: 50%; background-size: cover; background-position: center; display: grid; place-items: center; box-shadow: 0 8px 20px rgb(60 20 120 / 0.16); overflow: hidden; transition: transform 160ms ease; }
.oc__circle-img::after { content: ''; position: absolute; inset: 0; background: rgb(0 0 0 / 0.25); }
.oc__circle-img img { position: relative; z-index: 1; width: 52%; height: 52%; object-fit: contain; filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.4)); }
.oc__circle:hover .oc__circle-img { transform: scale(1.04); }
.oc__circle-label { font: 600 0.9375rem/1.25 var(--oc-font); text-align: center; }

/* steps */
.oc__steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.oc__step { border-radius: 12px; background: #fff; overflow: hidden; box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 12px 32px rgb(60 20 120 / 0.1); }
.oc__step-art { position: relative; height: 190px; overflow: hidden; display: grid; place-items: center; }
.oc__step-art--1 { background: linear-gradient(135deg, #F7D6F2, #D8E4FF 60%, #C9F1F5); }
.oc__step-art--2 { background: linear-gradient(135deg, #FDE7F3, #EFE6FF); }
.oc__step-art--3 { background: linear-gradient(160deg, #FCD9B8, #E5C8FF 55%, #B9D4FF); }
.oc__step-body { padding: 16px 18px 20px; display: grid; gap: 6px; }
.oc__step-body h3 { font: 700 1.0625rem var(--oc-font); }
.oc__step-body p { font-size: 0.875rem; line-height: 1.45; color: var(--oc-soft); }

.oc__fan { position: absolute; width: 42%; aspect-ratio: 1; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 22px rgb(0 0 0 / 0.25); display: flex; top: 18%; }
.oc__fan :deep(.bh) { width: 100%; height: 100%; aspect-ratio: auto; }
.oc__fan :deep(.bh__content) { padding: 8px; gap: 6px; }
.oc__fan :deep(.bh__logo) { height: 30px; }
.oc__fan :deep(.bh__headline) { font-size: 12px; }
.oc__fan--l { left: 8%; transform: rotate(-10deg); }
.oc__fan--r { right: 8%; transform: rotate(10deg); }
.oc__fan--c { left: 29%; top: 10%; z-index: 1; }
.oc__swatches { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; gap: 6px; padding: 6px 8px; border-radius: 999px; background: #fff; box-shadow: 0 6px 16px rgb(0 0 0 / 0.12); }
.oc__swatches i { width: 18px; height: 18px; border-radius: 50%; }

.oc__form { width: 78%; display: grid; gap: 8px; padding: 14px; border-radius: 12px; background: #fff; box-shadow: 0 12px 28px rgb(60 20 120 / 0.15); transform: rotate(-2deg); }
.oc__field { display: grid; gap: 2px; padding: 7px 10px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oc__field small { font-size: 0.6875rem; font-weight: 500; color: #8A8FA0; }

.oc__track { width: 62%; display: grid; gap: 6px; padding: 14px; border-radius: 14px; background: #111216; color: #fff; box-shadow: 0 14px 30px rgb(0 0 0 / 0.3); transform: translateY(-14px); }
.oc__track-head { font-size: 0.75rem; opacity: 0.7; }
.oc__track-num { font: 800 1.5rem var(--oc-font); }
.oc__track-num small { font-size: 0.75rem; font-weight: 500; opacity: 0.7; }
.oc__track-bar { height: 8px; border-radius: 99px; background: rgb(255 255 255 / 0.15); overflow: hidden; }
.oc__track-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #A78BFA, #F472B6); }
.oc__chat { position: absolute; left: 10%; right: 10%; bottom: 14px; padding: 9px 12px; border-radius: 14px 14px 14px 4px; background: #fff; font: 600 0.8125rem/1.3 var(--oc-font); box-shadow: 0 8px 20px rgb(0 0 0 / 0.14); }

/* comparison */
.oc__compare { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 12px; align-items: start; max-width: 760px; margin: 0 auto; }
.oc__col { display: grid; gap: 12px; padding: 18px 16px; }
.oc__col p { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: #8A8FA0; }
.oc__col-head { justify-content: center; min-height: 40px; font: 700 1rem var(--oc-font) !important; color: var(--oc-ink) !important; text-align: center; }
.oc__col--presto { border-radius: 16px; background: linear-gradient(180deg, #F4FBFF, #FFFFFF); box-shadow: 0 0 0 1px rgb(14 165 233 / 0.15), 0 16px 40px rgb(14 120 200 / 0.14); }
.oc__col--presto p { color: var(--oc-ink); font-weight: 500; }
.oc__col--presto .oc__col-head img { height: 18px; }
.oc__col p.is-ok .q-icon { color: #16A34A; }
.oc__col p.is-x .q-icon { color: #9CA3AF; }
.oc__col p.is-warn .q-icon { color: #6B7280; }

/* collage */
.oc__collage { margin-top: 72px; padding: 26px 0; overflow: hidden; display: grid; gap: 14px; background: linear-gradient(180deg, transparent, rgb(226 214 255 / 0.5), transparent); }
.oc__collage-row { display: flex; gap: 14px; justify-content: center; }
.oc__collage-row--b { transform: translateX(-90px); }
.oc__collage img { width: 240px; height: 168px; flex: none; object-fit: cover; border-radius: 4px; transform: rotate(var(--r)); box-shadow: 0 10px 24px rgb(0 0 0 / 0.18); border: 4px solid #fff; }

/* faq */
.oc__faq { margin: 0 auto; max-width: 820px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px 40px; }
.oc__faq dt { font: 700 1.0625rem/1.3 var(--oc-font); margin-bottom: 6px; }
.oc__faq dd { margin: 0; font-size: 0.9375rem; line-height: 1.5; color: var(--oc-soft); }

/* final */
.oc__final { max-width: 820px; margin: 0 auto; padding: 96px 24px 96px; display: grid; gap: 14px; justify-items: center; text-align: center; }
.oc__final p { color: var(--oc-soft); font-size: 1.0625rem; }
.oc__final .oc__cta { margin-top: 8px; }

/* footer */
.oc__foot { margin: 0 16px 16px; padding: 28px 32px; border-radius: 18px; background: #111216; color: #fff; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.oc__foot-logo { height: 22px; filter: brightness(0) invert(1); }
.oc__foot nav { display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.875rem; }
.oc__foot nav a { text-decoration: none; opacity: 0.75; }
.oc__foot p { margin-left: auto; font-size: 0.8125rem; opacity: 0.6; }

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .oc__links { display: none; }
  .oc__nav-actions { margin-left: auto; }
  .oc__hero { grid-template-columns: 1fr; gap: 32px; padding-top: 40px; }
  .oc__statements { grid-template-columns: repeat(2, 1fr); }
  .oc__circles { grid-template-columns: repeat(3, 1fr); gap: 22px 14px; }
  .oc__steps { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; }
}
@media (max-width: 600px) {
  .oc__navwrap { top: 8px; padding: 8px 12px 0; }
  .oc__nav { padding-left: 14px; }
  .oc__pill { padding: 8px 12px; }
  .oc__hero { padding: 32px 16px 40px; }
  .oc__hero-copy .oc__cta { width: 100%; }
  .oc__hero-art { aspect-ratio: 4 / 3.6; }
  .oc__phone { width: 38%; }
  .oc__bubble { right: 4%; bottom: 5%; font-size: 0.75rem; padding: 7px 10px; }
  .oc__band { padding: 18px 16px; }
  .oc__statements { gap: 16px 12px; }
  .oc__statements span { font-size: 0.9375rem; }
  .oc__section { padding: 56px 16px 16px; }
  .oc__grid { grid-template-columns: repeat(2, 1fr); gap: 16px 12px; }
  .oc__grid li:nth-child(9) { display: none; }
  .oc__tile-name { font-size: 0.8125rem; margin-top: 6px; }
  .oc__poster { width: 64%; }
  .oc__circle-label { font-size: 0.8125rem; }
  .oc__compare { grid-template-columns: 1fr 1.15fr; gap: 6px; }
  .oc__col--sheet { display: none; }
  .oc__col--presto .oc__col-head img { display: none; }
  .oc__col { padding: 14px 8px; gap: 10px; }
  .oc__col p { font-size: 0.8125rem; align-items: flex-start; }
  .oc__col p .q-icon { margin-top: 1px; flex: none; }
  .oc__collage img { width: 150px; height: 106px; border-width: 3px; }
  .oc__collage-row--b { transform: translateX(-60px); }
  .oc__faq { grid-template-columns: 1fr; gap: 20px; }
  .oc__final { padding: 72px 16px; }
  .oc__final .oc__cta { width: 100%; }
  .oc__foot { margin: 0 8px 8px; padding: 24px 20px; }
  .oc__foot p { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .oc__cta, .oc__tile, .oc__circle-img { transition: none; }
  .oc__tile:hover, .oc__cta:hover { transform: none; }
}
</style>
