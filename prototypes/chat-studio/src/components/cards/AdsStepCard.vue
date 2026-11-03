<script setup>
// The Ads step in the chat: the placements picked for the event and the ad
// the agent made, with a way into Advertisements.
import { computed } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import AdSuite from '../ads/AdSuite.vue'
import { offerById, packageSizes } from '../../ads.js'
import { route } from '../../router.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const ad = computed(() => props.project.ads.items.find((a) => a.id === props.card.adId))
const offers = computed(() => props.project.ads.offers.map(offerById).filter(Boolean))
</script>

<template>
  <CardShell kicker="Advertisements" title="Your ad placements" :aside="`${offers.length} placements · ${packageSizes(project.ads).length} sizes`">
    <ul class="asc__offers">
      <li v-for="o in offers" :key="o.id"><Icon name="check" :size="14" /> {{ o.label }} <small>{{ o.size.replace('x', '×') }}</small></li>
    </ul>
    <AdSuite v-if="ad" :project="project" :ad="ad" compact />
    <button type="button" class="cs-tab asc__open" @click="route.tab = 'ads'"><Icon name="megaphone" :size="18" /> Open Advertisements</button>
  </CardShell>
</template>

<style scoped>
.asc__offers { list-style: none; margin: -6px 0 14px; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; }
.asc__offers li { display: flex; align-items: center; gap: 6px; }
.asc__offers :deep(svg) { color: var(--ok); }
.asc__offers small { color: var(--ink-3); }
.asc__open { margin-top: 14px; }
</style>
