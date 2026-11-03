<script setup>
// One ad unit, drawn with brand-studio's approved AdCreative at its real IAB
// size and scaled down to fit (max width / height).
import { computed } from 'vue'
import AdCreative from '@bs/components/ads/AdCreative.vue'
import { AD_SIZES, asSponsor } from '../../ads.js'

const props = defineProps({
  ad: { type: Object, required: true },
  size: { type: String, required: true },
  maxWidth: { type: Number, default: 300 },
  maxHeight: { type: Number, default: 250 },
})
const dims = computed(() => AD_SIZES[props.size])
const scale = computed(() => Math.min(1, props.maxWidth / dims.value.width, props.maxHeight / dims.value.height))
const sponsor = computed(() => asSponsor(props.ad))
</script>

<template>
  <div class="ap" :style="{ width: `${dims.width * scale}px`, height: `${dims.height * scale}px` }">
    <div class="ap__unit" :style="{ width: `${dims.width}px`, height: `${dims.height}px`, transform: `scale(${scale})` }">
      <AdCreative :sponsor="sponsor" :size="size" :interactive="false" :fluid="false" />
    </div>
  </div>
</template>

<style scoped>
.ap { position: relative; overflow: hidden; border-radius: 2px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18); }
.ap__unit { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
</style>
