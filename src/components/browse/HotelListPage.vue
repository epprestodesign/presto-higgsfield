<script setup>
// HotelListPage — the full Browse Hotels search-results page BODY (placed inside
// PageFrame, which supplies the Global Nav + footer). Two flows:
//   reserve → Book Reservation (HotelCardReserve, availability: available / unmatched / unavailable)
//   group   → Group Block      (HotelCardGroup,   availability: matches / partial / unavailable)
// Layout: Hero banner → Booking Widget search bar (tucked onto the hero) →
// results toolbar (count + Sort) → 3-column body (filters · results · ads).
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import defaultBg from '../../../background-img/defaultBackgroundImage.png'
import epLogoWhite from '../../assets/eventpipe logos/eventpipe-logo-fff.svg'
import BookingWidget from '../BookingWidget.vue'
import FilterRail from './FilterRail.vue'
import SortDropdown from './SortDropdown.vue'
import SearchSummaryBar from './SearchSummaryBar.vue'
import HotelCardGroup from './HotelCardGroup.vue'
import HotelCardHorizontal from './HotelCardHorizontal.vue'
import DisplayAd from '../DisplayAd.vue'
import ResultsToolbar from './ResultsToolbar.vue'
import { sampleRooms } from '../../stories/browse/_rooms-sample.js'

const props = defineProps({
  flow: { type: String, default: 'reserve' }, // 'reserve' | 'group'
  showTeams: { type: Boolean, default: true }, // Teams vs Core booking widget
  // Optional right-rail skyscraper Display Ad, e.g. [160, 600] / [160, 320] /
  // [120, 600]. When null (default) the page renders with no ad rail.
  adSize: { type: Array, default: null },
  // Results state — drives what the results column shows:
  //   'full'    — all availability blocks (default)
  //   'partial' — a few matches + the fallback blocks
  //   'empty'   — no properties (empty state)
  //   'error'   — results failed to load
  //   'loading' — skeleton placeholders
  state: { type: String, default: 'full' },
})

const isGroup = computed(() => props.flow === 'group')
const isLoading = computed(() => props.state === 'loading')
const isError = computed(() => props.state === 'error')
const isEmpty = computed(() => props.state === 'empty')

// On phones (<600px) the results switch to the compact Expedia-style horizontal
// card (thin image column, no big CTA); desktop keeps the full listing card.
// Both flows use the same data, so the same component serves reserve + group.
const $q = useQuasar()
const ResultCard = computed(() => ($q.screen.lt.sm ? HotelCardHorizontal : HotelCardGroup))

// "Exact Matches Only" (from the filter rail). When ON, it demonstrates the
// filtered edge case: nothing matches the strict filter, so the matching set
// empties (count → 0, "(1 filter applied)" messaging shows) and the results
// collapse to the "…do not match your selected filters" fallback section.
const exactOnly = ref(false)
const filtersApplied = computed(() => {
  const f = activeFilters.value
  let n = exactOnly.value ? 1 : 0
  if (f.propertyQuery && f.propertyQuery.trim()) n++
  if (f.minStars) n++
  if (f.brands && f.brands.length) n++
  if (f.amenities && f.amenities.length) n++
  if (f.roomTypes && f.roomTypes.length) n++
  if (f.budget && f.budget.max) n++
  if (f.radius != null && f.radius !== 0.25) n++
  return n
})

// When an ad size is provided, add a third right-rail column sized to the ad.
const gridStyle = computed(() =>
  props.adSize
    ? { gridTemplateColumns: `260px minmax(0, 1fr) ${props.adSize[0]}px` }
    : {}
)

// Hero content.
const EVENT_NAME = 'Summer Soccer Classic 2027'
const EVENT_DATES = 'Wed, 6/16/2027 - Sat, 6/19/2027'
const scrim = 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5))'
const heroStyle = {
  backgroundImage: `${scrim}, url(${defaultBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

// --- Sample results ----------------------------------------------------------
// A 56-property pool (14 per parent brand) generated deterministically so the
// filters + sort have enough to stress-test. Each hotel carries the raw fields
// the filters/sort read: brand, amenities, room types, numeric distance/price.
const CITIES = ['Kansas City', 'Overland Park', 'Lenexa', 'Olathe', 'Shawnee', 'Leawood', 'Merriam', 'Prairie Village', 'Liberty', 'Gladstone', 'Independence', 'Blue Springs', 'Raytown', 'Grandview']
const BRAND_HOTELS = {
  'Marriott International': ['Marriott', 'Courtyard by Marriott', 'Residence Inn', 'AC Hotel', 'Renaissance', 'Sheraton', 'Westin'],
  'Hilton Worldwide': ['Hilton', 'Hampton Inn & Suites', 'DoubleTree', 'Embassy Suites', 'Homewood Suites', 'Hilton Garden Inn', 'Canopy'],
  'Hyatt Hotels': ['Hyatt Regency', 'Hyatt Place', 'Hyatt House', 'Grand Hyatt', 'Andaz', 'Thompson', 'Caption by Hyatt'],
  'IHG Hotels & Resorts': ['Holiday Inn', 'Holiday Inn Express', 'Crowne Plaza', 'Kimpton', 'InterContinental', 'Staybridge Suites', 'Candlewood Suites'],
}
const SUFFIXES = ['Downtown', 'Convention Center', 'Riverside', 'Midtown', 'Arena District', 'Waterfront', 'Airport', 'Old Town']
const AMEN_POOL = ['Free WiFi', 'Free Parking', 'Free Breakfast', 'Swimming Pool', 'Restaurant On-Site', 'Business Center', 'Bar / Lounge']
const ROOM_POOL = ['King', 'Double', 'Queen', 'Suite']
const STAR_POOL = [4, 3.5, 4.5, 3, 5, 4, 2.5]

const HOTELS = (() => {
  const out = []
  let i = 0
  for (const brand of Object.keys(BRAND_HOTELS)) {
    const chains = BRAND_HOTELS[brand]
    for (let k = 0; k < 14; k++) {
      const amenities = AMEN_POOL.filter((_, a) => (i + a) % 3 === 0 || ((i >> a) & 1))
      const roomTypes = ROOM_POOL.filter((_, r) => (i + r) % 2 === 0)
      out.push({
        name: `${chains[k % chains.length]} ${SUFFIXES[k % SUFFIXES.length]}`,
        brand,
        city: CITIES[i % CITIES.length],
        stars: STAR_POOL[i % STAR_POOL.length],
        distanceMi: Math.round((0.2 + ((i * 11) % 60) / 10) * 10) / 10, // 0.2 .. 6.1
        nightly: 109 + ((i * 17) % 240),                                // 109 .. 348
        amenities: amenities.length ? amenities : ['Free WiFi'],
        roomTypes: roomTypes.length ? roomTypes : ['King'],
        baseAvail: i % 12 === 11 ? 'unavailable' : i % 7 === 6 ? 'unmatched' : 'available',
        preferred: i % 9 === 0,
        roomsAvailable: (i % 12) + 1,
        seed: i,
      })
      i++
    }
  }
  return out
})()

// Active filter values relayed by FilterRail (property name, brands, amenities,
// radius, budget, min stars, room types), applied live to the list below.
const activeFilters = ref({})
const onFilters = (f) => { activeFilters.value = f || {} }

const matchesFilters = (h) => {
  const f = activeFilters.value
  if (f.propertyQuery && f.propertyQuery.trim() && !h.name.toLowerCase().includes(f.propertyQuery.toLowerCase().trim())) return false
  if (f.minStars && (h.stars || 0) < f.minStars) return false
  if (f.brands && f.brands.length && !f.brands.includes(h.brand)) return false
  if (f.amenities && f.amenities.length && !f.amenities.every((a) => h.amenities.includes(a))) return false
  if (f.roomTypes && f.roomTypes.length && !f.roomTypes.some((r) => h.roomTypes.includes(r))) return false
  if (f.budget && f.budget.max !== '' && f.budget.max != null) {
    const max = parseFloat(f.budget.max)
    if (!isNaN(max) && h.nightly > max) return false
  }
  // Radius drives the map preview at its 0.25 default; once moved it also caps
  // the list by distance.
  if (f.radius != null && f.radius !== 0.25 && h.distanceMi > f.radius) return false
  return true
}

const sortHotels = (list) => {
  const arr = [...list]
  if (sort.value === 'price_asc') arr.sort((a, b) => a.nightly - b.nightly)
  else if (sort.value === 'price_desc') arr.sort((a, b) => b.nightly - a.nightly)
  else if (sort.value === 'guest_rating') arr.sort((a, b) => (b.stars || 0) - (a.stars || 0))
  else arr.sort((a, b) => a.distanceMi - b.distanceMi)
  return arr
}

// Map a raw hotel to the card props both flows consume (the Group card renders
// for both; reserve availability keys pass straight through).
const toCard = (h) => ({
  name: h.name, flow: props.flow, ctaLabel: isGroup.value ? 'Select Rooms' : 'Choose Your Room',
  city: h.city, stars: h.stars, distance: `${h.distanceMi} mi from Main Arena`, preferred: h.preferred, seed: h.seed,
  startingPrice: isGroup.value ? h.nightly + 40 : h.nightly,
  fromNightly: h.nightly, total: h.nightly * 4,
  availability: isGroup.value ? (h.baseAvail === 'available' ? 'matches' : h.baseAvail === 'unmatched' ? 'partial' : 'unavailable') : h.baseAvail,
  roomsAvailable: h.roomsAvailable, roomsMax: 4, roomsRequested: 10,
  refundable: h.seed % 3 !== 2, lowRateGuarantee: h.seed % 2 === 0, rooms: sampleRooms,
})

const availableHotels = HOTELS.filter((h) => h.baseAvail === 'available')
const unmatchedHotels = HOTELS.filter((h) => h.baseAvail === 'unmatched')
const unavailableHotels = HOTELS.filter((h) => h.baseAvail === 'unavailable')

// Available matches (filtered + sorted) — the primary block.
const matchedHotels = computed(() => sortHotels(availableHotels.filter(matchesFilters)))

const mainHotels = computed(() => {
  if (isEmpty.value) return []
  const list = props.state === 'partial' ? matchedHotels.value.slice(0, 3) : matchedHotels.value
  return list.map(toCard)
})

// Fallback blocks (do-not-match / no-availability) — hidden in the empty state
// and when "Exact Matches Only" is on.
const fallbackSections = computed(() => {
  if (isEmpty.value || exactOnly.value) return []
  const secs = []
  if (unmatchedHotels.length) secs.push({ heading: 'The below hotels have availability for your selected dates but do not match your selected filters', hotels: sortHotels(unmatchedHotels).map(toCard) })
  if (unavailableHotels.length) secs.push({ heading: 'The below hotels do not have availability for your selected dates', hotels: sortHotels(unavailableHotels).map(toCard) })
  return secs
})

const resultCount = computed(() => {
  if (isEmpty.value) return 0
  return matchedHotels.value.length + (exactOnly.value ? 0 : unmatchedHotels.length + unavailableHotels.length)
})
// No available hotels match the active filters → show the empty state.
const noResults = computed(() => !isLoading.value && !isError.value && resultCount.value === 0)

// Group Block searches for a set number of rooms — surfaced in the results
// toolbar as "N properties available — searching for R rooms".
const roomsRequested = 2

// Filter sidebar v-models.
const fBudget = ref({ min: 20, max: 522 })
const fStars = ref([4, 5])
const fAmenities = ref(['Free WiFi', 'Free Breakfast'])
const fBrands = ref(['Cambria', 'Comfort'])
const priceHistogram = [8, 14, 11, 24, 38, 52, 47, 61, 44, 70, 56, 66, 51, 43, 47, 31, 35, 27, 31, 22, 28, 34, 30, 24, 18, 14, 22, 10, 7, 5]

// Sort control — Browse Hotels defaults to sorting by Distance.
const sort = ref('distance')

// --- Phone header (DES-419 / DES-422) -----------------------------------------
// Production collapses the search parameters into a one-line summary card with a
// pencil, and puts Filters + Map side by side above a full-width "Sort By" select.
// The full BookingWidget stays mounted but hidden until the pencil is tapped, so
// editing still uses the real widget rather than a mobile-only copy of it.
const editingSearch = ref(false)
const mapOpen = ref(false)

// Summary values mirror the hero's event + the widget's defaults.
const SEARCH_LOCATION = 'Kansas City'
const SEARCH_DATES = 'Jun 16 - Jun 19'
const searchGuests = computed(() =>
  isGroup.value
    ? `${roomsRequested} ${roomsRequested === 1 ? 'Room' : 'Rooms'}`
    : '1 Traveler, 1 Room'
)
</script>

<template>
  <div class="hlp">
    <!-- HERO -->
    <section class="hlp__hero" :style="heroStyle">
      <div class="hlp__hero-inner">
        <img :src="epLogoWhite" alt="EventPipe" class="hlp__hero-logo" />
        <div class="text-h5 hlp__event">{{ EVENT_NAME }}</div>
        <div class="text-body1 hlp__dates">{{ EVENT_DATES }}</div>
      </div>
    </section>

    <!-- SEARCH BAR — tucked up onto the hero. On phones this collapses to the
         SearchSummaryBar; the pencil reveals the real widget below it. -->
    <div class="hlp__searchwrap">
      <search-summary-bar
        class="hlp__summary"
        :location="SEARCH_LOCATION"
        :dates="SEARCH_DATES"
        :guests="searchGuests"
        :expanded="editingSearch"
        @edit="editingSearch = !editingSearch"
      />
      <div class="hlp__search" :class="{ 'hlp__search--editing': editingSearch }">
        <booking-widget :mode="isGroup ? 'group' : 'reservations'" :tabs="false" :show-mode="false" :show-teams="showTeams" :show-dates="true" />
      </div>
    </div>

    <!-- BODY: filters · results · (optional) ad rail -->
    <div class="hlp__container">
      <div class="hlp__grid" :style="gridStyle">
        <!-- LEFT: filter rail module. On phones it becomes a compact bar —
             [Filters] + [Sort By] on one line — with the count centered below
             (in the results toolbar). Sort here is hidden on desktop (the results
             toolbar carries it there). -->
        <aside class="hlp__rail hlp__rail--left">
          <div class="hlp__filterbar">
            <filter-rail
              class="hlp__filterbar-rail"
              :result-count="resultCount"
              v-model:exact-only="exactOnly"
              v-model:map-open="mapOpen"
              @update:filters="onFilters"
            />
            <!-- Phone-only "Map" button — the map moved out of the filters sheet
                 and sits beside Filters (DES-419 / DES-422). -->
            <button type="button" class="hlp__mapbtn" @click="mapOpen = true">
              <q-icon name="map" size="18px" /> Map
            </button>
          </div>
          <sort-dropdown class="hlp__filterbar-sort" :model-value="sort" variant="box" label="Sort By" @update:model-value="sort = $event" />
        </aside>

        <!-- MIDDLE: results toolbar + state-driven results -->
        <div class="hlp__results">
          <!-- toolbar (hidden while loading / on error) -->
          <results-toolbar
            v-if="!isLoading && !isError"
            v-model="sort"
            :count="resultCount"
            :filters-applied="filtersApplied"
            :rooms="isGroup ? roomsRequested : 0"
            class="hlp__toolbar"
            @clear-filters="exactOnly = false"
          />

          <!-- LOADING — skeleton placeholders -->
          <template v-if="isLoading">
            <div v-for="n in 4" :key="'skel-' + n" class="hlp__skel">
              <q-skeleton class="hlp__skel-media" animation="wave" />
              <div class="hlp__skel-body">
                <q-skeleton type="text" width="55%" height="26px" animation="wave" />
                <q-skeleton type="text" width="110px" animation="wave" />
                <q-skeleton type="text" width="48%" animation="wave" />
                <q-skeleton type="text" width="36%" animation="wave" />
              </div>
              <div class="hlp__skel-price">
                <q-skeleton type="text" width="90px" animation="wave" />
                <q-skeleton type="text" width="120px" height="24px" animation="wave" />
                <q-skeleton width="150px" height="52px" style="border-radius:8px" animation="wave" />
              </div>
            </div>
          </template>

          <!-- ERROR -->
          <div v-else-if="isError" class="hlp__state hlp__state--error">
            <q-icon name="error_outline" size="52px" />
            <h3 class="hlp__state-title">We couldn't load results</h3>
            <p class="hlp__state-text">Something went wrong fetching hotels for your selected dates. Check your connection and try again.</p>
            <button type="button" class="hlp__state-btn"><q-icon name="refresh" size="18px" /> Try again</button>
          </div>

          <!-- EMPTY -->
          <div v-else-if="isEmpty || noResults" class="hlp__state hlp__state--empty">
            <q-icon name="search_off" size="52px" />
            <h3 class="hlp__state-title">No properties match your search</h3>
            <p class="hlp__state-text">Try adjusting your filters, widening your search radius, or changing your dates to see more hotels.</p>
            <button type="button" class="hlp__state-btn" @click="exactOnly = false">Clear all filters</button>
          </div>

          <!-- FULL / PARTIAL — matching block (paginated) + fallback blocks -->
          <template v-else>
            <component
              :is="ResultCard"
              v-for="(hotel, hi) in mainHotels"
              :key="'main-' + hi"
              v-bind="hotel"
              class="hlp__card"
            />

            <!-- fallback availability sections — every status block (and its firm
                 line break) is visible (DES-51). -->
            <template v-for="(section, si) in fallbackSections" :key="'tail-' + si">
              <div v-if="section.heading" class="hlp__section">
                <hr class="hlp__section-rule" />
                <h3 class="hlp__section-heading">{{ section.heading }}</h3>
              </div>
              <component
                :is="ResultCard"
                v-for="(hotel, hi) in section.hotels"
                :key="'tail-' + si + '-' + hi"
                v-bind="hotel"
                class="hlp__card"
              />
            </template>
          </template>
        </div>

        <!-- RIGHT: optional sticky skyscraper Display Ad -->
        <aside v-if="adSize" class="hlp__rail hlp__rail--right">
          <div class="hlp__ads">
            <display-ad :width="adSize[0]" :height="adSize[1]" />
          </div>
        </aside>

      </div>
    </div>
  </div>
</template>

<style scoped>
.hlp { background: var(--ds-color-surface-sunken); }

/* hero */
.hlp__hero {
  position: relative;
  min-height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  background-color: #000;
  overflow: hidden;
}
.hlp__hero-inner { padding: 18px 24px; max-width: 760px; }
.hlp__hero-logo { height: 30px; width: auto; margin: 0 auto 12px; display: block; }
.hlp__event { font-weight: 700; line-height: 1.15; margin: 0; }
.hlp__dates { margin-top: 6px; }

/* search bar — white band directly under the hero */
.hlp__searchwrap { padding: 0; background: var(--ds-color-surface); border-bottom: 1px solid var(--ds-color-border); }
.hlp__search {
  margin: 0;
  position: relative;
  z-index: 2;
}
/* The widget sits on the plain white band — drop its own card border/rounded
   corners; keep the individual field borders. */
.hlp__search :deep(.bw) { border: 0; border-radius: 0; }

/* content container */
.hlp__container { max-width: 1400px; margin: 0 auto; padding: 0 24px; }

/* results toolbar (sits at the top of the results column, aligned to cards) */
.hlp__toolbar { margin-bottom: 20px; }

/* 3-column grid */
.hlp__grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  padding: 28px 0 40px;
}

/* left rail — filters card */
.hlp__filters {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
  padding: 20px 20px 24px;
}
.hlp__filters-title { margin: 0 0 4px; font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text); }
.hlp__divider { border: 0; border-top: 1px solid var(--ds-color-border); margin: 18px 0; }

/* middle — results list */
.hlp__results { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
/* DES-459 — section breaks made more prominent: a strong 2px navy rule above a
   larger, bold navy heading (more separation between result groups). */
.hlp__section { margin-top: 20px; }
.hlp__section-rule { border: 0; border-top: 2px solid var(--ds-color-border-brand); margin: 0 0 14px; }
.hlp__section-heading {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ds-color-text-brand);
  line-height: 1.3;
}
.hlp__card { width: 100%; }

/* loading skeleton — mirrors the hotel card layout */
.hlp__skel { display: flex; min-height: 360px; border: 1px solid rgba(0,0,0,0.04); border-radius: 12px; overflow: hidden; background: var(--ds-color-surface); box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06); }
.hlp__skel-media { width: 280px; height: auto; flex: none; border-radius: 0; }
.hlp__skel-body { flex: 1; min-width: 0; padding: 28px 32px; display: flex; flex-direction: column; gap: 12px; }
.hlp__skel-price { width: 260px; flex: none; padding: 28px 32px; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; gap: 10px; }

/* empty / error state panels */
.hlp__state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 56px 24px; background: var(--ds-color-surface); border: 1px solid var(--ds-color-border); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06); }
.hlp__state .q-icon { color: var(--ds-color-text-subtle); margin-bottom: 6px; }
.hlp__state--error .q-icon { color: var(--ds-palette-orange-600); }
.hlp__state-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--ds-color-text); }
.hlp__state-text { margin: 0; max-width: 420px; color: var(--ds-color-text-subtle); font-size: 0.9375rem; line-height: 1.5; }
.hlp__state-btn { margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; height: 46px; padding: 0 22px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-size: 0.9375rem; font-weight: 700; cursor: pointer; }
.hlp__state-btn:hover { background: var(--ds-palette-navy-800); }

/* right rail — sticky ads */
.hlp__rail--right { position: sticky; top: 24px; }
.hlp__ads { display: flex; flex-direction: column; align-items: center; gap: 20px; }

/* responsive-ish: collapse rails under ~1080px */
@media (max-width: 1200px) {
  .hlp__grid { grid-template-columns: 260px minmax(0, 1fr); }
  .hlp__rail--right { display: none; }
}
@media (max-width: 820px) {
  /* Single column. The filter rail now stacks above the results (it collapses
     to a "Filters" toggle on phones) instead of being hidden. */
  .hlp__grid { grid-template-columns: 1fr !important; }
}

/* Phones (<600px): tighten paddings, drop the ad rail, stack the skeletons. */
/* Desktop: the filter bar is just the FilterRail column; its inline Sort, the
   phone "Map" button and the collapsed search summary are all hidden (desktop
   carries Sort in the results toolbar and the map inside the filter rail). */
.hlp__filterbar-sort { display: none; }
.hlp__mapbtn { display: none; }
.hlp__summary { display: none; }

@media (max-width: 600px) {
  .hlp__container { padding: 0 16px; }
  /* No grid padding above the sticky bar — its own 12px padding is the only top
     spacing, so the chips sit with even space above and below. */
  .hlp__grid { gap: 12px; padding: 0 0 32px; }
  .hlp__rail--right { display: none; }
  /* The Filters + Sort bar sticks below the app nav while the results scroll.
     --hlp-bar-top is the nav height the host sets (0 by default; the prototype
     sets 60px so it tucks under the sticky global nav). */
  .hlp__rail--left {
    position: sticky; top: var(--hlp-bar-top, 0px); z-index: 20;
    /* Bleed the background full-width (the chips stay inset via the padding) so
       the sticky bar covers the whole viewport as results scroll under it. */
    margin: 0 -16px; padding: 12px 16px;
    background: var(--ds-color-surface-sunken);
    box-shadow: 0 6px 12px -8px rgba(0, 0, 0, 0.18);
  }
  /* Collapsed search summary replaces the full widget; the pencil reveals the
     widget again (DES-419 / DES-422). */
  .hlp__summary { display: flex; margin: 12px 16px; }
  .hlp__search { display: none; }
  .hlp__search--editing { display: block; border-top: 1px solid var(--ds-color-border); }

  /* Filters + Map as two equal buttons on one line, matching production. */
  .hlp__filterbar { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 12px; }
  .hlp__filterbar-rail :deep(.fr__toggle) {
    height: 44px; width: 100%; min-width: 0; padding: 0 14px; gap: 8px;
    justify-content: center; border-radius: var(--ds-radius-md);
    border-color: var(--ds-color-border); color: var(--ds-color-text); font-weight: 600;
    box-shadow: var(--ds-shadow-1);
  }
  /* The rail's trigger carries a trailing chevron on desktop; production's button
     is just [icon] Filters, so drop it here. */
  .hlp__filterbar-rail :deep(.fr__toggle > .q-icon) { display: none; }
  .hlp__mapbtn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    height: 44px; width: 100%; padding: 0 14px;
    border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md);
    background: var(--ds-color-surface); color: var(--ds-color-text);
    font-family: inherit; font-weight: 600; font-size: 0.9375rem; cursor: pointer;
    box-shadow: var(--ds-shadow-1);
  }
  /* Sort By — full-width floating-label select beneath the two buttons. */
  .hlp__filterbar-sort { display: block; margin-top: 12px; }
  .hlp__filterbar-sort :deep(.srt) { display: block; }
  .hlp__filterbar-sort :deep(.srt__btn) {
    width: 100%; min-height: 56px; padding: 8px 14px;
    border-color: var(--ds-color-border); background: var(--ds-color-surface);
  }
  /* Count centered below; the toolbar's own Sort is hidden (moved to the bar). */
  .hlp__toolbar { margin-bottom: 8px; }
  .hlp__toolbar :deep(.rtb) { justify-content: center; }
  .hlp__toolbar :deep(.rtb__count) { width: 100%; text-align: center; }
  .hlp__toolbar :deep(.srt) { display: none; }
  .hlp__hero { min-height: 0; }
  .hlp__hero-inner { padding: 16px; }
  .hlp__skel { flex-direction: column; min-height: 0; }
  .hlp__skel-media { width: 100%; height: 180px; }
  .hlp__skel-price { width: 100%; align-items: flex-start; }
}
</style>
