<script setup>
// RoomCardGroupCartConcept — CONCEPT ONLY (Storybook, not wired into the app).
// Explores how the Group Block room card should reflect inventory already in the
// cart while still letting the organizer add more. Four display variants:
//   banner   — a summary strip at the top; steppers below reset to 0 for adding
//   inline   — a small "N in cart" note under each night's stepper
//   editable — steppers pre-filled with the cart total; edit-in-place + trash
//   panels   — a separate "In your cart" panel above an "Add more" panel
// Shared behavior: "Add N more to cart" adds the selected inventory then resets
// the steppers to 0; deleting removes the entire block for the room type.
import { ref, computed } from 'vue'
import QuantityStepper from '../../QuantityStepper.vue'

const props = defineProps({
  variant: { type: String, default: 'banner' }, // banner | inline | editable | panels
  roomType: { type: String, default: 'Urban King' },
  bedConfig: { type: String, default: '1 King Bed' },
  maxOccupancy: { type: Number, default: 2 },
  nights: { type: Array, default: () => [] },        // [{ date, roomsLeft, price }]
  initialInCart: { type: Array, default: () => [] }, // per-night counts already held
  currency: { type: String, default: '$' },
})

const money = (n) => props.currency + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const shortDate = (d) => (d.split(',')[0] || d).trim() // "Thu, 7/9/2026" -> "Thu"

// Live-ish state so the concept is interactive: what's held vs what's being added.
const cart = ref(props.nights.map((_, i) => props.initialInCart[i] || 0))
const qty = ref(props.nights.map(() => 0))
const cartCount = computed(() => cart.value.reduce((a, b) => a + b, 0))
const addCount = computed(() => qty.value.reduce((a, b) => a + b, 0))
const startingPrice = computed(() => (props.nights.length ? Math.min(...props.nights.map((n) => n.price)) : 0))
const remaining = (i) => Math.max(0, props.nights[i].roomsLeft - cart.value[i])
const addLabel = computed(() => {
  if (addCount.value === 0) return cartCount.value > 0 ? 'Select rooms to add more' : 'Add to cart'
  return cartCount.value > 0 ? `Add ${addCount.value} more to cart` : `Add ${addCount.value} to cart`
})

const add = () => {
  if (addCount.value === 0) return
  qty.value.forEach((q, i) => { cart.value[i] += q })
  qty.value = props.nights.map(() => 0) // clear back to zeros after adding
}
const removeBlock = () => { cart.value = props.nights.map(() => 0) }
</script>

<template>
  <div class="cc" :class="`cc--${variant}`">
    <!-- HEAD (shared) -->
    <div class="cc__head">
      <h3 class="cc__title">{{ roomType }}</h3>
      <div v-if="bedConfig" class="cc__bed">{{ bedConfig }}</div>
      <div v-if="maxOccupancy != null" class="cc__occ"><q-icon name="bed" size="18px" /> <span>Max Occupancy: {{ maxOccupancy }}</span></div>
    </div>

    <!-- ============ VARIANT A — SUMMARY BANNER ============ -->
    <template v-if="variant === 'banner'">
      <div v-if="cartCount" class="cc__banner">
        <div class="cc__banner-top">
          <span class="cc__banner-title"><q-icon name="check_circle" size="18px" /> {{ cartCount }} room{{ cartCount === 1 ? '' : 's' }} in your cart</span>
          <button type="button" class="cc__linkdel" @click="removeBlock"><q-icon name="delete_outline" size="17px" /> Remove</button>
        </div>
        <div class="cc__chips">
          <span v-for="(n, i) in nights" :key="i" v-show="cart[i]" class="cc__chip">{{ shortDate(n.date) }} · {{ cart[i] }}</span>
        </div>
      </div>
      <div class="cc__sec">
        <h4 class="cc__h">Rooms per Night <span v-if="cartCount" class="cc__hnote">— add more</span></h4>
        <div v-for="(n, i) in nights" :key="i" class="cc__night">
          <div class="cc__ndate"><span class="cc__date">{{ n.date }}</span><span class="cc__rate">{{ money(n.price) }} / night</span></div>
          <span class="cc__left">{{ remaining(i) }} left</span>
          <quantity-stepper v-model="qty[i]" :min="0" :max="remaining(i)" size="sm" />
        </div>
      </div>
      <div class="cc__foot">
        <div class="cc__starting">STARTING PRICE</div>
        <div class="cc__amount"><strong>{{ money(startingPrice) }}</strong> <span>/ night</span></div>
        <button type="button" class="cc__cta" :class="{ 'is-ready': addCount > 0 }" :disabled="addCount === 0" @click="add">{{ addLabel }}</button>
      </div>
    </template>

    <!-- ============ VARIANT B — PER-NIGHT INLINE ============ -->
    <template v-else-if="variant === 'inline'">
      <div class="cc__sec">
        <h4 class="cc__h">Rooms per Night</h4>
        <div v-for="(n, i) in nights" :key="i" class="cc__nightwrap">
          <div class="cc__night">
            <div class="cc__ndate"><span class="cc__date">{{ n.date }}</span><span class="cc__rate">{{ money(n.price) }} / night</span></div>
            <span class="cc__left">{{ remaining(i) }} left</span>
            <quantity-stepper v-model="qty[i]" :min="0" :max="remaining(i)" size="sm" />
          </div>
          <div v-if="cart[i]" class="cc__incart"><q-icon name="check_circle" size="15px" /> {{ cart[i] }} in cart</div>
        </div>
      </div>
      <div class="cc__foot">
        <div class="cc__starting">STARTING PRICE</div>
        <div class="cc__amount"><strong>{{ money(startingPrice) }}</strong> <span>/ night</span></div>
        <button type="button" class="cc__cta" :class="{ 'is-ready': addCount > 0 }" :disabled="addCount === 0" @click="add">{{ addLabel }}</button>
        <button v-if="cartCount" type="button" class="cc__removeall" @click="removeBlock"><q-icon name="delete_outline" size="17px" /> Remove all from cart</button>
      </div>
    </template>

    <!-- ============ VARIANT C — EDITABLE IN-CART STEPPERS ============ -->
    <template v-else-if="variant === 'editable'">
      <div class="cc__sec">
        <h4 class="cc__h">Rooms per Night</h4>
        <p class="cc__editnote">Changes save straight to your cart. Set a night to 0 (🗑) to drop it.</p>
        <div v-for="(n, i) in nights" :key="i" class="cc__night">
          <div class="cc__ndate"><span class="cc__date">{{ n.date }}</span><span class="cc__rate">{{ money(n.price) }} / night</span></div>
          <span class="cc__left" :class="{ 'is-incart': cart[i] > 0 }">{{ cart[i] > 0 ? `${cart[i]} in cart` : `${n.roomsLeft} left` }}</span>
          <quantity-stepper v-model="cart[i]" :min="0" :max="n.roomsLeft" removable size="sm" @remove="cart[i] = 0" />
        </div>
      </div>
      <div class="cc__foot">
        <div class="cc__starting">STARTING PRICE</div>
        <div class="cc__amount"><strong>{{ money(startingPrice) }}</strong> <span>/ night</span></div>
        <div class="cc__savedrow"><q-icon name="check_circle" size="17px" /> <span>{{ cartCount }} room{{ cartCount === 1 ? '' : 's' }} in your cart</span>
          <button v-if="cartCount" type="button" class="cc__linkdel" @click="removeBlock"><q-icon name="delete_outline" size="17px" /> Remove room</button>
        </div>
      </div>
    </template>

    <!-- ============ VARIANT D — TWO PANELS ============ -->
    <template v-else>
      <div v-if="cartCount" class="cc__panel">
        <div class="cc__panel-head"><span class="cc__panel-title">In your cart</span><button type="button" class="cc__linkdel" @click="removeBlock"><q-icon name="delete_outline" size="17px" /> Remove</button></div>
        <div v-for="(n, i) in nights" :key="i" v-show="cart[i]" class="cc__cartline"><span>{{ n.date }}</span><span class="cc__cartqty">{{ cart[i] }} room{{ cart[i] === 1 ? '' : 's' }}</span></div>
      </div>
      <div class="cc__sec">
        <h4 class="cc__h">{{ cartCount ? 'Add more rooms' : 'Rooms per Night' }}</h4>
        <div v-for="(n, i) in nights" :key="i" class="cc__night">
          <div class="cc__ndate"><span class="cc__date">{{ n.date }}</span><span class="cc__rate">{{ money(n.price) }} / night</span></div>
          <span class="cc__left">{{ remaining(i) }} left</span>
          <quantity-stepper v-model="qty[i]" :min="0" :max="remaining(i)" size="sm" />
        </div>
      </div>
      <div class="cc__foot">
        <div class="cc__starting">STARTING PRICE</div>
        <div class="cc__amount"><strong>{{ money(startingPrice) }}</strong> <span>/ night</span></div>
        <button type="button" class="cc__cta" :class="{ 'is-ready': addCount > 0 }" :disabled="addCount === 0" @click="add">{{ addLabel }}</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cc { display: flex; flex-direction: column; width: 360px; background: var(--ds-color-surface); border: 1px solid rgba(0,0,0,0.04); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06); }

.cc__head { padding: 20px 22px 16px; display: flex; flex-direction: column; gap: 8px; }
.cc__title { margin: 0; font-size: 1.375rem; font-weight: 700; color: var(--ds-color-text-brand); line-height: 1.2; }
.cc__bed { color: var(--ds-color-text-subtle); font-size: 1rem; }
.cc__occ { display: inline-flex; align-items: center; gap: 8px; color: var(--ds-color-text); font-size: 1rem; }
.cc__occ .q-icon { color: var(--ds-color-text-brand); }

/* Nights (shared) */
.cc__sec { padding: 14px 22px; border-top: 1px solid var(--ds-color-border); }
.cc__h { margin: 0 0 10px; font-size: 1.0625rem; font-weight: 700; color: var(--ds-color-text-brand); }
.cc__hnote { color: var(--ds-color-text-subtle); font-weight: 500; font-size: 0.9375rem; }
.cc__night { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; padding: 8px 0; }
.cc__ndate { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cc__date { color: var(--ds-color-text-brand); font-weight: 700; font-size: 1rem; }
.cc__rate { color: var(--ds-color-text-subtlest); font-size: 0.8125rem; }
.cc__left { font-weight: 700; font-size: 0.875rem; white-space: nowrap; color: var(--ds-color-text-success); }
.cc__left.is-incart { color: var(--ds-color-text-brand); }

/* Footer (shared) */
.cc__foot { padding: 16px 22px 20px; border-top: 1px solid var(--ds-color-border); }
.cc__starting { color: var(--ds-color-text-subtle); font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.04em; }
.cc__amount { color: var(--ds-color-text-brand); margin-top: 2px; }
.cc__amount strong { font-size: 1.5rem; font-weight: 700; }
.cc__amount span { color: var(--ds-color-text-subtle); font-size: 0.9375rem; }
.cc__cta { width: 100%; height: 46px; margin-top: 14px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-palette-slate-300); color: #fff; font-family: inherit; font-size: 1rem; font-weight: 700; cursor: default; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.cc__cta.is-ready { background: var(--ds-color-background-brand-bold); cursor: pointer; }
.cc__cta.is-ready:hover { background: var(--ds-palette-navy-800); }

/* Delete affordances (shared) */
.cc__linkdel { display: inline-flex; align-items: center; gap: 5px; background: none; border: 0; padding: 0; color: var(--ds-color-text-danger); font-family: inherit; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
.cc__linkdel:hover { text-decoration: underline; }
.cc__removeall { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 12px; background: none; border: 0; padding: 6px 0; color: var(--ds-color-text-danger); font-family: inherit; font-weight: 600; font-size: 0.9375rem; cursor: pointer; }
.cc__removeall:hover { text-decoration: underline; }

/* A — banner */
.cc__banner { margin: 0 22px; padding: 12px 14px; background: var(--ds-color-background-success); border: 1px solid var(--ds-palette-green-200, #BBF7D0); border-radius: var(--ds-radius-md); }
.cc__banner-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.cc__banner-title { display: inline-flex; align-items: center; gap: 7px; color: var(--ds-palette-green-700); font-weight: 700; font-size: 0.9375rem; }
.cc__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.cc__chip { background: var(--ds-color-surface); border: 1px solid var(--ds-palette-green-200, #BBF7D0); color: var(--ds-palette-green-700); border-radius: var(--ds-radius-pill); padding: 2px 10px; font-size: 0.8125rem; font-weight: 600; }

/* B — inline */
.cc__nightwrap { padding: 2px 0 8px; border-bottom: 1px solid var(--ds-color-border); }
.cc__nightwrap:last-child { border-bottom: 0; }
.cc__incart { display: inline-flex; align-items: center; gap: 5px; margin-left: 2px; color: var(--ds-palette-green-700); font-weight: 600; font-size: 0.8125rem; }

/* C — editable */
.cc__editnote { margin: 0 0 8px; color: var(--ds-color-text-subtle); font-size: 0.8125rem; line-height: 1.4; }
.cc__savedrow { display: flex; align-items: center; gap: 8px; margin-top: 14px; color: var(--ds-palette-green-700); font-weight: 600; font-size: 0.9375rem; }
.cc__savedrow .cc__linkdel { margin-left: auto; }

/* D — panels */
.cc__panel { margin: 0 22px; padding: 12px 14px; background: var(--ds-palette-slate-50, #F8FAFC); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); }
.cc__panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.cc__panel-title { font-weight: 700; font-size: 0.9375rem; color: var(--ds-color-text-brand); }
.cc__cartline { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 0.9375rem; color: var(--ds-color-text); }
.cc__cartqty { color: var(--ds-color-text-subtle); font-weight: 600; }
</style>
