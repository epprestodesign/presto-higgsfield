<script setup>
// A Presto booking screen — landing, hotel listings or hotel details — laid
// out like the live Studio's mockups (Chrome window on desktop, Chrome for iOS
// in the phone shell), branded with the project's logo, banner, colours and
// page text. Desktop is drawn at 1440 design px, the phone at 390; `--u` is
// one design px. `chrome: false` drops the browser frame (stack thumbnails).
import { computed } from 'vue'
import LogoMark from '../LogoMark.vue'
import ChromeWindow from '../devices/ChromeWindow.vue'
import PhoneFrame from '../devices/PhoneFrame.vue'

const props = defineProps({
  project: { type: Object, required: true },
  screen: { type: String, default: 'landing' }, // landing | listings | details
  device: { type: String, default: 'desktop' }, // desktop | mobile
  chrome: { type: Boolean, default: true },
  phoneWidth: { type: Number, default: 280 },
})
const emit = defineEmits(['edit'])

const photos = import.meta.glob('../../assets/hotel/*.jpg', { eager: true, query: '?url', import: 'default' })
const photo = (id) => photos[`../../assets/hotel/${id}.jpg`]
const HOTELS = [
  { name: 'Courtyard by Marriott Downtown', area: 'Overland Park', img: 'exterior', stars: 3, miles: '0.2', price: 149, left: 6, preferred: true },
  { name: 'Hilton Garden Inn Convention Center', area: 'Overland Park', img: 'lobby', stars: 3, miles: '0.6', price: 132, left: 14 },
  { name: 'Sheraton Overland Park', area: 'Overland Park', img: 'pool', stars: 4, miles: '1.1', price: 169, left: 3 },
]

const c = computed(() => props.project.copy)
const b = computed(() => props.project.brand)
const bg = computed(() => props.project.selected || { src: b.value.images[0].src, filter: '' })
const main = computed(() => props.project.palette[0])
const display = computed(() => `'${b.value.fonts.display}', 'PT Sans', sans-serif`)
const compact = computed(() => props.screen !== 'landing')
const vars = computed(() => ({ '--main': main.value, '--display': display.value }))
</script>

<template>
  <!-- Desktop: Chrome window (or bare, for thumbnails) -->
  <component :is="chrome ? ChromeWindow : 'div'" v-if="device === 'desktop'" :class="{ 'ps-bare': !chrome }" v-bind="chrome ? { title: b.name, favicon: b.logo } : {}">
    <div class="ps ps--desktop" :style="vars">
      <header v-if="chrome" class="ps__nav">
        <span class="ps__brand"><LogoMark :project="project" look="original" :size="0" class="ps__navlogo" />{{ b.short }}</span>
        <span class="ps__navlinks"><span>Contact Us</span><b>Manage Booking</b></span>
      </header>

      <section class="ps__hero" :class="{ 'is-compact': compact }">
        <span class="ps__img" :style="{ backgroundImage: `url(${bg.src})`, filter: bg.filter || undefined }" />
        <div class="ps__copy">
          <LogoMark :project="project" :size="0" class="ps__logo" />
          <button v-if="c.show.headline" type="button" class="ps__h" @click="emit('edit')">{{ c.headline }}</button>
          <button v-if="c.show.meta" type="button" class="ps__m" @click="emit('edit')">{{ c.meta }}</button>
          <button v-if="c.show.tagline && !compact" type="button" class="ps__t" @click="emit('edit')">{{ c.tagline }}</button>
        </div>
      </section>

      <template v-if="screen === 'landing'">
        <div class="ps__widget">
          <span class="ps__field"><i>☰</i><span><small>Booking Type</small>Individual</span><em>⌄</em></span>
          <span class="ps__field"><i>▦</i><span><small>Check-in – Check-out</small>Jun 11 – 15</span></span>
          <span class="ps__field"><i>☺</i><span><small>Travelers</small>1 traveler, 1 room</span></span>
          <b class="ps__search">Search</b>
        </div>
        <h2 class="ps__section">Official event hotels</h2>
        <div class="ps__cards">
          <article v-for="h in HOTELS" :key="h.name" class="ps__card">
            <span class="ps__photo"><img :src="photo(h.img)" alt="" /><em v-if="h.preferred">Preferred Hotel</em><i class="l">‹</i><i class="r">›</i></span>
            <b>{{ h.name }}</b>
            <small>{{ h.area }}</small>
            <small class="ps__stars">{{ '★'.repeat(h.stars) }}<span>{{ '★'.repeat(5 - h.stars) }}</span></small>
            <small class="ps__left">⚑ {{ h.left }} rooms max — 1 requested</small>
            <small>◎ {{ h.miles }} mi from Main Arena</small>
          </article>
        </div>
      </template>

      <template v-else-if="screen === 'listings'">
        <div class="ps__toolbar">
          <span class="ps__count">{{ HOTELS.length }} hotels available</span>
          <span class="ps__chips"><b>All</b><span>Under $150</span><span>Walk to venue</span><span>Pool</span></span>
          <span class="ps__sort">Sort: Distance ⌄</span>
        </div>
        <div class="ps__split">
          <div class="ps__rows">
            <article v-for="h in HOTELS" :key="h.name" class="ps__row">
              <span class="ps__photo"><img :src="photo(h.img)" alt="" /><em v-if="h.preferred">Preferred Hotel</em></span>
              <div class="ps__rowbody">
                <b>{{ h.name }}</b>
                <small>{{ h.area }} · ◎ {{ h.miles }} mi from Main Arena</small>
                <small class="ps__stars">{{ '★'.repeat(h.stars) }}<span>{{ '★'.repeat(5 - h.stars) }}</span></small>
                <small class="ps__left">⚑ {{ h.left }} rooms left at the event rate</small>
              </div>
              <div class="ps__rowprice"><small>from</small><b>${{ h.price }}</b><small>/night</small><span>View rooms</span></div>
            </article>
          </div>
          <div class="ps__map"><i v-for="(h, i) in HOTELS" :key="h.name" :class="`p${i}`">${{ h.price }}</i></div>
        </div>
      </template>

      <template v-else>
        <p class="ps__back">‹ Back to Hotel listing</p>
        <div class="ps__gallery">
          <img :src="photo('exterior')" alt="" /><img :src="photo('deluxe-king')" alt="" /><img :src="photo('ocean-suite')" alt="" /><img :src="photo('pool')" alt="" /><img :src="photo('restaurant')" alt="" />
          <em>▦ See all 9 photos</em>
        </div>
        <nav class="ps__tabs"><b>Overview</b><span>Rooms</span><span>Property</span><span>Amenities</span><span>Policies</span></nav>
        <div class="ps__detail">
          <div>
            <p class="ps__badges"><em class="dark">Preferred Hotel</em><em class="ok">✓ Lowest Rate Guarantee</em></p>
            <h3 class="ps__dname">Courtyard by Marriott Downtown</h3>
            <small class="ps__stars">★★★<span>★★</span> · 0.2 mi from Main Arena · Free breakfast</small>
          </div>
          <aside class="ps__book"><small>Event rate from</small><b>$149<span>/night</span></b><span class="ps__bookbtn">Book a room</span></aside>
        </div>
      </template>
    </div>
  </component>

  <!-- Phone: Chrome for iOS in the phone shell -->
  <component :is="chrome ? PhoneFrame : 'div'" v-else v-bind="chrome ? { width: phoneWidth } : {}">
    <div class="ps ps--mobile" :style="vars">
      <header class="ps__nav">
        <LogoMark :project="project" look="original" :size="0" class="ps__navlogo" />
        <span class="ps__burger">≡</span>
      </header>
      <section class="ps__hero" :class="{ 'is-compact': compact }">
        <span class="ps__img" :style="{ backgroundImage: `url(${bg.src})`, filter: bg.filter || undefined }" />
        <div class="ps__copy">
          <LogoMark :project="project" :size="0" class="ps__logo" />
          <button v-if="c.show.headline" type="button" class="ps__h" @click="emit('edit')">{{ c.headline }}</button>
          <button v-if="c.show.meta" type="button" class="ps__m" @click="emit('edit')">{{ c.meta }}</button>
          <button v-if="c.show.tagline && !compact" type="button" class="ps__t" @click="emit('edit')">{{ c.tagline }}</button>
        </div>
      </section>

      <template v-if="screen === 'landing'">
        <h2 class="ps__section">Official event hotels</h2>
        <article v-for="h in HOTELS.slice(0, 2)" :key="h.name" class="ps__card">
          <span class="ps__photo"><img :src="photo(h.img)" alt="" /><em v-if="h.preferred">Preferred Hotel</em><i class="l">‹</i><i class="r">›</i></span>
          <b>{{ h.name }}</b>
          <small>{{ h.area }}</small>
          <small class="ps__stars">{{ '★'.repeat(h.stars) }}<span>{{ '★'.repeat(5 - h.stars) }}</span></small>
          <small class="ps__left">⚑ {{ h.left }} rooms max — 1 requested</small>
          <small>◎ {{ h.miles }} mi from Main Arena</small>
        </article>
      </template>

      <template v-else-if="screen === 'listings'">
        <div class="ps__toolbar"><span class="ps__chips"><b>All</b><span>Under $150</span><span>Walk to venue</span><span>Pool</span></span></div>
        <p class="ps__count">{{ HOTELS.length }} hotels available · Sort: Distance</p>
        <article v-for="h in HOTELS" :key="h.name" class="ps__card">
          <span class="ps__photo"><img :src="photo(h.img)" alt="" /><em v-if="h.preferred">Preferred Hotel</em></span>
          <b>{{ h.name }}</b>
          <small class="ps__stars">{{ '★'.repeat(h.stars) }}<span>{{ '★'.repeat(5 - h.stars) }}</span> · ◎ {{ h.miles }} mi</small>
          <small class="ps__price">from <b>${{ h.price }}</b>/night</small>
        </article>
      </template>

      <template v-else>
        <div class="ps__gallery"><img :src="photo('exterior')" alt="" /><i>‹</i><em>▦ See all 9 photos</em></div>
        <div class="ps__detail">
          <p class="ps__badges"><em class="dark">Preferred Hotel</em><em class="ok">✓ Lowest Rate Guarantee</em></p>
          <h3 class="ps__dname">Courtyard by Marriott Downtown</h3>
          <small class="ps__stars">★★★<span>★★</span> · 0.2 mi from Main Arena</small>
          <nav class="ps__tabs"><b>Overview</b><span>Rooms</span><span>Amenities</span></nav>
          <span class="ps__bookbtn">Book a room · from $149</span>
        </div>
      </template>
    </div>
  </component>
</template>

<style scoped>
/* ---------- shared ---------- */
.ps { --u: 1px; position: relative; background: #f8fafc; color: #0f172a; font-family: 'PT Sans', -apple-system, sans-serif; text-align: left; }
.ps-bare { container-type: inline-size; overflow: hidden; background: #f8fafc; }
.ps--desktop { --u: calc(100cqw / 1440); }
.ps button { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: inherit; cursor: text; border-radius: 2px; }
.ps__hero button:hover { outline: 1px dashed rgba(255, 255, 255, 0.85); outline-offset: 3px; }
.ps__nav { display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e2e8f0; }
.ps__brand { display: flex; align-items: center; gap: calc(var(--u) * 12); font-weight: 700; color: var(--main); }
.ps__navlinks { display: flex; align-items: center; gap: calc(var(--u) * 24); color: #0f172a; }
.ps__navlinks b { padding: calc(var(--u) * 10) calc(var(--u) * 18); border: calc(var(--u) * 1.5) solid #0f172a; border-radius: calc(var(--u) * 4); }
.ps__hero { position: relative; overflow: hidden; color: #fff; display: grid; place-items: center; text-align: center; }
.ps__img { position: absolute; inset: 0; background: center / cover; }
.ps__hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(rgba(3, 10, 38, 0.35), rgba(3, 10, 38, 0.55)); }
.ps__copy { position: relative; z-index: 1; display: grid; justify-items: center; }
.ps__copy button { text-align: center; }
.ps__h { font-family: var(--display) !important; font-weight: 700; line-height: 1.05; letter-spacing: -0.01em; text-wrap: balance; }
.ps__m { font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.95; }
.ps__t { opacity: 0.92; }
.ps__stars { color: #f59e0b !important; letter-spacing: 0.08em; }
.ps__stars span { color: #cbd5e1; }
.ps__left { color: #c2410c !important; }
.ps__photo { position: relative; display: block; overflow: hidden; }
.ps__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ps__photo em, .ps__badges .dark { position: absolute; font-style: normal; font-weight: 700; color: #fff; background: #14532d; }
.ps__photo i { position: absolute; top: 50%; display: grid; place-items: center; border-radius: 50%; background: rgba(255, 255, 255, 0.9); color: #0f172a; font-style: normal; transform: translateY(-50%); }
.ps__badges em { position: static; display: inline-block; font-style: normal; font-weight: 700; }
.ps__badges .ok { color: #15803d; background: #fff; border: 1px solid #86efac; }

/* ---------- desktop (1440 design px) ---------- */
.ps--desktop .ps__nav { height: calc(var(--u) * 72); padding: 0 calc(var(--u) * 64); font-size: calc(var(--u) * 15); }
.ps--desktop .ps__brand { font-size: calc(var(--u) * 20); }
.ps--desktop .ps__navlogo { --s: calc(var(--u) * 40) !important; }
.ps--desktop .ps__hero { height: calc(var(--u) * 480); }
.ps--desktop .ps__hero.is-compact { height: calc(var(--u) * 260); }
.ps--desktop .ps__copy { gap: calc(var(--u) * 10); max-width: calc(var(--u) * 960); padding-bottom: calc(var(--u) * 24); }
.ps--desktop .ps__logo { --s: calc(var(--u) * 96) !important; margin-bottom: calc(var(--u) * 10); }
.ps--desktop .is-compact .ps__logo { --s: calc(var(--u) * 64) !important; margin-bottom: 0; }
.ps--desktop .ps__h { font-size: calc(var(--u) * 58); }
.ps--desktop .is-compact .ps__h { font-size: calc(var(--u) * 38); }
.ps--desktop .ps__m { font-size: calc(var(--u) * 15); }
.ps--desktop .ps__t { font-size: calc(var(--u) * 22); }
.ps--desktop .ps__widget { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1.3fr 1.2fr auto; gap: calc(var(--u) * 12); width: calc(var(--u) * 1200); margin: calc(var(--u) * -56) auto 0; padding: calc(var(--u) * 16); border-radius: calc(var(--u) * 8); background: #fff; box-shadow: 0 calc(var(--u) * 10) calc(var(--u) * 30) rgba(3, 10, 38, 0.14); font-size: calc(var(--u) * 15); }
.ps--desktop .ps__field { display: flex; align-items: center; gap: calc(var(--u) * 12); padding: calc(var(--u) * 10) calc(var(--u) * 14); border: 1px solid #cbd5e1; border-radius: calc(var(--u) * 4); }
.ps__field i { font-style: normal; color: #64748b; }
.ps__field > span { display: grid; flex: 1; }
.ps__field small { font-size: 0.8em; color: #64748b; }
.ps__field em { font-style: normal; color: #64748b; }
.ps--desktop .ps__search { display: grid; place-items: center; padding: 0 calc(var(--u) * 32); border-radius: calc(var(--u) * 4); background: var(--main); color: #fff; }
.ps--desktop .ps__section { margin: calc(var(--u) * 48) calc(var(--u) * 120) calc(var(--u) * 20); font-size: calc(var(--u) * 30); }
.ps--desktop .ps__cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: calc(var(--u) * 24); padding: 0 calc(var(--u) * 120) calc(var(--u) * 64); }
.ps--desktop .ps__card { display: grid; gap: calc(var(--u) * 4); font-size: calc(var(--u) * 15); }
.ps--desktop .ps__card .ps__photo { aspect-ratio: 16 / 10.5; border-radius: calc(var(--u) * 8); margin-bottom: calc(var(--u) * 10); }
.ps--desktop .ps__card b { font-size: calc(var(--u) * 19); }
.ps__card small { color: #475569; }
.ps--desktop .ps__photo em { top: calc(var(--u) * 12); left: calc(var(--u) * 12); padding: calc(var(--u) * 5) calc(var(--u) * 10); border-radius: calc(var(--u) * 4); font-size: calc(var(--u) * 13); }
.ps--desktop .ps__photo i { width: calc(var(--u) * 30); height: calc(var(--u) * 30); font-size: calc(var(--u) * 18); }
.ps__photo i.l { left: calc(var(--u) * 10); } .ps__photo i.r { right: calc(var(--u) * 10); }

.ps--desktop .ps__toolbar { display: flex; align-items: center; gap: calc(var(--u) * 20); padding: calc(var(--u) * 28) calc(var(--u) * 120) calc(var(--u) * 16); font-size: calc(var(--u) * 15); }
.ps--desktop .ps__count { font-weight: 700; font-size: calc(var(--u) * 20); }
.ps__chips { display: flex; gap: calc(var(--u) * 8); flex: 1; }
.ps__chips > * { padding: calc(var(--u) * 6) calc(var(--u) * 14); border: 1px solid #cbd5e1; border-radius: 999px; background: #fff; white-space: nowrap; }
.ps__chips b { background: var(--main); border-color: var(--main); color: #fff; }
.ps__sort { color: #475569; }
.ps--desktop .ps__split { display: grid; grid-template-columns: 1fr calc(var(--u) * 460); gap: calc(var(--u) * 24); padding: 0 calc(var(--u) * 120) calc(var(--u) * 48); }
.ps--desktop .ps__rows { display: grid; gap: calc(var(--u) * 16); align-content: start; }
.ps--desktop .ps__row { display: grid; grid-template-columns: calc(var(--u) * 260) 1fr auto; gap: calc(var(--u) * 20); padding: calc(var(--u) * 12); border: 1px solid #e2e8f0; border-radius: calc(var(--u) * 8); background: #fff; font-size: calc(var(--u) * 15); }
.ps--desktop .ps__row .ps__photo { aspect-ratio: 16 / 11; border-radius: calc(var(--u) * 6); }
.ps__rowbody { display: grid; align-content: start; gap: calc(var(--u) * 6); }
.ps--desktop .ps__rowbody b { font-size: calc(var(--u) * 20); }
.ps__rowbody small { color: #475569; }
.ps__rowprice { display: grid; justify-items: end; align-content: center; gap: calc(var(--u) * 2); color: #475569; }
.ps--desktop .ps__rowprice b { font-size: calc(var(--u) * 26); color: #0f172a; }
.ps__rowprice span { margin-top: calc(var(--u) * 8); padding: calc(var(--u) * 8) calc(var(--u) * 16); border-radius: calc(var(--u) * 4); background: var(--main); color: #fff; font-weight: 700; }
.ps__map { position: relative; border-radius: calc(var(--u) * 8); background: repeating-linear-gradient(35deg, #e6ebf2 0 calc(var(--u) * 14), #eef2f7 calc(var(--u) * 14) calc(var(--u) * 28)); min-height: calc(var(--u) * 420); }
.ps__map i { position: absolute; padding: calc(var(--u) * 4) calc(var(--u) * 10); border-radius: 999px; background: var(--main); color: #fff; font-style: normal; font-weight: 700; font-size: calc(var(--u) * 14); }
.ps__map .p0 { top: 22%; left: 30%; } .ps__map .p1 { top: 48%; left: 58%; } .ps__map .p2 { top: 70%; left: 24%; }

.ps--desktop .ps__back { margin: calc(var(--u) * 24) calc(var(--u) * 120) calc(var(--u) * 14); font-weight: 700; font-size: calc(var(--u) * 15); }
.ps--desktop .ps__gallery { position: relative; display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: calc(var(--u) * 8); height: calc(var(--u) * 400); margin: 0 calc(var(--u) * 120); }
.ps__gallery img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ps--desktop .ps__gallery img:first-child { grid-row: 1 / 3; border-radius: calc(var(--u) * 8) 0 0 calc(var(--u) * 8); }
.ps__gallery em { position: absolute; right: calc(var(--u) * 14); bottom: calc(var(--u) * 14); padding: calc(var(--u) * 6) calc(var(--u) * 12); border-radius: calc(var(--u) * 4); background: #fff; color: #0f172a; font-style: normal; font-weight: 700; font-size: calc(var(--u) * 14); }
.ps--desktop .ps__tabs { display: flex; gap: calc(var(--u) * 28); margin: calc(var(--u) * 20) calc(var(--u) * 120) 0; border-bottom: 1px solid #e2e8f0; font-size: calc(var(--u) * 15); }
.ps__tabs > * { padding: calc(var(--u) * 12) 0; color: #475569; }
.ps__tabs b { color: #0f172a; box-shadow: inset 0 calc(var(--u) * -3) 0 var(--main); }
.ps--desktop .ps__detail { display: flex; justify-content: space-between; gap: calc(var(--u) * 24); padding: calc(var(--u) * 20) calc(var(--u) * 120) calc(var(--u) * 48); }
.ps--desktop .ps__badges { display: flex; gap: calc(var(--u) * 8); margin: 0 0 calc(var(--u) * 10); font-size: calc(var(--u) * 13); }
.ps--desktop .ps__badges em { padding: calc(var(--u) * 5) calc(var(--u) * 10); border-radius: 999px; }
.ps--desktop .ps__dname { margin: 0 0 calc(var(--u) * 6); font-size: calc(var(--u) * 32); }
.ps--desktop .ps__detail small { font-size: calc(var(--u) * 15); color: #475569; }
.ps__book { display: grid; gap: calc(var(--u) * 6); align-content: start; width: calc(var(--u) * 340); padding: calc(var(--u) * 20); border: 1px solid #e2e8f0; border-radius: calc(var(--u) * 8); background: #fff; font-size: calc(var(--u) * 14); }
.ps__book b { font-size: calc(var(--u) * 30); }
.ps__book b span { font-size: 0.5em; font-weight: 400; color: #475569; }
.ps__bookbtn { display: block; padding: calc(var(--u) * 12); border-radius: calc(var(--u) * 4); background: var(--main); color: #fff; font-weight: 700; text-align: center; }

/* ---------- phone (390 design px) ---------- */
.ps--mobile { width: 390px; min-height: 760px; padding-bottom: 96px; }
.ps--mobile .ps__nav { height: 56px; padding: 0 16px; }
.ps--mobile .ps__navlogo { --s: 34px !important; }
.ps__burger { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 20px; }
.ps--mobile .ps__hero { height: 300px; padding: 0 20px; }
.ps--mobile .ps__hero.is-compact { height: 170px; }
.ps--mobile .ps__copy { gap: 6px; }
.ps--mobile .ps__logo { --s: 60px !important; margin-bottom: 4px; }
.ps--mobile .is-compact .ps__logo { --s: 40px !important; }
.ps--mobile .ps__h { font-size: 30px; }
.ps--mobile .is-compact .ps__h { font-size: 22px; }
.ps--mobile .ps__m { font-size: 11px; }
.ps--mobile .ps__t { font-size: 15px; }
.ps--mobile .ps__section { margin: 22px 16px 12px; font-size: 22px; }
.ps--mobile .ps__card { display: grid; gap: 3px; margin: 0 16px 20px; font-size: 14px; }
.ps--mobile .ps__card .ps__photo { aspect-ratio: 16 / 10.5; border-radius: 8px; margin-bottom: 8px; }
.ps--mobile .ps__card b { font-size: 18px; }
.ps--mobile .ps__photo em { top: 10px; left: 10px; padding: 4px 9px; border-radius: 4px; font-size: 12px; }
.ps--mobile .ps__photo i { width: 28px; height: 28px; font-size: 16px; }
.ps--mobile .ps__toolbar { padding: 14px 16px 4px; overflow: hidden; font-size: 13px; }
.ps--mobile .ps__count { margin: 8px 16px 12px; font-size: 14px; font-weight: 700; }
.ps__price { color: #475569; }
.ps__price b { font-size: 18px; color: #0f172a; }
.ps--mobile .ps__gallery { position: relative; height: 240px; }
.ps--mobile .ps__gallery > i { position: absolute; top: 12px; left: 12px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; font-style: normal; font-size: 20px; }
.ps--mobile .ps__gallery em { right: 12px; bottom: 12px; font-size: 13px; }
.ps--mobile .ps__detail { display: grid; gap: 8px; padding: 16px; }
.ps--mobile .ps__badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; font-size: 12px; }
.ps--mobile .ps__badges em { padding: 4px 9px; border-radius: 999px; }
.ps--mobile .ps__dname { margin: 0; font-size: 26px; line-height: 1.15; }
.ps--mobile .ps__detail small { font-size: 14px; }
.ps--mobile .ps__tabs { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
.ps--mobile .ps__bookbtn { margin-top: 8px; padding: 14px; font-size: 16px; }
</style>
