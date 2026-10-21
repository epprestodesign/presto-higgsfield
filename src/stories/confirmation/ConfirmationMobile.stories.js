// CONFIRMATION / Mobile — the mobile-optimized confirmation, consolidated in one
// folder. Reuses the REAL confirmation story at phone width (tighter gutters, the
// summary header stacks, actions left-align).
import { Mobile as ConfGroupMobile } from './ConfirmationPageGroup.stories.js'

export default {
  title: 'Confirmation/Mobile',
  tags: ['mobile'],
  parameters: { layout: 'fullscreen' },
}

/** The Group Block confirmation at 390 — one card per hotel, rooms held by night. */
export const Confirmation = { ...ConfGroupMobile, name: 'Confirmation' }
