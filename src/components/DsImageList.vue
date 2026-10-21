<script setup>
// DsImageList — responsive image grid (MUI "Image List"). Built on QImg.
defineProps({
  items: { type: Array, default: () => [] }, // [{ src, title }]
  cols: { type: Number, default: 3 },
  gap: { type: String, default: '8px' },
})
</script>
<template>
  <div class="ds-image-list" :style="{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }">
    <q-img v-for="(it, i) in items" :key="i" :src="it.src" :ratio="1" style="border-radius:4px">
      <div v-if="it.title" class="absolute-bottom text-caption">{{ it.title }}</div>
    </q-img>
  </div>
</template>
