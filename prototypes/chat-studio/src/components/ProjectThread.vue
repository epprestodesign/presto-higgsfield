<script setup>
// A project: the brand bar (logo + colours) always at the top, then two tabs.
// Chat — one vertical conversation, split into drafts (Setup, Draft 1, Draft 2…)
// so you can scroll back through what you tried. The agent waits for a
// go-ahead after each step (the stepper shows where it is).
// Concepts — every draft as a stack of its screens; open one to see it big.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Icon from './Icon.vue'
import Composer from './Composer.vue'
import AgentStatus from './AgentStatus.vue'
import ProjectHeader from './ProjectHeader.vue'
import ConceptsTab from './ConceptsTab.vue'
import DraftViewer from './DraftViewer.vue'
import DraftStack from './presto/DraftStack.vue'
import BrandCard from './cards/BrandCard.vue'
import LooksCard from './cards/LooksCard.vue'
import BannersCard from './cards/BannersCard.vue'
import PagesCard from './cards/PagesCard.vue'
import ExportCard from './cards/ExportCard.vue'
import SiteAskCard from './cards/SiteAskCard.vue'
import AdCard from './cards/AdCard.vue'
import AdsStepCard from './cards/AdsStepCard.vue'
import AdPackageCard from './cards/AdPackageCard.vue'
import AdsWhereCard from './cards/AdsWhereCard.vue'
import AdsSizesCard from './cards/AdsSizesCard.vue'
import AdsSpotsCard from './cards/AdsSpotsCard.vue'
import AdsLooksCard from './cards/AdsLooksCard.vue'
import AdsTab from './ads/AdsTab.vue'
import AdPreview from './ads/AdPreview.vue'
import { reply, state, stopWorking, stagesFor, draftView, toast, uploadLogo, adsChat, chatContext, clearChatContext, sizeName } from '../mockAgent.js'
import { readySizes, reviseAd, thumbSize } from '../ads.js'
import { route, link, go } from '../router.js'

const props = defineProps({ project: { type: Object, required: true } })
const adOf = (r) => props.project.ads?.items.find((a) => a.id === r.adId)
const CARDS = { brand: BrandCard, looks: LooksCard, banners: BannersCard, pages: PagesCard, export: ExportCard, ad: AdCard, ads: AdsStepCard, adPackage: AdPackageCard, adsWhere: AdsWhereCard, adsSizes: AdsSizesCard, adsSpots: AdsSpotsCard, adsLooks: AdsLooksCard, siteAsk: SiteAskCard }

// Tab and open draft live in the route, so they deep-link.
const tab = computed({ get: () => route.tab, set: (t) => { route.tab = t; route.draft = 0; route.at = '' } })
const viewing = computed({
  get: () => (route.draft ? props.project.drafts[route.draft - 1] || null : null),
  set: (d) => { route.draft = d ? d.n : 0; if (!d) { route.device = 'desktop'; route.screen = 'landing' } },
})

// ---- Scrolling: follow the conversation unless you've scrolled up.
const scroller = ref(null)
const atBottom = ref(true)
const following = ref(true)
function onScroll() {
  const el = scroller.value
  atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 120
}
function onWheel() { if (state.working) following.value = atBottom.value }
function toBottom(smooth = true) {
  const el = scroller.value
  if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}
const pulse = computed(() => props.project.messages.map((m) => `${m.id}:${m.status}:${m.step}`).join('|'))
const lastDone = computed(() => [...props.project.messages].reverse().find((m) => m.role === 'agent' && m.status === 'done')?.id)
watch(pulse, () => { if (atBottom.value) nextTick(() => toBottom()) })
// When an answer lands, bring its start into view so you read it top-down.
watch(lastDone, (id) => {
  if (!id || !following.value) return
  nextTick(() => scroller.value?.querySelector(`[data-mid="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
})
watch(tab, (t) => { if (t === 'chat') nextTick(() => (route.at ? scrollToAt(false) : toBottom(false))) })
// ?at=draft-2 / ?at=setup scrolls the chat to that part.
function scrollToAt(smooth = true) {
  const el = scroller.value?.querySelector(`[data-seg="${route.at}"]`)
  if (el) { following.value = false; el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }) }
}
watch(() => route.at, (a) => { if (a) nextTick(() => scrollToAt()) })
onMounted(() => (route.at ? nextTick(() => scrollToAt(false)) : toBottom(false)))
function copyLink(at) {
  const url = link({ view: 'project', project: props.project.slug, at })
  navigator.clipboard?.writeText(url).catch(() => {})
  route.at = at
  toast('Link copied')
}

// "Edit" on an ad in the chat attaches it to the chat box: the next message
// changes that ad (the size picked, or every size).
const composer = ref(null)
const ctxAd = computed(() => (chatContext.projectId === props.project.id ? adOf(chatContext) : null))
const ctxThumb = computed(() => ctxAd.value && (chatContext.size || thumbSize(readySizes(ctxAd.value))))
watch(() => [chatContext.adId, chatContext.size], () => { if (ctxAd.value) nextTick(() => composer.value?.focus()) })
function reviseInChat(text) {
  const ad = ctxAd.value
  const one = chatContext.every ? null : chatContext.size
  adsChat(
    props.project, text,
    one ? `Updated **${ad.name}** in the ${sizeName(one)} only. The other sizes are unchanged.` : `Updated **${ad.name}** in every finished size.`,
    ad.id, { adRef: { adId: ad.id, size: ctxThumb.value || null, every: !one } },
  )
  reviseAd(props.project, ad, text, one)
  clearChatContext()
}

function ask(text, opts = {}) {
  if (state.working) return
  if (ctxAd.value && text) { following.value = true; atBottom.value = true; reviseInChat(text); nextTick(() => toBottom()); return }
  if (route.tab !== 'chat') tab.value = 'chat'
  route.at = ''
  following.value = true
  atBottom.value = true
  // An image attached in the composer is taken as a new logo.
  if (opts.logo?.file) uploadLogo(props.project, opts.logo.file, text)
  else reply(props.project, text)
  nextTick(() => toBottom())
}

// "Add a new logo": a chip (or the header's logo menu) that asks for a file.
const logoPicker = ref(null)
function onChip(c) {
  if (c === 'Add a new logo') logoPicker.value?.click()
  else if (c === 'Open Advertisements') tab.value = 'ads'
  else ask(c)
}
function onLogoFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (f) ask('', { logo: { file: f } })
}
function md(t) {
  return t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

// ---- Drafts: the chat split into segments, one per draft.
const draftOf = (m) => (m.draft ? props.project.drafts[m.draft - 1] : null)
const segments = computed(() => {
  const out = []
  for (const m of props.project.messages) {
    const n = m.draft || 0
    if (!out.length || out.at(-1).n !== n) out.push({ n, draft: n ? props.project.drafts[n - 1] : null, messages: [] })
    out.at(-1).messages.push(m)
  }
  return out
})
const setupLine = computed(() => stagesFor(props.project).filter((s) => !['pages', 'files'].includes(s.id)).map((s) => ({ brand: 'Brand kit', logo: 'logo', banners: 'first banners', ads: 'ads' })[s.id]).join(', ').replace(/, ([^,]*)$/, ' and $1').replace(/^./, (c) => c.toUpperCase()))
const brandReady = computed(() => props.project.messages.some((m) => m.card?.type === 'brand'))
function time(t) { return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }

// ---- Stepper
function hasCard(type) { return props.project.messages.some((m) => m.card?.type === type) }
const stages = computed(() => {
  const all = stagesFor(props.project)
  return all.map((st, i) => ({
    ...st,
    state: i < props.project.stage || (i === props.project.stage && i === all.length - 1 && hasCard(st.card)) ? 'done' : i === props.project.stage ? 'current' : 'next',
  }))
})
function jumpTo(st) {
  if (route.tab !== 'chat') tab.value = 'chat'
  const m = [...props.project.messages].reverse().find((x) => x.card?.type === st.card)
  if (m) nextTick(() => scroller.value?.querySelector(`[data-mid="${m.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
const lastAgent = computed(() => [...props.project.messages].reverse().find((m) => m.role === 'agent')?.id)
</script>

<template>
  <div class="th">
    <ProjectHeader v-model:tab="tab" :project="project" :stages="stages" :brand-ready="brandReady" @jump="jumpTo" @close="go({ view: 'home' })" @upload="(f) => ask('', { logo: { file: f } })" />
    <input ref="logoPicker" type="file" accept="image/*" hidden aria-label="Choose a logo file" @change="onLogoFile" />

    <div class="th__body">
      <div v-show="tab === 'chat'" ref="scroller" class="th__scroll" @scroll.passive="onScroll" @wheel.passive="onWheel" @touchmove.passive="onWheel">
        <div class="th__list">
          <section v-for="seg in segments" :key="seg.n" class="th__seg" :data-seg="seg.draft ? `draft-${seg.n}` : 'setup'" :aria-label="seg.draft ? `Draft ${seg.n}` : 'Setup'">
            <header class="th__seghead">
              <template v-if="seg.draft">
                <button type="button" class="th__segthumb ds-hover" :aria-label="`Open draft ${seg.n}`" @click="viewing = seg.draft">
                  <DraftStack :views="[draftView(project, seg.draft)]" small />
                </button>
                <span class="th__segtext">
                  <b>Draft {{ seg.n }} · {{ seg.draft.label }}</b>
                  <small>{{ time(seg.draft.at) }}<template v-if="!seg.draft.snap"> · Current</template></small>
                </span>
                <button type="button" class="th__link" :aria-label="`Copy a link to draft ${seg.n}`" title="Copy a link to this draft" @click="copyLink(`draft-${seg.n}`)"><Icon name="link" :size="16" /></button>
                <button type="button" class="cs-btn-ghost" @click="viewing = seg.draft">View</button>
              </template>
              <template v-else>
                <span class="th__segtext"><b>Setup</b><small>{{ setupLine }}</small></span>
                <button type="button" class="th__link" aria-label="Copy a link to the setup" title="Copy a link to the setup" @click="copyLink('setup')"><Icon name="link" :size="16" /></button>
              </template>
            </header>
            <ol class="th__msgs">
              <li v-for="m in seg.messages" :key="m.id" :data-mid="m.id" :class="`th__msg th__msg--${m.role}`">
                <div v-if="m.role === 'user'" class="th__pill">
                  <figure v-if="m.image" class="th__upload"><img :src="m.image" :alt="m.fileName" /><figcaption>{{ m.fileName }}</figcaption></figure>
                  <figure v-else-if="m.adRef && adOf(m.adRef)" class="th__adref">
                    <AdPreview v-if="m.adRef.size" :ad="adOf(m.adRef)" :size="m.adRef.size" :max-width="220" :max-height="90" />
                    <figcaption>{{ adOf(m.adRef).name }} · {{ m.adRef.every ? 'every size' : m.adRef.size.replace('x', '×') }}</figcaption>
                  </figure>
                  <p v-if="m.text">{{ m.text }}</p>
                </div>
                <template v-else>
                  <AgentStatus :message="m" />
                  <p v-if="m.text" class="th__text" v-html="md(m.text)" />
                  <component :is="CARDS[m.card.type]" v-if="m.card" :project="project" :card="m.card" :view="draftOf(m) ? draftView(project, draftOf(m)) : null" @ask="ask" />
                  <div v-if="(m.next && m.id === lastAgent) || m.chips?.length" class="th__chips" :class="{ 'has-foot': m.card?.type === 'banners' }">
                    <button v-if="m.next && m.id === lastAgent" type="button" class="cs-btn-dark th__next" :disabled="state.working" @click="ask(m.next.say)">
                      {{ m.next.label }} <Icon name="arrow" :size="18" />
                    </button>
                    <button v-for="c in m.chips" :key="c" type="button" class="cs-chip" :disabled="state.working" @click="onChip(c)"><Icon v-if="c === 'Add a new logo'" name="clip" :size="16" />{{ c }}</button>
                  </div>
                </template>
              </li>
            </ol>
          </section>
        </div>
      </div>

      <ConceptsTab v-if="tab === 'concepts'" :project="project" @open="viewing = $event" @chat="tab = 'chat'" />
      <AdsTab v-if="tab === 'ads'" :project="project" />

      <div v-show="tab === 'chat'" class="th__dock">
        <button v-if="!atBottom" type="button" class="th__jump" aria-label="Jump to the latest" @click="toBottom()"><Icon name="down" :size="18" /></button>
        <Composer ref="composer" :working="state.working" :placeholder="ctxAd ? `What should change in ${ctxAd.name}?` : 'Ask for changes…'" @send="ask" @stop="stopWorking">
          <template v-if="ctxAd" #context>
            <div class="th__ctx">
              <span class="th__ctxthumb"><AdPreview v-if="ctxThumb" :ad="ctxAd" :size="ctxThumb" :max-width="112" :max-height="48" /><img v-else-if="ctxAd.logo" :src="ctxAd.logo" alt="" /></span>
              <span class="th__ctxtext"><b>Editing {{ ctxAd.name }}<template v-if="chatContext.size"> · {{ sizeName(chatContext.size) }}</template></b><small>Attached as context: say what to change</small></span>
              <label v-if="chatContext.size" class="th__every"><input v-model="chatContext.every" type="checkbox" /> Every size</label>
              <button type="button" class="th__ctxx" aria-label="Stop editing this ad" @click="clearChatContext"><Icon name="x" :size="16" /></button>
            </div>
          </template>
        </Composer>
      </div>
    </div>

    <DraftViewer v-if="viewing" :project="project" :draft="viewing" @close="viewing = null" @go="viewing = $event" @restored="tab = 'chat'" />
  </div>
</template>

<style scoped>
.th { position: relative; display: grid; grid-template-rows: auto 1fr; grid-template-columns: minmax(0, 1fr); height: 100%; min-height: 0; }
.th__body { position: relative; min-height: 0; }
.th__scroll { height: 100%; overflow-y: auto; scroll-padding-top: 76px; background: var(--surface-2); }
.th__list { margin: 0 auto; padding: 0 28px 180px; width: min(940px, 100%); }
.th__seg + .th__seg { margin-top: 18px; }
.th__seghead { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 12px; margin: 0 -12px; padding: 10px 12px; background: color-mix(in srgb, var(--surface-2) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
.th__segthumb { width: 96px; flex: none; padding: 0; overflow: hidden; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-3); cursor: pointer; }
.th__segtext { flex: 1; min-width: 0; display: grid; }
.th__segtext b { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.th__segtext small { font-size: 12.5px; color: var(--ink-3); }
.th__link { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: var(--r); background: none; color: var(--ink-3); cursor: pointer; }
.th__link:hover { background: var(--surface-3); color: var(--ink); }
.th__msgs { list-style: none; margin: 0; padding: 24px 0 8px; display: grid; gap: 28px; }
.th__msg { display: grid; gap: 12px; justify-items: stretch; animation: rise 0.3s ease-out both; }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }
.th__msg--user { justify-items: end; }
.th__pill { margin: 0; max-width: 78%; padding: 10px 16px; border-radius: 8px 8px 2px 8px; background: var(--pill); color: var(--pill-ink); font-size: 16px; }
.th__pill p { margin: 0; }
.th__adref { display: grid; gap: 6px; margin: 2px 0 8px; }
.th__adref figcaption { font-size: 12px; opacity: 0.8; }
.th__ctx { display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 8px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); }
.th__ctxthumb { display: grid; place-items: center; width: 120px; height: 52px; flex: none; border-radius: 2px; background: var(--surface-3); overflow: hidden; }
.th__ctxthumb img { max-width: 40px; max-height: 40px; object-fit: contain; }
.th__ctxtext { flex: 1; min-width: 0; display: grid; }
.th__ctxtext b { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.th__ctxtext small { font-size: 12px; color: var(--ink-3); }
.th__every { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); white-space: nowrap; cursor: pointer; }
.th__ctxx { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border: 0; border-radius: 50%; background: none; color: var(--ink-3); cursor: pointer; }
.th__ctxx:hover { background: var(--surface-3); color: var(--ink); }
@media (max-width: 640px) { .th__ctxthumb { width: 72px; } }
.th__upload { display: grid; gap: 6px; margin: 2px 0 8px; }
.th__upload img { width: 180px; max-height: 140px; padding: 12px; border-radius: var(--r); background: #fff; object-fit: contain; }
.th__upload figcaption { font-size: 12px; opacity: 0.8; }
.th__text { margin: 0; font-size: 16px; color: var(--ink); }
.th__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.th__chips.has-foot { margin-top: 22px; }
.th__chips :disabled { opacity: 0.5; cursor: default; }
.th__next { min-height: 40px; }

.th__dock { position: absolute; left: 0; right: 0; bottom: 0; padding: 36px 28px 20px; background: linear-gradient(transparent, var(--surface-2) 45%); pointer-events: none; }
.th__dock > * { pointer-events: auto; width: min(860px, 100%); margin: 0 auto; }
.th__jump { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 40px !important; height: 40px; display: grid; place-items: center; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); box-shadow: var(--shadow); cursor: pointer; }
@media (max-width: 760px) { .th__list { padding: 0 16px 170px; } .th__dock { padding: 32px 12px 12px; } .th__segthumb { width: 64px; } }
</style>
