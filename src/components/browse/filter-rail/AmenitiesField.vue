<script setup>
// AmenitiesField — title + amenity checkboxes + more/fewer toggle + apply button.
// `v-model` is an array of selected amenity labels. Amenity catalog comes from
// the shared amenities lib.
import { ref, computed, watch } from 'vue'
import { filterAmenities } from '../../../lib/amenities.js'

const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])

// DES-457: selections are staged locally and only committed to the parent
// (which filters results) when "Apply Amenity Filters" is pressed.
const amenitySel = ref([...props.modelValue])
watch(() => props.modelValue, (v) => { amenitySel.value = [...v] })
const applied = computed(() => JSON.stringify([...amenitySel.value].sort()) === JSON.stringify([...props.modelValue].sort()))
const apply = () => emit('update:modelValue', [...amenitySel.value])

const AMENITIES = filterAmenities().map((a) => a.label)
const amenitiesShown = ref(15)
const visibleAmenities = computed(() => AMENITIES.slice(0, amenitiesShown.value))
const moreCount = computed(() => AMENITIES.length - amenitiesShown.value)
const toggleMore = () => { amenitiesShown.value = moreCount.value > 0 ? AMENITIES.length : 15 }
</script>

<template>
  <div>
    <h3 class="fr__title">Amenities</h3>
    <q-checkbox v-for="a in visibleAmenities" :key="a" v-model="amenitySel" :val="a" :label="a" color="primary" dense class="fr__check" />
    <button type="button" class="fr__more" @click="toggleMore">
      <q-icon :name="moreCount > 0 ? 'expand_more' : 'expand_less'" size="18px" />
      <span>{{ moreCount > 0 ? `More amenity options` : 'Fewer amenity options' }}</span>
    </button>
    <button type="button" class="fr__apply" :class="{ 'fr__apply--done': applied }" @click="apply">Apply Amenity Filters</button>
  </div>
</template>

<style scoped>
.fr__title {
  margin: 0 0 2px;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  color: var(--ds-color-text-brand);
}

/* Checkboxes */
.fr__check { display: flex; margin: 2px 0; }

/* More link */
.fr__more {
  display: flex; align-items: center; gap: 6px; margin: 8px 0 14px; padding: 0;
  border: 0; background: none; cursor: pointer; color: var(--ds-color-text-brand);
  font-weight: 700; font-size: 0.875rem;
}

/* Apply / clear buttons */
.fr__apply {
  width: 100%; height: 44px; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; border-radius: var(--ds-radius-button); cursor: pointer;
  background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 0.9375rem;
}
.fr__apply:hover { background: var(--ds-palette-navy-800, #0a1f4d); }
/* Muted once applied (no pending changes); solid navy invites you to apply. */
.fr__apply--done, .fr__apply--done:hover { background: var(--ds-palette-slate-200); color: var(--ds-color-text-subtle); }
</style>
