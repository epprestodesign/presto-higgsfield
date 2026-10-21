<script setup>
// DsUnsplashImage — pulls a live image from Unsplash by query (for prototypes
// and mockups). Falls back to a labelled placeholder when no API key is set,
// so it's safe to render in the public Storybook build.
import { ref, watchEffect } from 'vue'
import { randomPhoto, triggerDownload, hasUnsplashKey } from '../lib/unsplash.js'

const props = defineProps({
  query: { type: String, default: 'hotel' },
  orientation: { type: String, default: 'landscape' }, // landscape | portrait | squarish
  ratio: { type: [String, Number], default: 16 / 9 },
  size: { type: String, default: 'regular' }, // raw | full | regular | small | thumb
  showCredit: { type: Boolean, default: true },
})

const photo = ref(null)
const error = ref(false)

watchEffect(async () => {
  photo.value = null
  error.value = false
  if (!hasUnsplashKey()) return
  try {
    const p = await randomPhoto(props.query, { orientation: props.orientation })
    photo.value = p
    triggerDownload(p.downloadLocation) // Unsplash guideline
  } catch (e) {
    error.value = true
  }
})
</script>

<template>
  <q-img
    v-if="photo"
    :src="photo.urls[size]"
    :ratio="Number(ratio)"
    :alt="photo.alt"
    style="border-radius: 4px"
  >
    <div
      v-if="showCredit"
      class="absolute-bottom text-caption"
      style="font-weight: 400"
      v-html="photo.attributionHtml"
    />
  </q-img>

  <div
    v-else
    class="flex flex-center text-center"
    :style="{
      aspectRatio: String(ratio),
      minHeight: '120px',
      borderRadius: '12px',
      background: 'var(--ds-color-surface-sunken)',
      color: 'var(--ds-color-text-subtle)',
      border: '1px dashed var(--ds-color-border-bold)',
    }"
  >
    <div class="column items-center q-pa-md">
      <q-icon name="image" size="28px" />
      <div class="text-caption q-mt-xs">
        {{ error ? 'Unsplash request failed' : 'Set VITE_UNSPLASH_ACCESS_KEY to load "' + query + '"' }}
      </div>
    </div>
  </div>
</template>
