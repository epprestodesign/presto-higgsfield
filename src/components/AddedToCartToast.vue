<script setup>
// AddedToCartToast — a compact "Added to cart" confirmation that drops from the
// nav cart icon after a room is added (Uber Eats style). Shows the room type +
// hotel just added with a hotel photo, plus View cart / Go to checkout actions.
// Presentational: the host positions it under the cart icon and controls when it
// shows; it emits `dismiss` after `autoDismiss` ms (0 = stay).
import { onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  heading: { type: String, default: 'Added to cart' },
  roomType: { type: String, default: '' },
  hotel: { type: String, default: '' },
  image: { type: String, default: '' },
  autoDismiss: { type: Number, default: 0 },
  // Distance in px from the card's RIGHT edge to the notch. The host sets this
  // from the cart button's real position so the arrow points at the cart — on
  // phones the card is centred, so a fixed offset lands on the overflow menu
  // instead (DES-423). Null keeps the default right-hand placement.
  notchRight: { type: Number, default: null },
})
const emit = defineEmits(['view-cart', 'checkout', 'dismiss'])

let timer = null
onMounted(() => { if (props.autoDismiss > 0) timer = setTimeout(() => emit('dismiss'), props.autoDismiss) })
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="atc" role="status" aria-live="polite">
    <span class="atc__notch" :style="notchRight != null ? { right: notchRight + 'px' } : null" />
    <h3 class="atc__title">{{ heading }}</h3>
    <div class="atc__item">
      <img v-if="image" :src="image" :alt="hotel" class="atc__thumb" />
      <div v-else class="atc__thumb atc__thumb--icon"><q-icon name="king_bed" size="26px" /></div>
      <div class="atc__info">
        <div class="atc__room">{{ roomType }}</div>
        <div v-if="hotel" class="atc__hotel">{{ hotel }}</div>
      </div>
    </div>
    <button type="button" class="atc__btn atc__btn--view" @click="emit('view-cart')">View cart</button>
    <button type="button" class="atc__btn atc__btn--checkout" @click="emit('checkout')">Go to checkout</button>
  </div>
</template>

<style scoped>
.atc { position: relative; width: 360px; max-width: 92vw; background: var(--ds-color-surface); border-radius: var(--ds-radius-lg); box-shadow: var(--ds-shadow-3, 0 14px 36px rgba(2, 16, 63, 0.18)); padding: 20px 20px 18px; }
/* Little arrow pointing up to the cart icon. */
.atc__notch { position: absolute; top: -7px; right: 30px; width: 16px; height: 16px; background: var(--ds-color-surface); transform: rotate(45deg); border-top-left-radius: 3px; }
.atc__title { margin: 0 0 16px; font-size: 1.375rem; font-weight: 800; color: var(--ds-color-text); }
.atc__item { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.atc__thumb { width: 64px; height: 64px; border-radius: var(--ds-radius-md); object-fit: cover; flex: none; background: var(--ds-palette-slate-100); }
.atc__thumb--icon { display: flex; align-items: center; justify-content: center; color: var(--ds-color-text-subtle); }
.atc__info { min-width: 0; }
.atc__room { font-weight: 700; font-size: 1.0625rem; color: var(--ds-color-text); }
.atc__hotel { color: var(--ds-color-text-subtle); font-size: 0.9375rem; margin-top: 2px; }
.atc__btn { width: 100%; height: 52px; border-radius: var(--ds-radius-md); font-family: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.atc__btn--view { background: var(--ds-color-surface); border: 1.5px solid var(--ds-color-border-brand); color: var(--ds-color-text-brand); margin-bottom: 10px; }
.atc__btn--view:hover { background: var(--ds-palette-navy-50); }
.atc__btn--checkout { border: 0; background: var(--ds-color-background-brand-bold); color: #fff; }
.atc__btn--checkout:hover { background: var(--ds-palette-navy-800); }
</style>
