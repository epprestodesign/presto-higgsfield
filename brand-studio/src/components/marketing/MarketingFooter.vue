<script setup>
// MarketingFooter — closing CTA band + site footer.
import epLogoWhite from '@lib/assets/eventpipe logos/eventpipe-logo-fff.svg'

const emit = defineEmits(['start'])
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mf">
    <div class="mf__cta">
      <h2 class="bs-display-2 mf__title">Your attendees are going to book somewhere.</h2>
      <p class="bs-lead mf__lead">Give them a page that looks like your event.</p>
      <q-btn unelevated no-caps class="bs-btn bs-btn--lg mf__btn" label="Create Your Booking Page" icon-right="arrow_forward" @click="emit('start')" />
    </div>
    <div class="mf__base">
      <img :src="epLogoWhite" alt="EventPipe" class="mf__logo" />
      <nav aria-label="Footer" class="mf__links">
        <a href="#how-it-works">How it works</a>
        <a href="#examples">Examples</a>
        <a href="#sponsorships">Sponsorships</a>
        <a href="#faq">FAQ</a>
        <a href="#get-started">Contact sales</a>
      </nav>
      <p class="mf__legal">© {{ year }} EventPipe · Terms · Privacy · Demo pages use sample hotels and rates.</p>
    </div>
  </footer>
</template>

<style scoped>
.mf { margin-top: clamp(64px, 9vw, 120px); background: var(--bs-ink); color: #fff; }
.mf__cta { max-width: 880px; margin: 0 auto; padding: clamp(64px, 8vw, 104px) 24px 56px; text-align: center; display: grid; gap: 16px; justify-items: center; }
.mf__title { color: #fff; }
.mf__lead { color: rgb(255 255 255 / 0.75); }
.q-btn.mf__btn { margin-top: 8px; background: #fff; color: var(--bs-ink); }
.mf__base { max-width: 1240px; margin: 0 auto; padding: 28px 24px 36px; border-top: 1px solid rgb(255 255 255 / 0.12); display: flex; flex-wrap: wrap; align-items: center; gap: 16px 32px; }
.mf__logo { height: 26px; width: auto; }
.mf__links { display: flex; flex-wrap: wrap; gap: 6px 20px; }
.mf__links a { color: rgb(255 255 255 / 0.8); text-decoration: none; font: 400 0.9375rem/1 var(--bs-font); padding: 6px 0; }
.mf__links a:hover { color: #fff; text-decoration: underline; }
.mf__legal { margin: 0 0 0 auto; font: 400 0.8125rem/1.4 var(--bs-font); color: rgb(255 255 255 / 0.6); }
@media (max-width: 760px) { .mf__legal { margin-left: 0; } .mf__base { padding-inline: 16px; } }
</style>
