<script setup>
// A simplified Presto booking screen (landing, hotel listings or hotel
// details) on desktop or phone, branded with the project's logo, banner,
// colours and page text. Sizes use container units so it scales to fit.
import { computed } from 'vue'
import LogoMark from '../LogoMark.vue'

const props = defineProps({
  project: { type: Object, required: true },
  screen: { type: String, default: 'landing' }, // landing | listings | details
  device: { type: String, default: 'desktop' }, // desktop | mobile
  /** Browser / phone frame chrome (off in the stacked thumbnails). */
  chrome: { type: Boolean, default: true },
})
const emit = defineEmits(['edit'])

const photos = import.meta.glob('../../assets/hotel/*.jpg', { eager: true, query: '?url', import: 'default' })
const photo = (id) => photos[`../../assets/hotel/${id}.jpg`]

const HOTELS = [
  { name: 'The Overland Suites', img: 'exterior', stars: 4, miles: '0.4', price: 149, left: 6 },
  { name: 'Hilton Garden Inn Downtown', img: 'deluxe-king', stars: 3, miles: '1.1', price: 132, left: 14 },
  { name: 'Courtyard by the Park', img: 'pool', stars: 3, miles: '1.8', price: 119, left: 3 },
]
const c = computed(() => props.project.copy)
const bg = computed(() => props.project.selected || { src: props.project.brand.images[0].src, filter: '' })
const main = computed(() => props.project.palette[0])
const accent = computed(() => props.project.palette[1])
const compact = computed(() => props.screen !== 'landing')
</script>

<template>
  <div class="ps" :class="[`ps--${device}`, `ps--${screen}`]">
    <div v-if="chrome && device === 'desktop'" class="ps__bar"><i /><i /><i /></div>
    <div v-else-if="chrome" class="ps__status"><b>9:41</b><span>●●● ▮</span></div>

    <div class="ps__view">
      <!-- Top nav -->
      <header v-if="chrome" class="ps__nav">
        <span class="ps__navlogo"><LogoMark :project="project" look="original" :size="0" /></span>
        <span v-if="device === 'desktop'" class="ps__links"><span>Hotels</span><span>Event info</span><span>My booking</span></span>
        <span class="ps__help">{{ device === 'desktop' ? 'Need help?' : '☰' }}</span>
      </header>

      <!-- Hero banner -->
      <section class="ps__hero" :class="{ 'is-compact': compact }">
        <span class="ps__img" :style="{ backgroundImage: `url(${bg.src})`, filter: bg.filter || undefined }" />
        <div class="ps__copy">
          <LogoMark :project="project" :size="0" class="ps__logo" />
          <div class="ps__lines">
            <button v-if="c.show.headline" type="button" class="ps__h" @click="emit('edit')">{{ c.headline }}</button>
            <button v-if="c.show.meta" type="button" class="ps__m" @click="emit('edit')">{{ c.meta }}</button>
            <button v-if="c.show.tagline && !compact" type="button" class="ps__t" @click="emit('edit')">{{ c.tagline }}</button>
          </div>
        </div>
      </section>

      <!-- Landing: search + featured hotels -->
      <template v-if="screen === 'landing'">
        <div class="ps__search">
          <span><small>Check-in</small>Jun 11</span><span><small>Check-out</small>Jun 15</span><span><small>Guests</small>2 adults</span>
          <b :style="{ background: main }">Search hotels</b>
        </div>
        <p class="ps__section">Featured hotels near the venue</p>
        <div class="ps__grid">
          <article v-for="h in HOTELS" :key="h.name" class="ps__tile">
            <img :src="photo(h.img)" alt="" />
            <b>{{ h.name }}</b>
            <small>{{ '★'.repeat(h.stars) }} · {{ h.miles }} mi from venue</small>
            <em :style="{ color: main }">from ${{ h.price }}<i>/night</i></em>
          </article>
        </div>
      </template>

      <!-- Listings: filters + rows (+ map on desktop) -->
      <template v-else-if="screen === 'listings'">
        <div class="ps__filters"><span class="is-on" :style="{ background: main, borderColor: main }">All hotels</span><span>Under $150</span><span>Walk to venue</span><span>Pool</span></div>
        <div class="ps__split">
          <ul class="ps__rows">
            <li v-for="h in HOTELS" :key="h.name">
              <img :src="photo(h.img)" alt="" />
              <div><b>{{ h.name }}</b><small>{{ '★'.repeat(h.stars) }} · {{ h.miles }} mi</small><small class="ps__left" :style="{ color: accent }">{{ h.left }} rooms left</small></div>
              <em :style="{ color: main }">${{ h.price }}</em>
            </li>
          </ul>
          <div v-if="device === 'desktop'" class="ps__map"><i v-for="n in 3" :key="n" :style="{ background: main }">${{ HOTELS[n - 1].price }}</i></div>
        </div>
      </template>

      <!-- Details: gallery + rooms -->
      <template v-else>
        <div class="ps__gallery"><img :src="photo('exterior')" alt="" /><img :src="photo('lobby')" alt="" /><img :src="photo('restaurant')" alt="" /></div>
        <div class="ps__detail">
          <div>
            <b class="ps__dname">The Overland Suites</b>
            <small>★★★★ · 0.4 mi from venue · Free breakfast</small>
          </div>
          <b class="ps__book" :style="{ background: main }">Book a room</b>
        </div>
        <ul class="ps__rooms">
          <li><img :src="photo('deluxe-king')" alt="" /><span><b>Deluxe King</b><small>1 king · sleeps 2</small></span><em :style="{ color: main }">$149</em></li>
          <li><img :src="photo('ocean-suite')" alt="" /><span><b>Two Queen Suite</b><small>2 queens · sleeps 4</small></span><em :style="{ color: main }">$189</em></li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Desktop is drawn at a 1440px design width, the phone at 390px; both scale with the frame. */
.ps { container-type: inline-size; overflow: hidden; background: #fff; color: #0f172a; font-family: var(--sans); }
.ps--desktop { border: 1px solid var(--line); border-radius: var(--r-card); }
.ps--mobile { width: 290px; margin: 0 auto; border: 8px solid #0f172a; border-radius: 36px; box-shadow: var(--shadow-overlay); }
.ps--mobile .ps__view { height: 540px; overflow: hidden; }

.ps__bar { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #f1f5f9; font-size: 11px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
.ps__bar i { width: 9px; height: 9px; border-radius: 50%; background: #cbd5e1; }
.ps__bar span { margin-left: 10px; }
.ps__status { display: flex; justify-content: space-between; padding: 8px 18px 4px; font-size: 11px; }
.ps__status span { letter-spacing: 1px; font-size: 9px; }

.ps__nav { display: flex; align-items: center; gap: 3cqw; padding: 1.1cqw 5cqw; border-bottom: 1px solid #e2e8f0; font-size: max(10px, 1.05cqw); }
.ps--mobile .ps__nav { padding: 3cqw 5cqw; font-size: 4cqw; }
.ps__navlogo :deep(.lm) { --s: 3.4cqw !important; }
.ps--mobile .ps__navlogo :deep(.lm) { --s: 10cqw !important; }
.ps__links { display: flex; gap: 2.4cqw; flex: 1; justify-content: flex-end; font-weight: 700; color: #334155; }
.ps__help { margin-left: auto; color: #475569; }
.ps__links + .ps__help { margin-left: 0; padding-left: 2cqw; border-left: 1px solid #e2e8f0; }

.ps__hero { position: relative; aspect-ratio: 1440 / 400; overflow: hidden; color: #fff; }
.ps__hero.is-compact { aspect-ratio: 1440 / 240; }
.ps--mobile .ps__hero { aspect-ratio: 390 / 250; }
.ps--mobile .ps__hero.is-compact { aspect-ratio: 390 / 150; }
.ps__img { position: absolute; inset: 0; background: center / cover; }
.ps__hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(1, 17, 62, 0.72), rgba(1, 17, 62, 0.12) 75%); }
.ps--mobile .ps__hero::after { background: linear-gradient(0deg, rgba(1, 17, 62, 0.8), rgba(1, 17, 62, 0.1) 85%); }
.ps__copy { position: relative; z-index: 1; display: flex; align-items: center; gap: 2.6cqw; height: 100%; padding: 0 5cqw; }
.ps--mobile .ps__copy { flex-direction: column; align-items: flex-start; justify-content: flex-end; gap: 2.5cqw; padding: 5cqw; }
.ps--mobile .is-compact .ps__copy { flex-direction: row; align-items: center; }
.ps__logo { --s: 12cqw !important; }
.is-compact .ps__logo { --s: 7cqw !important; }
.ps--mobile .ps__logo { --s: 20cqw !important; }
.ps--mobile .is-compact .ps__logo { --s: 15cqw !important; }
.ps__lines { display: grid; justify-items: start; gap: 0.5cqw; }
.ps__lines button { padding: 0; border: 0; background: none; color: inherit; text-align: left; cursor: text; border-radius: 2px; font-family: var(--sans); }
.ps__lines button:hover { outline: 1px dashed rgba(255, 255, 255, 0.8); outline-offset: 3px; }
.ps__h { font-weight: 700; font-size: 3.6cqw; line-height: 1.05; text-transform: uppercase; }
.is-compact .ps__h { font-size: 2.5cqw; }
.ps__m { font-weight: 700; font-size: 1.15cqw; letter-spacing: 0.1em; opacity: 0.92; }
.ps__t { font-size: 1.5cqw; opacity: 0.92; }
.ps--mobile .ps__h { font-size: 7.4cqw; }
.ps--mobile .is-compact .ps__h { font-size: 5.6cqw; }
.ps--mobile .ps__m { font-size: 3cqw; }
.ps--mobile .ps__t { font-size: 3.8cqw; }

.ps__search { display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 0.8cqw; align-items: center; margin: -2.4cqw 5cqw 0; position: relative; z-index: 2; padding: 0.8cqw; border: 1px solid #e2e8f0; border-radius: 4px; background: #fff; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.1); font-size: max(10px, 1.15cqw); }
.ps__search span { display: grid; padding: 0.4cqw 1cqw; border-right: 1px solid #e2e8f0; font-weight: 700; }
.ps__search small { font-weight: 400; color: #64748b; font-size: 0.85em; }
.ps__search b { padding: 1.1cqw 2.2cqw; border-radius: 4px; color: #fff; }
.ps--mobile .ps__search { grid-template-columns: 1fr 1fr; margin: 4cqw; gap: 2cqw; padding: 3cqw; font-size: 3.4cqw; box-shadow: none; }
.ps--mobile .ps__search span { border-right: 0; padding: 0; }
.ps--mobile .ps__search span:nth-child(3) { display: none; }
.ps--mobile .ps__search b { grid-column: 1 / -1; text-align: center; padding: 3cqw; }
.ps__section { margin: 2.4cqw 5cqw 1.2cqw; font-weight: 700; font-size: max(11px, 1.4cqw); }
.ps--mobile .ps__section { margin: 2cqw 4cqw 2cqw; font-size: 4.2cqw; }
.ps__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6cqw; padding: 0 5cqw 3cqw; }
.ps--mobile .ps__grid { grid-template-columns: 1fr; gap: 4cqw; padding: 0 4cqw 4cqw; }
.ps__tile { display: grid; gap: 0.3cqw; font-size: max(10px, 1.1cqw); }
.ps--mobile .ps__tile { font-size: 3.6cqw; gap: 1cqw; }
.ps__tile img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 4px; margin-bottom: 0.4cqw; }
.ps__tile small { color: #64748b; }
.ps__tile em, .ps__rows em, .ps__rooms em { font-style: normal; font-weight: 700; }
.ps__tile em i { font-style: normal; font-weight: 400; color: #64748b; }

.ps__filters { display: flex; gap: 0.8cqw; padding: 1.6cqw 5cqw 0; font-size: max(10px, 1.05cqw); }
.ps__filters span { padding: 0.5cqw 1.4cqw; border: 1px solid #cbd5e1; border-radius: 999px; }
.ps__filters .is-on { color: #fff; font-weight: 700; }
.ps--mobile .ps__filters { gap: 2cqw; padding: 4cqw 4cqw 0; font-size: 3.4cqw; overflow: hidden; white-space: nowrap; }
.ps--mobile .ps__filters span { padding: 1.4cqw 3.4cqw; }
.ps__split { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.6cqw; padding: 1.6cqw 5cqw 3cqw; }
.ps--mobile .ps__split { grid-template-columns: 1fr; padding: 4cqw; }
.ps__rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 1cqw; align-content: start; }
.ps--mobile .ps__rows { gap: 3cqw; }
.ps__rows li { display: flex; align-items: center; gap: 1.4cqw; padding: 0.8cqw; border: 1px solid #e2e8f0; border-radius: 4px; font-size: max(10px, 1.1cqw); }
.ps--mobile .ps__rows li { gap: 3cqw; padding: 2cqw; font-size: 3.5cqw; }
.ps__rows img { width: 9cqw; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 2px; }
.ps--mobile .ps__rows img { width: 26cqw; }
.ps__rows li div { flex: 1; display: grid; }
.ps__rows small { color: #64748b; }
.ps__left { font-weight: 700; }
.ps__map { position: relative; border-radius: 4px; background: repeating-linear-gradient(45deg, #eef2f7 0 10px, #f5f7fa 10px 20px); min-height: 18cqw; }
.ps__map i { position: absolute; padding: 0.3cqw 0.8cqw; border-radius: 999px; color: #fff; font-style: normal; font-weight: 700; font-size: max(9px, 0.95cqw); }
.ps__map i:nth-child(1) { top: 20%; left: 30%; } .ps__map i:nth-child(2) { top: 50%; left: 60%; } .ps__map i:nth-child(3) { top: 72%; left: 22%; }

.ps__gallery { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; gap: 0.6cqw; padding: 1.6cqw 5cqw 0; height: 20cqw; }
.ps__gallery img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.ps__gallery img:first-child { grid-row: 1 / 3; }
.ps--mobile .ps__gallery { grid-template-columns: 1fr; grid-template-rows: 1fr; height: 44cqw; padding: 0; gap: 0; }
.ps--mobile .ps__gallery img { border-radius: 0; }
.ps--mobile .ps__gallery img:not(:first-child) { display: none; }
.ps__detail { display: flex; align-items: center; justify-content: space-between; gap: 2cqw; padding: 1.6cqw 5cqw; font-size: max(10px, 1.1cqw); }
.ps__detail > div { display: grid; }
.ps__detail small { color: #64748b; }
.ps__dname { font-size: max(13px, 1.8cqw); }
.ps__book { padding: 0.9cqw 2cqw; border-radius: 4px; color: #fff; white-space: nowrap; }
.ps--mobile .ps__detail { flex-direction: column; align-items: stretch; padding: 4cqw; font-size: 3.4cqw; }
.ps--mobile .ps__dname { font-size: 5cqw; }
.ps--mobile .ps__book { text-align: center; padding: 3cqw; }
.ps__rooms { list-style: none; margin: 0; padding: 0 5cqw 3cqw; display: grid; gap: 1cqw; }
.ps--mobile .ps__rooms { padding: 0 4cqw 4cqw; gap: 3cqw; }
.ps__rooms li { display: flex; align-items: center; gap: 1.4cqw; padding: 0.8cqw; border: 1px solid #e2e8f0; border-radius: 4px; font-size: max(10px, 1.1cqw); }
.ps--mobile .ps__rooms li { gap: 3cqw; padding: 2cqw; font-size: 3.5cqw; }
.ps__rooms img { width: 9cqw; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 2px; }
.ps--mobile .ps__rooms img { width: 26cqw; }
.ps__rooms span { flex: 1; display: grid; }
.ps__rooms small { color: #64748b; }
</style>
