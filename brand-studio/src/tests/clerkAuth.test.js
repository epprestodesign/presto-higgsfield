import { describe, it, expect } from 'vitest'
import { toAuthError, AuthError } from '../auth/clerkAuth.js'
import * as mock from '../auth/mockAuth.js'
import * as clerk from '../auth/clerkAuth.js'
import * as auth from '../auth/index.js'

// A ClerkAPIResponseError carries the parsed API errors on `errors`.
const apiError = (code, { longMessage = '', paramName } = {}) =>
  Object.assign(new Error('API error'), { errors: [{ code, message: 'msg', longMessage, meta: paramName ? { paramName } : {} }] })

describe('Clerk error → AuthError', () => {
  it('uses the mock’s wording for known codes and sets the field', () => {
    const e = toAuthError(apiError('form_password_incorrect', { paramName: 'password', longMessage: 'Password is incorrect.' }))
    expect(e).toBeInstanceOf(AuthError)
    expect(e).toMatchObject({ code: 'form_password_incorrect', field: 'password', message: 'That password isn’t right. Try again or reset it.' })

    expect(toAuthError(apiError('form_identifier_not_found', { paramName: 'identifier' })))
      .toMatchObject({ field: 'email', message: 'We couldn’t find an account with that email.' })
    expect(toAuthError(apiError('form_identifier_exists', { paramName: 'email_address' })))
      .toMatchObject({ field: 'email', code: 'form_identifier_exists' })
    expect(toAuthError(apiError('form_code_incorrect', { paramName: 'code' })))
      .toMatchObject({ field: 'code', code: 'form_code_incorrect' })
  })

  it('maps meta.paramName to the screen’s field names', () => {
    expect(toAuthError(apiError('form_param_nil', { paramName: 'first_name', longMessage: 'First name is required.' })))
      .toMatchObject({ field: 'firstName', message: 'First name is required.' })
    expect(toAuthError(apiError('form_param_format_invalid', { paramName: 'email_address' })))
      .toMatchObject({ field: 'email', message: 'Enter a valid email address.' })
  })

  it('falls back to longMessage, then message, with no field', () => {
    expect(toAuthError(apiError('something_new', { longMessage: 'A long message.' })))
      .toMatchObject({ field: null, code: 'something_new', message: 'A long message.' })
    // Allowlist rejections (non-@eventpipe.com addresses)
    for (const code of ['not_allowed_access', 'identifier_not_allowed_access', 'some_future_not_allowed_code']) {
      expect(toAuthError(apiError(code, { longMessage: 'Access not allowed.' }))).toMatchObject({ field: 'email', message: 'Banner Lab is for EventPipe accounts. Use your @eventpipe.com email.' })
    }
    expect(toAuthError(new Error('boom'))).toMatchObject({ field: null, message: 'boom' })
    expect(toAuthError(undefined).message).toBe('Something went wrong. Try again.')
  })

  it('handles email-link and runtime errors (err.code)', () => {
    expect(toAuthError(Object.assign(new Error('x'), { code: 'expired' })).message).toBe('That link has expired. Send a new one.')
    expect(toAuthError(Object.assign(new Error('x'), { code: 'network_error' })).code).toBe('network_error')
  })

  it('passes AuthErrors through untouched', () => {
    const e = new AuthError('Enter your password.', { field: 'password' })
    expect(toAuthError(e)).toBe(e)
  })
})

describe('auth adapters', () => {
  const flows = ['signInWithGoogle', 'signUpWithGoogle', 'signInWithPassword', 'verifySignInCode', 'sendMagicLink', 'completeMagicLink',
    'cancelMagicLink', 'signUp', 'verifySignUpCode', 'sendResetCode', 'verifyResetCode', 'resetPassword', 'resend', 'setMockDelay']

  it('mock and Clerk expose the same flows, sharing one AuthError', () => {
    for (const f of flows) {
      expect(typeof mock[f], `mock.${f}`).toBe('function')
      expect(typeof clerk[f], `clerk.${f}`).toBe('function')
    }
    expect(mock.AuthError).toBe(clerk.AuthError)
    expect(auth.AuthError).toBe(mock.AuthError)
  })

  it('uses the mock when no publishable key is set', async () => {
    if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) return
    expect(auth.authMode()).toBe('mock')
    expect(auth.currentUser()).toBeNull()
    await expect(auth.getSessionToken()).resolves.toBeNull()
  })

  it('Clerk flows validate input before loading Clerk', async () => {
    await expect(clerk.signInWithPassword({ email: 'nope', password: 'x' })).rejects.toMatchObject({ field: 'email' })
    await expect(clerk.signUp({ firstName: 'A', email: 'a@b.co', password: 'short' })).rejects.toMatchObject({ field: 'password' })
  })
})

describe('server session check', () => {
  const env = { CLERK_SECRET_KEY: 'sk_test_x' }
  const req = (headers) => ({ headers })
  it('says why a token was rejected', async () => {
    const { authenticate } = await import('../../server/auth.js')
    const verify = async () => { throw Object.assign(new Error('expired'), { reason: 'token-expired' }) }
    const r = await authenticate(req({ authorization: 'Bearer abc' }), { env, verify })
    expect(r).toMatchObject({ ok: false, status: 401, reason: 'token-expired' })
    const none = await authenticate(req({}), { env, verify })
    expect(none.reason).toBe('no-token')
  })
  it('accepts a valid token', async () => {
    const { authenticate } = await import('../../server/auth.js')
    const r = await authenticate(req({ authorization: 'Bearer abc' }), { env, verify: async () => ({ sub: 'user_1' }) })
    expect(r).toMatchObject({ ok: true, userId: 'user_1' })
  })
  it('reads the Clerk host from a publishable key', async () => {
    const { frontendApiOf } = await import('../../server/auth.js')
    const key = `pk_test_${Buffer.from('bold-shrew-3922.clerk.accounts.dev$').toString('base64')}`
    expect(frontendApiOf(key)).toBe('bold-shrew-3922.clerk.accounts.dev')
    expect(frontendApiOf('nope')).toBe('')
  })
})
