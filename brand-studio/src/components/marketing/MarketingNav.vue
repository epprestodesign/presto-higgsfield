<script setup>
// MarketingNav — sticky top bar for the Brand Studio marketing site.
import { ref } from 'vue'
import epLogo from '@lib/assets/eventpipe logos/eventpipe-logo.svg'

defineProps({
  links: {
    type: Array,
    default: () => [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Examples', href: '#examples' },
      { label: 'Customize', href: '#customize' },
      { label: 'Sponsorships', href: '#sponsorships' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
})
const emit = defineEmits(['start', 'signin'])
const open = ref(false)
</script>

<template>
  <header class="mn">
    <nav class="mn__inner" aria-label="Primary">
      <a href="#top" class="mn__brand bs-focusable" aria-label="Presto Brand Studio by EventPipe — home">
        <img :src="epLogo" alt="" class="mn__logo" />
        <span class="mn__divider" aria-hidden="true" />
        <span class="mn__product">Brand Studio</span>
      </a>

      <ul class="mn__links">
        <li v-for="l in links" :key="l.href"><a :href="l.href" class="mn__link bs-focusable">{{ l.label }}</a></li>
      </ul>

      <div class="mn__actions">
        <button type="button" class="mn__signin bs-focusable" @click="emit('signin')">Sign in</button>
        <q-btn unelevated no-caps class="bs-btn bs-btn--primary mn__cta" label="Create your booking page" @click="emit('start')" />
        <q-btn
          flat round dense class="mn__menu" icon="menu"
          :aria-expanded="open ? 'true' : 'false'" aria-controls="mn-drawer" aria-label="Open menu"
          @click="open = !open"
        />
      </div>
    </nav>

    <div v-if="open" id="mn-drawer" class="mn__drawer">
      <a v-for="l in links" :key="l.href" :href="l.href" class="mn__drawer-link bs-focusable" @click="open = false">{{ l.label }}</a>
      <button type="button" class="mn__drawer-link mn__drawer-btn bs-focusable" @click="open = false; emit('signin')">Sign in</button>
    </div>
  </header>
</template>

<style scoped>
.mn {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgb(255 255 255 / 0.86);
  backdrop-filter: saturate(1.4) blur(14px);
  border-bottom: 1px solid var(--bs-line);
}
.mn__inner { max-width: 1240px; margin: 0 auto; padding: 0 24px; height: 68px; display: flex; align-items: center; gap: 32px; }
.mn__brand { display: flex; align-items: center; gap: 12px; text-decoration: none; border-radius: 6px; }
.mn__logo { height: 24px; width: auto; display: block; }
.mn__divider { width: 1px; height: 22px; background: var(--bs-line-strong); }
.mn__product { font: 700 1.0625rem/1 var(--bs-font); color: var(--bs-ink); letter-spacing: -0.01em; }
.mn__links { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; }
.mn__link { display: block; padding: 8px 12px; border-radius: 6px; font: 400 0.9375rem/1 var(--bs-font); color: var(--bs-ink-soft); text-decoration: none; }
.mn__link:hover { color: var(--bs-ink); background: var(--bs-surface-2); }
.mn__actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.mn__signin { background: none; border: 0; padding: 10px 14px; border-radius: 6px; font: 700 0.9375rem/1 var(--bs-font); color: var(--bs-ink); cursor: pointer; }
.mn__signin:hover { background: var(--bs-surface-2); }
.mn__menu { display: none; color: var(--bs-ink); }
.mn__drawer { display: none; }

@media (max-width: 1080px) {
  .mn__links { display: none; }
}
@media (max-width: 640px) {
  .mn__inner { padding: 0 16px; gap: 12px; height: 60px; }
  .mn__signin { display: none; }
  .mn__cta { display: none; }
  .mn__menu { display: inline-flex; }
  .mn__drawer { display: grid; padding: 8px 16px 16px; border-top: 1px solid var(--bs-line); background: #fff; }
  .mn__drawer-link { display: block; padding: 14px 4px; font: 400 1rem/1 var(--bs-font); color: var(--bs-ink); text-decoration: none; border-bottom: 1px solid var(--bs-line); }
  .mn__drawer-btn { background: none; border: 0; text-align: left; cursor: pointer; font-weight: 700; }
}
</style>
