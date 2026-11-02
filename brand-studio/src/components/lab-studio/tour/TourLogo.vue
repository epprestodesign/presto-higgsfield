<script setup>
// Tour slide 5 — make the logo read on dark banners: pick the "White" look,
// the crest pops white and the contrast score turns green.
import './tour.css'
import TourCanvas from './TourCanvas.vue'
import { ARROW, SHIELD } from './cursors.js'

const LOOKS = [
  { x: 124, label: 'Original', look: 'dark' },
  { x: 258, label: 'White', look: 'white' },
  { x: 392, label: 'White box', look: 'box' },
]
</script>

<template>
  <svg class="tour tour-logo" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
    <TourCanvas id="tour-logo-dots" />

    <!-- Banner -->
    <rect class="tour-shadow" x="150" y="30" width="340" height="150" rx="12" />
    <rect x="150" y="28" width="340" height="150" rx="12" fill="#0b1437" />
    <g transform="translate(320 88)">
      <path :d="SHIELD" fill="#18224a" />
      <path d="M-8-12v22h16" fill="none" stroke="#212c58" stroke-width="5" stroke-linejoin="round" />
    </g>
    <g class="tour-logo__pop">
      <g transform="translate(320 88)">
        <path :d="SHIELD" fill="#fff" />
        <path d="M-8-12v22h16" fill="none" stroke="#0b1437" stroke-width="5" stroke-linejoin="round" />
      </g>
    </g>
    <text x="320" y="156" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">Lakeside Summer Camps</text>

    <!-- Contrast scores -->
    <g class="tour-logo__bad">
      <rect x="406" y="40" width="72" height="24" rx="12" fill="#fee2e2" />
      <text x="442" y="56.5" text-anchor="middle" font-size="12" font-weight="700" fill="#b91c1c">1.4:1</text>
    </g>
    <g class="tour-logo__good">
      <rect x="406" y="40" width="72" height="24" rx="12" fill="#dcfce7" />
      <path d="M418 52.5l3.5 3.5 6.5-7" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <text x="451" y="56.5" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">8.8:1</text>
    </g>

    <!-- Look cards -->
    <g v-for="l in LOOKS" :key="l.label">
      <rect class="tour-shadow" :x="l.x" y="206" width="124" height="118" rx="10" />
      <rect class="tour-card" :x="l.x" y="204" width="124" height="118" rx="10" />
      <rect :x="l.x + 10" y="214" width="104" height="66" rx="6" fill="#0b1437" />
      <rect v-if="l.look === 'box'" :x="l.x + 46" y="226" width="32" height="42" rx="5" fill="#fff" />
      <g :transform="`translate(${l.x + 62} 246) scale(0.48)`">
        <path :d="SHIELD" :fill="l.look === 'white' ? '#fff' : l.look === 'box' ? '#0b1437' : '#18224a'" />
      </g>
      <text :x="l.x + 62" y="305" text-anchor="middle" font-size="12.5" font-weight="600" fill="#030a26">{{ l.label }}</text>
    </g>
    <rect class="tour-logo__sel tour-logo__sel--a" x="122" y="202" width="128" height="122" rx="12" />
    <rect class="tour-logo__sel tour-logo__sel--b" x="256" y="202" width="128" height="122" rx="12" />

    <circle class="tour-ripple tour-logo__r" cx="320" cy="262" r="16" />

    <g class="tour-logo__cursor tour-cursor">
      <path :d="ARROW" transform="scale(1.2)" />
    </g>
  </svg>
</template>

<style scoped>
.tour-logo { --tour-still: 3s; }
.tour-logo__pop { transform-origin: 320px 90px; animation: tour-logo-pop 6s ease-out infinite both; }
.tour-logo__bad { animation: tour-logo-bad 6s linear infinite both; }
.tour-logo__good { animation: tour-logo-good 6s ease-out infinite both; }
.tour-logo__sel { fill: none; stroke: #7c3aed; stroke-width: 2; }
.tour-logo__sel--a { animation: tour-logo-sel-a 6s linear infinite both; }
.tour-logo__sel--b { animation: tour-logo-sel-b 6s linear infinite both; }
.tour-logo__r { animation: tour-logo-r 6s ease-out infinite both; }
.tour-logo__cursor { animation: tour-logo-cursor 6s ease-in-out infinite both; }

@keyframes tour-logo-pop {
  0%, 31% { opacity: 0; transform: scale(0.85); }
  35% { opacity: 1; transform: scale(1.16); }
  41%, 88% { opacity: 1; transform: scale(1); }
  93%, 100% { opacity: 0; transform: scale(1); }
}
@keyframes tour-logo-bad {
  0%, 32% { opacity: 1; } 35%, 90% { opacity: 0; } 94%, 100% { opacity: 1; }
}
@keyframes tour-logo-good {
  0%, 36% { opacity: 0; transform: translate(0, -4px); }
  41%, 88% { opacity: 1; transform: translate(0, 0); }
  92%, 100% { opacity: 0; transform: translate(0, 0); }
}
@keyframes tour-logo-sel-a {
  0%, 29% { opacity: 1; } 30%, 90% { opacity: 0; } 91%, 100% { opacity: 1; }
}
@keyframes tour-logo-sel-b {
  0%, 29% { opacity: 0; } 30%, 90% { opacity: 1; } 91%, 100% { opacity: 0; }
}
@keyframes tour-logo-r {
  0%, 27% { opacity: 0; transform: scale(0.3); }
  28% { opacity: 0.8; transform: scale(0.3); }
  35%, 100% { opacity: 0; transform: scale(1.6); }
}
@keyframes tour-logo-cursor {
  0% { transform: translate(520px, 340px); }
  22%, 34% { transform: translate(320px, 262px); }
  56%, 86% { transform: translate(560px, 250px); }
  100% { transform: translate(520px, 340px); }
}
</style>
