<script setup>
// DsSectionHeader — title + optional subtitle + actions slot. No Quasar equivalent.
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>
<template>
  <div class="ds-section-header row items-center q-mb-md">
    <div class="col">
      <div class="text-h6">{{ title }}</div>
      <div v-if="subtitle" class="text-body2 text-grey-7">{{ subtitle }}</div>
    </div>
    <div class="col-auto"><slot name="actions" /></div>
  </div>
</template>
