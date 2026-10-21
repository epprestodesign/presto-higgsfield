<script setup>
// SearchSummaryBar — the compact, read-only summary of the active search shown at
// the top of the hotel list on PHONES (DES-419 / DES-422). Production shows the
// search parameters collapsed to a single bordered card — destination on top,
// dates + travelers/rooms beneath, and a pencil that reopens the full booking
// widget — instead of the full multi-field widget, which is far too tall at 390px.
//
// Presentational only: the values are props and the pencil emits `edit`, so the
// host (HotelListPage) decides what editing means.
defineProps({
  location: { type: String, default: '' },
  dates: { type: String, default: '' },
  // e.g. "1 Traveler, 1 Room" (reserve) or "4 Rooms" (group block)
  guests: { type: String, default: '' },
  // Reflects whether the host currently has the full widget open, so the control
  // reads correctly to screen readers.
  expanded: { type: Boolean, default: false },
})
defineEmits(['edit'])
</script>

<template>
  <div class="ssb">
    <div class="ssb__text">
      <div class="ssb__location">{{ location }}</div>
      <div class="ssb__meta">
        <span class="ssb__dates">{{ dates }}</span>
        <span v-if="guests" class="ssb__guests">{{ guests }}</span>
      </div>
    </div>
    <button
      type="button"
      class="ssb__edit"
      :aria-expanded="expanded"
      aria-label="Edit search"
      @click="$emit('edit')"
    >
      <q-icon name="edit" size="22px" />
    </button>
  </div>
</template>

<style scoped>
.ssb {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px 10px 14px;
  border: 1px solid var(--ds-color-border-bold);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
}
.ssb__text { flex: 1; min-width: 0; }
.ssb__location {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ds-color-text-brand);
}
/* Dates on the left, travelers/rooms pushed toward the middle — matching the
   production two-column reading rhythm rather than a tight stack. */
.ssb__meta {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-top: 2px;
  font-size: 0.9375rem;
  color: var(--ds-color-text);
}
.ssb__dates { flex: none; }
.ssb__guests { flex: 1; }
.ssb__edit {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--ds-color-text-brand);
  cursor: pointer;
}
.ssb__edit:hover { background: var(--ds-palette-navy-50, #eef1f7); }
</style>
