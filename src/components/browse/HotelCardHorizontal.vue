<script setup>
// HotelCardHorizontal — a horizontal (Expedia-style) alternative to the vertical
// hotel result card. Same DATA as the Book Reservation / Group Block cards
// (name, stars, availability status, distance, price, CTA, and the expandable
// Availability panel), but the media is a flush 3-image grid (1 lead + 2 thumbs)
// on the left instead of a carousel — no gallery, no ad/heart chrome.
import { ref, computed, onMounted } from 'vue'
import { loadImagery } from '../../lib/imagery'
import RoomAvailability from './RoomAvailability.vue'

const props = defineProps({
  name: { type: String, default: 'Hotel' },
  city: { type: String, default: '' },
  stars: { type: Number, default: null },
  distance: { type: String, default: '' },
  preferred: { type: Boolean, default: false },
  // 'reserve' | 'group' — drives status wording, price block, and CTA default.
  flow: { type: String, default: 'reserve' },
  // reserve: available | unmatched | unavailable · group: matches | partial | unavailable
  availability: { type: String, default: 'available' },
  fromNightly: { type: Number, default: null },
  total: { type: Number, default: null },
  startingPrice: { type: Number, default: null },
  roomsAvailable: { type: Number, default: 0 },
  ctaLabel: { type: String, default: '' },
  currency: { type: String, default: '$' },
  // ISO code rendered after the amount ("$102.50 USD nightly"), matching
  // production's price wording (DES-419 / DES-422).
  currencyCode: { type: String, default: 'USD' },
  // Availability panel (shared with the vertical cards): [{ type, nightly, nights }]
  rooms: { type: Array, default: () => [] },
  openAvailability: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  imageCategories: { type: Array, default: () => ['exterior', 'lobby', 'rooms'] },
  seed: { type: Number, default: 0 },
})
const emit = defineEmits(['choose', 'select'])

const isGroup = computed(() => props.flow === 'group')
const unavailable = computed(() => props.availability === 'unavailable')
const status = computed(() => {
  const a = props.availability
  if (a === 'unavailable') return { tone: 'muted', label: 'No availability for selected dates' }
  if (isGroup.value) {
    const n = props.roomsAvailable
    const rooms = `${n} ${n === 1 ? 'room' : 'rooms'} available`
    if (a === 'partial') return { tone: 'warning', label: `Only ${rooms}` }
    return { tone: 'success', label: `${rooms} — matches request` }
  }
  if (a === 'unmatched') return { tone: 'warning', label: 'Adjust your search parameters' }
  return { tone: 'success', label: 'Fully Available' }
})
const cta = computed(() => props.ctaLabel || (isGroup.value ? 'Select Rooms' : 'Choose Your Room'))
const starList = computed(() => {
  const s = props.stars || 0
  return Array.from({ length: 5 }, (_, i) => (s >= i + 1 ? 'star' : s >= i + 0.5 ? 'star_half' : 'star_border'))
})
const money = (n) => props.currency + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Three images from the imagery library (1 lead + 2 thumbs).
const loaded = ref([])
const imgs = computed(() => (props.images.length ? props.images : loaded.value))
onMounted(async () => {
  if (props.images.length) return
  const lib = await loadImagery()
  const out = []
  for (const c of props.imageCategories) {
    const arr = lib[c]
    if (arr && arr.length) { const e = arr[props.seed % arr.length]; out.push({ src: e.url, alt: e.alt }) }
  }
  loaded.value = out
})

const open = ref(props.openAvailability)
const onCta = () => emit(isGroup.value ? 'select' : 'choose')
</script>

<template>
  <div class="hch" :class="{ 'hch--dim': unavailable }">
    <div class="hch__row">
      <!-- MEDIA — flush 3-image grid (1 lead + 2 thumbs), no padding to the card edge -->
      <div class="hch__media">
        <div class="hch__lead">
          <img v-if="imgs[0]" :src="imgs[0].src" :alt="imgs[0].alt || name" />
          <div v-else class="hch__ph"><q-icon name="image" size="26px" /></div>
          <span v-if="preferred" class="hch__preferred">Preferred Hotel</span>
        </div>
        <div class="hch__thumbs">
          <div v-for="i in 2" :key="i" class="hch__thumb">
            <img v-if="imgs[i]" :src="imgs[i].src" :alt="imgs[i].alt || ''" />
            <div v-else class="hch__ph"><q-icon name="image" size="16px" /></div>
          </div>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="hch__body">
        <h3 class="hch__name">{{ name }}</h3>
        <div v-if="city" class="hch__loc">{{ city }}</div>
        <div v-if="stars" class="hch__stars"><q-icon v-for="(s, i) in starList" :key="i" :name="s" size="18px" /></div>
        <div v-else class="hch__unrated">Unrated</div>

        <div class="hch__status" :class="`hch__status--${status.tone}`">
          <q-icon v-if="status.tone === 'success'" name="check_circle" size="18px" />
          <span v-else class="hch__dot" />
          <span>{{ status.label }}</span>
        </div>

        <div v-if="distance" class="hch__distance"><q-icon name="place" size="18px" /> <span>{{ distance }}</span></div>

        <!-- Price block — production order: rate, total, taxes note, Availability,
             then the CTA (DES-419 / DES-422). -->
        <div class="hch__price">
          <template v-if="isGroup">
            <div class="hch__starting">STARTING PRICE</div>
            <div class="hch__amount"><strong>{{ money(startingPrice) }}</strong> <span>/ night</span></div>
          </template>
          <template v-else>
            <div class="hch__from">From {{ money(fromNightly) }} {{ currencyCode }} nightly</div>
            <div class="hch__total">{{ money(total) }} {{ currencyCode }} total</div>
            <div class="hch__taxes">Total includes taxes &amp; fees</div>
          </template>

          <button v-if="rooms.length" type="button" class="hch__availtoggle" :aria-expanded="open" @click="open = !open">
            <span>Availability</span> <q-icon :name="open ? 'expand_less' : 'expand_more'" size="18px" />
          </button>

          <button type="button" class="hch__cta" :class="{ 'hch__cta--muted': unavailable }" @click="onCta">{{ cta }}</button>
        </div>
      </div>
    </div>

    <!-- AVAILABILITY PANEL -->
    <div v-if="open && rooms.length" class="hch__avail">
      <room-availability :rooms="rooms" :currency="currency" />
    </div>
  </div>
</template>

<style scoped>
/* The card is a size CONTAINER so its layout responds to its own width (not the
   viewport). This makes the compact styles below fire in Storybook docs (where
   the card is framed narrow inside a wide iframe) as well as in the mobile list. */
.hch { container-type: inline-size; border: 1px solid var(--ds-color-border); border-radius: 12px; background: var(--ds-color-surface); overflow: hidden; box-shadow: var(--ds-shadow-1); }
.hch--dim .hch__media, .hch--dim .hch__body { opacity: 0.55; }
.hch__row { display: flex; align-items: stretch; }

/* Media: flush to the card's top/left/bottom edges (no padding). */
.hch__media { flex: 0 0 42%; max-width: 200px; display: flex; flex-direction: column; gap: 3px; }
.hch__lead { position: relative; flex: 1.9; min-height: 0; background: var(--ds-palette-slate-100); }
.hch__thumbs { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; flex: 1; min-height: 0; }
.hch__thumb { position: relative; background: var(--ds-palette-slate-100); min-height: 0; }
.hch__lead img, .hch__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hch__ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--ds-color-text-subtlest); }
.hch__preferred { position: absolute; top: 0; left: 0; background: var(--ds-color-background-brand-bold); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; }

/* Content */
.hch__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; }
.hch__name { margin: 0; font-size: 1.125rem; font-weight: 800; line-height: 1.2; color: var(--ds-color-text-brand); }
.hch__loc { color: var(--ds-color-text-subtle); font-size: 0.9375rem; }
.hch__stars { color: var(--ds-color-text-brand); display: flex; gap: 1px; }
.hch__unrated { color: var(--ds-color-text-subtle); font-size: 0.875rem; }
.hch__status { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9375rem; }
.hch__status--success { color: var(--ds-color-text-success); }
.hch__status--warning { color: var(--ds-palette-orange-600); }
.hch__status--muted { color: var(--ds-color-text-subtle); }
.hch__status .hch__dot { width: 10px; height: 10px; border-radius: 50%; background: currentColor; flex: none; }
.hch__distance { display: inline-flex; align-items: center; gap: 6px; color: var(--ds-color-text); font-size: 0.875rem; }
.hch__distance :deep(.q-icon) { color: var(--ds-color-text-brand); }
.hch__availtoggle { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; background: none; border: 0; padding: 2px 0; color: var(--ds-color-link); font-family: inherit; font-size: 0.9375rem; font-weight: 700; text-decoration: underline; cursor: pointer; }

.hch__price { margin-top: auto; padding-top: 8px; display: flex; flex-direction: column; align-items: flex-start; }
.hch__taxes { color: var(--ds-color-text-subtle); font-size: 0.8125rem; }
.hch__starting { color: var(--ds-color-text-subtle); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; }
.hch__amount { color: var(--ds-color-text-brand); }
.hch__amount strong { font-size: 1.375rem; font-weight: 700; }
.hch__amount span { color: var(--ds-color-text-subtle); font-size: 0.875rem; }
.hch__from { color: var(--ds-color-text); font-size: 1rem; }
.hch__total { color: var(--ds-color-text); font-weight: 700; font-size: 1.0625rem; }
.hch__cta { width: 100%; height: 48px; margin-top: 10px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.hch__cta:hover { background: var(--ds-palette-navy-800); }
.hch__cta--muted { background: var(--ds-palette-slate-300); pointer-events: none; }

.hch__avail { border-top: 1px solid var(--ds-color-border); padding: 14px 16px; }

/* Narrow (phone-width) card: thinner media column, smaller type throughout, and
   no full-width CTA (the whole card is the tap target, price flush at bottom). */
@container (max-width: 600px) {
  .hch__media { flex: 0 0 30%; max-width: 116px; }
  .hch__body { padding: 12px; gap: 4px; }
  /* Production renders the property name as an underlined link. */
  .hch__name { font-size: 0.9375rem; text-decoration: underline; text-underline-offset: 2px; }
  .hch__loc { font-size: 0.8125rem; }
  .hch__stars :deep(.q-icon) { font-size: 15px !important; }
  .hch__unrated { font-size: 0.75rem; }
  .hch__status { font-size: 0.8125rem; gap: 6px; }
  .hch__status :deep(.q-icon) { font-size: 15px !important; }
  .hch__status .hch__dot { width: 8px; height: 8px; }
  .hch__distance { font-size: 0.75rem; }
  .hch__distance :deep(.q-icon) { font-size: 15px !important; }
  .hch__availtoggle { font-size: 0.8125rem; }
  .hch__starting { font-size: 0.6875rem; }
  .hch__amount strong { font-size: 1.125rem; }
  .hch__amount span { font-size: 0.75rem; }
  .hch__from { font-size: 0.8125rem; }
  .hch__total { font-size: 0.9375rem; }
  .hch__preferred { font-size: 0.625rem; padding: 3px 8px; }
  /* Production right-aligns the whole price block and keeps a real, content-width
     "Choose Your Room" CTA on phones (DES-419 / DES-422). */
  .hch__price { align-items: flex-end; text-align: right; padding-top: 14px; gap: 2px; }
  .hch__taxes { font-size: 0.6875rem; }
  .hch__availtoggle { align-self: flex-end; font-size: 0.8125rem; margin-top: 2px; }
  .hch__cta { width: auto; align-self: flex-end; height: 40px; padding: 0 16px; margin-top: 8px; font-size: 0.875rem; }
}
</style>
