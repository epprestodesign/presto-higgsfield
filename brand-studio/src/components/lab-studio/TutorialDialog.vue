<script setup>
// Quick tutorial for the project canvas: a carousel of short looping clips
// (made with Higgsfield, Kling 3.0 Turbo), one per quick action: just the
// cursor on the canvas. Opened from the ?
// button by the zoom control. ← / → move between slides; swipe on touch.
import { computed, nextTick, ref, watch } from 'vue'
import panMp4 from '../../assets/tutorial/pan.mp4'
import panJpg from '../../assets/tutorial/pan.jpg'
import zoomMp4 from '../../assets/tutorial/zoom.mp4'
import zoomJpg from '../../assets/tutorial/zoom.jpg'
import promptMp4 from '../../assets/tutorial/prompt.mp4'
import promptJpg from '../../assets/tutorial/prompt.jpg'
import logoMp4 from '../../assets/tutorial/logo.mp4'
import logoJpg from '../../assets/tutorial/logo.jpg'
import exportMp4 from '../../assets/tutorial/export.mp4'
import exportJpg from '../../assets/tutorial/export.jpg'
import zoomKeysMp4 from '../../assets/tutorial/zoom-keys.mp4'
import zoomKeysJpg from '../../assets/tutorial/zoom-keys.jpg'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ start: { type: Number, default: 0 } })

const SLIDES = [
  {
    id: 'pan', video: panMp4, poster: panJpg, title: 'Move around the canvas',
    body: 'Hold Space and drag with the hand to pan, or pick the hand tool. Scrolling pans too.',
    keys: [['Space', 'hold + drag'], ['H', 'hand'], ['V', 'select']],
  },
  {
    id: 'zoom', video: zoomMp4, poster: zoomJpg, title: 'Zoom to any frame',
    body: 'Double-click a frame to fill the screen with it. Esc, or double-click empty canvas, to see everything again.',
    keys: [['Double-click', 'zoom to frame'], ['Esc', 'see all']],
  },
  {
    id: 'zoom-keys', video: zoomKeysMp4, poster: zoomKeysJpg, title: 'Zoom in and out',
    body: 'Use the + and − buttons in the corner, or the keyboard. ⌘ 0 fits everything back on screen.',
    keys: [['⌘ +', 'zoom in'], ['⌘ −', 'zoom out'], ['⌘ 0', 'fit all']],
  },
  {
    id: 'prompt', video: promptMp4, poster: promptJpg, title: 'Start from a suggestion',
    body: 'Click a chip to drop a full prompt into the box. Read it, change anything, then send. Swipe the chips sideways for more.',
    keys: [['Enter', 'send'], ['Shift + Enter', 'new line']],
  },
  {
    id: 'logo', video: logoMp4, poster: logoJpg, title: 'Make the logo read on dark banners',
    body: 'Logo projects try a few clean-ups and looks (white, glow, white box and more), each scored for contrast. Click a look to use it, then make banners with it.',
    keys: [],
  },
  {
    id: 'export', video: exportMp4, poster: exportJpg, title: 'Preview and export',
    body: '▶ Preview on a page mockup opens the real Presto pages on desktop and phone. Export downloads the logo and banners as a ZIP.',
    keys: [],
  },
]

const index = ref(props.start)
const slide = computed(() => SLIDES[index.value])
const videos = ref([])
const last = computed(() => index.value === SLIDES.length - 1)

function go(i) { index.value = (i + SLIDES.length) % SLIDES.length }
function play() {
  nextTick(() => videos.value.forEach((v, i) => {
    if (!v) return
    if (i === index.value && open.value) { v.currentTime = 0; v.play().catch(() => {}) } else v.pause()
  }))
}
watch([index, open], play)
watch(open, (o) => { if (o) index.value = props.start })

function onKey(e) {
  if (e.key === 'ArrowRight') go(index.value + 1)
  else if (e.key === 'ArrowLeft') go(index.value - 1)
}
let touchX = null
const onTouchStart = (e) => { touchX = e.touches[0].clientX }
function onTouchEnd(e) {
  if (touchX == null) return
  const dx = e.changedTouches[0].clientX - touchX
  if (Math.abs(dx) > 40) go(index.value + (dx < 0 ? 1 : -1))
  touchX = null
}
</script>

<template>
  <q-dialog v-model="open" @show="play" @keydown="onKey">
    <!-- Must be a <div>: Quasar only makes a dialog's direct div child clickable -->
    <div class="tut" role="group" aria-roledescription="carousel" aria-label="Canvas tutorial">
      <header class="tut__top">
        <span class="tut__eyebrow">Quick tour · {{ index + 1 }} of {{ SLIDES.length }}</span>
        <q-btn v-close-popup round flat dense icon="close" aria-label="Close the tutorial" />
      </header>

      <div class="tut__stage" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
        <div class="tut__track" :style="{ transform: `translateX(-${index * 100}%)` }">
          <div v-for="(s, i) in SLIDES" :key="s.id" class="tut__slide" :aria-hidden="i !== index" role="group" aria-roledescription="slide" :aria-label="`${i + 1} of ${SLIDES.length}: ${s.title}`">
            <video
              :ref="(el) => (videos[i] = el)" class="tut__video" :src="s.video" :poster="s.poster"
              muted loop playsinline preload="metadata" aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div class="tut__copy" aria-live="polite">
        <h2 class="tut__title">{{ slide.title }}</h2>
        <p class="tut__body">{{ slide.body }}</p>
        <p v-if="slide.keys.length" class="tut__keys">
          <span v-for="k in slide.keys" :key="k[0]" class="tut__key"><kbd>{{ k[0] }}</kbd> {{ k[1] }}</span>
        </p>
      </div>

      <footer class="tut__nav">
        <div class="tut__dots" role="tablist" aria-label="Slides">
          <button
            v-for="(s, i) in SLIDES" :key="s.id" type="button" role="tab" class="tut__dot" :class="{ 'is-on': i === index }"
            :aria-selected="i === index" :aria-label="s.title" @click="go(i)"
          />
        </div>
        <span class="tut__spacer" />
        <q-btn v-if="index > 0" flat no-caps class="tut__btn" label="Back" @click="go(index - 1)" />
        <q-btn v-if="!last" unelevated no-caps class="tut__btn tut__btn--primary" label="Next" icon-right="arrow_forward" @click="go(index + 1)" />
        <q-btn v-else v-close-popup unelevated no-caps class="tut__btn tut__btn--primary" label="Got it" />
      </footer>
    </div>
  </q-dialog>
</template>

<style scoped>
.tut { width: min(720px, calc(100vw - 32px)); max-width: none !important; background: #fff; border-radius: 20px; overflow: hidden; font-family: var(--bs-font); box-shadow: var(--bs-shadow-3, 0 24px 60px rgb(3 10 38 / 0.25)); }
.tut__top { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 8px 20px; }
.tut__eyebrow { font: 600 0.75rem var(--bs-font); letter-spacing: 0.04em; text-transform: uppercase; color: var(--bs-ink-soft); }
.tut__stage { overflow: hidden; background: #eceef2; aspect-ratio: 16 / 9; }
.tut__track { display: flex; height: 100%; transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.tut__slide { flex: none; width: 100%; height: 100%; }
.tut__video { width: 100%; height: 100%; object-fit: cover; display: block; }
.tut__copy { padding: 18px 22px 6px; min-height: 132px; }
.tut__title { margin: 0 0 6px; font: 600 1.25rem/1.3 var(--bs-font); letter-spacing: -0.01em; color: var(--bs-ink); }
.tut__body { margin: 0; font-size: 0.9375rem; line-height: 1.55; color: var(--bs-ink-soft); }
.tut__keys { margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.8125rem; color: var(--bs-ink-soft); }
.tut__key { display: inline-flex; align-items: center; gap: 6px; }
.tut__key kbd { padding: 2px 7px; border-radius: 6px; border: 1px solid var(--bs-line); border-bottom-width: 2px; background: var(--bs-surface-2); font: 600 0.75rem var(--bs-font); color: var(--bs-ink); }
.tut__nav { display: flex; align-items: center; gap: 8px; padding: 12px 16px 16px 22px; }
.tut__dots { display: flex; gap: 6px; }
.tut__dot { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 999px; background: var(--bs-line); cursor: pointer; transition: width 0.25s, background-color 0.25s; }
.tut__dot.is-on { width: 22px; background: var(--bs-ink); }
.tut__spacer { flex: 1; }
.tut__btn { border-radius: 999px; padding: 4px 16px; font-weight: 600; }
.tut__btn--primary { background: var(--bs-ink); color: #fff; }
@media (prefers-reduced-motion: reduce) { .tut__track { transition: none; } }
</style>
