<script setup>
// AuthScreen — Banner Lab's log-in, over a blurred, static picture of a
// project (so it's clear what's behind the door). One card, several steps:
//
//   sign-in      Google · magic link · email + password
//                (→ sign-in-code when Clerk asks for a code on a new device)
//   magic-email  → magic-sent (check your email; prototype can "open" it)
//   sign-up      Google · name, email, password (live rules) → verify (6-digit code)
//   forgot       email → forgot-code → forgot-new → done
//   done         "You're in", then hands the user to the app
//
// All auth calls go through ../../auth/index.js: real Clerk when
// VITE_CLERK_PUBLISHABLE_KEY is set (outside Storybook), else the mock.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import * as auth from '../../auth/index.js'
import AuthField from './AuthField.vue'
import CodeInput from './CodeInput.vue'
import PasswordRules from './PasswordRules.vue'
import backdropJpg from '../../assets/auth/studio-backdrop.jpg'

const props = defineProps({
  initialStep: { type: String, default: 'sign-in' },
  initialEmail: { type: String, default: '' },
  initialPassword: { type: String, default: '' },
  initialFirstName: { type: String, default: '' },
  initialLastName: { type: String, default: '' },
  initialError: { type: Object, default: null }, // { field, message, code } — for stories
  backdrop: { type: String, default: backdropJpg },
  dismissible: { type: Boolean, default: false },
  mockDelay: { type: Number, default: 700 },
  autoContinue: { type: Boolean, default: true }, // leave the "You're in" step on its own
  initialDoneKind: { type: String, default: 'welcome' }, // 'welcome' | 'reset' (stories)
})
const emit = defineEmits(['signed-in', 'close'])
auth.setMockDelay(props.mockDelay)

const step = ref(props.initialStep)
const email = ref(props.initialEmail)
const password = ref(props.initialPassword)
const confirm = ref('')
const firstName = ref(props.initialFirstName)
const lastName = ref(props.initialLastName)
const keepLoggedIn = ref(true) // Clerk: session lifetime is set in the dashboard; this is the UI for it
const agree = ref(false)
const signOutOthers = ref(true)
const code = ref('')
const pending = ref(props.initialStep === 'verify' ? { firstName: firstName.value, lastName: lastName.value, email: email.value } : null)
const user = ref(props.initialStep === 'done' ? { name: [props.initialFirstName || 'Alex', props.initialLastName].filter(Boolean).join(' '), email: props.initialEmail } : null)
const doneKind = ref(props.initialDoneKind) // 'welcome' | 'reset'

const busy = ref('') // which action is running: 'google' | 'password' | 'magic' | 'signup' | 'code' | 'reset' | 'resend'
const error = ref(props.initialError || auth.takeRedirectError())
const isMock = auth.authMode() === 'mock'
const errFor = (field) => (error.value && (error.value.field === field || (!error.value.field && field === 'form')) ? error.value.message : '')
watch(step, (s, prev) => {
  error.value = null
  code.value = ''
  if (prev === 'magic-sent') auth.cancelMagicLink()
})

// Resend cooldown for code / link steps.
const cooldown = ref(0)
let timer = 0
function startCooldown(s = 30) {
  cooldown.value = s
  clearInterval(timer)
  timer = setInterval(() => { cooldown.value -= 1; if (cooldown.value <= 0) clearInterval(timer) }, 1000)
}
if (['magic-sent', 'verify', 'forgot-code', 'sign-in-code'].includes(props.initialStep)) startCooldown()
onBeforeUnmount(() => { clearInterval(timer); auth.cancelMagicLink() })
const cooldownLabel = computed(() => `0:${String(cooldown.value).padStart(2, '0')}`)

async function run(kind, fn) {
  if (busy.value) return
  busy.value = kind
  error.value = null
  try { await fn() } catch (e) { error.value = { field: e.field || null, message: e.message, code: e.code } } finally { busy.value = '' }
}

function finish(u, kind = 'welcome') {
  user.value = u
  doneKind.value = kind
  step.value = 'done'
}
let leaving = 0
watch(step, (s) => {
  clearTimeout(leaving)
  if (s === 'done' && props.autoContinue && user.value) leaving = setTimeout(() => emit('signed-in', user.value), 1400)
})
// Clerk can ask for an emailed code after a password log-in on a new device.
function signedIn(r, kind = 'welcome') {
  if (r?.needsCode) { step.value = 'sign-in-code'; startCooldown(); return }
  finish(r.user, kind)
}
const continueNow = () => { clearTimeout(leaving); emit('signed-in', user.value || { name: 'Alex Smith', email: email.value || 'alex@example.com' }) }

// ── Actions ───────────────────────────────────────────────────────────────
const google = () => run('google', async () => finish((await auth.signInWithGoogle()).user))
const logIn = () => run('password', async () => signedIn(await auth.signInWithPassword({ email: email.value, password: password.value })))
const sendLink = () => run('magic', async () => {
  await auth.sendMagicLink({ email: email.value })
  step.value = 'magic-sent'
  startCooldown()
  if (!isMock) waitForLink()
})
// Mock: the prototype button "opens" the link.
const openLink = () => run('magic', async () => finish((await auth.completeMagicLink({ email: email.value })).user))
// Clerk: wait (in the background) for the link to be opened in this browser.
function waitForLink() {
  auth.completeMagicLink({ email: email.value })
    .then((r) => { if (step.value === 'magic-sent') signedIn(r) })
    .catch((e) => { if (step.value === 'magic-sent') error.value = { field: e.field || null, message: e.message, code: e.code } })
}
const createAccount = () => run('signup', async () => {
  if (!agree.value) throw new auth.AuthError('Please agree to the Terms and Privacy Policy.', { field: 'agree' })
  const r = await auth.signUp({ firstName: firstName.value, lastName: lastName.value, email: email.value, password: password.value })
  pending.value = r.pending
  step.value = 'verify'
  startCooldown()
})
const verify = () => run('code', async () => {
  if (code.value.length < 6) throw new auth.AuthError('Enter all 6 digits.', { field: 'code' })
  finish((await auth.verifySignUpCode({ code: code.value, pending: pending.value || { email: email.value } })).user)
})
const sendReset = () => run('reset', async () => { await auth.sendResetCode({ email: email.value }); step.value = 'forgot-code'; startCooldown() })
const verifyReset = () => run('code', async () => {
  if (code.value.length < 6) throw new auth.AuthError('Enter all 6 digits.', { field: 'code' })
  await auth.verifyResetCode({ code: code.value })
  step.value = 'forgot-new'
  password.value = ''
})
const saveNewPassword = () => run('reset', async () => signedIn(await auth.resetPassword({ email: email.value, password: password.value, confirm: confirm.value, signOutOfOtherSessions: signOutOthers.value }), 'reset'))
const verifySignIn = () => run('code', async () => {
  if (code.value.length < 6) throw new auth.AuthError('Enter all 6 digits.', { field: 'code' })
  signedIn(await auth.verifySignInCode({ code: code.value, email: email.value }))
})
const resend = () => run('resend', async () => {
  await auth.resend()
  startCooldown()
  if (step.value === 'magic-sent' && !isMock) { error.value = null; waitForLink() }
})

const submitCode = () => (step.value === 'verify' ? verify() : step.value === 'sign-in-code' ? verifySignIn() : verifyReset())
const codeBack = computed(() => ({ verify: 'sign-up', 'forgot-code': 'forgot', 'sign-in-code': 'sign-in' })[step.value] || 'sign-in')
const codeTitle = computed(() => ({ verify: 'Verify your email', 'forgot-code': 'Enter your reset code', 'sign-in-code': 'Check your email' })[step.value] || '')

function go(s) {
  step.value = s
  nextTick(() => document.querySelector('.auth__card input:not([type=checkbox])')?.focus())
}
const firstLetter = computed(() => (user.value?.name || '?').split(' ')[0])
</script>

<template>
  <div class="auth">
    <img class="auth__bg" :src="backdrop" alt="" aria-hidden="true" />
    <div class="auth__scrim" aria-hidden="true" />

    <main class="auth__wrap">
      <section class="auth__card" :aria-labelledby="`auth-title-${step}`">
        <q-btn v-if="dismissible" round flat dense icon="close" class="auth__close" aria-label="Close" @click="emit('close')" />
        <p class="auth__brand">Banner Lab <span>BETA</span></p>
        <!-- Errors that aren't about one field (rate limits, a failed Google or magic-link return). -->
        <p v-if="errFor('form')" class="auth__err auth__formerr" role="alert"><q-icon name="error" size="16px" /> {{ errFor('form') }}</p>

        <Transition name="auth-step" mode="out-in">
          <!-- ── Log in ─────────────────────────────────────────────── -->
          <form v-if="step === 'sign-in'" key="sign-in" class="auth__step" novalidate @submit.prevent="logIn">
            <h1 id="auth-title-sign-in" class="auth__title">Log in</h1>
            <p class="auth__sub">Welcome back. Pick up your banners and logos where you left off.</p>
            <div class="auth__providers">
              <button type="button" class="auth__provider" :disabled="!!busy" @click="google">
                <q-spinner v-if="busy === 'google'" size="18px" />
                <svg v-else class="auth__g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
                {{ busy === 'google' ? 'Connecting to Google…' : 'Continue with Google' }}
              </button>
              <button type="button" class="auth__provider" :disabled="!!busy" @click="go('magic-email')">
                <q-icon name="auto_awesome" size="18px" class="auth__magic" /> Continue with magic link
              </button>
            </div>
            <p class="auth__or"><span>or</span></p>
            <AuthField v-model="email" label="Email" type="email" autocomplete="username" inputmode="email" placeholder="you@company.com" :error="errFor('email')">
              <p v-if="error?.code === 'form_identifier_not_found'" class="auth__hint">New here? <button type="button" class="auth__link" @click="go('sign-up')">Create an account with this email</button></p>
            </AuthField>
            <AuthField v-model="password" label="Password" type="password" autocomplete="current-password" :error="errFor('password')">
              <template #aside><button type="button" class="auth__link auth__link--small" @click="go('forgot')">Forgot password?</button></template>
            </AuthField>
            <q-checkbox v-model="keepLoggedIn" dense label="Keep me logged in" class="auth__check" />
            <button type="submit" class="auth__primary" :disabled="!!busy">
              <q-spinner v-if="busy === 'password'" size="18px" /> {{ busy === 'password' ? 'Logging in…' : 'Log in' }}
            </button>
            <p class="auth__foot">New to Banner Lab? <button type="button" class="auth__link" @click="go('sign-up')">Create an account</button></p>
          </form>

          <!-- ── Magic link: email ─────────────────────────────────── -->
          <form v-else-if="step === 'magic-email'" key="magic-email" class="auth__step" novalidate @submit.prevent="sendLink">
            <button type="button" class="auth__back" @click="go('sign-in')"><q-icon name="arrow_back" size="18px" /> All log-in options</button>
            <span class="auth__icon"><q-icon name="auto_awesome" size="26px" /></span>
            <h1 id="auth-title-magic-email" class="auth__title">Log in with a magic link</h1>
            <p class="auth__sub">We’ll email you a link that logs you straight in. No password needed.</p>
            <AuthField v-model="email" label="Email" type="email" autocomplete="username" inputmode="email" placeholder="you@company.com" :error="errFor('email')" autofocus />
            <button type="submit" class="auth__primary" :disabled="!!busy">
              <q-spinner v-if="busy === 'magic'" size="18px" /> {{ busy === 'magic' ? 'Sending…' : 'Email me a link' }}
            </button>
            <p class="auth__foot">No account yet? <button type="button" class="auth__link" @click="go('sign-up')">Create one</button></p>
          </form>

          <!-- ── Magic link: sent ──────────────────────────────────── -->
          <div v-else-if="step === 'magic-sent'" key="magic-sent" class="auth__step">
            <span class="auth__icon auth__icon--mail"><q-icon name="mark_email_unread" size="28px" /></span>
            <h1 id="auth-title-magic-sent" class="auth__title">Check your email</h1>
            <p class="auth__sub">We sent a log-in link to <strong>{{ email || 'your email' }}</strong>. It works for 10 minutes, on this device.</p>
            <div class="auth__mailapps">
              <a class="auth__provider" href="https://mail.google.com/mail/u/0/#search/from%3Abannerlab" target="_blank" rel="noopener"><q-icon name="mail" size="18px" /> Open Gmail</a>
              <a class="auth__provider" href="https://outlook.live.com/mail/0/" target="_blank" rel="noopener"><q-icon name="mail_outline" size="18px" /> Open Outlook</a>
            </div>
            <p v-if="!isMock && !error" class="auth__hint auth__center auth__waiting"><q-spinner size="14px" /> Waiting for you to open the link…</p>
            <button v-if="isMock" type="button" class="auth__proto" :disabled="!!busy" @click="openLink">
              <q-spinner v-if="busy === 'magic'" size="16px" /><q-icon v-else name="science" size="16px" /> Prototype: open the link from the email
            </button>
            <p class="auth__foot">
              Didn’t get it? Check spam, or
              <button v-if="cooldown <= 0" type="button" class="auth__link" :disabled="!!busy" @click="resend">resend the link</button>
              <span v-else class="auth__muted">resend in {{ cooldownLabel }}</span>
            </p>
            <button type="button" class="auth__link auth__center" @click="go('magic-email')">Use a different email</button>
          </div>

          <!-- ── Create account ────────────────────────────────────── -->
          <form v-else-if="step === 'sign-up'" key="sign-up" class="auth__step" novalidate @submit.prevent="createAccount">
            <h1 id="auth-title-sign-up" class="auth__title">Create your account</h1>
            <p class="auth__sub">Make Presto banners and logos for your events, and keep every version.</p>
            <button type="button" class="auth__provider" :disabled="!!busy" @click="google">
              <q-spinner v-if="busy === 'google'" size="18px" />
              <svg v-else class="auth__g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
              {{ busy === 'google' ? 'Connecting to Google…' : 'Sign up with Google' }}
            </button>
            <p class="auth__or"><span>or</span></p>
            <div class="auth__two">
              <AuthField v-model="firstName" label="First name" autocomplete="given-name" :error="errFor('firstName')" />
              <AuthField v-model="lastName" label="Last name" autocomplete="family-name" />
            </div>
            <AuthField v-model="email" label="Work email" type="email" autocomplete="email" inputmode="email" placeholder="you@company.com" :error="errFor('email')">
              <p v-if="error?.code === 'form_identifier_exists'" class="auth__hint"><button type="button" class="auth__link" @click="go('sign-in')">Log in instead</button> or <button type="button" class="auth__link" @click="go('forgot')">reset your password</button></p>
            </AuthField>
            <AuthField v-model="password" label="Password" type="password" autocomplete="new-password" :error="errFor('password')">
              <PasswordRules :password="password" />
            </AuthField>
            <div class="auth__agree" :class="{ 'has-error': errFor('agree') }">
              <q-checkbox v-model="agree" dense />
              <span>I agree to the <a href="#" @click.prevent>Terms</a> and <a href="#" @click.prevent>Privacy Policy</a>.</span>
            </div>
            <p v-if="errFor('agree')" class="auth__err" role="alert"><q-icon name="error" size="16px" /> {{ errFor('agree') }}</p>
            <button type="submit" class="auth__primary" :disabled="!!busy">
              <q-spinner v-if="busy === 'signup'" size="18px" /> {{ busy === 'signup' ? 'Creating your account…' : 'Create account' }}
            </button>
            <p class="auth__foot">Already have an account? <button type="button" class="auth__link" @click="go('sign-in')">Log in</button></p>
          </form>

          <!-- ── Verify email (sign-up) / reset code ───────────────── -->
          <form v-else-if="step === 'verify' || step === 'forgot-code' || step === 'sign-in-code'" :key="step" class="auth__step" novalidate @submit.prevent="submitCode">
            <button type="button" class="auth__back" @click="go(codeBack)"><q-icon name="arrow_back" size="18px" /> {{ step === 'sign-in-code' ? 'Back to log in' : 'Change email' }}</button>
            <span class="auth__icon auth__icon--mail"><q-icon name="pin" size="26px" /></span>
            <h1 :id="`auth-title-${step}`" class="auth__title">{{ codeTitle }}</h1>
            <p v-if="step === 'sign-in-code'" class="auth__sub">You’re logging in on a new device, so we sent a 6-digit code to <strong>{{ email || 'your email' }}</strong>.</p>
            <p v-else class="auth__sub">We sent a 6-digit code to <strong>{{ email || 'your email' }}</strong>. It expires in 10 minutes.</p>
            <CodeInput v-model="code" :error="errFor('code')" :disabled="busy === 'code'" @complete="submitCode" />
            <button type="submit" class="auth__primary" :disabled="!!busy || code.length < 6">
              <q-spinner v-if="busy === 'code'" size="18px" /> {{ busy === 'code' ? 'Checking…' : step === 'verify' ? 'Verify and continue' : 'Continue' }}
            </button>
            <p class="auth__foot">
              Didn’t get a code?
              <button v-if="cooldown <= 0" type="button" class="auth__link" :disabled="!!busy" @click="resend">Send a new one</button>
              <span v-else class="auth__muted">Send a new one in {{ cooldownLabel }}</span>
            </p>
          </form>

          <!-- ── Forgot password: email ────────────────────────────── -->
          <form v-else-if="step === 'forgot'" key="forgot" class="auth__step" novalidate @submit.prevent="sendReset">
            <button type="button" class="auth__back" @click="go('sign-in')"><q-icon name="arrow_back" size="18px" /> Back to log in</button>
            <span class="auth__icon"><q-icon name="lock_reset" size="26px" /></span>
            <h1 id="auth-title-forgot" class="auth__title">Reset your password</h1>
            <p class="auth__sub">Enter the email for your account and we’ll send you a 6-digit code.</p>
            <AuthField v-model="email" label="Email" type="email" autocomplete="username" inputmode="email" placeholder="you@company.com" :error="errFor('email')" autofocus />
            <button type="submit" class="auth__primary" :disabled="!!busy">
              <q-spinner v-if="busy === 'reset'" size="18px" /> {{ busy === 'reset' ? 'Sending…' : 'Send code' }}
            </button>
            <p class="auth__foot">Remembered it? <button type="button" class="auth__link" @click="go('sign-in')">Log in</button></p>
          </form>

          <!-- ── Forgot password: new password ─────────────────────── -->
          <form v-else-if="step === 'forgot-new'" key="forgot-new" class="auth__step" novalidate @submit.prevent="saveNewPassword">
            <span class="auth__icon"><q-icon name="password" size="26px" /></span>
            <h1 id="auth-title-forgot-new" class="auth__title">Choose a new password</h1>
            <p class="auth__sub">For <strong>{{ email || 'your account' }}</strong>.</p>
            <AuthField v-model="password" label="New password" type="password" autocomplete="new-password" :error="errFor('password')" autofocus>
              <PasswordRules :password="password" />
            </AuthField>
            <AuthField v-model="confirm" label="Confirm new password" type="password" autocomplete="new-password" :error="errFor('confirm')" />
            <q-checkbox v-model="signOutOthers" dense label="Log out of other devices" class="auth__check" />
            <button type="submit" class="auth__primary" :disabled="!!busy">
              <q-spinner v-if="busy === 'reset'" size="18px" /> {{ busy === 'reset' ? 'Saving…' : 'Update password' }}
            </button>
          </form>

          <!-- ── Done ──────────────────────────────────────────────── -->
          <div v-else key="done" class="auth__step auth__done">
            <span class="auth__icon auth__icon--ok"><q-icon name="check" size="30px" /></span>
            <h1 id="auth-title-done" class="auth__title">{{ doneKind === 'reset' ? 'Password updated' : `You’re in, ${firstLetter}` }}</h1>
            <p class="auth__sub">{{ doneKind === 'reset' ? 'You’re logged in with your new password.' : 'Taking you to your projects…' }}</p>
            <button type="button" class="auth__primary" @click="continueNow">Continue to Banner Lab</button>
          </div>
        </Transition>
      </section>
      <p class="auth__legal"><a href="#" @click.prevent>Terms</a> · <a href="#" @click.prevent>Privacy</a></p>
    </main>
  </div>
</template>

<style scoped>
.auth { position: relative; min-height: 100vh; min-height: 100dvh; overflow: hidden; font-family: var(--bs-font); background: #d9dce3; }
.auth__bg { position: absolute; inset: -24px; width: calc(100% + 48px); height: calc(100% + 48px); object-fit: cover; object-position: top left; filter: blur(7px) saturate(0.85); }
.auth__scrim { position: absolute; inset: 0; background: rgb(120 126 140 / 0.5); }
.auth__wrap { position: relative; z-index: 1; min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; align-content: center; gap: 14px; padding: 40px 16px; overflow-y: auto; }
.auth__card { position: relative; width: min(460px, 100%); background: #fff; border-radius: 28px; padding: 36px 36px 30px; box-shadow: 0 30px 80px rgb(3 10 38 / 0.28), 0 2px 8px rgb(3 10 38 / 0.08); }
.auth__close { position: absolute; top: 16px; right: 16px; color: var(--bs-ink-soft); }
.auth__brand { margin: 0 0 14px; text-align: center; font: 600 0.875rem var(--bs-font); letter-spacing: -0.01em; color: var(--bs-ink-soft); }
.auth__brand span { margin-left: 4px; padding: 1px 6px; border: 1px solid var(--bs-line); border-radius: 999px; font: 700 0.5625rem var(--bs-font); letter-spacing: 0.08em; vertical-align: 2px; }
.auth__step { display: grid; gap: 16px; }
.auth__title { margin: 0; text-align: center; font: 700 1.875rem/1.2 var(--bs-font); letter-spacing: -0.025em; color: var(--bs-ink); }
.auth__sub { margin: -6px 0 4px; text-align: center; font: 400 0.9375rem/1.5 var(--bs-font); color: var(--bs-ink-soft); }
.auth__sub strong { color: var(--bs-ink); font-weight: 600; word-break: break-all; }
.auth__icon { justify-self: center; display: grid; place-items: center; width: 56px; height: 56px; border-radius: 18px; background: var(--bs-accent-soft); color: var(--bs-accent); }
.auth__icon--ok { background: #dcfce7; color: var(--bs-success); border-radius: 50%; animation: auth-pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1); }
.auth__providers, .auth__mailapps { display: grid; gap: 10px; }
.auth__mailapps { grid-template-columns: 1fr 1fr; }
.auth__provider { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 52px; padding: 0 16px; border: 1px solid var(--bs-line); border-radius: 999px; background: #fff; font: 600 1rem var(--bs-font); color: var(--bs-ink); text-decoration: none; cursor: pointer; transition: background-color 0.15s, border-color 0.15s; }
.auth__provider:hover:not(:disabled) { background: var(--bs-surface-2); border-color: var(--bs-ink-faint); }
.auth__provider:disabled { opacity: 0.6; cursor: default; }
.auth__g { width: 20px; height: 20px; }
.auth__magic { color: var(--bs-accent); }
.auth__or { margin: 2px 0; display: flex; align-items: center; gap: 14px; font: 400 0.875rem var(--bs-font); color: var(--bs-ink-soft); }
.auth__or::before, .auth__or::after { content: ''; flex: 1; height: 1px; background: var(--bs-line); }
.auth__two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.auth__check :deep(.q-checkbox__label) { font: 500 0.9375rem var(--bs-font); color: var(--bs-ink); padding-left: 10px; }
.auth__agree { display: flex; align-items: center; gap: 10px; font: 400 0.875rem var(--bs-font); color: var(--bs-ink-soft); }
.auth__agree a { color: var(--bs-accent); font-weight: 600; }
.auth__agree.has-error :deep(.q-checkbox__bg) { border-color: var(--bs-danger); }
.auth__err { margin: -8px 0 0; display: flex; align-items: center; gap: 6px; font: 500 0.8125rem var(--bs-font); color: var(--bs-danger); }
.auth__formerr { margin: 0 0 14px; justify-content: center; text-align: center; }
.auth__waiting { display: flex; align-items: center; gap: 8px; }
.auth__primary { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 54px; margin-top: 2px; border: 0; border-radius: 999px; background: var(--bs-ink); color: #fff; font: 600 1.0625rem var(--bs-font); cursor: pointer; transition: background-color 0.15s, opacity 0.15s; }
.auth__primary:hover:not(:disabled) { background: #1e293b; }
.auth__primary:disabled { opacity: 0.55; cursor: default; }
.auth__primary:focus-visible, .auth__provider:focus-visible, .auth__link:focus-visible, .auth__back:focus-visible, .auth__proto:focus-visible { outline: 2px solid var(--bs-accent); outline-offset: 3px; }
.auth__link { border: 0; background: none; padding: 0; font: 600 0.9375rem var(--bs-font); color: var(--bs-accent); cursor: pointer; }
.auth__link:hover { text-decoration: underline; }
.auth__link:disabled { opacity: 0.5; cursor: default; }
.auth__link--small { font-size: 0.8125rem; }
.auth__center { justify-self: center; }
.auth__foot { margin: 2px 0 0; text-align: center; font: 400 0.9375rem/1.6 var(--bs-font); color: var(--bs-ink); }
.auth__muted { color: var(--bs-ink-soft); font-variant-numeric: tabular-nums; }
.auth__hint { margin: 0; font: 400 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
.auth__hint .auth__link { font-size: 0.8125rem; }
.auth__back { justify-self: start; display: inline-flex; align-items: center; gap: 6px; margin: -8px 0 -4px; border: 0; background: none; padding: 4px 0; font: 600 0.875rem var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.auth__back:hover { color: var(--bs-ink); }
.auth__proto { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; border: 1px dashed var(--bs-accent); border-radius: 12px; background: var(--bs-accent-soft); font: 600 0.875rem var(--bs-font); color: var(--bs-accent); cursor: pointer; }
.auth__done { padding: 12px 0 4px; }
.auth__legal { margin: 0; font: 500 0.75rem var(--bs-font); color: rgb(255 255 255 / 0.9); text-shadow: 0 1px 2px rgb(0 0 0 / 0.25); }
.auth__legal a { color: inherit; }
.auth-step-enter-active, .auth-step-leave-active { transition: opacity 0.18s, transform 0.18s; }
.auth-step-enter-from { opacity: 0; transform: translateX(12px); }
.auth-step-leave-to { opacity: 0; transform: translateX(-12px); }
@keyframes auth-pop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (max-width: 520px) {
  .auth__wrap { padding: 20px 12px; place-items: start center; }
  .auth__card { padding: 28px 20px 24px; border-radius: 24px; }
  .auth__title { font-size: 1.625rem; }
  .auth__two, .auth__mailapps { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { .auth-step-enter-active, .auth-step-leave-active { transition: none; } .auth__icon--ok { animation: none; } }
</style>
