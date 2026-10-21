<script setup>
// GlobalNav — the app's top-level white nav bar: brand logo on the left, a
// "Manage Booking" pill and a cart icon (with a live count badge) on the right.
// Brand/icons use the DS primary (navy); the count badge uses the DS danger red.
// The cart opens the CartFlyout order summary; it stays closed until clicked.
import { ref, computed } from 'vue'
import CartFlyout from './CartFlyout.vue'

const props = defineProps({
  brand: { type: String, default: 'Soccer League' },
  contactLabel: { type: String, default: 'Contact Us' },
  // Contact details shown in the Contact Us dropdown.
  contactInfo: { type: Object, default: () => ({
    name: 'EventPipe Travel',
    hours: 'Monday through Friday, 8:30am–5:30pm Eastern Time',
    phone: '(888) 640-6400',
    email: 'support@eventpipe.com',
  }) },
  manageLabel: { type: String, default: 'Manage Booking' },
  cartMode: { type: String, default: 'reserve' }, // reserve | hold | reservations
  cart: { type: Object, default: () => ({}) },
  // Cart icon button + fly-out visibility. 'auto' (default) shows the cart only
  // for the Group Block (hold) flow — the flows that book directly (single Book
  // Reservation and Multiple Reservations) have no running cart. Pass true/false
  // to force it (e.g. the standalone cart-component demos force it on).
  showCart: { type: [Boolean, String], default: 'auto' },
  // Show the cart fly-out open on mount (e.g. Storybook cart stories).
  openCart: { type: Boolean, default: false },
  // Minimal chrome (e.g. checkout): just the centered brand — no Contact Us,
  // Manage Booking, or cart.
  minimal: { type: Boolean, default: false },
})
const emit = defineEmits(['manage', 'contact'])

// The cart button belongs to the Group Block (hold) flow only; 'auto' derives
// that from cartMode, while an explicit boolean overrides it.
const cartVisible = computed(() =>
  typeof props.showCart === 'boolean' ? props.showCart : props.cartMode === 'hold'
)
// DES-412: the group-block (hold) cart shows a plain red dot when it holds
// inventory — not a count (an exact number is too complex to keep accurate).
// Other flows keep the numeric badge.
const dotOnly = computed(() => props.cartMode === 'hold')
// Whether the passed cart currently holds any rooms. Derived straight from the
// cart prop so the red dot appears the moment inventory is first added — it does
// NOT wait for the fly-out to mount CartReview and emit a count.
const cartHasRooms = computed(() => {
  const c = props.cart
  if (!c) return false
  return c.hotels ? c.hotels.some((h) => (h.rooms || []).length) : !!c.hotel
})
// Show the dot as soon as the cart has inventory, or once the live count is > 0.
const showDot = computed(() => cartHasRooms.value || count.value > 0)

// Cart fly-out.
const cartOpen = ref(props.openCart)
const count = ref(0)
</script>

<template>
  <div class="gnav-wrap">
    <header class="gnav" :class="{ 'gnav--minimal': minimal }">
      <a class="gnav__brand" href="#" @click.prevent>{{ brand }}</a>

      <div v-if="!minimal" class="gnav__actions">
        <a class="gnav__contact" href="#" @click.prevent="emit('contact')">
          {{ contactLabel }}
          <q-menu anchor="bottom right" self="top right" :offset="[0, 10]" class="gnav__contactmenu">
            <div class="gnav__contactcard">
              <h4 class="gnav__contact-name">{{ contactInfo.name }}</h4>
              <div class="gnav__contact-block">
                <span class="gnav__contact-h">Hours</span>
                <p class="gnav__contact-p">{{ contactInfo.hours }}</p>
              </div>
              <div class="gnav__contact-block">
                <span class="gnav__contact-h">By Phone</span>
                <a class="gnav__contact-row" :href="'tel:' + contactInfo.phone.replace(/[^0-9+]/g, '')"><q-icon name="call" size="18px" /> {{ contactInfo.phone }}</a>
              </div>
              <div class="gnav__contact-block">
                <span class="gnav__contact-h">By Email</span>
                <a class="gnav__contact-row" :href="'mailto:' + contactInfo.email"><q-icon name="mail" size="18px" /> {{ contactInfo.email }}</a>
              </div>
            </div>
          </q-menu>
        </a>
        <button class="gnav__manage" @click="emit('manage')">{{ manageLabel }}</button>
        <button v-if="cartVisible" class="gnav__iconbtn" aria-label="Open cart" @click="cartOpen = true">
          <q-icon name="shopping_cart" size="22px" />
          <!-- DES-412: group block → red dot (has inventory); else numeric badge. -->
          <span v-if="dotOnly" v-show="showDot" class="gnav__dot" aria-hidden="true" />
          <span v-else class="gnav__badge">{{ count }}</span>
        </button>

        <!-- Mobile (<600px): Contact Us + Manage Booking collapse into this menu;
             the brand and cart stay in the bar. Hidden on desktop via CSS. -->
        <button class="gnav__hamburger" aria-label="Menu">
          <q-icon name="menu" size="24px" />
          <q-menu anchor="bottom right" self="top right" :offset="[0, 10]" class="gnav__mobilemenu">
            <div class="gnav__mobilemenu-card">
              <button class="gnav__mm-manage" @click="emit('manage')">{{ manageLabel }}</button>
              <div class="gnav__mm-sep" />
              <h4 class="gnav__contact-name">{{ contactInfo.name }}</h4>
              <div class="gnav__contact-block">
                <span class="gnav__contact-h">Hours</span>
                <p class="gnav__contact-p">{{ contactInfo.hours }}</p>
              </div>
              <div class="gnav__contact-block">
                <span class="gnav__contact-h">By Phone</span>
                <a class="gnav__contact-row" :href="'tel:' + contactInfo.phone.replace(/[^0-9+]/g, '')"><q-icon name="call" size="18px" /> {{ contactInfo.phone }}</a>
              </div>
              <div class="gnav__contact-block">
                <span class="gnav__contact-h">By Email</span>
                <a class="gnav__contact-row" :href="'mailto:' + contactInfo.email"><q-icon name="mail" size="18px" /> {{ contactInfo.email }}</a>
              </div>
            </div>
          </q-menu>
        </button>
      </div>
    </header>

    <cart-flyout v-if="cartVisible && !minimal" v-model="cartOpen" :mode="cartMode" :cart="cart" @update:count="count = $event" />
  </div>
</template>

<style scoped>
.gnav { display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 72px; padding: 0 28px; background: var(--ds-color-surface); color: var(--ds-color-text-brand); border-bottom: 1px solid var(--ds-color-border); }
.gnav__brand { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em; color: var(--ds-color-text-brand); text-decoration: none; }
/* Minimal (checkout): center the brand, no actions. */
.gnav--minimal { justify-content: center; }

.gnav__actions { display: flex; align-items: center; gap: 16px; }
.gnav__contact { color: var(--ds-color-text-brand); font-weight: 600; font-size: 0.9375rem; text-decoration: none; cursor: pointer; }
.gnav__contact:hover { text-decoration: underline; }
.gnav__manage { height: 48px; padding: 0 24px; border-radius: var(--ds-radius-button); border: 1px solid var(--ds-color-border-brand); background: transparent; color: var(--ds-color-text-brand); font-weight: 600; font-size: 0.9375rem; cursor: pointer; transition: background var(--ds-duration-fast) var(--ds-ease-standard), border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.gnav__manage:hover { background: var(--ds-palette-navy-50); }

.gnav__iconbtn { position: relative; width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--ds-color-border-brand); background: transparent; color: var(--ds-color-text-brand); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background var(--ds-duration-fast) var(--ds-ease-standard), border-color var(--ds-duration-fast) var(--ds-ease-standard); }
.gnav__iconbtn:hover { background: var(--ds-palette-navy-50); border-color: var(--ds-color-border-brand); }
.gnav__badge { position: absolute; top: -2px; right: -2px; min-width: 22px; height: 22px; padding: 0 5px; border-radius: var(--ds-radius-pill); background: var(--ds-color-background-danger-bold); color: #fff; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
/* DES-412: group-block cart inventory indicator — a plain red dot, no number. */
.gnav__dot { position: absolute; top: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--ds-color-background-danger-bold); border: 2px solid var(--ds-color-surface); }

/* Hamburger — hidden on desktop, shown on phones (<600px). */
.gnav__hamburger { display: none; width: 44px; height: 44px; border-radius: var(--ds-radius-md); border: 1px solid var(--ds-color-border-brand); background: transparent; color: var(--ds-color-text-brand); cursor: pointer; align-items: center; justify-content: center; }
.gnav__hamburger:hover { background: var(--ds-palette-navy-50); }
.gnav__mm-manage { width: 100%; height: 44px; border-radius: var(--ds-radius-button); border: 1px solid var(--ds-color-border-brand); background: transparent; color: var(--ds-color-text-brand); font-family: inherit; font-weight: 700; font-size: 0.9375rem; cursor: pointer; }
.gnav__mm-manage:hover { background: var(--ds-palette-navy-50); }
.gnav__mm-sep { height: 1px; background: var(--ds-color-border); margin: 16px 0; }

/* Phone layout: condense the bar, drop the inline links, show the hamburger. */
@media (max-width: 600px) {
  .gnav { height: 60px; padding: 0 16px; gap: 10px; }
  .gnav__brand { font-size: 1.25rem; }
  .gnav__actions { gap: 10px; }
  .gnav__contact, .gnav__manage { display: none; }
  .gnav__hamburger { display: inline-flex; }
  .gnav__iconbtn { width: 44px; height: 44px; }
}
</style>

<!-- Unscoped: q-menu content is teleported outside this component. -->
<style>
.gnav__contactmenu, .gnav__mobilemenu { border-radius: var(--ds-radius-lg); box-shadow: var(--ds-shadow-3, 0 8px 24px rgba(0,0,0,0.18)); }
.gnav__contactmenu .gnav__contactcard, .gnav__mobilemenu .gnav__mobilemenu-card { width: 300px; max-width: 88vw; padding: 20px; }
.gnav__contactmenu .gnav__contact-name, .gnav__mobilemenu .gnav__contact-name { margin: 0 0 18px; text-align: center; font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text-brand); }
.gnav__contactmenu .gnav__contact-block, .gnav__mobilemenu .gnav__contact-block { margin-top: 18px; }
.gnav__contactmenu .gnav__contact-block:first-of-type { margin-top: 0; }
.gnav__contactmenu .gnav__contact-h, .gnav__mobilemenu .gnav__contact-h { display: block; font-size: 1rem; font-weight: 700; color: var(--ds-color-text); margin-bottom: 5px; }
.gnav__contactmenu .gnav__contact-p, .gnav__mobilemenu .gnav__contact-p { margin: 0; color: var(--ds-color-text); font-size: 0.9375rem; line-height: 1.45; }
.gnav__contactmenu .gnav__contact-row, .gnav__mobilemenu .gnav__contact-row { display: inline-flex; align-items: center; gap: 10px; color: var(--ds-color-text); font-size: 0.9375rem; text-decoration: none; }
.gnav__contactmenu .gnav__contact-row:hover, .gnav__mobilemenu .gnav__contact-row:hover { text-decoration: underline; }
.gnav__contactmenu .gnav__contact-row .q-icon, .gnav__mobilemenu .gnav__contact-row .q-icon { color: var(--ds-color-text-brand); flex: none; }
</style>
