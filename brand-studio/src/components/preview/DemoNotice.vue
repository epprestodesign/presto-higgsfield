<script setup>
// DemoNotice — persistent, unobtrusive reminder that a branded preview / published
// demo is a simulation: hotel rates and availability are illustrative and no
// bookings or payments are ever made. Sticky to the bottom of the page.
import { ref } from 'vue'

defineProps({
  // 'bar' = sticky bottom pill (pages) · 'inline' = block banner (checkout)
  variant: { type: String, default: 'bar' },
  title: { type: String, default: 'Demo checkout — no payment is taken.' },
  message: { type: String, default: '' },
})
const expanded = ref(false)
</script>

<template>
  <div v-if="variant === 'inline'" class="dn-inline" role="note">
    <q-icon name="info" size="20px" class="dn-inline__icon" />
    <div>
      <strong>{{ title }}</strong>
      {{ message || 'This is a preview of the checkout experience. Do not enter real card details; nothing you type here is stored or charged, and no reservation is made.' }}
    </div>
  </div>

  <div v-else class="dn" role="note" aria-label="Demo notice">
    <button type="button" class="dn__pill" :aria-expanded="expanded" @click="expanded = !expanded">
      <span class="dn__dot" aria-hidden="true" />
      <span class="dn__title">Demo preview</span>
      <span class="dn__short">· Rates & availability are illustrative</span>
      <q-icon :name="expanded ? 'expand_more' : 'expand_less'" size="18px" />
    </button>
    <p v-if="expanded" class="dn__more">
      {{ message || 'Built with Presto Brand Studio. Hotels, rates and availability shown here are sample data. No bookings, holds or payments are made from this page.' }}
    </p>
  </div>
</template>

<style scoped>
.dn {
  position: sticky; bottom: 12px; z-index: 30;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  margin: 0 auto; width: fit-content; max-width: calc(100% - 24px);
  pointer-events: none;
}
.dn__pill, .dn__more { pointer-events: auto; }
.dn__pill {
  display: inline-flex; align-items: center; gap: 8px;
  height: 36px; padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 0.12); border-radius: 999px;
  background: rgb(3 10 38 / 0.88); color: #fff;
  backdrop-filter: blur(6px);
  font: 400 0.8125rem/1 'PT Sans', sans-serif;
  box-shadow: 0 6px 20px rgb(3 10 38 / 0.25);
  cursor: pointer;
}
.dn__pill:focus-visible { outline: 3px solid #A78BFA; outline-offset: 2px; }
.dn__dot { width: 8px; height: 8px; border-radius: 50%; background: #F59E0B; flex: none; }
.dn__title { font-weight: 700; }
.dn__short { opacity: 0.85; }
.dn__more {
  margin: 0; max-width: 460px; padding: 10px 14px; border-radius: 10px;
  background: rgb(3 10 38 / 0.92); color: #fff; font: 400 0.8125rem/1.45 'PT Sans', sans-serif;
  box-shadow: 0 6px 20px rgb(3 10 38 / 0.25);
}
@media (max-width: 600px) { .dn__short { display: none; } }

.dn-inline {
  display: flex; gap: 10px; align-items: flex-start;
  margin: 16px auto 0; max-width: 1180px; padding: 12px 16px;
  border: 1px solid var(--ds-palette-amber-300, #FCD34D); border-radius: 8px;
  background: var(--ds-palette-amber-50, #FFFBEB); color: var(--ds-palette-amber-900, #78350F);
  font-size: 0.9375rem; line-height: 1.45;
}
.dn-inline__icon { color: var(--ds-palette-amber-600, #D97706); flex: none; margin-top: 1px; }
</style>
