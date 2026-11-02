// Banner Lab auth — a mock with the same shape as the Clerk flows we'll use,
// so the screens can be built and reviewed before Clerk is set up. Swapping in
// Clerk means replacing this file with an adapter over Clerk's useSignIn /
// useSignUp (clerk-js); the screens only talk to these functions.
//
// Every call resolves after a short delay, or throws an AuthError with a
// user-facing message. Prototype rules (also in the Storybook docs):
//   • Any email works. "taken@…" is already registered (sign-up fails);
//     "nobody@…" has no account (password log-in fails).
//   • Log-in password: "wrongpass" is rejected; anything 8+ characters works.
//   • Codes: 000000 is wrong; any other 6 digits work.

export class AuthError extends Error {
  constructor(message, { field = null, code = '' } = {}) {
    super(message)
    this.field = field // which input the message belongs to, if any
    this.code = code
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let delay = 700
/** Stories and tests can speed the mock up. */
export const setMockDelay = (ms) => { delay = ms }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isEmail = (v) => EMAIL.test(String(v).trim())

function nameFromEmail(email) {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ')
  return local.replace(/\b\w/g, (c) => c.toUpperCase())
}
const user = ({ email, firstName = '', lastName = '' }) => {
  const name = [firstName, lastName].filter(Boolean).join(' ') || nameFromEmail(email)
  return { id: `user_${Math.abs([...email].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))}`, email, name }
}

function checkEmail(email) {
  if (!isEmail(email)) throw new AuthError('Enter a valid email address.', { field: 'email', code: 'form_param_format_invalid' })
}

// ── Password rules (shown live while typing; Clerk enforces its own too) ──
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'number', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'case', label: 'Upper and lower case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
]
export const passwordOk = (p) => PASSWORD_RULES.every((r) => r.test(p))

// ── Sign in ───────────────────────────────────────────────────────────────

/** Clerk: signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl, redirectUrlComplete }) */
export async function signInWithGoogle() {
  await wait(delay + 300)
  return { user: user({ email: 'alex.smith@gmail.com', firstName: 'Alex', lastName: 'Smith' }) }
}

/** Clerk: signIn.create({ identifier: email, password }) → status 'complete' → setActive({ session }) */
export async function signInWithPassword({ email, password }) {
  checkEmail(email)
  if (!password) throw new AuthError('Enter your password.', { field: 'password' })
  await wait(delay)
  if (/^nobody@/i.test(email)) throw new AuthError('We couldn’t find an account with that email.', { field: 'email', code: 'form_identifier_not_found' })
  if (password === 'wrongpass' || password.length < 8) throw new AuthError('That password isn’t right. Try again or reset it.', { field: 'password', code: 'form_password_incorrect' })
  return { user: user({ email }) }
}

/**
 * Clerk: signIn.create({ identifier: email }) then
 * signIn.createEmailLinkFlow().startEmailLinkFlow({ emailAddressId, redirectUrl })
 */
export async function sendMagicLink({ email }) {
  checkEmail(email)
  await wait(delay)
  return { email, expiresInMinutes: 10 }
}

/** In Clerk the link opens your redirectUrl and the flow resolves; here we simulate it. */
export async function completeMagicLink({ email }) {
  await wait(delay)
  return { user: user({ email }) }
}

// ── Sign up ───────────────────────────────────────────────────────────────

/** Clerk: signUp.authenticateWithRedirect({ strategy: 'oauth_google', … }) */
export const signUpWithGoogle = signInWithGoogle

/**
 * Clerk: signUp.create({ firstName, lastName, emailAddress, password }) then
 * signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
 */
export async function signUp({ firstName, lastName, email, password }) {
  if (!firstName?.trim()) throw new AuthError('Enter your first name.', { field: 'firstName' })
  checkEmail(email)
  if (!passwordOk(password)) throw new AuthError('Your password needs to meet all the rules below.', { field: 'password', code: 'form_password_pwned' })
  await wait(delay)
  if (/^taken@/i.test(email)) throw new AuthError('An account with this email already exists.', { field: 'email', code: 'form_identifier_exists' })
  return { email, pending: { firstName, lastName, email } }
}

/** Clerk: signUp.attemptEmailAddressVerification({ code }) → setActive({ session }) */
export async function verifySignUpCode({ code, pending }) {
  await wait(delay)
  if (code === '000000') throw new AuthError('That code isn’t right. Check the email and try again.', { field: 'code', code: 'form_code_incorrect' })
  return { user: user(pending) }
}

// ── Forgot password ───────────────────────────────────────────────────────

/** Clerk: signIn.create({ strategy: 'reset_password_email_code', identifier: email }) */
export async function sendResetCode({ email }) {
  checkEmail(email)
  await wait(delay)
  return { email }
}

/** Clerk: signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code }) → status 'needs_new_password' */
export async function verifyResetCode({ code }) {
  await wait(delay)
  if (code === '000000') throw new AuthError('That code isn’t right. Check the email and try again.', { field: 'code', code: 'form_code_incorrect' })
  return { ok: true }
}

/** Clerk: signIn.resetPassword({ password, signOutOfOtherSessions: true }) → setActive({ session }) */
export async function resetPassword({ email, password, confirm }) {
  if (!passwordOk(password)) throw new AuthError('Your password needs to meet all the rules below.', { field: 'password' })
  if (password !== confirm) throw new AuthError('The passwords don’t match.', { field: 'confirm' })
  await wait(delay)
  return { user: user({ email }) }
}

/** Resend for any code or link step. Clerk: call the matching prepare/start method again. */
export async function resend() {
  await wait(Math.min(delay, 500))
  return { ok: true }
}
