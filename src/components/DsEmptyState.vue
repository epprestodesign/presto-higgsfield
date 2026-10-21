<script setup>
// DsEmptyState — icon + headline + description + action slot. No Quasar equivalent.
defineProps({
  icon: { type: String, default: 'inbox' },
  title: { type: String, default: 'Nothing here yet' },
  description: { type: String, default: '' },
})
</script>
<template>
  <div class="ds-empty-state column flex-center text-center q-pa-xl" style="gap:8px">
    <q-icon :name="icon" size="56px" class="text-grey-5" />
    <div class="text-h6">{{ title }}</div>
    <div v-if="description" class="text-body2 text-grey-7" style="max-width:360px">{{ description }}</div>
    <div class="q-mt-sm"><slot name="action" /></div>
  </div>
</template>
