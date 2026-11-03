<script setup>
// In the chat: the ad an Advertisements action was about, live.
import { computed } from 'vue'
import AdSuite from '../ads/AdSuite.vue'
import { restoreAd } from '../../ads.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const ad = computed(() => props.project.ads.items.find((a) => a.id === props.card.adId))
const gone = computed(() => props.project.ads.removed?.[props.card.adId]?.ad)
</script>

<template>
  <AdSuite v-if="ad" :project="project" :ad="ad" compact />
  <p v-else class="adc__gone" role="status"><template v-if="gone"><b>{{ gone.name }}</b> was deleted. <button type="button" @click="restoreAd(project, card.adId)">Undo</button></template><template v-else>This ad was removed.</template></p>
</template>

<style scoped>
.adc__gone { margin: 0; padding: 12px 14px; border: 1px dashed var(--line-bold); border-radius: var(--r); color: var(--ink-2); font-size: 14px; }
.adc__gone button { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
</style>
