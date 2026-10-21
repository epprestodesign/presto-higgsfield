<script setup>
// Filter — a single browse-sidebar filter section. The `type` prop selects the
// control; each type is a Storybook variant:
//   amenities      → checkbox list (multi-select)
//   amenitiesGrid  → icon-tile grid (multi-select)
//   roomType       → icon chip toggles (multi-select)
//   guestRating    → radio group (single-select)
//   starRating     → star chip toggles (multi-select)
//   hotelClass     → description cards (multi-select)
//   brands         → nested checkbox tree; a parent toggles all its children
//   budget         → dual-handle range slider + min/max readout (+ optional histogram)
//   propertySearch → text input, with optional autocomplete suggestions
// v-model holds the appropriate value shape per type. Selected states use the
// DS primary (Navy). Stack several to build a full filter sidebar.
import { computed, reactive, ref } from 'vue'
import { AMENITIES, filterAmenities } from '../../lib/amenities.js'

const props = defineProps({
  type: { type: String, required: true },
  title: { type: String, default: '' },
  modelValue: { default: undefined },
  options: { type: Array, default: null }, // amenities / guestRating / hotelClass overrides
  brands: { type: Array, default: null },  // brands tree override
  tiles: { type: Array, default: null },   // amenitiesGrid override
  // budget
  min: { type: Number, default: 50 },
  max: { type: Number, default: 1000 },
  step: { type: Number, default: 10 },
  currency: { type: String, default: '$' },
  histogram: { type: Array, default: null }, // budget: price-distribution bar heights
  nights: { type: Number, default: 3 }, // budget: nights used to scale per-night ↔ total
  // propertySearch
  placeholder: { type: String, default: '' },
  suggestions: { type: Array, default: null }, // [string] or [{ name, location }]
  // layout
  collapsible: { type: Boolean, default: false }, // title becomes an expand/collapse header
  defaultOpen: { type: Boolean, default: true },
  // amenities / amenitiesGrid: show only the first N items behind a
  // "View more / Fewer" toggle. null → per-type default; 0 → show all.
  collapseAfter: { type: Number, default: null },
})
const emit = defineEmits(['update:modelValue'])

const DEFAULTS = {
  amenities: {
    title: 'Amenities',
    // Full amenity list, sourced from the shared catalog (src/lib/amenities.js).
    options: filterAmenities().map((a) => a.label),
    value: () => [],
  },
  amenitiesGrid: {
    title: 'Amenities',
    // Icon-tile grid sourced from the full amenities catalog (src/lib/amenities.js).
    tiles: AMENITIES.map((a) => ({ label: a.label, icon: a.icon })),
    value: () => [],
  },
  roomType: {
    title: 'Room Type',
    // Ordered least → most bed occupancy (see ROOM_TYPE_ORDER). The component
    // re-sorts whatever options it's given into this canonical order anyway.
    options: [
      { label: 'Twin', icon: 'single_bed' },
      { label: 'Double', icon: 'bed' },
      { label: 'Queen', icon: 'bed' },
      { label: 'King', icon: 'king_bed' },
      { label: 'Suite', icon: 'meeting_room' },
    ],
    value: () => [],
  },
  guestRating: {
    title: 'Guest Rating',
    options: ['Any', '2.0 – 2.9', '3.0 – 3.9', '4.0 – 4.9', '5.0'],
    value: () => 'Any',
  },
  starRating: { title: 'Star Rating', options: [1, 2, 3, 4, 5], value: () => [] },
  hotelClass: {
    title: 'Hotel class',
    options: [
      { label: '2-star', sub: 'Just the basics' }, { label: '3-star', sub: 'Quality comfort' },
      { label: '4-star', sub: 'Lots of extras' }, { label: '5-star', sub: 'Top service' },
    ],
    value: () => [],
  },
  brands: {
    title: 'Brands',
    brands: [
      { name: 'Choice Hotels', children: ['Cambria', 'Comfort', 'Quality Inn', 'Rodeway Inn'] },
      { name: 'Extended Stay America', children: ['Extended Stay America Suites', 'Extended Stay America Select'] },
      { name: 'Hilton Honors', children: ['Hampton', 'DoubleTree', 'Embassy Suites', 'Hilton Garden Inn'] },
      { name: 'Hyatt', children: ['Hyatt Place', 'Hyatt House', 'Grand Hyatt', 'Park Hyatt'] },
      { name: 'IHG Hotels & Resorts', children: ['Holiday Inn', 'Crowne Plaza', 'Staybridge Suites', 'Candlewood Suites'] },
    ],
    value: () => [],
  },
  budget: { title: 'Your budget (per night)', value: () => ({ min: 50, max: 1000 }) },
  propertySearch: { title: 'Search By Property Name', placeholder: 'e.g Hilton', value: () => '' },
}

const cfg = computed(() => DEFAULTS[props.type] || {})
const heading = computed(() => props.title || cfg.value.title || '')
const opts = computed(() => props.options || cfg.value.options || [])
const tiles = computed(() => props.tiles || cfg.value.tiles || [])
const brandOpts = computed(() => props.brands || cfg.value.brands || [])
const suggestions = computed(() => props.suggestions || [])

// Room Type chips always read left→right from least to most bed occupancy,
// regardless of the order options are supplied in. Unknown labels sort last but
// keep their relative order (stable sort).
const ROOM_TYPE_ORDER = ['twin', 'single', 'cot', 'double', 'full', 'queen', 'king', 'suite']
const roomTypeRank = (label) => {
  const l = String(label).toLowerCase()
  const i = ROOM_TYPE_ORDER.findIndex((k) => l.includes(k))
  return i === -1 ? ROOM_TYPE_ORDER.length : i
}
const roomTypeOpts = computed(() => [...opts.value].sort((a, b) => roomTypeRank(a.label) - roomTypeRank(b.label)))

// v-model with per-type defaults when the parent leaves it undefined.
const val = computed({
  get: () => (props.modelValue === undefined ? cfg.value.value?.() : props.modelValue),
  set: (v) => emit('update:modelValue', v),
})

const toggleIn = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
const toggleVal = (item) => { val.value = toggleIn(val.value || [], item) }

// Budget readout — top of the range shows "<max>+".
const money = (n) => props.currency + ' ' + Number(n).toLocaleString('en-US') + (n >= props.max ? '+' : '')
const range = computed({
  get: () => val.value || { min: props.min, max: props.max },
  set: (v) => { val.value = v },
})
// Price basis — the budget can show per-night (canonical) or total trip cost.
// `range` stays in per-night terms; the toggle scales the *displayed* values by
// `nights`, so the emitted v-model is always per-night regardless of basis.
const priceBasis = ref('night') // 'night' | 'total'
const factor = computed(() => (priceBasis.value === 'total' ? Math.max(1, props.nights) : 1))
const dispMin = computed(() => props.min * factor.value)
const dispMax = computed(() => props.max * factor.value)
const dispStep = computed(() => props.step * factor.value)
const dispRange = computed({
  get: () => ({ min: range.value.min * factor.value, max: range.value.max * factor.value }),
  set: (v) => { range.value = { min: Math.round(v.min / factor.value), max: Math.round(v.max / factor.value) } },
})
// Editable Min/Max inputs (in the displayed basis), clamped so the handles never
// cross. An empty Max means "no cap" (the slider's top).
const setMin = (v) => {
  let n = Number(v)
  if (Number.isNaN(n)) n = dispMin.value
  n = Math.max(dispMin.value, Math.min(n, dispRange.value.max - dispStep.value))
  dispRange.value = { min: n, max: dispRange.value.max }
}
const setMax = (v) => {
  let n = (v === '' || v == null) ? dispMax.value : Number(v)
  if (Number.isNaN(n)) n = dispMax.value
  n = Math.min(dispMax.value, Math.max(n, dispRange.value.min + dispStep.value))
  dispRange.value = { min: dispRange.value.min, max: n }
}

// Price-distribution bars: scaled to the tallest bucket; a bar is "active"
// (brand color) when its price bucket falls inside the selected range.
const bars = computed(() => {
  const h = props.histogram
  if (!h || !h.length) return []
  const peak = Math.max(...h, 1)
  return h.map((v, i) => {
    const price = props.min + ((i + 0.5) / h.length) * (props.max - props.min)
    return { h: Math.max(6, (v / peak) * 100), active: price >= range.value.min && price <= range.value.max }
  })
})

// Brands tree — value is the list of selected leaf names; a parent reflects
// 'all' / 'some' / 'none' of its children and toggling it selects/clears them.
const expanded = reactive(Object.fromEntries(brandOpts.value.map((b, i) => [b.name, i === 0])))
const toggleExpand = (name) => { expanded[name] = !expanded[name] }
const brandState = (b) => {
  const sel = val.value || []
  const ch = b.children || []
  if (!ch.length) return sel.includes(b.name) ? 'all' : 'none'
  const n = ch.filter((c) => sel.includes(c)).length
  return n === 0 ? 'none' : n === ch.length ? 'all' : 'some'
}
const toggleBrand = (b) => {
  const sel = val.value || []
  const ch = b.children || []
  if (!ch.length) { toggleVal(b.name); return }
  val.value = brandState(b) === 'all' ? sel.filter((c) => !ch.includes(c)) : Array.from(new Set([...sel, ...ch]))
}

// Property-search autocomplete.
const acFocused = ref(false)
const matches = computed(() => {
  const q = (val.value || '').toString().trim().toLowerCase()
  if (!q) return []
  return suggestions.value
    .map((s) => (typeof s === 'string' ? { name: s } : s))
    .filter((s) => `${s.name} ${s.location || ''}`.toLowerCase().includes(q))
    .slice(0, 6)
})
const pick = (s) => { val.value = s.name; acFocused.value = false }

// Collapsible section state.
const open = ref(props.defaultOpen)

// Inline search — filters long lists (amenities / amenitiesGrid / brands) by
// label as you type. While searching we bypass the View-more collapse and show
// every match. Each Filter renders one `type`, so a single query ref serves the
// active list (the search field is rendered only by those three sections).
const query = ref('')
const searching = computed(() => query.value.trim().length > 0)
const q = computed(() => query.value.trim().toLowerCase())
const matchLabel = (label) => label.toLowerCase().includes(q.value)
const filteredOpts = computed(() => (searching.value ? opts.value.filter(matchLabel) : opts.value))
const filteredTiles = computed(() => (searching.value ? tiles.value.filter((t) => matchLabel(t.label)) : tiles.value))
// Brands: a parent match keeps all its children; otherwise keep matching children.
const filteredBrands = computed(() => {
  if (!searching.value) return brandOpts.value
  return brandOpts.value
    .map((b) => {
      if (matchLabel(b.name)) return b
      const children = (b.children || []).filter(matchLabel)
      return children.length ? { ...b, children } : null
    })
    .filter(Boolean)
})
const noMatches = computed(() => searching.value && (
  props.type === 'amenitiesGrid' ? filteredTiles.value.length === 0
  : props.type === 'brands' ? filteredBrands.value.length === 0
  : filteredOpts.value.length === 0
))

// "View more / Fewer amenity options" — collapse long amenity lists/grids to a
// preview, with a toggle. Defaults: 15 checkbox rows, 8 grid tiles.
const DEFAULT_COLLAPSE = { amenities: 15, amenitiesGrid: 8 }
const showAll = ref(false)
const collapseLimit = computed(() => {
  const n = props.collapseAfter ?? DEFAULT_COLLAPSE[props.type] ?? 0
  return n > 0 ? n : 0
})
const totalCount = computed(() => (props.type === 'amenitiesGrid' ? tiles.value.length : opts.value.length))
const hiddenCount = computed(() => Math.max(0, totalCount.value - collapseLimit.value))
const canToggle = computed(() => collapseLimit.value > 0 && hiddenCount.value > 0 && !searching.value)
const collapse = (list) => (collapseLimit.value && !showAll.value ? list.slice(0, collapseLimit.value) : list)
// While searching, show every match (the View-more collapse is bypassed).
const visibleOpts = computed(() => (searching.value ? filteredOpts.value : collapse(opts.value)))
const visibleTiles = computed(() => (searching.value ? filteredTiles.value : collapse(tiles.value)))
</script>

<template>
  <section class="flt" :class="{ 'flt--collapsible': collapsible }">
    <button v-if="collapsible" type="button" class="flt__titlerow" :aria-expanded="open" @click="open = !open">
      <h3 class="flt__title">{{ heading }}</h3>
      <q-icon :name="open ? 'expand_less' : 'expand_more'" size="24px" class="flt__titlechev" />
    </button>
    <h3 v-else class="flt__title">{{ heading }}</h3>

    <div v-show="!collapsible || open" class="flt__body">
    <!-- amenities: checkbox list -->
    <template v-if="type === 'amenities'">
      <div class="flt__find">
        <q-icon name="search" size="20px" class="flt__find-icon" />
        <input v-model="query" class="flt__find-input" type="text" placeholder="Search amenities" autocomplete="off" aria-label="Search amenities" />
        <button v-if="searching" type="button" class="flt__find-clear" aria-label="Clear search" @click="query = ''"><q-icon name="close" size="18px" /></button>
      </div>
      <div class="flt__list">
        <button v-for="a in visibleOpts" :key="a" type="button" class="flt__check" :class="{ 'is-on': (val || []).includes(a) }" role="checkbox" :aria-checked="(val || []).includes(a)" @click="toggleVal(a)">
          <span class="flt__box"><q-icon v-if="(val || []).includes(a)" name="check" size="14px" /></span>
          <span class="flt__label">{{ a }}</span>
        </button>
      </div>
      <p v-if="noMatches" class="flt__noresults">No amenities match “{{ query.trim() }}”.</p>
      <button v-if="canToggle" type="button" class="flt__more" :aria-expanded="showAll" @click="showAll = !showAll">
        <q-icon :name="showAll ? 'expand_less' : 'expand_more'" size="20px" />
        {{ showAll ? 'Fewer amenity options' : `View ${hiddenCount} more amenities` }}
      </button>
    </template>

    <!-- amenities: icon-tile grid -->
    <template v-else-if="type === 'amenitiesGrid'">
      <div class="flt__find">
        <q-icon name="search" size="20px" class="flt__find-icon" />
        <input v-model="query" class="flt__find-input" type="text" placeholder="Search amenities" autocomplete="off" aria-label="Search amenities" />
        <button v-if="searching" type="button" class="flt__find-clear" aria-label="Clear search" @click="query = ''"><q-icon name="close" size="18px" /></button>
      </div>
      <div class="flt__grid">
        <button v-for="t in visibleTiles" :key="t.label" type="button" class="flt__tile" :class="{ 'is-on': (val || []).includes(t.label) }" :aria-pressed="(val || []).includes(t.label)" @click="toggleVal(t.label)">
          <q-icon :name="t.icon" size="20px" />
          <span>{{ t.label }}</span>
        </button>
      </div>
      <p v-if="noMatches" class="flt__noresults">No amenities match “{{ query.trim() }}”.</p>
      <button v-if="canToggle" type="button" class="flt__more" :aria-expanded="showAll" @click="showAll = !showAll">
        <q-icon :name="showAll ? 'expand_less' : 'expand_more'" size="20px" />
        {{ showAll ? 'Fewer amenity options' : `View ${hiddenCount} more amenities` }}
      </button>
    </template>

    <!-- room type: icon chip toggles -->
    <div v-else-if="type === 'roomType'" class="flt__chips">
      <button v-for="o in roomTypeOpts" :key="o.label" type="button" class="flt__chip" :class="{ 'is-on': (val || []).includes(o.label) }" :aria-pressed="(val || []).includes(o.label)" @click="toggleVal(o.label)">
        <q-icon :name="o.icon" size="18px" />
        <span>{{ o.label }}</span>
      </button>
    </div>

    <!-- guest rating: radio group -->
    <div v-else-if="type === 'guestRating'" class="flt__list" role="radiogroup">
      <button v-for="o in opts" :key="o" type="button" class="flt__radio" :class="{ 'is-on': val === o }" role="radio" :aria-checked="val === o" @click="val = o">
        <span class="flt__dot"><span v-if="val === o" /></span>
        <span class="flt__label">{{ o }}</span>
      </button>
    </div>

    <!-- star rating: chip toggles -->
    <div v-else-if="type === 'starRating'" class="flt__stars">
      <button v-for="s in opts" :key="s" type="button" class="flt__star" :class="{ 'is-on': (val || []).includes(s) }" :aria-pressed="(val || []).includes(s)" @click="toggleVal(s)">
        {{ s }} <q-icon name="star" size="14px" />
      </button>
    </div>

    <!-- hotel class: description cards -->
    <div v-else-if="type === 'hotelClass'" class="flt__classes">
      <button v-for="c in opts" :key="c.label" type="button" class="flt__class" :class="{ 'is-on': (val || []).includes(c.label) }" :aria-pressed="(val || []).includes(c.label)" @click="toggleVal(c.label)">
        <strong>{{ c.label }}</strong>
        <span>{{ c.sub }}</span>
      </button>
    </div>

    <!-- brands: nested checkbox tree -->
    <div v-else-if="type === 'brands'" class="flt__brands">
      <div class="flt__find">
        <q-icon name="search" size="20px" class="flt__find-icon" />
        <input v-model="query" class="flt__find-input" type="text" placeholder="Search brands" autocomplete="off" aria-label="Search brands" />
        <button v-if="searching" type="button" class="flt__find-clear" aria-label="Clear search" @click="query = ''"><q-icon name="close" size="18px" /></button>
      </div>
      <div v-for="b in filteredBrands" :key="b.name" class="flt__brand">
        <div class="flt__brandhead">
          <button type="button" class="flt__check" :class="{ 'is-on': brandState(b) === 'all' }" @click="toggleBrand(b)">
            <span class="flt__box" :class="{ 'is-indet': brandState(b) === 'some' }">
              <q-icon v-if="brandState(b) === 'all'" name="check" size="14px" />
              <span v-else-if="brandState(b) === 'some'" class="flt__dash" />
            </span>
            <span class="flt__label">{{ b.name }}</span>
          </button>
          <button v-if="(b.children || []).length" type="button" class="flt__chev" :aria-label="expanded[b.name] ? 'Collapse' : 'Expand'" @click="toggleExpand(b.name)">
            <q-icon :name="(expanded[b.name] || searching) ? 'expand_less' : 'expand_more'" size="22px" />
          </button>
        </div>
        <div v-show="expanded[b.name] || searching" class="flt__children">
          <button v-for="c in b.children" :key="c" type="button" class="flt__check flt__check--child" :class="{ 'is-on': (val || []).includes(c) }" role="checkbox" :aria-checked="(val || []).includes(c)" @click="toggleVal(c)">
            <span class="flt__box"><q-icon v-if="(val || []).includes(c)" name="check" size="14px" /></span>
            <span class="flt__label">{{ c }}</span>
          </button>
        </div>
      </div>
      <p v-if="noMatches" class="flt__noresults">No brands match “{{ query.trim() }}”.</p>
    </div>

    <!-- budget: dual-handle slider + min/max boxes (+ optional price histogram) -->
    <div v-else-if="type === 'budget'" class="flt__budget" :class="{ 'flt__budget--histo': bars.length }">
      <div class="flt__basis" role="radiogroup" aria-label="Price basis">
        <button type="button" class="flt__radio flt__radio--inline" :class="{ 'is-on': priceBasis === 'night' }" role="radio" :aria-checked="priceBasis === 'night'" @click="priceBasis = 'night'">
          <span class="flt__dot"><span v-if="priceBasis === 'night'" /></span><span class="flt__label">Per night</span>
        </button>
        <button type="button" class="flt__radio flt__radio--inline" :class="{ 'is-on': priceBasis === 'total' }" role="radio" :aria-checked="priceBasis === 'total'" @click="priceBasis = 'total'">
          <span class="flt__dot"><span v-if="priceBasis === 'total'" /></span><span class="flt__label">Total cost</span>
        </button>
      </div>
      <div v-if="priceBasis === 'total'" class="flt__basisnote">Total for {{ nights }} night{{ nights === 1 ? '' : 's' }}</div>
      <div class="flt__mmrow">
        <label class="flt__mm">
          <span>Minimum</span>
          <span class="flt__mmfield"><span class="flt__mmcur">{{ currency }}</span><input class="flt__mminput" type="number" inputmode="numeric" :value="dispRange.min" :min="dispMin" :max="dispRange.max - dispStep" @change="setMin($event.target.value)" /></span>
        </label>
        <label class="flt__mm">
          <span>{{ priceBasis === 'total' ? 'Max total' : 'Max price' }}</span>
          <span class="flt__mmfield"><span class="flt__mmcur">{{ currency }}</span><input class="flt__mminput" type="number" inputmode="numeric" :value="dispRange.max >= dispMax ? null : dispRange.max" placeholder="Max" :min="dispRange.min + dispStep" :max="dispMax" @change="setMax($event.target.value)" /></span>
        </label>
      </div>
      <div v-if="bars.length" class="flt__histo" aria-hidden="true">
        <span v-for="(b, i) in bars" :key="i" class="flt__bar" :class="{ 'is-active': b.active }" :style="{ height: b.h + '%' }" />
      </div>
      <q-range :model-value="dispRange" :min="dispMin" :max="dispMax" :step="dispStep" class="flt__range" color="dark" track-color="grey-4" @update:model-value="dispRange = $event" />
    </div>

    <!-- property search: text input with optional autocomplete -->
    <div v-else-if="type === 'propertySearch'" class="flt__searchwrap">
      <input v-model="val" class="flt__search" type="text" :placeholder="placeholder || cfg.placeholder" autocomplete="off" @focus="acFocused = true" @blur="acFocused = false" />
      <ul v-if="acFocused && matches.length" class="flt__ac">
        <li v-for="m in matches" :key="m.name">
          <button type="button" class="flt__acopt" @mousedown.prevent="pick(m)">
            <q-icon name="location_city" size="18px" />
            <span class="flt__acname">{{ m.name }}</span>
            <span v-if="m.location" class="flt__acloc">{{ m.location }}</span>
          </button>
        </li>
      </ul>
    </div>
    </div>
  </section>
</template>

<style scoped>
.flt { padding: 4px 0; }
.flt__title { margin: 0 0 12px; font-size: 1rem; font-weight: 700; color: var(--ds-color-text); }
.flt__titlerow { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 0; background: none; border: 0; cursor: pointer; text-align: left; }
.flt__titlerow .flt__title { margin: 0; }
.flt__titlechev { color: var(--ds-color-text-subtle); flex: none; }
.flt--collapsible .flt__body { padding-top: 12px; }

/* "View more / Fewer amenity options" toggle */
.flt__more { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 4px 0; background: none; border: 0; color: var(--ds-color-text-brand); font-family: inherit; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
.flt__more:hover { text-decoration: underline; }

/* checkbox + radio rows */
.flt__list { display: flex; flex-direction: column; gap: 2px; }
.flt__check, .flt__radio { display: flex; align-items: center; gap: 10px; width: 100%; padding: 4px 0; background: none; border: 0; text-align: left; cursor: pointer; }
.flt__box { width: 20px; height: 20px; flex: none; border: 2px solid var(--ds-color-border-bold); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #fff; transition: background var(--ds-duration-fast) var(--ds-ease-standard), border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__check.is-on .flt__box, .flt__box.is-indet { background: var(--ds-color-background-brand-bold); border-color: var(--ds-color-background-brand-bold); }
.flt__dash { width: 10px; height: 2px; border-radius: 1px; background: #fff; }
.flt__dot { width: 20px; height: 20px; flex: none; border: 2px solid var(--ds-color-border-bold); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.flt__radio.is-on .flt__dot { border-color: var(--ds-color-background-brand-bold); }
.flt__dot span { width: 10px; height: 10px; border-radius: 50%; background: var(--ds-color-background-brand-bold); }
.flt__label { font-size: 0.875rem; font-weight: 400; color: var(--ds-color-text); }
.flt__check:hover .flt__box, .flt__radio:hover .flt__dot { border-color: var(--ds-color-text); }

/* amenities icon grid */
.flt__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.flt__tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 68px; padding: 10px 8px; text-align: center; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: var(--ds-color-text); font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard), border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__tile .q-icon { color: var(--ds-color-text-subtle); }
.flt__tile:hover { border-color: var(--ds-color-text); }
.flt__tile.is-on { border-color: var(--ds-color-background-brand-bold); background: var(--ds-palette-navy-50); box-shadow: inset 0 0 0 1px var(--ds-color-background-brand-bold); }
.flt__tile.is-on .q-icon { color: var(--ds-color-background-brand-bold); }

/* star chips */
.flt__stars { display: flex; flex-wrap: wrap; gap: 8px; }
.flt__star { display: inline-flex; align-items: center; gap: 5px; height: 38px; min-width: 50px; padding: 0 12px; justify-content: center; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: var(--ds-color-text); font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard), border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__star .q-icon { color: var(--ds-color-text); }
.flt__star:hover { border-color: var(--ds-color-text); }
.flt__star.is-on { background: var(--ds-color-background-brand-bold); border-color: var(--ds-color-background-brand-bold); color: #fff; }
.flt__star.is-on .q-icon { color: #fff; }

/* hotel class cards */
.flt__classes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.flt__class { display: flex; flex-direction: column; gap: 2px; align-items: center; padding: 12px 10px; text-align: center; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard), border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__class strong { font-size: 0.9375rem; font-weight: 700; color: var(--ds-color-text); }
.flt__class span { font-size: 0.8125rem; color: var(--ds-color-text-subtle); }
.flt__class:hover { border-color: var(--ds-color-text); }
.flt__class.is-on { border-color: var(--ds-color-background-brand-bold); background: var(--ds-palette-navy-50); box-shadow: inset 0 0 0 1px var(--ds-color-background-brand-bold); }

/* brands tree */
.flt__brands { display: flex; flex-direction: column; }
.flt__brandhead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.flt__chev { background: none; border: 0; padding: 6px; color: var(--ds-color-text-subtle); cursor: pointer; display: flex; }
.flt__children { display: flex; flex-direction: column; padding-left: 30px; }
.flt__check--child .flt__label { font-weight: 400; }

/* budget */
.flt__budget { display: flex; flex-direction: column; padding-top: 4px; }
/* per-night / total-cost basis toggle */
.flt__basis { display: flex; flex-wrap: wrap; gap: 6px 20px; margin-bottom: 8px; }
.flt__radio--inline { width: auto; gap: 8px; }
.flt__basisnote { font-size: 0.8125rem; color: var(--ds-color-text-subtle); margin: 0 0 12px; }
.flt__range { padding: 0 6px; }
.flt__budget .flt__range { order: 1; }
.flt__budget .flt__mmrow { order: 2; margin-top: 14px; }
.flt__budget--histo .flt__mmrow { order: 1; margin-top: 0; margin-bottom: 18px; }
.flt__budget--histo .flt__histo { order: 2; }
.flt__budget--histo .flt__range { order: 3; }

.flt__mmrow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.flt__mm { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 8px 12px; cursor: text; transition: border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__mm:focus-within { border-color: var(--ds-color-border-focused); }
.flt__mm > span:first-child { font-size: 0.8125rem; color: var(--ds-color-text-subtle); }
.flt__mmfield { display: flex; align-items: center; gap: 4px; }
.flt__mmcur { font-size: 1rem; font-weight: 700; color: var(--ds-color-text); flex: none; }
.flt__mminput { width: 100%; min-width: 0; border: 0; outline: none; background: none; padding: 0; font-family: inherit; font-size: 1rem; font-weight: 700; color: var(--ds-color-text); }
.flt__mminput::placeholder { color: var(--ds-color-text-subtlest); font-weight: 700; }
/* Hide number-input spinners for a cleaner look. */
.flt__mminput::-webkit-outer-spin-button, .flt__mminput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.flt__mminput { -moz-appearance: textfield; }

/* room type chips */
.flt__chips { display: flex; flex-wrap: wrap; gap: 8px; }
.flt__chip { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-pill); background: var(--ds-color-surface); color: var(--ds-color-text); font-weight: 500; font-size: 0.875rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard), border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__chip .q-icon { color: var(--ds-color-text); }
.flt__chip:hover { border-color: var(--ds-color-text); }
.flt__chip.is-on { border-color: var(--ds-color-background-brand-bold); background: var(--ds-palette-navy-50); box-shadow: inset 0 0 0 1px var(--ds-color-background-brand-bold); }

/* price-distribution histogram */
.flt__histo { display: flex; align-items: flex-end; gap: 3px; height: 72px; padding: 0 6px; }
.flt__bar { flex: 1; min-width: 0; border-radius: 4px 4px 0 0; background: var(--ds-palette-slate-200); transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__bar.is-active { background: var(--ds-color-background-brand-bold); }

/* property search + autocomplete */
/* Inline list search (amenities / brands) — leading icon + clearable input. */
.flt__find { position: relative; display: flex; align-items: center; margin-bottom: 12px; }
.flt__find-icon { position: absolute; left: 12px; color: var(--ds-color-text-subtle); pointer-events: none; }
.flt__find-input { width: 100%; height: 38px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 36px; font-family: inherit; font-size: 0.875rem; color: var(--ds-color-text); outline: none; background: var(--ds-color-surface); transition: border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__find-input:focus { border-color: var(--ds-color-border-focused); }
.flt__find-input::placeholder { color: var(--ds-color-text-subtlest); }
.flt__find-clear { position: absolute; right: 8px; width: 26px; height: 26px; border: 0; border-radius: 50%; background: none; color: var(--ds-color-text-subtle); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.flt__find-clear:hover { background: var(--ds-palette-slate-100); color: var(--ds-color-text); }
.flt__noresults { color: var(--ds-color-text-subtle); font-size: 0.875rem; margin: 2px 2px 0; }

.flt__searchwrap { position: relative; }
.flt__search { width: 100%; height: 42px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); outline: none; transition: border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.flt__search:focus { border-color: var(--ds-color-border-focused); }
.flt__search::placeholder { color: var(--ds-color-text-subtlest); }
.flt__ac { list-style: none; margin: 6px 0 0; padding: 6px; position: absolute; z-index: 20; left: 0; right: 0; background: var(--ds-color-surface); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); box-shadow: var(--ds-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.12)); }
.flt__acopt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; border: 0; border-radius: var(--ds-radius-sm); background: none; text-align: left; cursor: pointer; }
.flt__acopt:hover { background: var(--ds-palette-slate-100); }
.flt__acopt .q-icon { color: var(--ds-color-text-subtle); flex: none; }
.flt__acname { font-size: 0.875rem; font-weight: 600; color: var(--ds-color-text); }
.flt__acloc { font-size: 0.8125rem; color: var(--ds-color-text-subtle); margin-left: auto; }
</style>
