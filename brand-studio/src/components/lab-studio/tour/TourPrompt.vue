<script setup>
// Tour slide 4 — start from a suggestion: click a chip, its prompt types into
// the box, then send.
import './tour.css'
import TourCanvas from './TourCanvas.vue'
import { ARROW } from './cursors.js'

const CHIPS = [
  { x: 33, w: 196, label: 'Make it darker and moodier' },
  { x: 239, w: 176, label: 'Try an abstract version' },
  { x: 425, w: 182, label: 'More space in the center' },
]
</script>

<template>
  <svg class="tour tour-pr" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
    <TourCanvas id="tour-pr-dots" />

    <text class="tour-label" x="35" y="62" font-size="12">Try a suggestion</text>
    <g v-for="c in CHIPS" :key="c.label">
      <rect class="tour-shadow" :x="c.x" y="76" :width="c.w" height="32" rx="16" />
      <rect class="tour-card" :x="c.x" y="74" :width="c.w" height="32" rx="16" />
    </g>
    <rect class="tour-pr__picked" x="33.75" y="74.75" width="194.5" height="30.5" rx="15.25" />
    <text v-for="c in CHIPS" :key="`t-${c.label}`" :x="c.x + c.w / 2" y="94.5" text-anchor="middle" font-size="12" font-weight="500" fill="#030a26">{{ c.label }}</text>

    <!-- Prompt box -->
    <rect class="tour-shadow" x="33" y="132" width="574" height="170" rx="16" />
    <rect class="tour-card" x="33" y="130" width="574" height="170" rx="16" />
    <g class="tour-pr__typed" font-size="15" fill="#030a26">
      <text x="55" y="166">Make the banner darker and moodier:</text>
      <text x="55" y="190">deepen the shadows…</text>
    </g>
    <rect class="tour-pr__cover tour-pr__cover--1" x="53" y="148" width="274" height="24" fill="#fff" />
    <rect class="tour-pr__cover tour-pr__cover--2" x="53" y="172" width="168" height="24" fill="#fff" />
    <text class="tour-pr__placeholder" x="55" y="166" font-size="15" fill="#9aa0ad">Describe a change…</text>
    <g class="tour-pr__status">
      <circle cx="61" cy="266" r="4" fill="#7c3aed" />
      <text x="73" y="270.5" font-size="12.5" font-weight="500" fill="#7c3aed">Making new banners…</text>
    </g>

    <g class="tour-pr__send">
      <circle cx="571" cy="266" r="18" fill="#030a26" />
      <path d="M571 274v-16M564 265l7-7 7 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <circle class="tour-ripple tour-pr__r1" cx="131" cy="90" r="16" />
    <circle class="tour-ripple tour-pr__r2" cx="571" cy="266" r="16" />

    <g class="tour-pr__cursor tour-cursor">
      <path :d="ARROW" transform="scale(1.2)" />
    </g>
  </svg>
</template>

<style scoped>
.tour-pr { --tour-still: 4.6s; }
.tour-pr__picked { fill: #ede9fe; stroke: #7c3aed; stroke-width: 1.5; animation: tour-pr-picked 7s linear infinite both; }
.tour-pr__typed { animation: tour-pr-typed 7s linear infinite both; }
.tour-pr__cover { transform-box: fill-box; transform-origin: 100% 50%; }
.tour-pr__cover--1 { animation: tour-pr-cover1 7s linear infinite both; }
.tour-pr__cover--2 { animation: tour-pr-cover2 7s linear infinite both; }
.tour-pr__placeholder { animation: tour-pr-placeholder 7s linear infinite both; }
.tour-pr__status { animation: tour-pr-status 7s linear infinite both; }
.tour-pr__send { transform-origin: 571px 266px; animation: tour-pr-send 7s ease-out infinite both; }
.tour-pr__r1 { animation: tour-pr-r1 7s ease-out infinite both; }
.tour-pr__r2 { animation: tour-pr-r2 7s ease-out infinite both; }
.tour-pr__cursor { animation: tour-pr-cursor 7s ease-in-out infinite both; }

@keyframes tour-pr-picked {
  0%, 16% { opacity: 0; } 17%, 90% { opacity: 1; } 94%, 100% { opacity: 0; }
}
@keyframes tour-pr-placeholder {
  0%, 17% { opacity: 1; } 19%, 92% { opacity: 0; } 95%, 100% { opacity: 1; }
}
@keyframes tour-pr-typed {
  0%, 86% { opacity: 1; } 89%, 94% { opacity: 0; } 97%, 100% { opacity: 1; }
}
/* The white covers shrink to the right in steps, so the words appear as if typed. */
@keyframes tour-pr-cover1 {
  0%, 21% { transform: scaleX(1); animation-timing-function: steps(14, end); }
  46%, 90% { transform: scaleX(0); }
  92%, 100% { transform: scaleX(1); }
}
@keyframes tour-pr-cover2 {
  0%, 47% { transform: scaleX(1); animation-timing-function: steps(8, end); }
  58%, 90% { transform: scaleX(0); }
  92%, 100% { transform: scaleX(1); }
}
@keyframes tour-pr-status {
  0%, 75% { opacity: 0; } 78%, 87% { opacity: 1; } 90%, 100% { opacity: 0; }
}
@keyframes tour-pr-send {
  0%, 71% { transform: scale(1); } 73% { transform: scale(0.86); } 77%, 100% { transform: scale(1); }
}
@keyframes tour-pr-r1 {
  0%, 15% { opacity: 0; transform: scale(0.3); }
  16% { opacity: 0.8; transform: scale(0.3); }
  23%, 100% { opacity: 0; transform: scale(1.6); }
}
@keyframes tour-pr-r2 {
  0%, 71% { opacity: 0; transform: scale(0.3); }
  72% { opacity: 0.8; transform: scale(0.3); }
  79%, 100% { opacity: 0; transform: scale(1.6); }
}
@keyframes tour-pr-cursor {
  0% { transform: translate(520px, 336px); }
  14%, 22% { transform: translate(131px, 92px); }
  40% { transform: translate(300px, 222px); }
  50% { transform: translate(300px, 222px); }
  66%, 80% { transform: translate(572px, 268px); }
  100% { transform: translate(520px, 336px); }
}
</style>
