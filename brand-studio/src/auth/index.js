// Banner Lab auth — the one import for screens and the app.
//
// Real Clerk (./clerkAuth.js) when VITE_CLERK_PUBLISHABLE_KEY is set and we're
// not in Storybook; otherwise the mock (./mockAuth.js), so Storybook and the
// public GitHub Pages build never touch the network. Both adapters have the
// same functions and throw the same AuthError.

import * as mock from './mockAuth.js'
import * as clerk from './clerkAuth.js'

export { AuthError, isEmail, PASSWORD_RULES, passwordOk } from './authShared.js'

const KEY = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || ''
const inStorybook = () => typeof window !== 'undefined'
  && !!(window.__STORYBOOK_PREVIEW__ || window.__STORYBOOK_ADDONS_CHANNEL__ || window.__STORYBOOK_STORY_STORE__)

/** 'clerk' or 'mock'. Decided once, on first use. */
let decided = ''
export function authMode() {
  if (!decided) decided = KEY && !inStorybook() ? 'clerk' : 'mock'
  return decided
}
const impl = () => (authMode() === 'clerk' ? clerk : mock)

// ── Auth screen flows (same names as mockAuth.js) ─────────────────────────
export const setMockDelay = (ms) => impl().setMockDelay(ms)
export const signInWithGoogle = (...a) => impl().signInWithGoogle(...a)
export const signUpWithGoogle = (...a) => impl().signUpWithGoogle(...a)
export const signInWithPassword = (...a) => impl().signInWithPassword(...a)
export const verifySignInCode = (...a) => impl().verifySignInCode(...a)
export const sendMagicLink = (...a) => impl().sendMagicLink(...a)
export const completeMagicLink = (...a) => impl().completeMagicLink(...a)
export const cancelMagicLink = (...a) => impl().cancelMagicLink(...a)
export const signUp = (...a) => impl().signUp(...a)
export const verifySignUpCode = (...a) => impl().verifySignUpCode(...a)
export const sendResetCode = (...a) => impl().sendResetCode(...a)
export const verifyResetCode = (...a) => impl().verifyResetCode(...a)
export const resetPassword = (...a) => impl().resetPassword(...a)
export const resend = (...a) => impl().resend(...a)

// ── Session (Clerk only; the mock has no session to restore) ──────────────

/** Init Clerk once and finish any OAuth / magic-link return. Mock: resolves null. */
export const loadAuth = () => (authMode() === 'clerk' ? clerk.loadAuth() : Promise.resolve(null))
/** The signed-in user { id, name, email, imageUrl, org, workspace }, or null. */
export const currentUser = () => (authMode() === 'clerk' ? clerk.currentUser() : null)
/** Called on any session / org change. Returns an unsubscribe. */
export const onAuthChange = (cb) => (authMode() === 'clerk' ? clerk.onAuthChange(cb) : () => {})
/** An error left by an OAuth / magic-link return, once (for the log-in screen). */
export const takeRedirectError = () => (authMode() === 'clerk' ? clerk.takeRedirectError() : null)
/** End the session. Mock: nothing to end. */
export const signOut = () => (authMode() === 'clerk' ? clerk.signOut() : Promise.resolve())
/** Clerk session JWT for supabase-js (`accessToken`) and API calls; null when signed out or mocked. */
export const getSessionToken = (opts) => (authMode() === 'clerk' ? clerk.getSessionToken(opts) : Promise.resolve(null))
