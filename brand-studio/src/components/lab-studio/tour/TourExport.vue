<script setup>
// Tour slide 6 — preview and export: ▶ Preview opens the page mockup as a
// browser window, then the export panel slides in and downloads the files.
import './tour.css'
import TourCanvas from './TourCanvas.vue'
import { ARROW } from './cursors.js'

const MINI = [{ x: 208, fill: '#c7d2fe' }, { x: 286, fill: '#bae6fd' }, { x: 364, fill: '#fde68a' }]
const HOTELS = [
  { x: 58, fill: '#c7d2fe', name: 'Lakeview Inn', price: 'From $129' },
  { x: 236, fill: '#bae6fd', name: 'Pine Lodge', price: 'From $109' },
  { x: 414, fill: '#fde68a', name: 'Harbor Hotel', price: 'From $149' },
]
const FILES = ['Logo · PNG', 'Banner 1440×400 · JPG', 'Banner 1440×240 · JPG']
</script>

<template>
  <svg class="tour tour-ex" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="tour-ex-window"><rect x="40" y="20" width="560" height="320" rx="10" /></clipPath>
    </defs>
    <TourCanvas id="tour-ex-dots" />

    <!-- Page mockup artboard -->
    <text class="tour-label" x="200" y="48">Booking page</text>
    <g class="tour-ex__link">
      <path d="M380 39.5v9l7.5-4.5z" fill="#7c3aed" />
      <text x="440" y="48" text-anchor="end" font-size="12" font-weight="600" fill="#7c3aed">Preview</text>
    </g>
    <rect class="tour-shadow" x="200" y="60" width="240" height="172" rx="10" />
    <rect class="tour-card" x="200" y="58" width="240" height="172" rx="10" />
    <rect x="208" y="66" width="224" height="64" rx="5" fill="#0b1437" />
    <text x="320" y="96" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Lakeside Summer Camps</text>
    <text x="320" y="112" text-anchor="middle" font-size="8" fill="#c7cbe0">Book your stay</text>
    <g v-for="t in MINI" :key="t.x">
      <rect :x="t.x" y="140" width="68" height="44" rx="4" :fill="t.fill" />
      <rect :x="t.x" y="190" width="50" height="6" rx="3" fill="#cfd3dc" />
      <rect :x="t.x" y="201" width="34" height="6" rx="3" fill="#e3e6ec" />
    </g>

    <!-- Expanded preview window -->
    <g class="tour-ex__browser">
      <rect class="tour-shadow" x="40" y="24" width="560" height="320" rx="10" />
      <g clip-path="url(#tour-ex-window)">
        <rect x="40" y="20" width="560" height="320" fill="#fff" />
        <rect x="40" y="20" width="560" height="28" fill="#f2f3f6" />
        <circle cx="56" cy="34" r="4" fill="#f87171" />
        <circle cx="69" cy="34" r="4" fill="#fbbf24" />
        <circle cx="82" cy="34" r="4" fill="#34d399" />
        <rect x="210" y="26" width="220" height="16" rx="8" fill="#fff" />
        <text x="320" y="37.5" text-anchor="middle" font-size="9.5" fill="#6b7180">Preview · Lakeside Summer Camps</text>
        <rect x="40" y="48" width="560" height="130" fill="#0b1437" />
        <text x="320" y="104" text-anchor="middle" font-size="24" font-weight="700" fill="#fff">Lakeside Summer Camps</text>
        <text x="320" y="126" text-anchor="middle" font-size="12" fill="#c7cbe0">Book your stay for summer 2027</text>
        <rect x="270" y="140" width="100" height="26" rx="13" fill="#fff" />
        <text x="320" y="157" text-anchor="middle" font-size="11" font-weight="600" fill="#0b1437">Find a hotel</text>
        <g v-for="h in HOTELS" :key="h.name">
          <rect :x="h.x" y="192" width="168" height="80" rx="6" :fill="h.fill" />
          <text :x="h.x" y="292" font-size="12.5" font-weight="600" fill="#030a26">{{ h.name }}</text>
          <text :x="h.x" y="309" font-size="11" fill="#6b7180">{{ h.price }}</text>
        </g>
      </g>
      <rect x="40.5" y="20.5" width="559" height="319" rx="9.5" fill="none" stroke="#dde0e7" />
      <rect class="tour-ex__dim" x="40" y="20" width="560" height="320" rx="10" fill="#030a26" />
    </g>

    <!-- Export panel -->
    <g class="tour-ex__panel">
      <rect x="372" y="40" width="236" height="288" rx="14" fill="rgb(3 10 38 / 0.12)" />
      <rect class="tour-card" x="372" y="36" width="236" height="288" rx="14" />
      <text x="390" y="68" font-size="14" font-weight="700" fill="#030a26">Graphics &amp; export</text>
      <g v-for="(f, i) in FILES" :key="f">
        <rect x="388" :y="86 + i * 46" width="204" height="38" rx="8" fill="#f4f5f8" />
        <text x="402" :y="109.5 + i * 46" font-size="12" font-weight="500" fill="#030a26">{{ f }}</text>
        <g class="tour-ex__arrow">
          <path :d="`M574 ${96 + i * 46}v12M569 ${103 + i * 46}l5 5 5-5M568 ${114 + i * 46}h12`" fill="none" stroke="#030a26" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </g>
      <g class="tour-ex__btn">
        <rect x="388" y="264" width="204" height="40" rx="20" fill="#030a26" />
        <text x="490" y="288.5" text-anchor="middle" font-size="13" font-weight="600" fill="#fff">Download ZIP</text>
      </g>
    </g>

    <circle class="tour-ripple tour-ex__r1" cx="412" cy="44" r="16" />
    <circle class="tour-ripple tour-ex__r2" cx="548" cy="286" r="16" />

    <g class="tour-ex__cursor tour-cursor">
      <path :d="ARROW" transform="scale(1.2)" />
    </g>
  </svg>
</template>

<style scoped>
.tour-ex { --tour-still: 5.6s; }
.tour-ex__browser { transform-origin: 320px 180px; animation: tour-ex-browser 8s ease-in-out infinite both; }
.tour-ex__dim { animation: tour-ex-dim 8s linear infinite both; }
.tour-ex__panel { animation: tour-ex-panel 8s ease-out infinite both; }
.tour-ex__btn { transform-origin: 490px 284px; animation: tour-ex-btn 8s ease-out infinite both; }
.tour-ex__arrow { animation: tour-ex-arrow 8s ease-in-out infinite both; }
.tour-ex__r1 { animation: tour-ex-r1 8s ease-out infinite both; }
.tour-ex__r2 { animation: tour-ex-r2 8s ease-out infinite both; }
.tour-ex__cursor { animation: tour-ex-cursor 8s ease-in-out infinite both; }

@keyframes tour-ex-browser {
  0%, 17% { opacity: 0; transform: translate(0, -36px) scale(0.43); }
  19% { opacity: 1; transform: translate(0, -36px) scale(0.43); }
  31%, 89% { opacity: 1; transform: translate(0, 0) scale(1); }
  95%, 100% { opacity: 0; transform: translate(0, 0) scale(1); }
}
@keyframes tour-ex-dim {
  0%, 46% { opacity: 0; } 54%, 84% { opacity: 0.16; } 88%, 100% { opacity: 0; }
}
@keyframes tour-ex-panel {
  0%, 46% { opacity: 0; transform: translate(260px, 0); }
  48% { opacity: 1; transform: translate(260px, 0); }
  55%, 84% { opacity: 1; transform: translate(0, 0); }
  88%, 100% { opacity: 0; transform: translate(0, 0); }
}
@keyframes tour-ex-btn {
  0%, 72% { transform: scale(1); } 74% { transform: scale(0.94); } 77%, 100% { transform: scale(1); }
}
@keyframes tour-ex-arrow {
  0%, 74% { transform: translate(0, 0); } 77% { transform: translate(0, 3px); }
  80% { transform: translate(0, 0); } 83% { transform: translate(0, 3px); } 86%, 100% { transform: translate(0, 0); }
}
@keyframes tour-ex-r1 {
  0%, 14% { opacity: 0; transform: scale(0.3); }
  15% { opacity: 0.8; transform: scale(0.3); }
  21%, 100% { opacity: 0; transform: scale(1.6); }
}
@keyframes tour-ex-r2 {
  0%, 72% { opacity: 0; transform: scale(0.3); }
  73% { opacity: 0.8; transform: scale(0.3); }
  80%, 100% { opacity: 0; transform: scale(1.6); }
}
@keyframes tour-ex-cursor {
  0% { transform: translate(300px, 300px); }
  11%, 17% { transform: translate(412px, 44px); }
  32%, 56% { transform: translate(330px, 250px); }
  68%, 82% { transform: translate(548px, 286px); }
  100% { transform: translate(300px, 300px); }
}
</style>
