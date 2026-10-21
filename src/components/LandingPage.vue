<script setup>
// LandingPage — the event landing page, composed top to bottom:
//   Global Nav → Hero Banner (event name + dates over the default imagery)
//   → Booking Widget (search) → Event description (intro, benefits, who's
//   attending, event information, closing) → Display Ads → Footer.
// `mode` switches the widget + cart between Book Reservations ('reservations')
// and Group Block ('group'). All copy is prop-driven; defaults describe a
// sample youth soccer tournament (age divisions U9–U19).
import defaultBg from '../../background-img/defaultBackgroundImage.png'
import GlobalNav from './GlobalNav.vue'
import BookingWidget from './BookingWidget.vue'
import DisplayAd from './DisplayAd.vue'
import epLogo from '../assets/eventpipe logos/eventpipe-logo.svg'
import epLogoWhite from '../assets/eventpipe logos/eventpipe-logo-fff.svg'

const props = defineProps({
  mode: { type: String, default: 'reservations' }, // 'reservations' | 'group'
  brand: { type: String, default: 'Presto' },
  eventName: { type: String, default: 'Virginia International Youth Soccer Cup 2026' },
  eventDates: { type: String, default: 'Sat, 7/18/2026 - Sun, 7/19/2026' },

  // Event description content (the centered copy block).
  intro: {
    type: Array,
    default: () => [
      'Join clubs from across the country for one of the premier youth soccer tournaments in the region. The Virginia International Youth Soccer Cup brings together players, coaches, club teams, families, and passionate fans for an exciting weekend of competitive matches across age divisions U9 through U19.',
      "Hosted at the Fredericksburg Sportsplex in Fredericksburg, Virginia, this tournament features two full days of matches across Boys and Girls brackets from U9 to U19. Whether you're stepping onto the pitch, coaching your squad, or cheering from the sidelines, Presto makes it easy to plan your trip and stay close to the action.",
    ],
  },
  benefits: {
    type: Array,
    default: () => [
      'Official event hotel options near the fields',
      'Exclusive group and team rates when available',
      'Flexible accommodations for players, coaches, and families',
      'Easy online booking with instant confirmation',
      'Stay together with your club or team',
      'Convenient access to restaurants, shopping, and local attractions',
    ],
  },
  attendingTitle: { type: String, default: "Who's Attending?" },
  attending: {
    type: Array,
    default: () => [
      { title: 'Players', text: 'Compete against top youth soccer clubs from across the region in U9–U19 divisions while enjoying a seamless travel experience close to the fields.' },
      { title: 'Coaches & Clubs', text: 'Keep your entire roster together with convenient hotel options that simplify tournament logistics throughout the weekend.' },
      { title: 'Friends & Family', text: 'Support your player while enjoying everything Fredericksburg has to offer, from local dining and historic attractions to family-friendly entertainment between matches.' },
      { title: 'Fans & Spectators', text: 'Experience competitive youth soccer featuring rising talent from a wide range of age divisions and clubs.' },
    ],
  },
  eventInfoTitle: { type: String, default: 'Event Information' },
  eventInfo: {
    type: Object,
    default: () => ({
      dates: 'July 18–19, 2026',
      lines: [
        'Venue: Fredericksburg Sportsplex – Fields 1–8',
        '2371 Carl D. Silver Parkway',
        'Fredericksburg, Virginia 22401',
      ],
    }),
  },
  closing: {
    type: Array,
    default: () => [
      'Spectator admission is free, making it a great weekend for families, teammates, and soccer fans to experience the excitement of the tournament together.',
      'Book your accommodations early to secure the best available rates and stay close to the fields throughout the weekend.',
    ],
  },

  ads: { type: Number, default: 3 },
  // Booking Widget state: true = Teams Booking Widget (Registered Team(s) field),
  // false = Core Booking Widget (generic search, no team field).
  showTeams: { type: Boolean, default: true },
})

// Same hero treatment as Foundations / Hero Banner → Landing Page (scrim + image).
const scrim = 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5))'
const heroStyle = { backgroundImage: `${scrim}, url(${defaultBg})` }
</script>

<template>
  <div class="lp">
    <!-- Global nav -->
    <!-- No cart on the landing page (nothing has been added yet). -->
    <global-nav :brand="brand" :cart-mode="mode === 'group' ? 'hold' : 'reserve'" :show-cart="false" />

    <!-- Hero (Foundations / Hero Banner — Landing Page imagery) -->
    <section class="lp__hero" :style="heroStyle">
      <div class="lp__hero-inner">
        <img :src="epLogoWhite" alt="EventPipe" class="lp__hero-logo" />
        <h1 class="lp__event text-h5">{{ eventName }}</h1>
        <p class="lp__dates text-body1">{{ eventDates }}</p>
      </div>
    </section>

    <!-- Booking Widget -->
    <section class="lp__widget">
      <div class="lp__widget-card">
        <!-- DES-91: the landing booking type starts blank (no default selection),
             independent of the page's cart context. -->
        <booking-widget mode="" :tabs="false" :show-teams="showTeams" />
      </div>
    </section>

    <!-- Event description -->
    <section class="lp__content">
      <p v-for="(p, i) in intro" :key="'i' + i" class="lp__para">{{ p }}</p>

      <ul class="lp__benefits">
        <li v-for="(b, i) in benefits" :key="'b' + i">
          <span class="lp__check" aria-hidden="true">✔</span> {{ b }}
        </li>
      </ul>

      <h2 class="lp__section-title">{{ attendingTitle }}</h2>
      <div v-for="(a, i) in attending" :key="'a' + i" class="lp__attend">
        <h3 class="lp__attend-title">{{ a.title }}</h3>
        <p class="lp__para">{{ a.text }}</p>
      </div>

      <h2 class="lp__section-title">{{ eventInfoTitle }}</h2>
      <p class="lp__para lp__info"><strong>Dates:</strong> {{ eventInfo.dates }}</p>
      <p v-for="(l, i) in eventInfo.lines" :key="'l' + i" class="lp__para lp__info">{{ l }}</p>

      <p v-for="(c, i) in closing" :key="'c' + i" class="lp__para lp__closing">{{ c }}</p>
    </section>

    <!-- Display ads -->
    <section class="lp__section lp__ads">
      <display-ad v-for="n in ads" :key="n" />
    </section>

    <!-- Footer -->
    <footer class="lp__footer">
      <div class="lp__footer-inner">
        <img :src="epLogo" alt="EventPipe" class="lp__logo" />
        <span class="lp__legal">© 2026 EventPipe · Terms · Privacy · Contact</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.lp {
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
}

/* Hero.
   The booking widget below is pulled up 48px (.lp__widget margin-top), so it
   covers the bottom 48px of this band. Centring on the full box therefore reads
   as 24px too low. The padding-bottom shrinks the box `align-items: center`
   works on to the part that stays visible, which optically centres the logo,
   event name and dates together. Keep it in sync with the widget's offset. */
.lp__hero {
  min-height: 300px;
  padding-bottom: 48px;
  background-color: #000;
  background-size: cover;
  background-position: center;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.lp__hero-inner { padding: 0 24px; max-width: 820px; }
.lp__hero-logo { height: 30px; width: auto; margin: 0 auto 12px; display: block; }
/* Desktop hero scale. Phones override both sizes in the media query at the end
   of this block, so these are desktop-only. */
.lp__event { font-size: 2.5rem; font-weight: 700; line-height: 1.15; margin: 0; text-wrap: balance; }
.lp__dates { font-size: 1.25rem; font-weight: 400; margin: 8px 0 0; }

/* Booking widget — tucked up onto the hero. */
.lp__widget {
  max-width: 1040px;
  margin: -48px auto 0;
  padding: 0 24px;
  position: relative;
  z-index: 2;
}
.lp__widget-card {
  background: var(--ds-color-surface);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-2);
}

/* Event description — centered copy block. */
.lp__content {
  max-width: 860px;
  margin: 0 auto;
  padding: 56px 24px 8px;
  text-align: center;
}
.lp__para { margin: 0 0 22px; line-height: 1.6; font-size: 1rem; }
.lp__benefits {
  list-style: none;
  padding: 0;
  margin: 4px 0 34px;
}
.lp__benefits li { margin: 8px 0; line-height: 1.5; }
.lp__check { font-weight: 700; }
.lp__section-title {
  font-size: 1.25rem;
  font-weight: 400;
  margin: 40px 0 26px;
}
.lp__attend { margin-bottom: 30px; }
.lp__attend-title { font-size: 1rem; font-weight: 700; margin: 0 0 8px; }
.lp__info { margin: 0 0 4px; }
.lp__closing { margin-top: 22px; }

/* Shared content section (ads) */
.lp__section {
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 24px 0;
}
.lp__ads {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

/* Footer */
.lp__footer {
  margin-top: 56px;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.lp__footer-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.lp__logo { height: 30px; width: auto; display: block; }
.lp__legal { color: var(--ds-color-text-subtle); font-size: 0.8125rem; }

/* Phones — placed last so these win the cascade over the desktop rules above.
   Smaller hero + 4px page gutters (the widget keeps its own interior padding). */
@media (max-width: 600px) {
  .lp__hero { min-height: 0; padding: 40px 0; }
  .lp__hero-inner { padding: 0 16px; }
  .lp__hero-logo { height: 30px; margin-bottom: 12px; }
  .lp__event { font-size: 1.5rem; }
  .lp__dates { font-size: 1rem; }
  .lp__widget { margin-top: -8px; padding: 0 16px; }
  .lp__content { padding: 40px 16px 8px; }
}
</style>
