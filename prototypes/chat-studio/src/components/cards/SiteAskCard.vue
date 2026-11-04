<script setup>
// No website in the brief: ask for it, since the logo, the colours and the
// pages ads link to all come from the site. The ways out: upload a logo (ads
// then link to the event's Presto pages), or go without one (the event's name
// set in type).
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import { giveWebsite, giveLogoNoSite, goWithoutLogo, state } from '../../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true }, card: { type: Object, required: true } })
const done = computed(() => props.project.site !== 'ask')
const url = ref('')
const valid = computed(() => /\b[\w-]+\.[a-z]{2,}\b/i.test(url.value.trim()))
const file = ref(null)
function send() { if (valid.value && !state.working) giveWebsite(props.project, url.value.trim()) }
function onFile(e) { const f = e.target.files?.[0]; e.target.value = ''; if (f) giveLogoNoSite(props.project, f) }
const ANSWER = { given: 'Website added', none: 'Going without a website', brief: 'Website added' }
</script>

<template>
  <CardShell kicker="Website" title="What’s the event’s website?" :aside="done ? ANSWER[project.site] : ''">
    <form class="sa" @submit.prevent="send">
      <label class="sa__field">
        <span class="sa__icon"><Icon name="link" :size="18" /></span>
        <input v-model="url" type="text" inputmode="url" autocomplete="url" placeholder="yourevent.com" aria-label="The event’s website" :disabled="done" />
      </label>
      <button type="submit" class="cs-btn-dark" :disabled="done || !valid || state.working">Use this website</button>
    </form>
    <p class="sa__or">No website? Ads will link to the event’s own Presto pages.</p>
    <div class="sa__outs">
      <button type="button" class="cs-btn-ghost" :disabled="done || state.working" @click="file.click()"><Icon name="image" :size="16" /> Upload a logo</button>
      <button type="button" class="cs-btn-ghost" :disabled="done || state.working" @click="goWithoutLogo(project)">Go without a logo</button>
      <input ref="file" type="file" accept="image/*" hidden @change="onFile" />
    </div>
    <p class="sa__note">Without a logo, the ads set <b>{{ project.brand.short }}</b> in type, in your colours.</p>
  </CardShell>
</template>

<style scoped>
.sa { display: flex; gap: 8px; flex-wrap: wrap; }
.sa__field { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); }
.sa__field:focus-within { border-color: var(--navy-900); box-shadow: 0 0 0 1px var(--navy-900); }
.sa__icon { display: grid; color: var(--ink-3); }
.sa__field input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: 15px; color: var(--ink); outline: none; }
.sa__or { margin: 18px 0 8px; color: var(--ink-2); font-size: 14px; }
.sa__outs { display: flex; gap: 8px; flex-wrap: wrap; }
.sa__note { margin: 12px 0 0; color: var(--ink-3); font-size: 13px; }
</style>
