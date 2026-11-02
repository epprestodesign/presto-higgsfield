// Pieces both auth adapters share (mockAuth.js and clerkAuth.js): the error
// type the screens read, email + password checks, and the live password rules.

export class AuthError extends Error {
  constructor(message, { field = null, code = '' } = {}) {
    super(message)
    this.field = field // which input the message belongs to, if any
    this.code = code
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isEmail = (v) => EMAIL.test(String(v).trim())

export function checkEmail(email) {
  if (!isEmail(email)) throw new AuthError('Enter a valid email address.', { field: 'email', code: 'form_param_format_invalid' })
}

export function nameFromEmail(email = '') {
  const local = String(email).split('@')[0].replace(/[._-]+/g, ' ')
  return local.replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Password rules (shown live while typing) ──────────────────────────────
// Kept in step with the Clerk instance's password policy (min 8 characters,
// a number, upper + lower case). Clerk also rejects breached passwords.
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'number', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'case', label: 'Upper and lower case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
]
export const passwordOk = (p) => PASSWORD_RULES.every((r) => r.test(p))
