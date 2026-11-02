<script setup>
// Tour slide 2 — zoom to a frame: double-click a frame, the view fills with
// it, then Esc brings every frame back.
import './tour.css'
import TourCanvas from './TourCanvas.vue'
import TourKey from './TourKey.vue'
import { ARROW, SHIELD } from './cursors.js'
</script>

<template>
  <svg class="tour tour-zoom" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
    <g class="tour-zoom__world">
      <TourCanvas id="tour-zoom-dots" />

      <g class="tour-zoom__labels">
        <text class="tour-label" x="60" y="112">Logo</text>
        <text class="tour-label" x="250" y="112">Wide banner</text>
        <text class="tour-label" x="440" y="112">Short banner</text>
      </g>

      <!-- Logo -->
      <rect class="tour-shadow" x="60" y="122" width="140" height="90" rx="8" />
      <rect class="tour-card" x="60" y="120" width="140" height="90" rx="8" />
      <path :d="SHIELD" transform="translate(130 163) scale(0.85)" fill="#030a26" />

      <!-- Wide banner (the one we zoom to) -->
      <rect class="tour-shadow" x="250" y="122" width="140" height="90" rx="8" />
      <rect x="250" y="120" width="140" height="90" rx="8" fill="#0b1437" />
      <circle cx="368" cy="140" r="16" fill="#7c3aed" opacity="0.45" />
      <text x="320" y="160" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">Summer Camps</text>
      <text x="320" y="174" text-anchor="middle" font-size="7" fill="#c7cbe0">Lakeside · July 2027</text>
      <rect x="296" y="182" width="48" height="14" rx="7" fill="#fff" />
      <text x="320" y="192" text-anchor="middle" font-size="7" font-weight="600" fill="#0b1437">Book now</text>

      <!-- Short banner -->
      <rect class="tour-shadow" x="440" y="142" width="140" height="50" rx="8" />
      <rect x="440" y="140" width="140" height="50" rx="8" fill="#4c1d95" />
      <text x="510" y="169" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">Summer Camps</text>

      <rect class="tour-zoom__outline" x="247" y="117" width="146" height="96" rx="10" />
    </g>

    <circle class="tour-ripple tour-zoom__r1" cx="368" cy="199" r="14" />
    <circle class="tour-ripple tour-zoom__r2" cx="368" cy="199" r="14" />

    <g class="tour-zoom__cap1">
      <rect x="24" y="308" width="104" height="30" rx="15" fill="#030a26" />
      <text x="76" y="327.5" text-anchor="middle" font-size="12.5" font-weight="600" fill="#fff">Double-click</text>
    </g>
    <g class="tour-zoom__cap2">
      <TourKey :x="24" :y="308" label="Esc" hint="see all frames" />
    </g>

    <g class="tour-zoom__cursor tour-cursor">
      <path :d="ARROW" transform="scale(1.2)" />
    </g>
  </svg>
</template>

<style scoped>
.tour-zoom { --tour-still: 3.2s; }
.tour-zoom__world { transform-origin: 320px 165px; animation: tour-zoom-world 6s ease-in-out infinite both; }
.tour-zoom__labels { animation: tour-zoom-labels 6s linear infinite both; }
.tour-zoom__outline { fill: none; stroke: #2563eb; stroke-width: 2.5; vector-effect: non-scaling-stroke; animation: tour-zoom-outline 6s linear infinite both; }
.tour-zoom__r1 { animation: tour-zoom-r1 6s ease-out infinite both; }
.tour-zoom__r2 { animation: tour-zoom-r2 6s ease-out infinite both; }
.tour-zoom__cap1 { animation: tour-zoom-cap1 6s linear infinite both; }
.tour-zoom__cap2 { animation: tour-zoom-cap2 6s linear infinite both; }
.tour-zoom__cursor { animation: tour-zoom-cursor 6s ease-in-out infinite both; }

@keyframes tour-zoom-world {
  0%, 30% { transform: translate(0, 0) scale(1); }
  46%, 64% { transform: translate(0, 15px) scale(2.8); }
  80%, 100% { transform: translate(0, 0) scale(1); }
}
@keyframes tour-zoom-labels {
  0%, 30% { opacity: 1; }
  35%, 75% { opacity: 0; }
  80%, 100% { opacity: 1; }
}
@keyframes tour-zoom-outline {
  0%, 23% { opacity: 0; }
  25%, 80% { opacity: 1; }
  84%, 100% { opacity: 0; }
}
@keyframes tour-zoom-r1 {
  0%, 15% { opacity: 0; transform: scale(0.3); }
  16% { opacity: 0.8; transform: scale(0.3); }
  24%, 100% { opacity: 0; transform: scale(1.7); }
}
@keyframes tour-zoom-r2 {
  0%, 20% { opacity: 0; transform: scale(0.3); }
  21% { opacity: 0.8; transform: scale(0.3); }
  29%, 100% { opacity: 0; transform: scale(1.7); }
}
@keyframes tour-zoom-cap1 {
  0%, 12% { opacity: 0; }
  15%, 44% { opacity: 1; }
  48%, 100% { opacity: 0; }
}
@keyframes tour-zoom-cap2 {
  0%, 56% { opacity: 0; }
  60%, 82% { opacity: 1; }
  86%, 100% { opacity: 0; }
}
@keyframes tour-zoom-cursor {
  0% { opacity: 1; transform: translate(520px, 300px); }
  14%, 28% { opacity: 1; transform: translate(368px, 199px); }
  33% { opacity: 0; transform: translate(368px, 199px); }
  90% { opacity: 0; transform: translate(520px, 300px); }
  96%, 100% { opacity: 1; transform: translate(520px, 300px); }
}
</style>
