// Banner Lab auth — the real adapter, over Clerk's vanilla JS SDK
// (@clerk/clerk-js). Same functions and AuthError contract as ./mockAuth.js,
// so the screens don't change. The UI is ours: we drive client.signIn /
// client.signUp directly and never mount Clerk's prebuilt components.
//
// The Studio is hash-routed (…/banner-lab/#/studio). Clerk's redirects come
// back to the same page with a marker in the hash:
//   #/studio/sso-callback   Google OAuth return → clerk.handleRedirectCallback
//   #/studio/verify         magic-link return  → clerk.handleEmailLinkVerification
// loadAuth() handles both, then rewrites the URL back to #/studio.
//
// Workspaces = Clerk Organizations. currentUser() reports the active org, or a
// personal workspace (the user's own id) when there isn't one. Supabase uses
// Clerk as a third-party auth provider: pass getSessionToken() to supabase-js.

import { AuthError, checkEmail, nameFromEmail, passwordOk } from './authShared.js'

export { AuthError }
export { isEmail, PASSWORD_RULES, passwordOk } from './authShared.js'

// ── Clerk error → AuthError ───────────────────────────────────────────────

const FIELD_FOR_PARAM = {
  identifier: 'email',
  email_address: 'email',
  emailAddress: 'email',
  password: 'password',
  code: 'code',
  first_name: 'firstName',
  firstName: 'firstName',
  last_name: 'lastName',
  lastName: 'lastName',
}

// Same wording as the mock where the case exists there.
const EVENTPIPE_ONLY = 'Banner Lab is for EventPipe accounts. Use your @eventpipe.com email.'

const MESSAGES = {
  form_identifier_not_found: ['We couldn’t find an account with that email.', 'email'],
  form_password_incorrect: ['That password isn’t right. Try again or reset it.', 'password'],
  form_identifier_exists: ['An account with this email already exists.', 'email'],
  form_code_incorrect: ['That code isn’t right. Check the email and try again.', 'code'],
  verification_expired: ['That code has expired. Send a new one.', 'code'],
  verification_failed: ['Too many wrong codes. Send a new one and try again.', 'code'],
  form_password_pwned: ['That password has shown up in a data breach. Choose a different one.', 'password'],
  form_password_length_too_short: ['Your password needs to meet all the rules below.', 'password'],
  form_password_not_strong_enough: ['Your password needs to meet all the rules below.', 'password'],
  form_password_validation_failed: ['Your password needs to meet all the rules below.', 'password'],
  strategy_for_user_invalid: ['This account doesn’t use a password. Continue with Google or a magic link instead.', 'password'],
  session_exists: ['You’re already logged in.', null],
  identifier_already_signed_in: ['You’re already logged in.', null],
  external_account_exists: ['That Google account is already linked to another user.', null],
  user_locked: ['Too many attempts. Your account is locked for a while; try again later.', null],
  too_many_requests: ['Too many attempts. Wait a moment and try again.', null],
  network_error: ['We couldn’t reach the log-in service. Check your connection and try again.', null],
  // Allowlist: Banner Lab is restricted to @eventpipe.com addresses.
  not_allowed_access: [EVENTPIPE_ONLY, 'email'],
  identifier_not_allowed_access: [EVENTPIPE_ONLY, 'email'],
  sign_up_restricted_waitlist: [EVENTPIPE_ONLY, 'email'],
  // EmailLinkError codes (magic link)
  expired: ['That link has expired. Send a new one.', null],
  failed: ['That link didn’t work. Send a new one.', null],
  client_mismatch: ['Open the link in the same browser you asked for it from.', null],
}

/**
 * Turn anything Clerk throws into an AuthError the screens can show:
 * ClerkAPIResponseError (err.errors[0].code / longMessage / meta.paramName),
 * EmailLinkError (err.code), or ClerkRuntimeError (err.code).
 */
export function toAuthError(err) {
  if (err instanceof AuthError) return err
  const first = Array.isArray(err?.errors) ? err.errors[0] : null
  const code = first?.code || err?.code || ''
  const param = first?.meta?.paramName || first?.meta?.param_name || ''
  const known = MESSAGES[code] || (/not_allowed/.test(code) ? [EVENTPIPE_ONLY, 'email'] : null)
  let field = known ? known[1] : null
  if (param && FIELD_FOR_PARAM[param]) field = FIELD_FOR_PARAM[param]
  if (code === 'form_param_format_invalid' && field === 'email') return new AuthError('Enter a valid email address.', { field, code })
  const message = known?.[0] || first?.longMessage || first?.long_message || first?.message || err?.message || 'Something went wrong. Try again.'
  return new AuthError(message, { field, code })
}

const guard = (fn) => async (...args) => {
  try { return await fn(...args) } catch (e) { throw toAuthError(e) }
}

// ── Loading Clerk ─────────────────────────────────────────────────────────

const KEY = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || ''
let clerk = null
let loading = null
let redirectError = null

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const appBase = () => `${window.location.origin}${window.location.pathname}`
const studioUrl = () => `${appBase()}#/studio`
const ssoCallbackUrl = () => `${appBase()}#/studio/sso-callback`
const emailLinkUrl = () => `${appBase()}#/studio/verify`

// Keep Clerk's own navigation on this page: same-page targets just rewrite the
// URL (no reload, no hashchange), anything else is a real navigation.
function navigate(to) {
  const url = new URL(to, window.location.href)
  if (url.origin === window.location.origin && url.pathname === window.location.pathname) {
    window.history.replaceState(window.history.state, '', `${url.pathname}#/studio`)
  } else {
    window.location.assign(url.href)
  }
  return Promise.resolve()
}

// Clerk reads __clerk_* params from location.search. If they landed after the
// hash (…#/studio/verify?__clerk_status=…), move them in front of it.
function hoistHashParams() {
  const { hash } = window.location
  const q = hash.indexOf('?')
  if (q < 0) return
  const url = new URL(window.location.href)
  new URLSearchParams(hash.slice(q + 1)).forEach((v, k) => url.searchParams.set(k, v))
  url.hash = hash.slice(0, q)
  window.history.replaceState(window.history.state, '', url)
}
const cleanUrl = () => window.history.replaceState(window.history.state, '', `${window.location.pathname}#/studio`)

async function handleReturn(c) {
  hoistHashParams()
  const hash = window.location.hash
  const params = new URLSearchParams(window.location.search)
  try {
    if (hash.startsWith('#/studio/sso-callback')) {
      await c.handleRedirectCallback({
        signInFallbackRedirectUrl: studioUrl(),
        signUpFallbackRedirectUrl: studioUrl(),
      }, navigate)
      if (!c.user) {
        const vErr = c.client?.signIn?.firstFactorVerification?.error || c.client?.signUp?.verifications?.externalAccount?.error
        if (vErr) throw { errors: [vErr] }
        const missing = c.client?.signUp?.missingFields || []
        throw new AuthError(missing.length
          ? `We couldn’t finish creating your account with Google (missing: ${missing.join(', ')}). Try email instead.`
          : 'We couldn’t finish logging you in with Google. Try again.')
      }
    } else if (params.has('__clerk_status')) {
      await c.handleEmailLinkVerification({}, navigate)
      if (!c.user) throw new AuthError('Your email is verified. Go back to the tab where you asked for the link to finish logging in.')
    }
  } catch (e) {
    redirectError = toAuthError(e)
  } finally {
    if (hash.startsWith('#/studio/') || params.has('__clerk_status')) cleanUrl()
  }
}

/** Load Clerk once (and finish an OAuth or magic-link return). Resolves to the Clerk instance. */
export function loadAuth() {
  if (!loading) {
    loading = (async () => {
      if (!KEY) throw new AuthError('Clerk isn’t configured (VITE_CLERK_PUBLISHABLE_KEY is missing).')
      const { Clerk } = await import('@clerk/clerk-js')
      const c = new Clerk(KEY)
      await c.load({ routerPush: navigate, routerReplace: navigate })
      clerk = c
      await handleReturn(c)
      return c
    })()
    loading.catch(() => { loading = null })
  }
  return loading
}

/** An error from an OAuth / magic-link return, once, for the log-in screen to show. */
export function takeRedirectError() {
  const e = redirectError
  redirectError = null
  return e
}

// ── Session helpers for the app ───────────────────────────────────────────

/** The signed-in user as the app sees it, or null. Includes the active workspace (org). */
export function currentUser() {
  const u = clerk?.user
  if (!u) return null
  const email = u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress || ''
  const org = clerk.organization
  const membership = org ? u.organizationMemberships?.find((m) => m.organization.id === org.id) : null
  return {
    id: u.id,
    name: u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || nameFromEmail(email),
    email,
    imageUrl: u.imageUrl || '',
    org: org ? { id: org.id, name: org.name, slug: org.slug || '', role: membership?.role || '' } : null,
    // Projects belong to a workspace: the active org, or the user's personal one.
    workspace: org ? { id: org.id, name: org.name, personal: false } : { id: u.id, name: 'Personal', personal: true },
  }
}

/** Subscribe to sign-in / sign-out / org switches (incl. other tabs). Returns an unsubscribe. */
export function onAuthChange(cb) {
  if (!clerk) return () => {}
  return clerk.addListener(() => cb(currentUser()))
}

/** Log out of Clerk and stay on the Studio. */
export async function signOut() {
  const c = await loadAuth()
  await c.signOut({ redirectUrl: studioUrl() })
}

/** A fresh Clerk session JWT for Supabase (third-party auth) / API calls, or null. */
export async function getSessionToken() {
  const c = await loadAuth()
  return c.session ? c.session.getToken() : null
}

async function activate(c, sessionId) {
  await c.setActive({ session: sessionId })
  return { user: currentUser() }
}

// What "Send a new one" does on the current step.
let resendFn = null

// ── Sign in ───────────────────────────────────────────────────────────────

/** signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl, redirectUrlComplete }) — leaves the page. */
export const signInWithGoogle = guard(async () => {
  const c = await loadAuth()
  await c.client.signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: ssoCallbackUrl(), redirectUrlComplete: studioUrl() })
  return new Promise(() => {}) // the browser is on its way to Google
})

/** signUp.authenticateWithRedirect({ strategy: 'oauth_google', … }) — new Google users land here too via transfer. */
export const signUpWithGoogle = guard(async () => {
  const c = await loadAuth()
  await c.client.signUp.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: ssoCallbackUrl(), redirectUrlComplete: studioUrl() })
  return new Promise(() => {})
})

// A sign-in that isn't complete yet: a password log-in from a new device comes
// back 'needs_client_trust' (Device Trust) or 'needs_second_factor'. We email a
// code and the screen asks for it (verifySignInCode).
async function settleSignIn(c, si) {
  if (si.status === 'complete') return activate(c, si.createdSessionId)
  if (si.status === 'needs_client_trust' || si.status === 'needs_second_factor') {
    const factor = si.supportedSecondFactors?.find((f) => f.strategy === 'email_code')
    if (!factor) throw new AuthError('This account needs a second step we don’t support here yet.', { code: si.status })
    const prepare = () => c.client.signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId })
    await prepare()
    resendFn = prepare
    return { needsCode: true, email: factor.safeIdentifier || si.identifier || '' }
  }
  if (si.status === 'needs_new_password') throw new AuthError('Choose a new password to continue.', { code: si.status })
  throw new AuthError('We couldn’t finish logging you in. Try again.', { code: si.status || '' })
}

/** signIn.create({ identifier, password }) → 'complete' → setActive({ session }). May return { needsCode: true }. */
export const signInWithPassword = guard(async ({ email, password }) => {
  checkEmail(email)
  if (!password) throw new AuthError('Enter your password.', { field: 'password' })
  const c = await loadAuth()
  const si = await c.client.signIn.create({ strategy: 'password', identifier: email.trim(), password })
  return settleSignIn(c, si)
})

/** signIn.attemptSecondFactor({ strategy: 'email_code', code }) → setActive({ session }) */
export const verifySignInCode = guard(async ({ code }) => {
  const c = await loadAuth()
  const si = await c.client.signIn.attemptSecondFactor({ strategy: 'email_code', code })
  return settleSignIn(c, si)
})

// ── Magic link ────────────────────────────────────────────────────────────
// We call prepareFirstFactor ourselves (so a send failure shows right away)
// and poll the sign-in like startEmailLinkFlow does, until the link is opened.
let magic = null

/** signIn.create({ identifier }) → prepareFirstFactor({ strategy: 'email_link', emailAddressId, redirectUrl }) */
export const sendMagicLink = guard(async ({ email }) => {
  checkEmail(email)
  const c = await loadAuth()
  cancelMagicLink()
  const si = await c.client.signIn.create({ identifier: email.trim() })
  const factor = si.supportedFirstFactors?.find((f) => f.strategy === 'email_link')
  if (!factor) throw new AuthError('Magic links aren’t available for this account. Use your password or Google.', { field: 'email', code: 'strategy_for_user_invalid' })
  const prepare = () => c.client.signIn.prepareFirstFactor({ strategy: 'email_link', emailAddressId: factor.emailAddressId, redirectUrl: emailLinkUrl() })
  await prepare()
  resendFn = prepare
  magic = { cancelled: false }
  return { email, expiresInMinutes: 10 }
})

/** Resolves once the emailed link is opened (in this browser), then signs in. */
export const completeMagicLink = guard(async () => {
  const c = await loadAuth()
  const run = magic
  if (!run) throw new AuthError('Send yourself a link first.')
  for (;;) {
    await wait(2000)
    if (run.cancelled) return new Promise(() => {}) // superseded; never settles
    if (c.user) return { user: currentUser() } // finished in the other tab (same client)
    const si = await c.client.signIn.reload()
    const v = si.firstFactorVerification
    if (v?.status === 'expired') throw new AuthError(MESSAGES.expired[0], { code: 'expired' })
    if (v?.status === 'failed') throw new AuthError(MESSAGES.failed[0], { code: 'failed' })
    if (si.status === 'complete') return activate(c, si.createdSessionId)
    if (v?.status === 'verified') return settleSignIn(c, si)
  }
})

/** Stop waiting for the magic link (leaving the "Check your email" step). */
export function cancelMagicLink() {
  if (magic) magic.cancelled = true
  magic = null
}

// ── Sign up ───────────────────────────────────────────────────────────────

/** signUp.create({ firstName, lastName, emailAddress, password }) → prepareEmailAddressVerification({ strategy: 'email_code' }) */
export const signUp = guard(async ({ firstName, lastName, email, password }) => {
  if (!firstName?.trim()) throw new AuthError('Enter your first name.', { field: 'firstName' })
  checkEmail(email)
  if (!passwordOk(password)) throw new AuthError('Your password needs to meet all the rules below.', { field: 'password' })
  const c = await loadAuth()
  await c.client.signUp.create({ firstName: firstName.trim(), lastName: lastName?.trim() || undefined, emailAddress: email.trim(), password })
  const prepare = () => c.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
  await prepare()
  resendFn = prepare
  return { email, pending: { firstName, lastName, email } }
})

/** signUp.attemptEmailAddressVerification({ code }) → setActive({ session }) */
export const verifySignUpCode = guard(async ({ code }) => {
  const c = await loadAuth()
  const su = await c.client.signUp.attemptEmailAddressVerification({ code })
  if (su.status === 'complete') return activate(c, su.createdSessionId)
  const missing = su.missingFields || []
  throw new AuthError(missing.length ? `We still need: ${missing.join(', ')}.` : 'We couldn’t finish creating your account. Try again.', { code: su.status || '' })
})

// ── Forgot password ───────────────────────────────────────────────────────

/** signIn.create({ strategy: 'reset_password_email_code', identifier }) — sends the code */
export const sendResetCode = guard(async ({ email }) => {
  checkEmail(email)
  const c = await loadAuth()
  const si = await c.client.signIn.create({ strategy: 'reset_password_email_code', identifier: email.trim() })
  const factor = si.supportedFirstFactors?.find((f) => f.strategy === 'reset_password_email_code')
  resendFn = factor ? () => c.client.signIn.prepareFirstFactor({ strategy: 'reset_password_email_code', emailAddressId: factor.emailAddressId }) : null
  return { email }
})

/** signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code }) → 'needs_new_password' */
export const verifyResetCode = guard(async ({ code }) => {
  const c = await loadAuth()
  const si = await c.client.signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code })
  if (si.status !== 'needs_new_password' && si.status !== 'complete') throw new AuthError('We couldn’t check that code. Try again.', { field: 'code', code: si.status || '' })
  return { ok: true }
})

/** signIn.resetPassword({ password, signOutOfOtherSessions }) → setActive({ session }). May return { needsCode: true }. */
export const resetPassword = guard(async ({ password, confirm, signOutOfOtherSessions = true }) => {
  if (!passwordOk(password)) throw new AuthError('Your password needs to meet all the rules below.', { field: 'password' })
  if (password !== confirm) throw new AuthError('The passwords don’t match.', { field: 'confirm' })
  const c = await loadAuth()
  const si = await c.client.signIn.resetPassword({ password, signOutOfOtherSessions })
  return settleSignIn(c, si)
})

/** Resend for the current code or link step: calls the matching prepare method again. */
export const resend = guard(async () => {
  if (!resendFn) throw new AuthError('Start again to get a new code.')
  await resendFn()
  return { ok: true }
})

/** The mock's speed knob; nothing to do for Clerk. */
export const setMockDelay = () => {}
