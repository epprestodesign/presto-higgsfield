<script setup>
// OrderSummary — the sticky right-rail card on the checkout page (Airbnb-style):
// hero image, title, editable rows (dates / guests / rooms), price details,
// total, and an optional scarcity note.
//
// DES-456: `summary.secondaryFees` renders up to three named custom fees below
// the price lines. Amounts only — the rate and the organizer's description are
// on the ⓘ. `summary.total` is caller-owned and must already include them.
import { computed } from 'vue'
import { normalizeSecondaryFees, feeTooltip } from '../../lib/secondaryFees'

const props = defineProps({
  summary: { type: Object, default: () => ({}) },
  currency: { type: String, default: '$' },
})
const emit = defineEmits(['change'])
const money = (n, c = '$') => c + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fees = computed(() => normalizeSecondaryFees(props.summary?.secondaryFees, {
  nights: props.summary?.nights ?? 1,
  rooms: props.summary?.rooms ?? 1,
}))
const feeTip = (f) => feeTooltip(f, { currency: props.currency })
</script>

<template>
  <aside class="os">
    <div class="os__top">
      <img v-if="summary.image" :src="summary.image" :alt="summary.title" class="os__img" />
      <div v-else class="os__img os__img--empty"><q-icon name="image" size="22px" /></div>
      <div class="os__titlewrap">
        <div class="os__title">{{ summary.title }}</div>
        <div v-if="summary.subtitle" class="os__subtitle">{{ summary.subtitle }}</div>
        <div v-if="summary.rating" class="os__rating"><q-icon name="star" size="14px" /> {{ summary.rating }}</div>
      </div>
    </div>

    <p v-if="summary.cancellation" class="os__cancel">{{ summary.cancellation }}</p>

    <div v-for="(r, i) in summary.rows" :key="i" class="os__row">
      <div class="os__rowmeta"><span class="os__rowlabel">{{ r.label }}</span><span class="os__rowval">{{ r.value }}</span></div>
      <button v-if="r.change" class="os__change" @click="emit('change', r.label)">Change</button>
    </div>

    <div class="os__rule" />

    <div class="os__priceh">Price details</div>
    <div v-for="(p, i) in summary.priceLines" :key="i" class="os__price"><span>{{ p.label }}</span><span>{{ money(p.value, currency) }}</span></div>
    <!-- DES-456: secondary custom fees, max 3 -->
    <div v-for="(f, i) in fees" :key="'fee' + i" class="os__price">
      <span class="os__feelabel">{{ f.name }}
        <button v-if="feeTip(f)" type="button" class="os__info" :aria-label="`About ${f.name}`"><q-icon name="info" size="15px" /><q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]" max-width="320px">{{ feeTip(f) }}</q-tooltip></button>
      </span>
      <span>{{ money(f.total, currency) }}</span>
    </div>

    <div class="os__rule" />
    <div class="os__total"><span>Total <small>{{ currency === '$' ? 'USD' : currency }}</small></span><span>{{ money(summary.total, currency) }}</span></div>
    <button class="os__breakdown">Price breakdown</button>

    <div v-if="summary.note" class="os__note"><q-icon name="local_fire_department" size="16px" /> {{ summary.note }}</div>
  </aside>
</template>

<style scoped>
.os { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); padding: 22px; box-shadow: var(--ds-shadow-1); background: var(--ds-color-surface); position: sticky; top: 20px; }
.os__top { display: flex; gap: 14px; }
.os__img { width: 64px; height: 64px; border-radius: var(--ds-radius-md); object-fit: cover; flex: none; background: var(--ds-palette-slate-100); }
.os__img--empty { display: flex; align-items: center; justify-content: center; color: var(--ds-color-text-disabled); }
.os__titlewrap { min-width: 0; }
.os__title { font-weight: 700; color: var(--ds-color-text); line-height: 1.3; }
.os__subtitle { color: var(--ds-color-text-subtle); font-size: 0.875rem; margin-top: 2px; }
.os__rating { display: inline-flex; align-items: center; gap: 4px; color: var(--ds-color-text); font-size: 0.8125rem; margin-top: 6px; }
.os__cancel { color: var(--ds-color-text-subtle); font-size: 0.875rem; margin: 16px 0 0; }
.os__row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 0 0; }
.os__rowmeta { display: flex; flex-direction: column; }
.os__rowlabel { font-weight: 700; color: var(--ds-color-text); font-size: 0.9375rem; }
.os__rowval { color: var(--ds-color-text-subtle); font-size: 0.875rem; margin-top: 2px; }
.os__change { background: none; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-sm); padding: 5px 12px; font-weight: 600; font-size: 0.8125rem; color: var(--ds-color-text); cursor: pointer; }
.os__change:hover { background: var(--ds-palette-slate-100); }
.os__rule { height: 1px; background: var(--ds-color-border); margin: 18px 0; }
.os__priceh { font-weight: 700; color: var(--ds-color-text); margin-bottom: 8px; }
.os__price { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; color: var(--ds-color-text); font-size: 0.9375rem; }
.os__price > span:first-child { color: var(--ds-color-text-subtle); }
.os__feelabel { display: inline-flex; align-items: center; gap: 5px; }
.os__info { display: inline-flex; align-items: center; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; }
.os__info:hover { color: var(--ds-color-text); }
.os__total { display: flex; justify-content: space-between; gap: 12px; font-weight: 700; font-size: 1.0625rem; color: var(--ds-color-text); }
.os__total small { font-weight: 600; font-size: 0.8125rem; color: var(--ds-color-text-subtle); }
.os__breakdown { background: none; border: 0; padding: 6px 0 0; color: var(--ds-color-text); font-weight: 600; text-decoration: underline; cursor: pointer; font-size: 0.875rem; }
.os__note { display: flex; align-items: center; gap: 8px; margin-top: 16px; background: var(--ds-palette-rose-50, #FFF1F2); color: var(--ds-palette-rose-700, #BE123C); border-radius: var(--ds-radius-pill); padding: 10px 14px; font-size: 0.8125rem; font-weight: 500; }

/* Phones: top-down — the summary hero photo goes full-width above the title
   (matching Confirmation); the card is no longer sticky. Price line-items stay
   as key/value rows. */
@media (max-width: 600px) {
  .os { position: static; padding: 18px; }
  .os__top { flex-direction: column; }
  .os__img { width: 100%; height: 160px; }
}
</style>
