<script setup>
// RoomsCarousel — the "Select Your Room" section of the hotel detail screen.
// Lays room cards out in a responsive grid of up to three per row; when there
// are more than three room types they wrap onto additional rows (e.g. 4 rooms →
// a row of 3 + a row of 1). No carousel/scroll — mirrors production.
// The `flow` prop picks the card: 'reserve' → RoomCardReserve (Book
// Reservations), 'group' → RoomCardGroup (Group Block). Sold-out rooms are
// rendered inline (the cards handle their own sold-out state), so availability
// never removes a room from the list — it just disables it.
import { ref, computed } from 'vue'
import RoomCardReserve from './RoomCardReserve.vue'
import RoomCardGroup from './RoomCardGroup.vue'
import PriceDetailsDialog from './PriceDetailsDialog.vue'

const props = defineProps({
  rooms: { type: Array, default: () => [] }, // array of room-card prop objects
  flow: { type: String, default: 'reserve' }, // 'reserve' | 'group'
  title: { type: String, default: 'Select Your Room' },
  subtitle: { type: String, default: '' },
  // DES-453: up to three secondary custom fees for this hotel, forwarded to the
  // Price Details modal. A room may also carry its own `secondaryFees`, which
  // wins — event hotel level overrides event level, same as the admin config.
  secondaryFees: { type: Array, default: null },
})

// Price Details modal (reserve flow) — opened from a room card's "Price Details".
const priceOpen = ref(false)
const activeRoom = ref(null)
const openPrice = (room) => { activeRoom.value = room; priceOpen.value = true }
const activeFees = computed(() => activeRoom.value?.secondaryFees ?? props.secondaryFees)

// `secondaryFees` is breakdown data, not a card prop — keep it off the room card
// so it doesn't fall through onto the DOM as an attribute.
const cardProps = (room) => { const { secondaryFees, ...rest } = room || {}; return rest }
</script>

<template>
  <section class="rcar">
    <header v-if="title || subtitle" class="rcar__head">
      <div class="rcar__heading">
        <h3 v-if="title" class="rcar__title">{{ title }}</h3>
        <p v-if="subtitle" class="rcar__sub">{{ subtitle }}</p>
      </div>
    </header>

    <!-- Up to 3 room cards per row; additional room types wrap to new rows. -->
    <div class="rcar__grid">
      <div v-for="(room, i) in rooms" :key="i" class="rcar__item">
        <room-card-group v-if="flow === 'group'" v-bind="cardProps(room)" />
        <room-card-reserve v-else v-bind="cardProps(room)" @price-details="openPrice(room)" />
      </div>
    </div>

    <!-- Price Details breakdown modal (reserve flow) -->
    <price-details-dialog v-model="priceOpen" :room="activeRoom" :secondary-fees="activeFees" />
  </section>
</template>

<style scoped>
.rcar { display: flex; flex-direction: column; gap: 16px; }
.rcar__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.rcar__title { font-size: 1.5rem; font-weight: 700; line-height: 1.2; margin: 0; color: var(--ds-color-text); }
.rcar__sub { margin: 4px 0 0; color: var(--ds-color-text-subtle); font-size: 0.9375rem; }

/* Grid: up to three cards per row, wrapping onto additional rows. Cards fill
   their cell (their intrinsic 360px width is overridden to 100%). */
.rcar__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; align-items: stretch; }
.rcar__item { min-width: 0; display: flex; }
.rcar__item > :deep(.rcr), .rcar__item > :deep(.rcg) { width: 100%; max-width: none; height: 100%; }

@media (max-width: 900px) { .rcar__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .rcar__grid { grid-template-columns: minmax(0, 1fr); } }
</style>
