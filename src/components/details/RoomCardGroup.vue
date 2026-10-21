<script setup>
// RoomCardGroup — "Group Block" vertical room card for the Hotel Details
// "Select Your Room" section. Header (room type, bed config, occupancy) + a
// "Rooms per Night" list with per-night quantity steppers + starting price + an
// "Add to Cart" / "Update" CTA. When a room is sold out (at least one night
// unavailable), the footer shows an "Unavailable" state.
//
// DES-416 — the steppers show the FULL quantity currently in the cart for this
// room type (not "new to add"), and persist across submits:
//   1. Staging      — stepping a night changes the on-screen selection only.
//   2. First submit — while nothing's in the cart the CTA reads "Add to Cart",
//      disabled until some night > 0. Clicking commits the selection.
//   3. Numbers stay — after committing, the steppers keep the chosen quantities.
//   4. Becomes Update — once anything's in the cart the CTA reads "Update".
//   5. Update gating — right after a commit the on-screen values match the cart,
//      so Update is disabled until a quantity changes.
//   6. Adjusting     — any change re-enables Update; committing pushes the new
//      quantities (up = add more, down = reduce).
//   7. Zero-out      — zeroing every night and clicking Update removes the room
//      type entirely; the CTA reverts to "Add to Cart".
import { ref, computed, watch } from 'vue'
import QuantityStepper from '../QuantityStepper.vue'

const props = defineProps({
  roomType: { type: String, default: 'Room' },
  bedConfig: { type: String, default: '' },
  maxOccupancy: { type: Number, default: null },
  features: { type: Array, default: () => [] },   // accepted but not rendered
  nights: { type: Array, default: () => [] },      // [{ date, roomsLeft, price }]
  // Per-night counts already in the cart for this room type. Seeds both the
  // steppers (what's shown) and the committed baseline (what's actually held).
  inCart: { type: Array, default: () => [] },
  currency: { type: String, default: '$' },
  availability: { type: String, default: 'available' }, // available | limited | soldout
  // Image props accepted for compatibility; room-type images are not shown.
  image: { type: String, default: '' },
  imageCategories: { type: Array, default: () => [] },
  seed: { type: Number, default: 0 },
})
// `update` carries the full committed state for this room type; `add`/`remove`
// remain as coarse signals for hosts that only care about entering/leaving cart.
const emit = defineEmits(['add', 'remove', 'update'])

const soldout = computed(() => props.availability === 'soldout')
const money = (n) => props.currency + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const leftLabel = (n) => (n <= 0 ? 'Sold Out' : n <= 3 ? `Only ${n} left` : `${n} left`)
const leftClass = (n) => (n <= 0 ? 'is-sold' : n <= 3 ? 'is-limited' : 'is-ok')

const seed = (src) => props.nights.map((n, i) => src?.[i] || 0)
// staged = what the steppers show; committed = what's actually in the cart.
const staged = ref(seed(props.inCart))
const committed = ref(seed(props.inCart))
// Re-seed if the host pushes a new cart state for this room type.
watch(() => props.inCart, (v) => { staged.value = seed(v); committed.value = seed(v) })

const stagedTotal = computed(() => staged.value.reduce((a, b) => a + b, 0))
const committedTotal = computed(() => committed.value.reduce((a, b) => a + b, 0))
// In-cart mode (rule 4): something for this room type is already held.
const inCartMode = computed(() => committedTotal.value > 0)
// Dirty (rules 5/6): the steppers differ from what's committed.
const dirty = computed(() => staged.value.some((v, i) => v !== committed.value[i]))
const startingPrice = computed(() => (props.nights.length ? Math.min(...props.nights.map((n) => n.price)) : 0))
// Rooms that would remain that night if the staged selection were taken.
const remaining = (i) => Math.max(0, props.nights[i].roomsLeft - staged.value[i])

const ctaLabel = computed(() => (inCartMode.value ? 'Update' : 'Add to Cart'))
// Add to Cart: needs a selection. Update: needs a change from the cart.
const ctaDisabled = computed(() => (soldout.value ? true : inCartMode.value ? !dirty.value : stagedTotal.value === 0))

// Commit the staged selection to the cart. Zeroing everything removes the room.
const commit = () => {
  const removed = stagedTotal.value === 0
  committed.value = [...staged.value]
  emit('update', { total: committedTotal.value, nights: [...committed.value] })
  emit(removed ? 'remove' : 'add', committedTotal.value)
}
const onSubmit = () => { if (!ctaDisabled.value) commit() }
</script>

<template>
  <div class="rcg">
    <!-- HEAD -->
    <div class="rcg__head">
      <h3 class="rcg__title">{{ roomType }}</h3>
      <div v-if="bedConfig" class="rcg__bed">{{ bedConfig }}</div>
      <div v-if="maxOccupancy != null" class="rcg__occ"><q-icon name="bed" size="18px" /> <span>Max Occupancy: {{ maxOccupancy }}</span></div>
    </div>

    <!-- ROOMS PER NIGHT -->
    <div v-if="nights.length" class="rcg__sec">
      <h4 class="rcg__h">Rooms per Night</h4>
      <div v-for="(n, i) in nights" :key="n.date" class="rcg__nightwrap">
        <div class="rcg__night">
          <div class="rcg__ndate">
            <span class="rcg__date">{{ n.date }}</span>
            <span class="rcg__nrate">{{ money(n.price) }} / night</span>
          </div>
          <span class="rcg__left" :class="leftClass(remaining(i))">{{ leftLabel(remaining(i)) }}</span>
          <!-- Steppers show the FULL quantity in cart for this night, capped at
               the night's availability (DES-416). -->
          <quantity-stepper v-model="staged[i]" :min="0" :max="soldout ? 0 : n.roomsLeft" size="sm" />
        </div>
      </div>
    </div>

    <!-- FOOT — starting price + CTA, or the Unavailable state when sold out -->
    <div class="rcg__foot">
      <template v-if="!soldout">
        <div class="rcg__starting">STARTING PRICE</div>
        <div class="rcg__amount"><strong>{{ money(startingPrice) }}</strong> <span>/ night</span></div>
        <button type="button" class="rcg__cta" :class="{ 'rcg__cta--ready': !ctaDisabled }" :disabled="ctaDisabled" @click="onSubmit">
          {{ ctaLabel }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="rcg__unavail" disabled>Unavailable</button>
        <p class="rcg__soldnote"><q-icon name="error" size="18px" /> <span>At least one night in your selected range is sold out at this property</span></p>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Fluid: fills its column (and shrinks to fit a 360px phone) but caps standalone.
   Inside RoomsCarousel the width/cap is overridden so grid cells fill fully. */
.rcg { display: flex; flex-direction: column; width: 100%; max-width: 400px; background: var(--ds-color-surface); border: 1px solid rgba(0,0,0,0.04); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06); }

/* Head grows to fill, pushing the Rooms-per-Night + footer to a consistent
   baseline so they align across equal-height cards in the grid. */
.rcg__head { flex: 1; padding: 20px 22px 16px; display: flex; flex-direction: column; gap: 8px; }
.rcg__title { margin: 0; font-size: 1.375rem; font-weight: 700; color: var(--ds-color-text-brand); line-height: 1.2; }
.rcg__bed { color: var(--ds-color-text-subtle); font-size: 1rem; }
.rcg__occ { display: inline-flex; align-items: center; gap: 8px; color: var(--ds-color-text); font-size: 1rem; }
.rcg__occ .q-icon { color: var(--ds-color-text-brand); }

.rcg__sec { padding: 14px 22px; border-top: 1px solid var(--ds-color-border); }
.rcg__h { margin: 0 0 10px; font-size: 1.0625rem; font-weight: 700; color: var(--ds-color-text-brand); }
.rcg__nightwrap { padding: 2px 0; }
.rcg__nightwrap + .rcg__nightwrap { border-top: 1px solid var(--ds-color-border); }
.rcg__night { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; padding: 8px 0; }
.rcg__ndate { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.rcg__date { color: var(--ds-color-text-brand); font-weight: 700; font-size: 1rem; }
.rcg__nrate { color: var(--ds-color-text-subtlest); font-size: 0.8125rem; }
.rcg__left { font-weight: 700; font-size: 0.9375rem; white-space: nowrap; }
.rcg__left.is-ok { color: var(--ds-color-text-success); }
.rcg__left.is-limited { color: var(--ds-palette-orange-600); }
.rcg__left.is-sold { color: var(--ds-color-text-danger); }

.rcg__foot { padding: 16px 22px 20px; border-top: 1px solid var(--ds-color-border); }
.rcg__starting { color: var(--ds-color-text-subtle); font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.04em; }
.rcg__amount { color: var(--ds-color-text-brand); margin-top: 2px; }
.rcg__amount strong { font-size: 1.5rem; font-weight: 700; }
.rcg__amount span { color: var(--ds-color-text-subtle); font-size: 0.9375rem; }
.rcg__cta { width: 100%; height: 46px; margin-top: 14px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-palette-slate-300); color: #fff; font-family: inherit; font-size: 1rem; font-weight: 700; cursor: default; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.rcg__cta--ready { background: var(--ds-color-background-brand-bold); cursor: pointer; }
.rcg__cta--ready:hover { background: var(--ds-palette-navy-800); }

/* Sold-out / unavailable state */
.rcg__unavail { width: 100%; height: 48px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-danger-bold); color: #fff; font-family: inherit; font-size: 1rem; font-weight: 700; cursor: default; }
.rcg__soldnote { display: flex; align-items: flex-start; gap: 8px; margin: 12px 0 0; color: var(--ds-color-text-danger); font-size: 0.875rem; line-height: 1.4; }
.rcg__soldnote .q-icon { color: var(--ds-color-text-danger); flex: none; margin-top: 1px; }
</style>
