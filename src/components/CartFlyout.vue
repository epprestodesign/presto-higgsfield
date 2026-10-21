<script setup>
// CartFlyout — the right-side slide-over chrome (scrim, top bar / kebab, footer
// countdown + CTA, special-requests sub-flyout) wrapped around the recyclable
// <CartReview> body, which is shared with the Checkout "Review order" step.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import CartReview from './CartReview.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'reserve' }, // reserve | hold
  cart: { type: Object, default: () => ({}) },
  currency: { type: String, default: '$' },
})
const emit = defineEmits(['update:modelValue', 'update:count', 'browse', 'edit-room'])
const $q = useQuasar()

const close = () => emit('update:modelValue', false)
// Empty state "Browse hotels": tell the host to navigate (browse) and close.
const onBrowse = () => { emit('browse'); close() }
// DES-414: relay a room block's "Edit" up to the host (navigate to that hotel's
// details page) and close the flyout.
const onEditRoom = (payload) => { emit('edit-room', payload); close() }
const money = (n) => props.currency + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const isReserve = computed(() => props.mode === 'reserve')
// Empty cart → show the empty state (illustration + "Browse hotels") instead of
// the review body + footer. True when the cart prop has nothing OR the live
// CartReview count (what's actually shown) hits zero as rooms are removed one by
// one — so the empty state always follows the visible list.
const anyRooms = (c) => (!c ? false : c.hotels ? c.hotels.some((h) => (h.rooms || []).length) : !!c.hotel)
const isEmpty = computed(() => {
  const propEmpty = isReserve.value ? !(props.cart && props.cart.hotel) : !anyRooms(props.cart)
  return propEmpty || (!isReserve.value && count.value === 0)
})

// --- Live values surfaced from the shared CartReview body ---
const reviewRef = ref(null)
// Seed from the cart so isEmpty isn't momentarily true before CartReview emits.
const count = ref(anyRooms(props.cart) ? 1 : 0)
const total = ref(0)
const onCount = (v) => { count.value = v; emit('update:count', v) }
// Re-seed the count each time the flyout opens so a stale zero (left over from a
// prior empty) doesn't wrongly show the empty state for a cart that's since been
// repopulated. Fires only on open, so it never fights per-delete count updates.
watch(() => props.modelValue, (open) => { if (open) count.value = anyRooms(props.cart) ? 1 : 0 })
const clearCart = () => reviewRef.value?.clear()

// --- Special requests sub-flyout ---
const requestsOpen = ref(false)
const requestText = ref('')
const saveRequest = () => {
  requestsOpen.value = false
  $q.notify({ message: 'Your message has been saved.', icon: 'check_circle', color: 'grey-9', position: 'bottom', timeout: 2500 })
}

// --- Reveal the "Your Cart" title once the body scrolls ---
const scrolled = ref(false)
const onScroll = (e) => { scrolled.value = e.target.scrollTop > 12 }

// --- Live "time left to book" countdown (mm:ss) + depleting progress line ---
const secs = ref(props.cart.heldSeconds ?? 895)
const initialSecs = props.cart.heldSeconds ?? 895
const clock = computed(() => `${Math.floor(secs.value / 60)}:${String(secs.value % 60).padStart(2, '0')}`)
const progressPct = computed(() => `${initialSecs ? Math.max(0, (secs.value / initialSecs) * 100) : 0}%`)
let timer = null
onMounted(() => { timer = setInterval(() => { if (props.modelValue && secs.value > 0) secs.value-- }, 1000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <teleport to="body">
    <div v-if="modelValue" class="cf">
      <div class="cf__scrim" @click="close" />
      <aside class="cf__panel" role="dialog" aria-label="Cart">
        <!-- Hold: top bar — close, title (reveals on scroll), kebab menu -->
        <div v-if="!isReserve" class="cf__top" :class="{ 'is-scrolled': scrolled }">
          <button class="cf__top-close" aria-label="Close" @click="close"><q-icon name="close" size="22px" /></button>
          <span class="cf__top-title" :class="{ 'is-visible': scrolled }">Your Cart</span>
          <q-btn flat round dense class="cf__top-kebab" aria-label="More options">
            <q-icon name="more_horiz" size="22px" />
            <q-menu auto-close anchor="bottom right" self="top right">
              <q-list style="min-width: 184px">
                <q-item clickable class="cf__clear" @click="clearCart">
                  <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
                  <q-item-section class="text-negative">Clear Cart</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
        <!-- Reserve: close overlaid on the hero carousel -->
        <button v-else class="cf__close" aria-label="Close" @click="close"><q-icon name="close" size="22px" /></button>

        <!-- Empty state — no rooms held yet. -->
        <div v-if="isEmpty" class="cf__empty">
          <div class="cf__empty-art">
            <span class="cf__empty-shape cf__empty-shape--diamond" />
            <span class="cf__empty-shape cf__empty-shape--circle" />
            <span class="cf__empty-icon"><q-icon name="shopping_cart" size="46px" /></span>
          </div>
          <h3 class="cf__empty-title">Add rooms to start a cart</h3>
          <p class="cf__empty-desc">Once you add rooms from a hotel, they'll appear here.</p>
          <button type="button" class="cf__empty-cta" @click="onBrowse">Browse hotels</button>
        </div>

        <template v-else>
        <div class="cf__body" @scroll="onScroll">
          <cart-review
            ref="reviewRef" :mode="mode" :cart="cart" :currency="currency" :show-requests="isReserve"
            :room-delete="mode === 'hold'"
            @update:count="onCount" @update:total="total = $event" @requests="requestsOpen = true"
            @edit-room="onEditRoom"
          />
        </div>

        <!-- Footer — countdown progress bar above a rounded total CTA -->
        <div class="cf__foot">
          <div class="cf__timer">
            <div class="cf__timer-row">
              <span class="cf__timer-label"><q-icon name="timer" size="18px" /> Time left to book</span>
              <span class="cf__timer-clock">{{ clock }}</span>
            </div>
            <div class="cf__timer-track"><div class="cf__timer-fill" :style="{ width: progressPct }" /></div>
          </div>
          <div class="cf__actions">
            <!-- Group blocks (hold) are held, not charged → no total shown. -->
            <q-btn unelevated no-caps class="cf__cta" :class="{ 'is-disabled': mode === 'hold' && count === 0, 'cf__cta--nototal': mode === 'hold' }" :tabindex="(mode === 'hold' && count === 0) ? -1 : 0">
              <span class="cf__cta-label">Go to checkout</span>
              <span v-if="mode !== 'hold'" class="cf__cta-total">{{ money(total) }}</span>
            </q-btn>
          </div>
        </div>
        </template>
      </aside>

      <!-- Special requests — sub-flyout over the cart -->
      <aside v-if="requestsOpen" class="cf__sub" role="dialog" aria-label="Special requests">
        <div class="cf__sub-head">
          <button class="cf__sub-close" aria-label="Close" @click="requestsOpen = false"><q-icon name="close" size="22px" /></button>
          <h3 class="cf__sub-title">Special requests (optional)</h3>
        </div>
        <div class="cf__sub-body">
          <p class="cf__sub-desc">We'll send your requests to the property, but they cannot be guaranteed. Please follow up with the property directly to confirm.</p>
          <label class="cf__sub-label" for="cf-req">Message to property</label>
          <textarea id="cf-req" v-model="requestText" class="cf__sub-textarea" maxlength="250" rows="4" placeholder="Special requests" />
          <div class="cf__sub-count">{{ requestText.length }}/250</div>
        </div>
        <div class="cf__sub-foot">
          <q-btn unelevated no-caps class="cf__sub-save" label="Save" @click="saveRequest" />
        </div>
      </aside>
    </div>
  </teleport>
</template>

<style scoped>
.cf { position: fixed; inset: 0; z-index: 3000; }
.cf__scrim { position: absolute; inset: 0; background: rgba(9, 9, 11, 0.5); animation: cf-fade 0.18s ease; }
.cf__panel { position: absolute; top: 0; right: 0; height: 100%; width: 500px; max-width: 92vw; background: var(--ds-color-surface); display: flex; flex-direction: column; box-shadow: var(--ds-shadow-4); animation: cf-slide 0.22s var(--ds-ease-standard); }
@keyframes cf-fade { from { opacity: 0; } }
@keyframes cf-slide { from { transform: translateX(100%); } }

.cf__close { position: absolute; top: 14px; left: 14px; width: 34px; height: 34px; border: 0; border-radius: 50%; background: var(--ds-palette-slate-100); color: var(--ds-color-text); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; }
.cf__close:hover { background: var(--ds-palette-slate-200); }

.cf__top { display: flex; align-items: center; gap: 12px; padding: 12px 16px; flex: none; background: var(--ds-color-surface); border-bottom: 1px solid transparent; position: relative; z-index: 3; transition: border-color var(--ds-duration-fast) var(--ds-ease-standard), box-shadow var(--ds-duration-fast) var(--ds-ease-standard); }
.cf__top.is-scrolled { border-bottom-color: var(--ds-color-border); box-shadow: var(--ds-shadow-1); }
.cf__top-close { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--ds-palette-slate-100); color: var(--ds-color-text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex: none; }
.cf__top-close:hover { background: var(--ds-palette-slate-200); }
.cf__top-title { flex: 1; text-align: center; font-weight: 700; font-size: 1.0625rem; color: var(--ds-color-text); opacity: 0; transition: opacity var(--ds-duration-fast) var(--ds-ease-standard); }
.cf__top-title.is-visible { opacity: 1; }
.cf__top-kebab { color: var(--ds-color-text); flex: none; }

.cf__body { flex: 1; overflow-y: auto; }

/* Empty state */
.cf__empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px 40px 64px; }
.cf__empty-art { position: relative; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; margin-bottom: 22px; }
.cf__empty-icon { width: 120px; height: 120px; border-radius: 50%; background: var(--ds-palette-slate-100); color: var(--ds-color-text-brand); display: flex; align-items: center; justify-content: center; }
.cf__empty-shape { position: absolute; }
.cf__empty-shape--diamond { top: 6px; right: 30px; width: 26px; height: 26px; background: var(--ds-palette-amber-400); border-radius: 6px; transform: rotate(45deg); }
.cf__empty-shape--circle { top: 22px; right: 12px; width: 18px; height: 18px; background: var(--ds-palette-green-400); border-radius: 50%; }
.cf__empty-title { margin: 0 0 10px; font-size: 1.375rem; font-weight: 800; color: var(--ds-color-text); }
.cf__empty-desc { margin: 0 0 28px; color: var(--ds-color-text-subtle); font-size: 1rem; line-height: 1.5; max-width: 300px; }
.cf__empty-cta { height: 52px; padding: 0 32px; border: 0; border-radius: var(--ds-radius-pill); background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit; font-weight: 700; font-size: 1rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard); }
.cf__empty-cta:hover { background: var(--ds-palette-navy-800); }

/* Footer — countdown progress bar (Instacart-style layout) above a rounded CTA */
.cf__foot { flex: none; border-top: 1px solid var(--ds-color-border); padding: 0; display: flex; flex-direction: column; background: var(--ds-color-surface); }
.cf__timer { background: var(--ds-palette-blue-100); }
.cf__timer-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; color: var(--ds-palette-blue-800); }
.cf__timer-label { display: inline-flex; align-items: center; gap: 8px; font-size: 0.9375rem; font-weight: 600; }
.cf__timer-clock { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 1rem; }
.cf__timer-track { height: 4px; background: rgba(37, 99, 235, 0.15); }
.cf__timer-fill { height: 100%; background: var(--ds-palette-blue-600); transition: width 1s linear; }
.cf__actions { padding: 16px 24px; }
.cf__cta { width: 100%; height: 54px; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 1rem; }
.cf__cta.is-disabled { background: var(--ds-palette-slate-200); color: var(--ds-color-text-subtlest); pointer-events: none; }
.cf__cta :deep(.q-btn__content) { width: 100%; justify-content: space-between; flex-wrap: nowrap; padding: 0 10px; }
.cf__cta--nototal :deep(.q-btn__content) { justify-content: center; }

/* Special requests sub-flyout */
.cf__sub { position: absolute; top: 0; right: 0; height: 100%; width: 500px; max-width: 92vw; background: var(--ds-color-surface); display: flex; flex-direction: column; box-shadow: var(--ds-shadow-4); z-index: 10; animation: cf-slide 0.22s var(--ds-ease-standard); }
.cf__sub-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; flex: none; }
.cf__sub-close { width: 32px; height: 32px; border: 0; background: none; color: var(--ds-color-text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex: none; }
.cf__sub-title { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--ds-color-text); }
.cf__sub-body { flex: 1; overflow-y: auto; padding: 6px 24px 24px; }
.cf__sub-desc { color: var(--ds-color-text-subtle); font-size: 0.9375rem; line-height: 1.5; margin: 0 0 22px; }
.cf__sub-label { display: block; font-weight: 700; font-size: 0.9375rem; color: var(--ds-color-text); margin-bottom: 8px; }
.cf__sub-textarea { width: 100%; min-height: 110px; resize: vertical; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); padding: 12px 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); outline: none; transition: border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.cf__sub-textarea:focus { border-color: var(--ds-color-border-focused); }
.cf__sub-textarea::placeholder { color: var(--ds-color-text-subtlest); }
.cf__sub-count { text-align: right; color: var(--ds-color-text-subtle); font-size: 0.8125rem; margin-top: 6px; }
.cf__sub-foot { flex: none; padding: 16px 24px 24px; }
.cf__sub-save { width: 100%; height: 52px; border-radius: var(--ds-radius-button); background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 1rem; }

/* Phones (<600px): the cart takes the full screen. */
@media (max-width: 600px) { .cf__panel, .cf__sub { width: 100vw; max-width: 100vw; } }
</style>
