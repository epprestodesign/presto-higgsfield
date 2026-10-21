<script setup>
// ProjectCard — one booking page in the dashboard. Leads with the design
// itself (a live BrandHero thumbnail), then the essentials and one primary
// action. Secondary actions live in an overflow menu.
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { formatDateRange, locationLabel } from '../../models/event.js'
import BrandHero from '../brand/BrandHero.vue'
import StatusChip from '../publish/StatusChip.vue'
import { relativeTime } from './time.js'

const props = defineProps({
  project: { type: Object, required: true },
})
const emit = defineEmits(['open', 'duplicate', 'preview'])
const $q = useQuasar()

const p = computed(() => props.project)
const concept = computed(() => p.value.concepts?.items?.find((c) => c.id === p.value.concepts.selectedId) || null)
const dates = computed(() => formatDateRange(p.value.event.startDate, p.value.event.endDate))
const where = computed(() => locationLabel(p.value.event))
const updated = computed(() => relativeTime(p.value.updatedAt))
const isPublished = computed(() => p.value.status === 'published')
const headline = computed(() => p.value.pages?.landing?.hero?.headline || p.value.event.name || 'Untitled booking page')

async function copyLink() {
  const url = p.value.publishing.publishedUrl
  try {
    await navigator.clipboard.writeText(url)
    $q.notify({ message: 'Share link copied', caption: url, icon: 'link', color: 'dark', position: 'bottom', timeout: 2200 })
  } catch {
    $q.notify({ message: 'Copy this link', caption: url, icon: 'link', color: 'dark', position: 'bottom', timeout: 4000 })
  }
}
</script>

<template>
  <article class="pc" :aria-labelledby="`pc-${p.id}`">
    <button type="button" class="pc__thumb bs-focusable" :aria-label="`Continue editing ${p.event.name}`" @click="emit('open', p.id)">
      <brand-hero
        :concept="concept"
        :brand-kit="p.brandKit"
        :headline="headline"
        :dates="dates"
        size="card"
        :heading-level="3"
        aria-hidden="true"
      />
      <span class="pc__thumb-hover" aria-hidden="true"><q-icon name="edit" size="18px" /> Continue editing</span>
    </button>

    <div class="pc__body">
      <div class="pc__top">
        <status-chip :status="p.status" size="sm" />
        <q-btn flat round dense icon="more_horiz" class="pc__more" :aria-label="`More actions for ${p.event.name}`">
          <q-menu anchor="bottom right" self="top right" class="pc__menu">
            <q-list dense style="min-width: 200px">
              <q-item v-close-popup clickable @click="emit('open', p.id)">
                <q-item-section avatar><q-icon name="edit" /></q-item-section>
                <q-item-section>Continue editing</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="emit('preview', p.id)">
                <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                <q-item-section>Open preview</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="emit('duplicate', p.id)">
                <q-item-section avatar><q-icon name="content_copy" /></q-item-section>
                <q-item-section>Duplicate</q-item-section>
              </q-item>
              <q-item v-if="isPublished" v-close-popup clickable @click="copyLink">
                <q-item-section avatar><q-icon name="link" /></q-item-section>
                <q-item-section>Copy share link</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
      <h3 :id="`pc-${p.id}`" class="pc__name">{{ p.event.name || 'Untitled booking page' }}</h3>
      <p class="pc__meta">{{ [dates, where].filter(Boolean).join(' · ') }}</p>

      <div class="pc__foot">
        <span class="pc__updated">Edited {{ updated }}</span>
        <q-btn
          v-if="isPublished"
          flat dense no-caps
          class="pc__share"
          icon="link"
          label="Copy link"
          :aria-label="`Copy share link for ${p.event.name}`"
          @click="copyLink"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.pc {
  display: flex; flex-direction: column;
  background: var(--bs-surface);
  border: 1px solid var(--bs-line);
  border-radius: var(--bs-radius-lg);
  overflow: hidden;
  box-shadow: var(--bs-shadow-1);
  transition: box-shadow var(--ds-duration-base) var(--ds-ease-standard), transform var(--ds-duration-base) var(--ds-ease-standard);
  font-family: var(--bs-font);
}
.pc:hover { box-shadow: var(--bs-shadow-2); transform: translateY(-2px); }
.pc__thumb { position: relative; display: block; padding: 0; border: 0; background: var(--bs-surface-2); cursor: pointer; text-align: left; border-bottom: 1px solid var(--bs-line); }
.pc__thumb :deep(.bh) { pointer-events: none; }
.pc__thumb-hover {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: rgb(3 10 38 / 0.55); color: #fff; font-weight: 700; font-size: 0.9375rem;
  opacity: 0; transition: opacity var(--ds-duration-fast) var(--ds-ease-standard);
}
.pc__thumb:hover .pc__thumb-hover, .pc__thumb:focus-visible .pc__thumb-hover { opacity: 1; }
.pc__body { padding: 14px 16px 14px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.pc__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.pc__more { color: var(--bs-ink-soft); margin-right: -6px; }
.pc__name { margin: 0; font: 700 1.0625rem/1.3 var(--bs-font); color: var(--bs-ink); letter-spacing: -0.01em; }
.pc__meta { margin: 0; font-size: 0.875rem; color: var(--bs-ink-soft); }
.pc__foot { margin-top: auto; padding-top: 12px; display: flex; align-items: center; justify-content: space-between; min-height: 36px; }
.pc__updated { font-size: 0.8125rem; color: var(--bs-ink-soft); }
.pc__share { color: var(--bs-brand); font-size: 0.8125rem; }
@media (prefers-reduced-motion: reduce) { .pc, .pc:hover { transform: none; transition: none; } }
</style>
