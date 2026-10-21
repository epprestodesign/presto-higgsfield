<script setup>
// HotelCardReserve — "Book Reservations" search-result card. Horizontal:
// photo carousel · hotel name + stars + availability status + distance ·
// price (From nightly / total) · "Choose Your Room" CTA. An expandable
// Availability panel lists per-night rooms-left. Three availability states:
//   available   → green "Fully Available"
//   unmatched   → orange "Adjust your search parameters" (has availability, off-filter)
//   unavailable → grey "No availability for selected dates" (card dimmed, CTA muted)
import { ref, computed, onMounted } from 'vue'
import { loadImagery } from '../../lib/imagery'
import RoomAvailability from './RoomAvailability.vue'

const props = defineProps({
  name: { type: String, default: 'Hotel Name' },
  images: { type: Array, default: () => [] },
  imageCategories: { type: Array, default: () => ['exterior', 'lobby', 'rooms'] },
  seed: { type: Number, default: 0 },
  orientation: { type: String, default: 'horizontal' }, // horizontal | vertical
  city: { type: String, default: '' },           // grey location subtitle under the name
  stars: { type: Number, default: null },        // null => "Unrated"
  distance: { type: String, default: '' },        // e.g. "0.3 mi from Main Arena"
  preferred: { type: Boolean, default: false },   // "Preferred Hotel" badge
  refundable: { type: Boolean, default: false },  // "Fully Refundable" chip
  lowRateGuarantee: { type: Boolean, default: true },
  currency: { type: String, default: '$' },
  fromNightly: { type: Number, default: null },
  total: { type: Number, default: null },
  availability: { type: String, default: 'available' }, // available | unmatched | unavailable
  ctaLabel: { type: String, default: 'Choose Your Room' },
  openAvailability: { type: Boolean, default: false }, // start with the Availability panel expanded
  // Availability panel — room-type carousel:
  // [{ type, nightly, nights: [{ date, roomsLeft }] }]
  rooms: { type: Array, default: () => [] },
})
const emit = defineEmits(['choose'])

const unavailable = computed(() => props.availability === 'unavailable')
const STATUS = {
  available: { tone: 'success', label: 'Fully Available' },
  unmatched: { tone: 'warning', label: 'Adjust your search parameters' },
  unavailable: { tone: 'muted', label: 'No availability for selected dates' },
}
const status = computed(() => STATUS[props.availability] || STATUS.available)
const starList = computed(() => {
  const s = props.stars || 0
  return Array.from({ length: 5 }, (_, i) => (s >= i + 1 ? 'star' : s >= i + 0.5 ? 'star_half' : 'star_border'))
})

// Carousel — sources photos from the imagery library by category.
const loaded = ref([])
const slides = computed(() => (props.images.length ? props.images : loaded.value))
const idx = ref(0)
const go = (n) => { const len = slides.value.length || 1; idx.value = (n + len) % len }
const prev = () => go(idx.value - 1)
const next = () => go(idx.value + 1)
onMounted(async () => {
  if (props.images.length) return
  const lib = await loadImagery()
  const out = []
  for (const c of props.imageCategories) {
    const arr = lib[c]
    if (arr && arr.length) { const e = arr[props.seed % arr.length]; out.push({ url: e.url, alt: e.alt }) }
  }
  loaded.value = out
})

const open = ref(props.openAvailability)
const money = (n) => props.currency + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD'
</script>

<template>
  <div class="hc" :class="[`hc--${orientation}`, { 'hc--dim': unavailable }]">
    <div class="hc__top">
      <!-- MEDIA -->
      <div class="hc__media">
        <img v-if="slides.length" :src="slides[idx].url" :alt="slides[idx].alt" class="hc__img" />
        <div v-else class="hc__img hc__img--empty"><q-icon name="image" size="32px" /></div>
        <span v-if="preferred" class="hc__preferred">Preferred Hotel</span>
        <template v-if="slides.length > 1">
          <button class="hc__arrow hc__arrow--prev" aria-label="Previous photo" @click="prev"><q-icon name="chevron_left" size="20px" /></button>
          <button class="hc__arrow hc__arrow--next" aria-label="Next photo" @click="next"><q-icon name="chevron_right" size="20px" /></button>
        </template>
      </div>

      <!-- CONTENT — full-width region: details on top, availability + price footer -->
      <div class="hc__main">
        <div class="hc__body">
          <h3 class="hc__name">{{ name }}</h3>
          <div v-if="city" class="hc__city">{{ city }}</div>
          <div v-if="stars" class="hc__stars"><q-icon v-for="(s, i) in starList" :key="i" :name="s" size="18px" /></div>
          <div v-else class="hc__unrated">Unrated</div>

          <div class="hc__status" :class="`hc__status--${status.tone}`">
            <q-icon v-if="availability === 'available'" name="check_circle" size="18px" />
            <span v-else class="hc__dot" />
            <span>{{ status.label }}</span>
          </div>

          <div v-if="distance" class="hc__distance"><q-icon name="place" size="18px" /> <span>{{ distance }}</span></div>
        </div>

        <div class="hc__footer">
          <button v-if="rooms.length" type="button" class="hc__availtoggle" :aria-expanded="open" @click="open = !open">
            <span class="hc__availtoggle-label">Availability</span> <q-icon :name="open ? 'expand_less' : 'expand_more'" size="18px" />
          </button>

          <div class="hc__price">
            <div class="hc__from">From {{ money(fromNightly) }} nightly</div>
            <div class="hc__total">{{ money(total) }} total</div>
            <div class="hc__taxes">Total includes taxes &amp; fees</div>
            <button type="button" class="hc__cta" :class="{ 'hc__cta--muted': unavailable }" @click="emit('choose')">{{ ctaLabel }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- AVAILABILITY PANEL — room-type carousel -->
    <div v-if="open && rooms.length" class="hc__avail">
      <room-availability :rooms="rooms" :currency="currency" />
    </div>
  </div>
</template>

<style scoped>
.hc { border: 1px solid rgba(0,0,0,0.04); border-radius: 12px; background: var(--ds-color-surface); overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06); }
.hc--dim .hc__media, .hc--dim .hc__body, .hc--dim .hc__from, .hc--dim .hc__total, .hc--dim .hc__taxes { opacity: 0.55; }

.hc__top { display: flex; align-items: stretch; }
/* Taller card with breathing room (horizontal only). */
.hc--horizontal .hc__top { min-height: 360px; }

/* media */
.hc__media { position: relative; width: 280px; flex: none; overflow: hidden; }
.hc__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hc__img--empty { display: flex; align-items: center; justify-content: center; background: var(--ds-palette-slate-100); color: var(--ds-color-text-subtlest); min-height: 200px; }
.hc__preferred { position: absolute; top: 0; left: 0; background: var(--ds-color-background-brand-bold); color: #fff; font-size: 0.8125rem; font-weight: 700; padding: 6px 12px; }
.hc__arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; border: 0; border-radius: 50%; background: rgba(0,0,0,0.45); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.hc__arrow--prev { left: 10px; } .hc__arrow--next { right: 10px; }
.hc__arrow:hover { background: rgba(0,0,0,0.65); }

/* content region — full width beside the media; details stack on top, the
   availability + price footer anchors to the bottom. Keeping this as one column
   (rather than a fixed-width price sibling) lets the hotel name use the full
   width before it wraps. */
.hc__main { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 28px 32px; }

/* body */
.hc__body { display: flex; flex-direction: column; gap: 12px; }
.hc__name { margin: 0; font-size: 1.375rem; font-weight: 700; color: var(--ds-color-text-brand); }
.hc__city { color: var(--ds-color-text-subtle); font-size: 1rem; margin-top: -10px; }
.hc__stars { color: var(--ds-color-text-brand); display: flex; gap: 1px; }
.hc__unrated { color: var(--ds-color-text-subtle); font-style: italic; font-size: 0.9375rem; }
.hc__status { display: inline-flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 600; }
.hc__status--success { color: var(--ds-color-text-success); }
.hc__status--warning { color: var(--ds-palette-orange-600); }
.hc__status--muted { color: var(--ds-color-text-subtle); }
.hc__dot { width: 9px; height: 9px; border-radius: 50%; background: currentColor; flex: none; }
.hc__distance { display: inline-flex; align-items: center; gap: 6px; color: var(--ds-color-text); font-size: 1rem; }
.hc__distance .q-icon { color: var(--ds-color-text-brand); }
/* footer — availability (left) + price (right), pinned to the bottom of the card */
.hc__footer { margin-top: auto; padding-top: 20px; display: flex; align-items: flex-end; justify-content: flex-end; gap: 16px; }
/* Availability sits bottom-left, height-matched to the CTA so the two align. */
.hc__availtoggle { margin-right: auto; min-height: 52px; display: inline-flex; align-items: center; gap: 4px; background: none; border: 0; padding: 0; color: var(--ds-color-link); font-family: inherit; font-size: 1rem; font-weight: 600; text-decoration: none; cursor: pointer; }
.hc__availtoggle-label { text-decoration: underline; }

/* price — bottom-right */
.hc__price { display: flex; flex-direction: column; align-items: flex-end; text-align: right; gap: 4px; }
.hc__from { color: var(--ds-color-text-subtle); font-size: 0.9375rem; }
.hc__total { color: var(--ds-color-text-brand); font-size: 1.25rem; font-weight: 700; }
.hc__taxes { color: var(--ds-color-text-subtle); font-size: 0.8125rem; margin-bottom: 6px; }
.hc__cta { height: 52px; padding: 0 24px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-size: 1rem; font-weight: 700; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.hc__cta:hover { background: var(--ds-palette-navy-800); }

/* Phones (<600px): image on top, content below; footer actions go full-width. */
@media (max-width: 600px) {
  .hc__top { flex-direction: column; }
  .hc--horizontal .hc__top { min-height: 0; }
  .hc__media { width: 100%; height: 200px; }
  .hc__main { padding: 16px; }
  .hc__footer { flex-direction: column; align-items: stretch; gap: 12px; padding-top: 16px; }
  .hc__availtoggle { margin-right: 0; min-height: 0; }
  .hc__price { align-items: flex-start; text-align: left; }
  .hc__cta { width: 100%; }
}
.hc__cta--muted { background: var(--ds-palette-navy-400); }

/* availability panel */
.hc__avail { border-top: 1px solid var(--ds-color-border); padding: 20px 24px; background: var(--ds-color-surface); }

/* VERTICAL layout — image top, content, full-width CTA (mirrors RoomCard). */
.hc--vertical { width: 320px; }
.hc--vertical .hc__top { flex-direction: column; align-items: stretch; }
.hc--vertical .hc__media { width: 100%; height: 190px; }
.hc--vertical .hc__main { padding: 16px 20px 20px; }
.hc--vertical .hc__body { gap: 6px; }
.hc--vertical .hc__name { font-size: 1.125rem; }
.hc--vertical .hc__footer { flex-direction: column; align-items: stretch; gap: 12px; margin-top: 12px; padding-top: 0; }
.hc--vertical .hc__availtoggle { align-self: flex-start; min-height: 0; }
.hc--vertical .hc__price { align-items: stretch; text-align: left; padding-top: 16px; border-top: 1px solid var(--ds-color-border); }
.hc--vertical .hc__cta { width: 100%; }
</style>
