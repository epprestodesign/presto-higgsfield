<script setup>
// CartBehavior — DES-413 interaction study. Showcases the Browse Hotels screen
// with the group-block cart opening in two different ways so we can feel the
// difference and pick one:
//   • overlay — the cart slides in over the page on a dimming scrim (today's
//     flyout behavior). The page underneath doesn't move.
//   • push   — the cart slides in and pushes the page content to the left
//     (Amazon-style persistent side panel). No scrim; the page stays interactive.
// This is a behavior demo: the nav + cart chrome are self-contained here so the
// stage can own the layout wrapper that the two behaviors need.
import { ref, watch } from 'vue'
import HotelListPage from './browse/HotelListPage.vue'
import CartReview from './CartReview.vue'

const props = defineProps({
  brand: { type: String, default: 'Soccer League' },
  // 'overlay' | 'push' — the two behaviors under study.
  behavior: { type: String, default: 'push' },
  // Start with the cart open so the behavior is visible immediately.
  open: { type: Boolean, default: true },
  cart: { type: Object, default: () => ({}) },
})

// Live, in-canvas state so the story can flip behavior + open/close without a
// reload — mirrors the props but lets the demo toolbar drive them.
const mode = ref(props.behavior)
const cartOpen = ref(props.open)
watch(() => props.behavior, (v) => { mode.value = v })
watch(() => props.open, (v) => { cartOpen.value = v })

const isPush = () => mode.value === 'push'
const close = () => { cartOpen.value = false }
const open = () => { cartOpen.value = true }
</script>

<template>
  <div class="cb">
    <!-- Demo control strip — not part of the real UI; lets you feel both -->
    <div class="cb__toolbar">
      <span class="cb__toolbar-label">Cart behavior</span>
      <div class="cb__seg" role="tablist" aria-label="Cart behavior">
        <button type="button" class="cb__seg-btn" :class="{ 'is-active': mode === 'overlay' }" role="tab" :aria-selected="mode === 'overlay'" @click="mode = 'overlay'">Overlay</button>
        <button type="button" class="cb__seg-btn" :class="{ 'is-active': mode === 'push' }" role="tab" :aria-selected="mode === 'push'" @click="mode = 'push'">Push</button>
      </div>
      <span class="cb__toolbar-hint">{{ mode === 'push' ? 'Cart pushes the page left — no scrim, page stays interactive.' : 'Cart slides over a dimming scrim — page underneath is inert.' }}</span>
      <button type="button" class="cb__toolbar-toggle" @click="cartOpen ? close() : open()">{{ cartOpen ? 'Close cart' : 'Open cart' }}</button>
    </div>

    <!-- App nav -->
    <header class="cb__nav">
      <span class="cb__brand">{{ brand }}</span>
      <div class="cb__nav-actions">
        <a class="cb__nav-link" href="#" @click.prevent>Contact Us</a>
        <button class="cb__nav-manage">Manage Booking</button>
        <button class="cb__cartbtn" aria-label="Open cart" @click="open">
          <q-icon name="shopping_cart" size="22px" />
          <!-- DES-412: red dot (has inventory), no number. -->
          <span class="cb__cartdot" aria-hidden="true" />
        </button>
      </div>
    </header>

    <!-- Stage: browse content + cart panel -->
    <div class="cb__stage">
      <!-- Content shifts left in push mode when the cart is open. -->
      <div class="cb__scroll" :class="{ 'is-pushed': isPush() && cartOpen }">
        <hotel-list-page flow="group" :show-teams="false" />
      </div>

      <!-- Overlay scrim — only in overlay mode. -->
      <div v-if="!isPush() && cartOpen" class="cb__scrim" @click="close" />

      <!-- Cart panel — same element for both behaviors; the wrapper class swaps
           the motion (float-over vs push). -->
      <aside class="cb__panel" :class="{ 'is-open': cartOpen, 'cb__panel--push': isPush() }" role="dialog" aria-label="Your cart">
        <div class="cb__panel-top">
          <button class="cb__panel-close" aria-label="Close cart" @click="close"><q-icon name="close" size="22px" /></button>
          <span class="cb__panel-title">Your Cart</span>
          <span class="cb__panel-spacer" />
        </div>
        <div class="cb__panel-body">
          <cart-review mode="hold" :cart="cart" room-delete @edit-room="close" />
        </div>
        <div class="cb__panel-foot">
          <div class="cb__timer">
            <span class="cb__timer-label"><q-icon name="timer" size="18px" /> Time left to book</span>
            <span class="cb__timer-clock">6:12</span>
          </div>
          <button class="cb__cta">Go to checkout</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.cb { height: 100vh; display: flex; flex-direction: column; background: var(--ds-color-surface); color: var(--ds-color-text); overflow: hidden; }

/* Demo control strip */
.cb__toolbar { flex: none; display: flex; align-items: center; gap: 14px; padding: 10px 20px; background: var(--ds-palette-slate-100); border-bottom: 1px solid var(--ds-color-border); font-size: 0.875rem; }
.cb__toolbar-label { font-weight: 700; color: var(--ds-color-text); }
.cb__seg { display: inline-flex; background: var(--ds-color-surface); border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-pill); padding: 2px; }
.cb__seg-btn { border: 0; background: none; padding: 6px 16px; border-radius: var(--ds-radius-pill); font-family: inherit; font-size: 0.8125rem; font-weight: 600; color: var(--ds-color-text-subtle); cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard), color var(--ds-duration-fast) var(--ds-ease-standard); }
.cb__seg-btn.is-active { background: var(--ds-color-background-brand-bold); color: #fff; }
.cb__toolbar-hint { color: var(--ds-color-text-subtle); flex: 1; min-width: 0; }
.cb__toolbar-toggle { border: 1px solid var(--ds-color-border-brand); background: var(--ds-color-surface); color: var(--ds-color-text-brand); font-family: inherit; font-weight: 600; font-size: 0.8125rem; padding: 7px 16px; border-radius: var(--ds-radius-button); cursor: pointer; flex: none; }
.cb__toolbar-toggle:hover { background: var(--ds-palette-navy-50); }

/* Nav */
.cb__nav { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 72px; padding: 0 28px; background: var(--ds-color-surface); border-bottom: 1px solid var(--ds-color-border); z-index: 2; }
.cb__brand { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em; color: var(--ds-color-text-brand); }
.cb__nav-actions { display: flex; align-items: center; gap: 16px; }
.cb__nav-link { color: var(--ds-color-text-brand); font-weight: 600; font-size: 0.9375rem; text-decoration: none; cursor: pointer; }
.cb__nav-link:hover { text-decoration: underline; }
.cb__nav-manage { height: 48px; padding: 0 24px; border-radius: var(--ds-radius-button); border: 1px solid var(--ds-color-border-brand); background: transparent; color: var(--ds-color-text-brand); font-weight: 600; font-size: 0.9375rem; cursor: pointer; }
.cb__nav-manage:hover { background: var(--ds-palette-navy-50); }
.cb__cartbtn { position: relative; width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--ds-color-border-brand); background: transparent; color: var(--ds-color-text-brand); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.cb__cartbtn:hover { background: var(--ds-palette-navy-50); }
.cb__cartdot { position: absolute; top: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--ds-color-background-danger-bold); border: 2px solid var(--ds-color-surface); }

/* Stage */
.cb__stage { position: relative; flex: 1; overflow: hidden; }
.cb__scroll { height: 100%; overflow-y: auto; transition: margin-right var(--ds-duration-medium, 0.28s) var(--ds-ease-standard); }
/* Push: the page content is squeezed to the left by the panel's width. */
.cb__scroll.is-pushed { margin-right: 440px; }

.cb__scrim { position: absolute; inset: 0; background: rgba(9, 9, 11, 0.5); z-index: 3; animation: cb-fade 0.18s ease; }
@keyframes cb-fade { from { opacity: 0; } }

/* Cart panel — offscreen right by default; slides in for both behaviors. */
.cb__panel { position: absolute; top: 0; right: 0; height: 100%; width: 440px; max-width: 92vw; background: var(--ds-color-surface); display: flex; flex-direction: column; box-shadow: var(--ds-shadow-4); transform: translateX(100%); transition: transform var(--ds-duration-medium, 0.28s) var(--ds-ease-standard); z-index: 4; }
.cb__panel.is-open { transform: translateX(0); }
/* Push panels read as part of the layout: a divider instead of a big shadow. */
.cb__panel--push { box-shadow: none; border-left: 1px solid var(--ds-color-border); }

.cb__panel-top { display: flex; align-items: center; gap: 12px; padding: 12px 16px; flex: none; border-bottom: 1px solid var(--ds-color-border); }
.cb__panel-close { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--ds-palette-slate-100); color: var(--ds-color-text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex: none; }
.cb__panel-close:hover { background: var(--ds-palette-slate-200); }
.cb__panel-title { flex: 1; text-align: center; font-weight: 700; font-size: 1.0625rem; color: var(--ds-color-text); }
.cb__panel-spacer { width: 36px; flex: none; }
.cb__panel-body { flex: 1; overflow-y: auto; }

.cb__panel-foot { flex: none; border-top: 1px solid var(--ds-color-border); }
.cb__timer { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: var(--ds-palette-blue-100); color: var(--ds-palette-blue-800); }
.cb__timer-label { display: inline-flex; align-items: center; gap: 8px; font-size: 0.9375rem; font-weight: 600; }
.cb__timer-clock { font-weight: 700; font-variant-numeric: tabular-nums; }
.cb__cta { margin: 16px 24px; width: calc(100% - 48px); height: 54px; border: 0; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; }
.cb__cta:hover { background: var(--ds-palette-navy-800); }

/* Phones (<600px): the cart is a full-screen sheet — "push" collapses to an
   overlay (there's no room to push content aside on a phone). */
@media (max-width: 600px) {
  .cb__panel { width: 100vw; max-width: 100vw; }
  .cb__scroll.is-pushed { margin-right: 0; }
  .cb__toolbar { flex-wrap: wrap; }
  .cb__toolbar-hint { flex-basis: 100%; order: 3; }
}
</style>
