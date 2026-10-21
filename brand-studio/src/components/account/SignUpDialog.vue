<script setup>
// SignUpDialog — the one-step account gate. Appears only when a visitor tries
// to do something permanent (save, publish). Short by design: Google or
// email + password, nothing else required. The visitor's design is shown on
// the left so it's obvious nothing they've made will be lost — the session
// store claims the anonymous draft on success (project.ownerId = user.id).
//
// Phase 1 uses the mock useSessionStore; Phase 2 swaps in Supabase Auth with
// the same surface (signUp / signIn / signInWithGoogle).
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useSessionStore } from '../../stores/session.js'
import { useProjectStore } from '../../stores/project.js'
import { formatDateRange } from '../../models/event.js'
import BrandHero from '../brand/BrandHero.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Why we're asking — shown as the dialog title.
  reason: { type: String, default: 'Save your booking page' },
  // Supporting line under the title.
  detail: { type: String, default: 'Create a free account to keep this design, come back to it anytime, and share a demo link.' },
  initialMode: { type: String, default: 'signup' }, // 'signup' | 'signin'
  // Delay for the mock auth calls (stories / tests).
  delayMs: { type: Number, default: 700 },
})
const emit = defineEmits(['update:modelValue', 'success'])

const $q = useQuasar()
const session = useSessionStore()
const project = useProjectStore()

const mode = ref(props.initialMode)
const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitted = ref(false)
const done = ref(false)
const emailInput = ref(null)

watch(() => props.modelValue, (open) => {
  if (!open) return
  mode.value = props.initialMode
  submitted.value = false
  done.value = false
  session.error = ''
  if (!email.value && project.project.organizer.email) email.value = project.project.organizer.email
  if (!name.value && project.project.organizer.firstName) name.value = `${project.project.organizer.firstName} ${project.project.organizer.lastName}`.trim()
}, { immediate: true })

const isSignup = computed(() => mode.value === 'signup')
const emailError = computed(() => {
  if (!submitted.value) return ''
  if (!email.value.trim()) return 'Enter your email address.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return 'Enter a valid email address.'
  return ''
})
const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!password.value) return 'Enter a password.'
  if (isSignup.value && password.value.length < 8) return 'Use at least 8 characters.'
  return ''
})

// Password strength hint (signup only) — guidance, not a gate beyond 8 chars.
const strength = computed(() => {
  const p = password.value
  if (!p) return null
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/\d/.test(p) && /[a-z]/i.test(p)) score++
  if (/[^a-z0-9]/i.test(p)) score++
  const levels = [
    { label: 'Too short', tone: 'weak', pct: 15 },
    { label: 'Okay', tone: 'fair', pct: 40 },
    { label: 'Good', tone: 'good', pct: 70 },
    { label: 'Strong', tone: 'strong', pct: 100 },
    { label: 'Strong', tone: 'strong', pct: 100 },
  ]
  return p.length < 8 ? levels[0] : levels[Math.max(1, score)]
})

// Thumbnail of the visitor's in-progress design (reassurance panel).
const pj = computed(() => project.project)
const concept = computed(() => project.selectedConcept)
const heroDates = computed(() => formatDateRange(pj.value.event.startDate, pj.value.event.endDate))

const close = () => emit('update:modelValue', false)

async function finish() {
  done.value = true
  emit('success', session.user)
  await new Promise((r) => setTimeout(r, Math.min(900, props.delayMs + 200)))
  close()
}

async function submit() {
  submitted.value = true
  session.error = ''
  if (emailError.value || passwordError.value) {
    await nextTick()
    // Focus the first invalid field. Use the native input: QInput.focus() is
    // queued by Quasar's focus manager and can fire late inside a dialog.
    const first = emailError.value ? emailInput.value : null
    first?.getNativeElement?.()?.focus()
    return
  }
  const creds = { email: email.value.trim(), password: password.value, name: name.value.trim() }
  const ok = isSignup.value
    ? await session.signUp(creds, { delayMs: props.delayMs })
    : await session.signIn(creds, { delayMs: props.delayMs })
  if (ok) finish()
}

async function google() {
  session.error = ''
  const ok = await session.signInWithGoogle({ delayMs: props.delayMs })
  if (ok) finish()
}

function switchMode() {
  mode.value = isSignup.value ? 'signin' : 'signup'
  submitted.value = false
  session.error = ''
}
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    :maximized="$q.screen.lt.sm"
    transition-show="fade"
    transition-hide="fade"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="sud" role="document" aria-labelledby="sud-title">
      <!-- Reassurance panel: your design, already safe -->
      <aside class="sud__aside" aria-label="Your design so far">
        <div class="sud__thumb">
          <brand-hero
            :concept="concept"
            :brand-kit="pj.brandKit"
            :headline="pj.pages.landing.hero.headline || pj.event.name || 'Your booking page'"
            :dates="heroDates"
            size="card"
            :heading-level="3"
          />
        </div>
        <div class="sud__keep">
          <q-icon name="cloud_done" size="22px" class="sud__keep-icon" aria-hidden="true" />
          <div>
            <p class="sud__keep-title">Your design is saved</p>
            <p class="sud__keep-text">Nothing you've made will be lost. We'll attach this draft to your new account.</p>
          </div>
        </div>
        <ul class="sud__perks">
          <li><q-icon name="check" aria-hidden="true" /> Save and come back anytime</li>
          <li><q-icon name="check" aria-hidden="true" /> Publish a shareable demo link</li>
          <li><q-icon name="check" aria-hidden="true" /> Free — no credit card</li>
        </ul>
      </aside>

      <!-- Form -->
      <div class="sud__main">
        <q-btn flat round dense icon="close" class="sud__close" aria-label="Close" @click="close" />

        <!-- Success -->
        <div v-if="done" class="sud__done" role="status" aria-live="polite">
          <div class="sud__done-mark"><q-icon name="check" size="34px" /></div>
          <h2 class="bs-title">You're in{{ session.user?.name ? `, ${session.user.name.split(' ')[0]}` : '' }}</h2>
          <p class="bs-body">Your booking page is saved to your account.</p>
        </div>

        <template v-else>
          <p class="bs-eyebrow sud__eyebrow">{{ isSignup ? 'Free account' : 'Welcome back' }}</p>
          <h2 id="sud-title" class="bs-display-2 sud__title">{{ isSignup ? reason : 'Sign in to continue' }}</h2>
          <p class="bs-body sud__detail">{{ isSignup ? detail : 'Sign in and we’ll attach this draft to your account.' }}</p>

          <q-btn
            unelevated no-caps
            class="bs-btn bs-btn--ghost bs-btn--lg sud__google"
            :loading="session.pending"
            :disable="session.pending"
            @click="google"
          >
            <svg class="sud__g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Continue with Google
          </q-btn>

          <div class="sud__or" role="separator"><span>or use email</span></div>

          <div v-if="session.error" class="sud__error" role="alert">
            <q-icon name="error_outline" size="20px" aria-hidden="true" />
            <span>{{ session.error }}</span>
          </div>

          <form class="sud__form" novalidate @submit.prevent="submit">
            <q-input
              v-if="isSignup"
              v-model="name"
              outlined
              label="Your name (optional)"
              autocomplete="name"
              class="sud__field"
            />
            <q-input
              ref="emailInput"
              v-model="email"
              outlined
              type="email"
              label="Work email"
              autocomplete="email"
              :error="!!emailError"
              :error-message="emailError"
              class="sud__field"
            />
            <q-input
              v-model="password"
              outlined
              :type="showPassword ? 'text' : 'password'"
              :label="isSignup ? 'Create a password' : 'Password'"
              :autocomplete="isSignup ? 'new-password' : 'current-password'"
              :error="!!passwordError"
              :error-message="passwordError"
              :hint="isSignup && !strength ? 'At least 8 characters' : undefined"
              class="sud__field"
            >
              <template #append>
                <q-btn
                  flat round dense
                  :icon="showPassword ? 'visibility_off' : 'visibility'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <div v-if="isSignup && strength" class="sud__strength" aria-live="polite">
              <div class="sud__meter" aria-hidden="true">
                <span :class="`sud__meter-fill--${strength.tone}`" :style="{ width: strength.pct + '%' }" />
              </div>
              <span class="sud__strength-label">Password strength: <strong>{{ strength.label }}</strong></span>
            </div>

            <q-btn
              type="submit"
              unelevated no-caps
              class="bs-btn bs-btn--primary bs-btn--lg sud__submit"
              :loading="session.pending"
              :label="isSignup ? 'Create account' : 'Sign in'"
            />
          </form>

          <p class="bs-caption sud__switch">
            {{ isSignup ? 'Already have an account?' : 'New to Brand Studio?' }}
            <button type="button" class="sud__link bs-focusable" @click="switchMode">
              {{ isSignup ? 'Sign in' : 'Create a free account' }}
            </button>
          </p>
          <p class="bs-caption sud__legal">
            By continuing you agree to EventPipe's <a href="#" class="sud__link">Terms</a> and
            <a href="#" class="sud__link">Privacy Policy</a>.
          </p>
        </template>
      </div>
    </div>
  </q-dialog>
</template>

<style scoped>
.sud {
  width: min(920px, 96vw);
  max-width: 920px !important;
  display: grid;
  grid-template-columns: 340px 1fr;
  background: var(--bs-surface);
  border-radius: var(--bs-radius-xl);
  overflow: hidden;
  box-shadow: var(--bs-shadow-3);
  font-family: var(--bs-font);
}
.sud__aside {
  background: linear-gradient(160deg, var(--ds-palette-navy-950) 0%, var(--ds-palette-navy-900) 100%);
  color: #fff;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.sud__thumb { border-radius: var(--bs-radius-md); overflow: hidden; box-shadow: 0 12px 32px rgb(0 0 0 / 0.35); transform: rotate(-1.5deg); }
.sud__keep { display: flex; gap: 12px; align-items: flex-start; }
.sud__keep-icon { color: #7CE3A8; flex: none; margin-top: 1px; }
.sud__keep-title { margin: 0; font-weight: 700; font-size: 1.0625rem; }
.sud__keep-text { margin: 4px 0 0; font-size: 0.9375rem; line-height: 1.45; color: rgb(255 255 255 / 0.82); }
.sud__perks { list-style: none; margin: auto 0 0; padding: 18px 0 0; border-top: 1px solid rgb(255 255 255 / 0.14); display: grid; gap: 10px; font-size: 0.9375rem; color: rgb(255 255 255 / 0.9); }
.sud__perks li { display: flex; gap: 8px; align-items: center; }
.sud__perks .q-icon { color: #7CE3A8; }

.sud__main { position: relative; padding: 40px 44px 32px; display: flex; flex-direction: column; }
.sud__close { position: absolute; top: 14px; right: 14px; color: var(--bs-ink-soft); }
.sud__eyebrow { color: var(--bs-ink-soft); }
.sud__title { margin-top: 10px; font-size: clamp(1.625rem, 3vw, 2.125rem); }
.sud__detail { margin-top: 10px; max-width: 46ch; }
.sud__google { margin-top: 26px; width: 100%; gap: 10px; }
.sud__google :deep(.q-btn__content) { gap: 10px; }
.sud__g { width: 20px; height: 20px; }
.sud__or { display: flex; align-items: center; gap: 12px; margin: 20px 0 14px; color: var(--bs-ink-soft); font-size: 0.8125rem; }
.sud__or::before, .sud__or::after { content: ''; flex: 1; height: 1px; background: var(--bs-line); }
.sud__error { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; margin-bottom: 12px; border-radius: var(--bs-radius-sm); background: var(--ds-color-background-danger); color: var(--ds-color-text-danger); font-size: 0.875rem; line-height: 1.4; }
.sud__form { display: flex; flex-direction: column; gap: 4px; }
.sud__field :deep(.q-field__control) { border-radius: var(--bs-radius-sm); }
.sud__strength { display: flex; align-items: center; gap: 10px; margin: -2px 0 8px; }
.sud__meter { flex: 1; height: 6px; border-radius: 99px; background: var(--ds-palette-slate-100); overflow: hidden; }
.sud__meter span { display: block; height: 100%; border-radius: inherit; transition: width var(--ds-duration-base) var(--ds-ease-standard); }
.sud__meter-fill--weak { background: var(--bs-danger); }
.sud__meter-fill--fair { background: var(--bs-warning); }
.sud__meter-fill--good { background: #22A06B; }
.sud__meter-fill--strong { background: var(--bs-success); }
.sud__strength-label { font-size: 0.8125rem; color: var(--bs-ink-soft); white-space: nowrap; }
.sud__submit { margin-top: 10px; width: 100%; }
.sud__switch { margin-top: 18px; text-align: center; }
.sud__legal { margin-top: 6px; text-align: center; color: var(--bs-ink-soft); }
.sud__link { background: none; border: 0; padding: 2px 2px; font: inherit; font-weight: 700; color: var(--bs-brand); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; border-radius: 4px; }
.sud__legal .sud__link { font-weight: 400; color: inherit; }

.sud__done { margin: auto; text-align: center; display: grid; justify-items: center; gap: 10px; padding: 40px 0; }
.sud__done-mark { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; background: #ECFDF3; color: var(--bs-success); animation: sud-pop var(--ds-duration-slow) var(--ds-ease-emphasized); }
@keyframes sud-pop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }

@media (max-width: 760px) {
  .sud { grid-template-columns: 1fr; width: 100%; border-radius: 0; min-height: 100%; }
  .sud__aside { padding: 18px 20px; gap: 14px; flex-direction: row; align-items: center; }
  .sud__thumb { display: none; }
  .sud__aside { padding-right: 56px; }
  .sud__perks { display: none; }
  .sud__keep-text { font-size: 0.8125rem; }
  .sud__main { padding: 28px 20px 24px; }
  .sud__close { color: #fff; top: 12px; right: 12px; position: fixed; }
}
@media (prefers-reduced-motion: reduce) {
  .sud__done-mark { animation: none; }
}
</style>
