<script setup>
// PriceDetailsDialog — the "Price Details" breakdown modal opened from a reserve
// room card. Shows the per-night line items, hotel fee, taxes, a grand total,
// and a Reserve Room CTA. Built on DsModal.
//
// Breakdown is derived from the room-card prop object:
//   subtotal = roomCount × nights × pricePerNight
//   hotelFee = room.hotelFee ?? $6 per room-night
//   taxes    = room.taxes    ?? 18% of subtotal
//   fees     = room.secondaryFees — up to three organizer-configured fees (DES-453)
//   total    = subtotal + hotelFee + taxes + fees
import { computed } from 'vue'
import DsModal from '../DsModal.vue'
import { normalizeSecondaryFees, secondaryFeesTotal, feeTooltip } from '../../lib/secondaryFees'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  room: { type: Object, default: null },
  currency: { type: String, default: '$' },
  // Up to three secondary custom fees. Falls back to `room.secondaryFees` so a
  // room-card object can carry its own without the parent re-plumbing the prop.
  secondaryFees: { type: Array, default: null },
})
const emit = defineEmits(['update:modelValue', 'reserve'])

const nights = computed(() => props.room?.nights || [])
const perNight = computed(() => props.room?.pricePerNight ?? 0)
const roomCount = computed(() => props.room?.roomCount ?? 1)

const lines = computed(() => nights.value.map((n) => ({ date: n.date, price: perNight.value })))
const subtotal = computed(() => roomCount.value * lines.value.length * perNight.value)
const round2 = (n) => Math.round(n * 100) / 100
const hotelFee = computed(() => props.room?.hotelFee ?? lines.value.length * roomCount.value * 6)
const taxes = computed(() => props.room?.taxes ?? round2(subtotal.value * 0.18))

// DES-453: up to three secondary custom fees, between Taxes and the total.
// Guests see each fee's calculated charge; the rate and the organizer's
// description live in the row tooltip.
const feeCtx = computed(() => ({ nights: lines.value.length, rooms: roomCount.value }))
const fees = computed(() => normalizeSecondaryFees(props.secondaryFees ?? props.room?.secondaryFees, feeCtx.value))
const feesTotal = computed(() => secondaryFeesTotal(props.secondaryFees ?? props.room?.secondaryFees, feeCtx.value))
const tipFor = (f) => feeTooltip(f, { currency: props.currency })

const total = computed(() => round2(subtotal.value + hotelFee.value + taxes.value + feesTotal.value))

const money = (n) => props.currency + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const nightsCount = computed(() => lines.value.length)
const reserve = () => { emit('reserve', props.room); emit('update:modelValue', false) }
</script>

<template>
  <ds-modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Price Details"
    size="md"
    aria-label="Price details"
  >
    <div class="pd">
      <div class="pd__head">
        {{ roomCount }} room{{ roomCount === 1 ? '' : 's' }} × {{ nightsCount }} night{{ nightsCount === 1 ? '' : 's' }}
      </div>

      <div class="pd__lines">
        <div v-for="l in lines" :key="l.date" class="pd__row pd__row--night">
          <span class="pd__date">{{ l.date }}</span>
          <span class="pd__amt">{{ money(l.price) }}</span>
        </div>
        <div class="pd__row">
          <span>Hotel fee</span>
          <span class="pd__amt">{{ money(hotelFee) }}</span>
        </div>
        <div class="pd__row">
          <span>Taxes</span>
          <span class="pd__amt">{{ money(taxes) }}</span>
        </div>

        <!-- DES-453: secondary custom fees (max 3). The calculated charge only —
             the rate and description are on the ⓘ, matching the live site. -->
        <div v-for="(f, i) in fees" :key="'fee' + i" class="pd__row">
          <span class="pd__feelabel">
            {{ f.name }}
            <button v-if="tipFor(f)" type="button" class="pd__info" :aria-label="`About ${f.name}`">
              <q-icon name="info" size="16px" />
              <q-tooltip class="pd__tooltip" anchor="top middle" self="bottom middle" :offset="[0, 8]" max-width="320px">{{ tipFor(f) }}</q-tooltip>
            </button>
          </span>
          <span class="pd__amt">{{ money(f.total) }}</span>
        </div>
      </div>

      <hr class="pd__rule" />

      <div class="pd__row pd__row--total">
        <span>Total Cost (USD)</span>
        <span>{{ money(total) }}</span>
      </div>

      <button type="button" class="pd__cta" @click="reserve">Reserve Room</button>
    </div>
  </ds-modal>
</template>

<style scoped>
.pd { display: flex; flex-direction: column; }
.pd__head { font-size: 1.0625rem; font-weight: 700; color: var(--ds-color-text); margin-bottom: 14px; }

.pd__lines { display: flex; flex-direction: column; gap: 12px; }
.pd__row { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 1.0625rem; color: var(--ds-color-text); }
.pd__row--night { padding-left: 24px; }
.pd__date { color: var(--ds-color-text); }
.pd__amt { color: var(--ds-color-text); font-variant-numeric: tabular-nums; }

/* Secondary fee rows — label + ⓘ trigger sized to sit on the text baseline. */
.pd__feelabel { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.pd__info { background: none; border: 0; padding: 0; display: inline-flex; align-items: center; color: var(--ds-color-text-subtle); cursor: pointer; }
.pd__info:hover { color: var(--ds-color-text); }
.pd__tooltip { font-size: 0.8125rem; line-height: 1.5; }

.pd__rule { border: 0; border-top: 1px solid var(--ds-color-border); margin: 18px 0; }

.pd__row--total { font-size: 1.25rem; font-weight: 800; color: var(--ds-color-text); }

.pd__cta {
  width: 100%; height: 60px; margin-top: 22px; border: 0; border-radius: var(--ds-radius-button);
  background: var(--ds-color-background-brand-bold); color: #fff; font-family: inherit;
  font-size: 1.125rem; font-weight: 700; cursor: pointer;
  transition: background var(--ds-duration-fast) var(--ds-ease-standard);
}
.pd__cta:hover { background: var(--ds-palette-navy-800); }
</style>
