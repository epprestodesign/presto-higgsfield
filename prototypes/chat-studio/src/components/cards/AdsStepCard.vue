<script setup>
// The Ads step in the chat: the placements picked for the event and the ad
// the agent made, with a way into Advertisements.
import { computed } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import AdSuite from '../ads/AdSuite.vue'
import { offerById, spotsOf, restoreAd } from '../../ads.js'
import { route } from '../../router.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const ad = computed(() => props.project.ads.items.find((a) => a.id === props.card.adId))
const gone = computed(() => props.project.ads.removed?.[props.card.adId]?.ad)
const offers = computed(() => props.project.ads.offers.map(offerById).filter(Boolean))
</script>

<template>
  <CardShell kicker="Advertisements" title="Your ad placements" :aside="`${offers.length} placements · ${spotsOf(project.ads).length} spots`">
    <ul class="asc__offers">
      <li v-for="o in offers" :key="o.id"><Icon name="check" :size="14" /> {{ o.label }} <small>{{ o.size.replace('x', '×') }}</small></li>
    </ul>
    <AdSuite v-if="ad" :project="project" :ad="ad" compact />
    <p v-else-if="gone" class="asc__gone" role="status"><b>{{ gone.name }}</b> was deleted. <button type="button" @click="restoreAd(project, card.adId)">Undo</button></p>
    <button type="button" class="cs-tab asc__open" @click="route.tab = 'ads'"><Icon name="megaphone" :size="18" /> Open Advertisements</button>
  </CardShell>
</template>

<style scoped>
.asc__offers { list-style: none; margin: -6px 0 14px; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; }
.asc__offers li { display: flex; align-items: center; gap: 6px; }
.asc__offers :deep(svg) { color: var(--ok); }
.asc__offers small { color: var(--ink-3); }
.asc__open { margin-top: 14px; }
.asc__gone { margin: 0; padding: 12px 14px; border: 1px dashed var(--line-bold); border-radius: var(--r); color: var(--ink-2); font-size: 14px; }
.asc__gone button { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
</style>
