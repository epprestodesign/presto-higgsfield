<script setup>
// ScaledFrame — renders its slot at a fixed design width, then scales it to
// fit the available width (like a thumbnail of a real page). Lets marketing
// mockups show the real Presto components at true desktop proportions.
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  designWidth: { type: Number, default: 1200 },
  // Clip the scaled content to this design height (null = natural height).
  designHeight: { type: Number, default: null },
})

const host = ref(null)
const inner = ref(null)
const scale = ref(1)
const height = ref(props.designHeight || 0)
let ro = null

const measure = () => {
  if (!host.value) return
  scale.value = host.value.clientWidth / props.designWidth
  const natural = props.designHeight || inner.value?.scrollHeight || 0
  height.value = natural * scale.value
}

onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  ro.observe(host.value)
  if (inner.value) ro.observe(inner.value)
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div ref="host" class="sf" :style="{ height: height + 'px' }">
    <div
      ref="inner"
      class="sf__inner"
      :style="{ width: designWidth + 'px', height: designHeight ? designHeight + 'px' : 'auto', transform: `scale(${scale})` }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sf { position: relative; overflow: hidden; width: 100%; }
.sf__inner { position: absolute; top: 0; left: 0; transform-origin: 0 0; overflow: hidden; }
</style>
