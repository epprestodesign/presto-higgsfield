<script setup>
// Tour slide 3 — zoom in and out: + twice (40 → 50 → 62%), then − twice back.
import './tour.css'
import TourCanvas from './TourCanvas.vue'
import TourKey from './TourKey.vue'
import { ARROW, SHIELD } from './cursors.js'
</script>

<template>
  <svg class="tour tour-zk" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
    <g class="tour-zk__world">
      <TourCanvas id="tour-zk-dots" />

      <text class="tour-label" x="182" y="126" font-size="8">Logo</text>
      <rect class="tour-shadow" x="182" y="133" width="84" height="56" rx="6" />
      <rect class="tour-card" x="182" y="132" width="84" height="56" rx="6" />
      <path :d="SHIELD" transform="translate(224 158) scale(0.55)" fill="#030a26" />

      <text class="tour-label" x="278" y="126" font-size="8">Wide banner</text>
      <rect class="tour-shadow" x="278" y="133" width="84" height="56" rx="6" />
      <rect x="278" y="132" width="84" height="56" rx="6" fill="#0b1437" />
      <text x="320" y="163" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">Summer Camps</text>

      <text class="tour-label" x="374" y="126" font-size="8">Short banner</text>
      <rect class="tour-shadow" x="374" y="145" width="84" height="32" rx="6" />
      <rect x="374" y="144" width="84" height="32" rx="6" fill="#4c1d95" />
      <text x="416" y="163" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">Summer Camps</text>
    </g>

    <!-- Zoom pill, bottom right -->
    <rect class="tour-shadow" x="470" y="302" width="150" height="40" rx="20" />
    <rect class="tour-card" x="470" y="300" width="150" height="40" rx="20" />
    <circle class="tour-zk__hit tour-zk__hit--minus" cx="496" cy="320" r="15" />
    <circle class="tour-zk__hit tour-zk__hit--plus" cx="594" cy="320" r="15" />
    <path d="M489 320h14M587 320h14M594 313v14" stroke="#030a26" stroke-width="2" stroke-linecap="round" />
    <g font-size="13" font-weight="600" fill="#030a26" text-anchor="middle">
      <text class="tour-zk__p40" x="545" y="324.5">40%</text>
      <text class="tour-zk__p50" x="545" y="324.5">50%</text>
      <text class="tour-zk__p62" x="545" y="324.5">62%</text>
    </g>

    <circle class="tour-ripple tour-zk__rp" cx="594" cy="320" r="14" />
    <circle class="tour-ripple tour-zk__rm" cx="496" cy="320" r="14" />

    <g class="tour-zk__kin"><TourKey :x="24" :y="308" label="⌘ +" hint="zoom in" /></g>
    <g class="tour-zk__kout"><TourKey :x="24" :y="308" label="⌘ −" hint="zoom out" /></g>

    <g class="tour-zk__cursor tour-cursor">
      <path :d="ARROW" transform="scale(1.2)" />
    </g>
  </svg>
</template>

<style scoped>
.tour-zk { --tour-still: 2.9s; }
.tour-zk__world { transform-origin: 320px 160px; animation: tour-zk-world 6s ease-out infinite both; }
.tour-zk__hit { fill: #030a26; opacity: 0; }
.tour-zk__hit--plus { animation: tour-zk-hit-plus 6s linear infinite both; }
.tour-zk__hit--minus { animation: tour-zk-hit-minus 6s linear infinite both; }
.tour-zk__p40 { animation: tour-zk-p40 6s linear infinite both; }
.tour-zk__p50 { animation: tour-zk-p50 6s linear infinite both; }
.tour-zk__p62 { animation: tour-zk-p62 6s linear infinite both; }
.tour-zk__rp { animation: tour-zk-rp 6s ease-out infinite both; }
.tour-zk__rm { animation: tour-zk-rm 6s ease-out infinite both; }
.tour-zk__kin { animation: tour-zk-kin 6s linear infinite both; }
.tour-zk__kout { animation: tour-zk-kout 6s linear infinite both; }
.tour-zk__cursor { animation: tour-zk-cursor 6s ease-in-out infinite both; }

@keyframes tour-zk-world {
  0%, 18% { transform: scale(1); }
  23%, 34% { transform: scale(1.25); }
  39%, 62% { transform: scale(1.5625); }
  67%, 76% { transform: scale(1.25); }
  81%, 100% { transform: scale(1); }
}
@keyframes tour-zk-p40 {
  0%, 18% { opacity: 1; } 19%, 80% { opacity: 0; } 81%, 100% { opacity: 1; }
}
@keyframes tour-zk-p50 {
  0%, 18% { opacity: 0; } 19%, 34% { opacity: 1; } 35%, 62% { opacity: 0; }
  63%, 76% { opacity: 1; } 77%, 100% { opacity: 0; }
}
@keyframes tour-zk-p62 {
  0%, 34% { opacity: 0; } 35%, 62% { opacity: 1; } 63%, 100% { opacity: 0; }
}
@keyframes tour-zk-hit-plus {
  0%, 17% { opacity: 0; } 18%, 20% { opacity: 0.1; } 22%, 33% { opacity: 0; }
  34%, 36% { opacity: 0.1; } 38%, 100% { opacity: 0; }
}
@keyframes tour-zk-hit-minus {
  0%, 61% { opacity: 0; } 62%, 64% { opacity: 0.1; } 66%, 75% { opacity: 0; }
  76%, 78% { opacity: 0.1; } 80%, 100% { opacity: 0; }
}
@keyframes tour-zk-rp {
  0%, 17% { opacity: 0; transform: scale(0.3); }
  18% { opacity: 0.8; transform: scale(0.3); }
  26% { opacity: 0; transform: scale(1.6); }
  33% { opacity: 0; transform: scale(0.3); }
  34% { opacity: 0.8; transform: scale(0.3); }
  42%, 100% { opacity: 0; transform: scale(1.6); }
}
@keyframes tour-zk-rm {
  0%, 61% { opacity: 0; transform: scale(0.3); }
  62% { opacity: 0.8; transform: scale(0.3); }
  70% { opacity: 0; transform: scale(1.6); }
  75% { opacity: 0; transform: scale(0.3); }
  76% { opacity: 0.8; transform: scale(0.3); }
  84%, 100% { opacity: 0; transform: scale(1.6); }
}
@keyframes tour-zk-kin {
  0%, 12% { opacity: 0; } 15%, 44% { opacity: 1; } 47%, 100% { opacity: 0; }
}
@keyframes tour-zk-kout {
  0%, 56% { opacity: 0; } 59%, 86% { opacity: 1; } 89%, 100% { opacity: 0; }
}
@keyframes tour-zk-cursor {
  0% { transform: translate(560px, 230px); }
  12%, 44% { transform: translate(595px, 321px); }
  56%, 80% { transform: translate(497px, 321px); }
  92%, 100% { transform: translate(560px, 230px); }
}
</style>
