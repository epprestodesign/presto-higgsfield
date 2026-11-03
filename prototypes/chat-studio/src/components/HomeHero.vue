<script setup>
// New project: a big serif line, the composer, and starter prompts by topic.
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import Composer from './Composer.vue'
import { SUGGESTIONS } from '../mockData.js'
import { MODES } from '../mockAgent.js'

defineProps({ working: { type: Boolean, default: false } })
const emit = defineEmits(['send'])
const tab = ref('Popular')
const draft = ref('')
const composer = ref(null)
const credits = computed(() => (MODES.find((m) => m.id === composer.value?.mode) || MODES[3]).credits)
function use(s) { draft.value = s; composer.value?.focus() }
</script>

<template>
  <section class="home" aria-labelledby="home-title">
    <p class="home__eyebrow">Banner Lab</p>
    <h1 id="home-title" class="home__title">Brand any event in one conversation</h1>
    <p class="home__sub">Describe the event or paste its website. You’ll get a clean logo, banners and the Presto pages, and you can change anything by asking.</p>

    <Composer ref="composer" v-model="draft" variant="home" placeholder="Describe the event, or paste its website" :working="working" @send="(t, o) => emit('send', t, o)" />

    <div class="home__tabs cs-tabs" role="tablist" aria-label="Starter prompts">
      <button
        v-for="(_, t) in SUGGESTIONS" :key="t" type="button" role="tab" class="cs-tab"
        :class="{ 'is-on': tab === t }" :aria-selected="tab === t" @click="tab = t"
      >{{ t }}</button>
    </div>
    <ul class="home__list" role="tabpanel">
      <li v-for="s in SUGGESTIONS[tab]" :key="s">
        <button type="button" class="home__sug" @click="use(s)">
          <svg class="cs-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v7a4 4 0 0 0 4 4h10M15 11l4 4-4 4" /></svg>
          {{ s }}
        </button>
      </li>
    </ul>
    <p class="home__note"><Icon name="credit" :size="16" /> {{ credits }}</p>
  </section>
</template>

<style scoped>
.home { width: min(840px, 100%); margin: 0 auto; padding: 10vh 24px 48px; display: grid; gap: 16px; }
.home__eyebrow { margin: 0; text-align: center; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
.home__title { margin: 0; text-align: center; font: 700 clamp(30px, 4vw, 44px)/1.15 var(--sans); color: var(--ink); }
.home__sub { margin: 0 auto 20px; max-width: 600px; text-align: center; font-size: 17px; color: var(--ink-2); }
.home__tabs { margin-top: 20px; }
.home__list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 0 24px; }
.home__sug { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 8px 4px; border: 0; background: none; text-align: left; font-size: 15px; cursor: pointer; }
.home__sug svg { color: var(--ink-3); }
.home__sug:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.home__note { display: flex; align-items: center; gap: 6px; margin: 8px 0 0; font-size: 13px; color: var(--ink-3); }
</style>
