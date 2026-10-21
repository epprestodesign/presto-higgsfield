<script setup>
// SaveGate — inline prompt shown when a visitor tries to save or publish.
// Explains *why* an account is needed (permanence, sharing) and that their
// work is already kept on this device, then opens SignUpDialog. Once signed
// in it collapses to a quiet "Saved to your account" confirmation.
import { ref, computed } from 'vue'
import { useSessionStore } from '../../stores/session.js'
import { useProjectStore } from '../../stores/project.js'
import SignUpDialog from './SignUpDialog.vue'
import { relativeTime } from './time.js'

const props = defineProps({
  intent: { type: String, default: 'save' }, // 'save' | 'publish'
  dismissible: { type: Boolean, default: true },
  delayMs: { type: Number, default: 700 },
})
const emit = defineEmits(['success', 'dismiss'])

const session = useSessionStore()
const project = useProjectStore()
const open = ref(false)

const copy = computed(() =>
  props.intent === 'publish'
    ? {
        title: 'Sign in to publish your demo',
        text: 'Published demos get a shareable link, so we attach them to an account. It takes about 20 seconds.',
        cta: 'Create free account & publish',
        reason: 'Publish your demo',
      }
    : {
        title: 'Keep this booking page',
        text: "Your progress is saved on this device for now. Create a free account to keep it permanently and pick up from any computer.",
        cta: 'Create free account',
        reason: 'Save your booking page',
      },
)

const savedAgo = computed(() => relativeTime(project.lastSavedAt || project.project.updatedAt))

async function onSuccess(user) {
  await project.saveDraft()
  emit('success', user)
}
</script>

<template>
  <div v-if="session.isAuthenticated" class="sg sg--saved" role="status">
    <q-icon name="cloud_done" size="20px" aria-hidden="true" />
    <span><strong>Saved to your account</strong> · {{ session.user.email }}<template v-if="savedAgo"> · {{ savedAgo }}</template></span>
  </div>

  <section v-else class="sg" :aria-labelledby="`sg-title-${intent}`">
    <div class="sg__icon" aria-hidden="true">
      <q-icon :name="intent === 'publish' ? 'public' : 'bookmark_add'" size="22px" />
    </div>
    <div class="sg__copy">
      <h3 :id="`sg-title-${intent}`" class="bs-subtitle">{{ copy.title }}</h3>
      <p class="bs-body">{{ copy.text }}</p>
    </div>
    <div class="sg__actions">
      <q-btn unelevated no-caps class="bs-btn bs-btn--primary" :label="copy.cta" @click="open = true" />
      <q-btn v-if="dismissible" flat no-caps class="bs-btn sg__later" label="Not now" @click="emit('dismiss')" />
    </div>

    <sign-up-dialog v-model="open" :reason="copy.reason" :delay-ms="delayMs" @success="onSuccess" />
  </section>
</template>

<style scoped>
.sg {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: var(--bs-radius-lg);
  background: var(--bs-surface);
  border: 1px solid var(--bs-line);
  box-shadow: var(--bs-shadow-2);
  font-family: var(--bs-font);
}
.sg__icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--ds-palette-navy-50); color: var(--bs-brand); }
.sg__copy { display: grid; gap: 4px; min-width: 0; }
.sg__actions { display: flex; gap: 8px; align-items: center; }
.sg__later { color: var(--bs-ink-soft); }
.sg--saved {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: #ECFDF3; color: #146C3A; border-color: #BBF0CF; box-shadow: none;
  font-size: 0.875rem; grid-template-columns: none;
}
@media (max-width: 720px) {
  .sg { grid-template-columns: auto 1fr; }
  .sg__actions { grid-column: 1 / -1; flex-wrap: wrap; }
  .sg__actions .q-btn:first-child { flex: 1; }
}
</style>
