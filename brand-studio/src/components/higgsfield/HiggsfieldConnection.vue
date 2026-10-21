<script setup>
// HiggsfieldConnection — live setup checklist for the Higgsfield API:
//   1. the local dev proxy is running (Storybook / prototype dev server),
//   2. an API key is in .env (shown masked),
//   3. Higgsfield accepts the key (verified for free; no generation is made).
import { onMounted, ref, computed } from 'vue'
import { hf } from '../../providers/higgsfield/client.js'

const props = defineProps({
  compact: { type: Boolean, default: false },
  // Story/testing hook: force a state instead of asking the dev server.
  simulate: { type: String, default: '' }, // '' | 'static' | 'no-key' | 'ready' | 'verified' | 'rejected'
})
const emit = defineEmits(['ready'])

const health = ref(null)
const verify = ref(null) // { ok, status, detail }
const checking = ref(false)
const verifying = ref(false)

const SIM = {
  static: { proxy: false, configured: false },
  'no-key': { proxy: true, configured: false },
  ready: { proxy: true, configured: true, keyId: 'hf_1…9c2e' },
  verified: { proxy: true, configured: true, keyId: 'hf_1…9c2e' },
  rejected: { proxy: true, configured: true, keyId: 'hf_1…9c2e' },
}

async function check() {
  checking.value = true
  verify.value = props.simulate === 'verified' ? { ok: true } : props.simulate === 'rejected' ? { ok: false, detail: 'Invalid API key' } : null
  health.value = props.simulate ? SIM[props.simulate] : await hf.health()
  checking.value = false
}
async function runVerify() {
  if (props.simulate) return
  verifying.value = true
  try { verify.value = await hf.verify() } catch (e) { verify.value = { ok: false, detail: e.message } }
  verifying.value = false
  if (verify.value?.ok) emit('ready')
}
onMounted(check)

const steps = computed(() => {
  const h = health.value || {}
  return [
    { id: 'proxy', label: 'Local dev server proxy', pass: !!h.proxy, detail: h.proxy ? 'Running: requests go through this machine’s Storybook / prototype dev server.' : 'Not available here. Live generation only works in your local Storybook (pnpm storybook) or prototype (pnpm prototype), never on GitHub Pages.' },
    { id: 'key', label: 'API key in .env', pass: !!h.configured, detail: h.configured ? `Found key ${h.keyId}. The secret stays on the server.` : 'Add HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_KEY_SECRET to the .env file in the repo root.' },
    { id: 'verify', label: 'Higgsfield accepts the key', pass: !!verify.value?.ok, fail: verify.value && !verify.value.ok, detail: verify.value?.ok ? 'Verified. You can generate.' : verify.value ? `Rejected: ${verify.value.detail}. Check the key ID and secret, then restart Storybook.` : 'Free check: no image is generated and no credits are used.' },
  ]
})
const allGood = computed(() => steps.value.every((s) => s.pass))
</script>

<template>
  <section class="hfc bs-card" :class="{ 'hfc--compact': compact }" aria-labelledby="hfc-title" aria-live="polite">
    <header class="hfc__head">
      <div>
        <p class="bs-eyebrow">Higgsfield API</p>
        <h2 id="hfc-title" class="bs-subtitle">{{ allGood ? 'Connected' : 'Connection check' }}</h2>
      </div>
      <q-btn flat dense no-caps icon="refresh" label="Re-check" class="bs-btn" :loading="checking" @click="check" />
    </header>

    <ol class="hfc__steps">
      <li v-for="(s, i) in steps" :key="s.id" class="hfc__step" :class="{ 'is-pass': s.pass, 'is-fail': s.fail }">
        <span class="hfc__mark" aria-hidden="true">
          <q-icon v-if="s.pass" name="check" size="16px" />
          <q-icon v-else-if="s.fail" name="close" size="16px" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <div class="hfc__body">
          <p class="hfc__label">{{ s.label }} <span class="bs-sr-only">{{ s.pass ? '(done)' : '(not done)' }}</span></p>
          <p v-if="!compact || !s.pass" class="bs-caption">{{ s.detail }}</p>
        </div>
        <q-btn
          v-if="s.id === 'verify' && health?.configured && !s.pass"
          unelevated no-caps class="bs-btn bs-btn--primary" :loading="verifying" label="Verify key" @click="runVerify"
        />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.hfc { padding: 18px 20px; font-family: var(--bs-font); }
.hfc--compact { padding: 14px 16px; }
.hfc__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.hfc__head .bs-subtitle { margin-top: 6px; }
.hfc__steps { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 12px; }
.hfc__step { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; gap: 12px; align-items: start; }
.hfc__mark { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--bs-surface-2); border: 1px solid var(--bs-line); font: 700 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
.is-pass .hfc__mark { background: var(--ds-palette-green-50, #F0FDF4); border-color: var(--bs-success); color: var(--bs-success); }
.is-fail .hfc__mark { background: var(--ds-palette-red-50, #FEF2F2); border-color: var(--bs-danger); color: var(--bs-danger); }
.hfc__label { margin: 3px 0 2px; font: 700 0.9375rem var(--bs-font); color: var(--bs-ink); }
@media (max-width: 600px) { .hfc__step { grid-template-columns: 28px minmax(0, 1fr); } .hfc__step .q-btn { grid-column: 2; justify-self: start; } }
</style>
