<script setup>
// ProjectDashboard — "My booking pages". A portfolio of designs, not a data
// table: each project leads with its branded hero. Tabs filter by lifecycle
// (Draft → Ready to publish → Published demo).
//
// Phase 2: session.projects becomes a Supabase query
//   select * from projects where owner_id = auth.uid() order by updated_at desc
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSessionStore } from '../../stores/session.js'
import ProjectCard from './ProjectCard.vue'
import { initials } from './time.js'
import epLogo from '@lib/assets/eventpipe logos/eventpipe-logo.svg'

const props = defineProps({
  loading: { type: Boolean, default: false },
  initialTab: { type: String, default: 'all' },
})
const emit = defineEmits(['open', 'new', 'preview', 'sign-out'])

const $q = useQuasar()
const session = useSessionStore()
const tab = ref(props.initialTab)

const TABS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'draft', label: 'Drafts', match: (p) => p.status === 'draft' },
  { id: 'ready', label: 'Ready to publish', match: (p) => p.status === 'ready' },
  { id: 'published', label: 'Published demos', match: (p) => p.status === 'published' },
]
const counts = computed(() => Object.fromEntries(TABS.map((t) => [t.id, session.projects.filter(t.match).length])))
const visible = computed(() => {
  const t = TABS.find((x) => x.id === tab.value) || TABS[0]
  return [...session.projects].filter(t.match).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
})

const EMPTY = {
  all: { icon: 'auto_awesome', title: 'Create your first booking page', text: 'Add your event, drop in your logo and colors, and preview a branded hotel booking site in minutes.', cta: true },
  draft: { icon: 'edit_note', title: 'No drafts', text: 'Pages you’re still working on will show up here.' },
  ready: { icon: 'checklist', title: 'Nothing waiting to publish', text: 'Finish the publishing checklist on a draft and it will move here.' },
  published: { icon: 'public', title: 'No published demos yet', text: 'Publish a demo to get a shareable link you can send to your team or attendees.' },
}

function duplicate(id) {
  const copy = session.duplicateProject(id)
  if (copy) $q.notify({ message: 'Duplicated', caption: copy.event.name, icon: 'content_copy', color: 'dark', position: 'bottom', timeout: 2000 })
}
function signOut() {
  session.signOut()
  emit('sign-out')
}
</script>

<template>
  <div class="pd">
    <header class="pd__bar">
      <div class="pd__brand">
        <img :src="epLogo" alt="EventPipe" class="pd__logo" />
        <span class="pd__product">Brand Studio</span>
      </div>
      <q-btn v-if="session.user" flat no-caps class="pd__user" :aria-label="`Account menu for ${session.user.name}`">
        <span class="pd__avatar" aria-hidden="true">{{ initials(session.user.name) }}</span>
        <span class="pd__user-name">{{ session.user.name }}</span>
        <q-icon name="expand_more" size="18px" aria-hidden="true" />
        <q-menu anchor="bottom right" self="top right">
          <q-list style="min-width: 240px">
            <q-item>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ session.user.name }}</q-item-label>
                <q-item-label caption>{{ session.user.email }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item v-close-popup clickable @click="signOut">
              <q-item-section avatar><q-icon name="logout" /></q-item-section>
              <q-item-section>Sign out</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </header>

    <main class="pd__main">
      <div class="pd__head">
        <div>
          <h1 class="bs-display-2">My booking pages</h1>
          <p class="bs-lead pd__sub">Drafts, demos ready to share, and everything you’ve published.</p>
        </div>
        <q-btn unelevated no-caps icon="add" label="New booking page" class="bs-btn bs-btn--primary bs-btn--lg" @click="emit('new')" />
      </div>

      <nav class="pd__tabs" aria-label="Filter booking pages">
        <div role="tablist" class="pd__tablist">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            role="tab"
            class="pd__tab bs-focusable"
            :class="{ 'pd__tab--on': tab === t.id }"
            :aria-selected="tab === t.id"
            :aria-controls="'pd-panel'"
            @click="tab = t.id"
          >
            {{ t.label }}
            <span class="pd__count" :aria-label="`${counts[t.id]} pages`">{{ loading ? '–' : counts[t.id] }}</span>
          </button>
        </div>
      </nav>

      <section id="pd-panel" role="tabpanel" class="pd__panel" :aria-busy="loading">
        <!-- Loading -->
        <div v-if="loading" class="pd__grid" aria-label="Loading booking pages">
          <div v-for="n in 6" :key="n" class="pd__skel">
            <q-skeleton class="pd__skel-thumb" animation="wave" square />
            <div class="pd__skel-body">
              <q-skeleton type="text" width="40%" animation="wave" />
              <q-skeleton type="text" width="80%" height="22px" animation="wave" />
              <q-skeleton type="text" width="60%" animation="wave" />
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="!visible.length" class="pd__empty">
          <div class="pd__empty-icon" aria-hidden="true"><q-icon :name="EMPTY[tab].icon" size="30px" /></div>
          <h2 class="bs-title">{{ EMPTY[tab].title }}</h2>
          <p class="bs-body pd__empty-text">{{ EMPTY[tab].text }}</p>
          <q-btn v-if="EMPTY[tab].cta" unelevated no-caps icon="add" label="Create your booking page" class="bs-btn bs-btn--primary" @click="emit('new')" />
        </div>

        <!-- Grid -->
        <div v-else class="pd__grid">
          <button v-if="tab === 'all'" type="button" class="pd__new bs-focusable" @click="emit('new')">
            <span class="pd__new-icon" aria-hidden="true"><q-icon name="add" size="26px" /></span>
            <span class="pd__new-title">New booking page</span>
            <span class="pd__new-text">Start from your event details</span>
          </button>
          <project-card
            v-for="p in visible"
            :key="p.id"
            :project="p"
            @open="emit('open', $event)"
            @preview="emit('preview', $event)"
            @duplicate="duplicate"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.pd { min-height: 100vh; background: var(--bs-canvas); font-family: var(--bs-font); color: var(--bs-ink); }
.pd__bar {
  position: sticky; top: 0; z-index: 10;
  height: var(--bs-toolbar-h);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  background: rgb(255 255 255 / 0.88);
  backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid var(--bs-line);
}
.pd__brand { display: flex; align-items: center; gap: 10px; }
.pd__logo { height: 24px; width: auto; }
.pd__product { padding-left: 10px; border-left: 1px solid var(--bs-line-strong); font-weight: 700; font-size: 0.9375rem; color: var(--bs-ink); }
.pd__user { border-radius: 999px; padding: 4px 8px 4px 4px; color: var(--bs-ink); }
.pd__user :deep(.q-btn__content) { gap: 8px; }
.pd__avatar { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--bs-brand); color: #fff; font-size: 0.8125rem; font-weight: 700; }
.pd__user-name { font-weight: 700; font-size: 0.9375rem; }

.pd__main { max-width: 1240px; margin: 0 auto; padding: 44px 24px 80px; }
.pd__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.pd__sub { margin-top: 8px; }

.pd__tabs { margin: 32px 0 24px; border-bottom: 1px solid var(--bs-line); overflow-x: auto; }
.pd__tablist { display: flex; gap: 4px; }
.pd__tab {
  position: relative; display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 14px; border: 0; background: none; cursor: pointer; white-space: nowrap;
  font: 700 0.9375rem/1 var(--bs-font); color: var(--bs-ink-soft); border-radius: var(--bs-radius-sm) var(--bs-radius-sm) 0 0;
}
.pd__tab:hover { color: var(--bs-ink); }
.pd__tab--on { color: var(--bs-ink); }
.pd__tab--on::after { content: ''; position: absolute; left: 10px; right: 10px; bottom: -1px; height: 3px; border-radius: 3px 3px 0 0; background: var(--bs-brand); }
.pd__count { min-width: 22px; padding: 3px 7px; border-radius: 999px; background: var(--ds-palette-slate-100); font-size: 0.75rem; color: var(--bs-ink-soft); text-align: center; }
.pd__tab--on .pd__count { background: var(--bs-brand); color: #fff; }

.pd__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px; }
.pd__new {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  min-height: 280px; border: 2px dashed var(--bs-line-strong); border-radius: var(--bs-radius-lg);
  background: transparent; cursor: pointer; font-family: inherit; color: var(--bs-ink);
  transition: border-color var(--ds-duration-fast), background var(--ds-duration-fast);
}
.pd__new:hover { border-color: var(--bs-brand); background: var(--bs-surface); }
.pd__new-icon { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: var(--bs-brand); color: #fff; margin-bottom: 6px; }
.pd__new-title { font-weight: 700; font-size: 1.0625rem; }
.pd__new-text { font-size: 0.875rem; color: var(--bs-ink-soft); }

.pd__skel { border: 1px solid var(--bs-line); border-radius: var(--bs-radius-lg); overflow: hidden; background: var(--bs-surface); }
.pd__skel-thumb { aspect-ratio: 16 / 7; height: auto; }
.pd__skel-body { padding: 16px; display: grid; gap: 6px; }

.pd__empty { text-align: center; padding: 72px 24px; display: grid; justify-items: center; gap: 10px; background: var(--bs-surface); border: 1px solid var(--bs-line); border-radius: var(--bs-radius-lg); }
.pd__empty-icon { width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; background: var(--ds-palette-navy-50); color: var(--bs-brand); margin-bottom: 6px; }
.pd__empty-text { max-width: 46ch; margin-bottom: 8px; }

@media (max-width: 600px) {
  .pd__bar { padding: 0 16px; }
  .pd__user-name { display: none; }
  .pd__main { padding: 28px 16px 56px; }
  .pd__head .q-btn { width: 100%; }
  .pd__grid { grid-template-columns: 1fr; gap: 16px; }
  .pd__new { min-height: 120px; flex-direction: row; gap: 12px; justify-content: flex-start; padding: 0 18px; }
  .pd__new-icon { margin: 0; width: 44px; height: 44px; }
  .pd__new-text { display: none; }
}
</style>
