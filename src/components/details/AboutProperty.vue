<script setup>
// AboutProperty — the "More about the property" description block on the hotel
// detail screen. A heading + body copy with an optional truncated "See more"
// expander.
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, default: 'More about the property' },
  text: { type: String, default: '' },
  paragraphs: { type: Array, default: () => [] }, // alt to `text`
  expandable: { type: Boolean, default: true },
})

const expanded = ref(false)
const body = props.paragraphs.length ? props.paragraphs : (props.text ? [props.text] : [])
</script>

<template>
  <section class="about">
    <h3 class="about__title">{{ title }}</h3>
    <div class="about__body" :class="{ 'is-clamped': expandable && !expanded && body.length }">
      <p v-for="(p, i) in body" :key="i">{{ p }}</p>
    </div>
    <button v-if="expandable && body.length" type="button" class="about__more" @click="expanded = !expanded">
      {{ expanded ? 'See less' : 'See more' }}
    </button>
  </section>
</template>

<style scoped>
.about { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.about__title { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--ds-color-text); }
.about__body { color: var(--ds-color-text-subtle); line-height: 1.6; }
.about__body p { margin: 0 0 12px; }
.about__body p:last-child { margin-bottom: 0; }
/* Collapsed: show ~3 lines of the first paragraph. */
.about__body.is-clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.about__more { background: none; border: 0; padding: 0; cursor: pointer; font-family: inherit; font-size: 0.875rem; font-weight: 600; color: var(--ds-color-text); text-decoration: underline; text-underline-offset: 2px; }
</style>
