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
import BrandBar from './BrandBar.vue'
import ConceptsTab from './ConceptsTab.vue'
import DraftViewer from './DraftViewer.vue'
import DraftStack from './presto/DraftStack.vue'
import BrandCard from './cards/BrandCard.vue'
import LooksCard from './cards/LooksCard.vue'
import BannersCard from './cards/BannersCard.vue'
import PagesCard from './cards/PagesCard.vue'
import ExportCard from './cards/ExportCard.vue'
import { reply, state, stopWorking, stagesFor, draftView, toast } from '../mockAgent.js'
import { route, link } from '../router.js'

const props = defineProps({ project: { type: Object, required: true } })
const CARDS = { brand: BrandCard, looks: LooksCard, banners: BannersCard, pages: PagesCard, export: ExportCard }

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

function ask(text) {
  if (state.working) return
  if (route.tab !== 'chat') tab.value = 'chat'
  route.at = ''
  following.value = true
  atBottom.value = true
  reply(props.project, text)
  nextTick(() => toBottom())
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
    <header class="th__top">
      <div class="th__entity">
        <span class="th__logo"><img :src="project.brand.logo" alt="" /></span>
        <span><small>Project</small><b>{{ project.name }}</b></span>
      </div>
      <div class="th__tabs" role="tablist" aria-label="Project views">
        <button type="button" role="tab" :aria-selected="tab === 'chat'" :class="{ 'is-on': tab === 'chat' }" @click="tab = 'chat'"><Icon name="chat" :size="18" /> Chat</button>
        <button type="button" role="tab" :aria-selected="tab === 'concepts'" :class="{ 'is-on': tab === 'concepts' }" @click="tab = 'concepts'">
          <Icon name="layers" :size="18" /> Concepts <span class="th__count">{{ project.drafts.length }}</span>
        </button>
      </div>
      <ol class="th__steps" aria-label="Steps">
        <li v-for="(st, i) in stages" :key="st.id" :class="`is-${st.state}`">
          <button type="button" :disabled="st.state === 'next'" :aria-current="st.state === 'current' ? 'step' : undefined" @click="jumpTo(st)">
            <span class="th__num"><Icon v-if="st.state === 'done'" name="check" :size="14" /><template v-else>{{ i + 1 }}</template></span>
            <span class="th__lbl">{{ st.label }}</span>
          </button>
        </li>
      </ol>
    </header>

    <BrandBar :project="project" :ready="brandReady" />

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
                <span class="th__segtext"><b>Setup</b><small>Brand kit, logo and first banners</small></span>
                <button type="button" class="th__link" aria-label="Copy a link to the setup" title="Copy a link to the setup" @click="copyLink('setup')"><Icon name="link" :size="16" /></button>
              </template>
            </header>
            <ol class="th__msgs">
              <li v-for="m in seg.messages" :key="m.id" :data-mid="m.id" :class="`th__msg th__msg--${m.role}`">
                <p v-if="m.role === 'user'" class="th__pill">{{ m.text }}</p>
                <template v-else>
                  <AgentStatus :message="m" />
                  <p v-if="m.text" class="th__text" v-html="md(m.text)" />
                  <component :is="CARDS[m.card.type]" v-if="m.card" :project="project" :card="m.card" :view="draftOf(m) ? draftView(project, draftOf(m)) : null" @ask="ask" />
                  <div v-if="(m.next && m.id === lastAgent) || m.chips?.length" class="th__chips" :class="{ 'has-foot': m.card?.type === 'banners' }">
                    <button v-if="m.next && m.id === lastAgent" type="button" class="cs-btn-dark th__next" :disabled="state.working" @click="ask(m.next.say)">
                      {{ m.next.label }} <Icon name="arrow" :size="18" />
                    </button>
                    <button v-for="c in m.chips" :key="c" type="button" class="cs-chip" :disabled="state.working" @click="ask(c)">{{ c }}</button>
                  </div>
                </template>
              </li>
            </ol>
          </section>
        </div>
      </div>

      <ConceptsTab v-if="tab === 'concepts'" :project="project" @open="viewing = $event" @chat="tab = 'chat'" />

      <div v-show="tab === 'chat'" class="th__dock">
        <button v-if="!atBottom" type="button" class="th__jump" aria-label="Jump to the latest" @click="toBottom()"><Icon name="down" :size="18" /></button>
        <Composer :working="state.working" placeholder="Ask for changes…" @send="ask" @stop="stopWorking" />
      </div>
    </div>

    <DraftViewer v-if="viewing" :project="project" :draft="viewing" @close="viewing = null" @go="viewing = $event" @restored="tab = 'chat'" />
  </div>
</template>

<style scoped>
.th { position: relative; display: grid; grid-template-rows: auto auto 1fr; height: 100%; min-height: 0; }
.th__top { display: flex; align-items: center; gap: 20px; padding: 10px 24px; border-bottom: 1px solid var(--line); background: var(--surface); z-index: 3; }
.th__entity { min-width: 0; display: flex; align-items: center; gap: 10px; }
.th__entity small { display: block; font-size: 12px; color: var(--ink-3); line-height: 1.2; }
.th__entity b { display: block; font-weight: 700; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.th__logo { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: var(--r); background: #fff; border: 1px solid var(--line); }
.th__logo img { max-width: 30px; max-height: 30px; object-fit: contain; }

.th__tabs { display: flex; gap: 2px; padding: 2px; border: 1px solid var(--line-bold); border-radius: var(--r); }
.th__tabs button { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 4px 12px; border: 0; border-radius: 2px; background: none; color: var(--ink-2); font-weight: 700; font-size: 14px; cursor: pointer; }
.th__tabs button:hover { color: var(--ink); }
.th__tabs button.is-on { background: var(--pill); color: var(--pill-ink); }
.th__count { min-width: 20px; padding: 0 6px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-size: 12px; line-height: 18px; text-align: center; }

/* Presto stepper */
.th__steps { display: flex; align-items: center; gap: 4px; margin: 0 0 0 auto; padding: 0; list-style: none; }
.th__steps li { display: flex; align-items: center; gap: 4px; }
.th__steps li + li::before { content: ''; width: 14px; height: 2px; border-radius: 1px; background: var(--line-bold); }
.th__steps li.is-done + li::before { background: var(--pill); }
.th__steps button { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 4px 8px 4px 4px; border: 0; border-radius: var(--r); background: none; font-size: 13px; font-weight: 700; color: var(--ink-3); cursor: pointer; }
.th__steps button:hover:not(:disabled) { background: var(--surface-3); }
.th__steps button:disabled { cursor: default; }
.th__num { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--line-bold); font-size: 12px; }
.is-current .th__num { border-color: var(--pill); color: var(--pill); }
.is-current button, .is-done button { color: var(--ink); }
.is-done .th__num { border-color: var(--pill); background: var(--pill); color: var(--pill-ink); }

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
.th__text { margin: 0; font-size: 16px; color: var(--ink); }
.th__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.th__chips.has-foot { margin-top: 22px; }
.th__chips :disabled { opacity: 0.5; cursor: default; }
.th__next { min-height: 40px; }

.th__dock { position: absolute; left: 0; right: 0; bottom: 0; padding: 36px 28px 20px; background: linear-gradient(transparent, var(--surface-2) 45%); pointer-events: none; }
.th__dock > * { pointer-events: auto; width: min(860px, 100%); margin: 0 auto; }
.th__jump { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 40px !important; height: 40px; display: grid; place-items: center; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); box-shadow: var(--shadow); cursor: pointer; }
@media (max-width: 1180px) { .th__lbl { display: none; } .th__steps li.is-current .th__lbl { display: inline; } }
@media (max-width: 760px) { .th__top { flex-wrap: wrap; padding: 10px 14px; gap: 8px 12px; } .th__steps { margin: 0; width: 100%; } .th__list { padding: 0 16px 170px; } .th__dock { padding: 32px 12px 12px; } .th__segthumb { width: 64px; } }
</style>
