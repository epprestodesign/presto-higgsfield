<script setup>
// In the chat: the ad an Advertisements action was about, live.
import { computed } from 'vue'
import AdSuite from '../ads/AdSuite.vue'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const ad = computed(() => props.project.ads.items.find((a) => a.id === props.card.adId))
</script>

<template>
  <AdSuite v-if="ad" :project="project" :ad="ad" compact />
  <p v-else class="adc__gone">This ad was removed.</p>
</template>

<style scoped>
.adc__gone { margin: 0; color: var(--ink-3); font-size: 14px; }
</style>
