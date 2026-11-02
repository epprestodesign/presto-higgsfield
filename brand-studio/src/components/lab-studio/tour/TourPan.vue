<script setup>
// Tour slide 1 — pan: Space held, the hand grabs empty canvas and drags the
// artboards left, then back.
import './tour.css'
import TourCanvas from './TourCanvas.vue'
import TourKey from './TourKey.vue'
import { HAND_CLOSED, HAND_OPEN, SHIELD } from './cursors.js'
</script>

<template>
  <svg class="tour tour-pan" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
    <g class="tour-pan__world">
      <TourCanvas id="tour-pan-dots" />
      <g transform="translate(0 18)">

        <!-- Logo -->
        <text class="tour-label" x="40" y="92">Logo</text>
        <rect class="tour-shadow" x="40" y="102" width="120" height="120" rx="10" />
        <rect class="tour-card" x="40" y="100" width="120" height="120" rx="10" />
        <path :d="SHIELD" transform="translate(100 158) scale(1.1)" fill="#030a26" />
        <path d="M-8-10v20h16" transform="translate(100 158)" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round" />

        <!-- Wide banner -->
        <text class="tour-label" x="190" y="92">Wide banner</text>
        <rect class="tour-shadow" x="190" y="102" width="200" height="80" rx="10" />
        <rect x="190" y="100" width="200" height="80" rx="10" fill="#0b1437" />
        <text x="290" y="138" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">Summer Camps</text>
        <text x="290" y="157" text-anchor="middle" font-size="10" fill="#c7cbe0">Book your stay</text>

        <!-- Short banner -->
        <text class="tour-label" x="420" y="92">Short banner</text>
        <rect class="tour-shadow" x="420" y="102" width="200" height="56" rx="10" />
        <rect x="420" y="100" width="200" height="56" rx="10" fill="#4c1d95" />
        <text x="520" y="133" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">Summer Camps</text>

        <!-- Page -->
        <text class="tour-label" x="650" y="92">Page</text>
        <rect class="tour-shadow" x="650" y="102" width="150" height="130" rx="10" />
        <rect class="tour-card" x="650" y="100" width="150" height="130" rx="10" />
        <rect x="658" y="108" width="134" height="44" rx="5" fill="#0b1437" />
        <rect x="690" y="124" width="70" height="7" rx="3.5" fill="#fff" />
        <rect x="658" y="160" width="40" height="62" rx="5" fill="#dfe3ee" />
        <rect x="705" y="160" width="40" height="62" rx="5" fill="#dfe3ee" />
      <rect x="752" y="160" width="40" height="62" rx="5" fill="#dfe3ee" />
      </g>
    </g>

    <g class="tour-pan__key">
      <TourKey :x="24" :y="308" label="Space" hint="hold + drag" />
    </g>

    <g class="tour-pan__hand tour-hand">
      <g transform="scale(1.5) translate(-12 -12)">
        <path class="tour-pan__open" :d="HAND_OPEN" />
        <path class="tour-pan__closed" :d="HAND_CLOSED" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.tour-pan { --tour-still: 1.8s; }
.tour-pan__world { animation: tour-pan-world 5s ease-in-out infinite both; }
.tour-pan__hand { animation: tour-pan-hand 5s ease-in-out infinite both; }
.tour-pan__open { animation: tour-pan-open 5s linear infinite both; }
.tour-pan__closed { animation: tour-pan-closed 5s linear infinite both; }
.tour-pan__key { animation: tour-pan-key 5s ease-out infinite both; }

@keyframes tour-pan-world {
  0%, 10% { transform: translate(0, 0); }
  42%, 54% { transform: translate(-150px, 0); }
  86%, 100% { transform: translate(0, 0); }
}
@keyframes tour-pan-hand {
  0%, 10% { transform: translate(400px, 290px); }
  42%, 54% { transform: translate(250px, 290px); }
  86%, 100% { transform: translate(400px, 290px); }
}
@keyframes tour-pan-closed {
  0%, 8% { opacity: 0; }
  9%, 44% { opacity: 1; }
  45%, 52% { opacity: 0; }
  53%, 87% { opacity: 1; }
  88%, 100% { opacity: 0; }
}
@keyframes tour-pan-open {
  0%, 8% { opacity: 1; }
  9%, 44% { opacity: 0; }
  45%, 52% { opacity: 1; }
  53%, 87% { opacity: 0; }
  88%, 100% { opacity: 1; }
}
@keyframes tour-pan-key {
  0% { opacity: 0; transform: translate(0, 6px); }
  6%, 90% { opacity: 1; transform: translate(0, 0); }
  96%, 100% { opacity: 0; transform: translate(0, 6px); }
}
</style>
