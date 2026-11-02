import AuthScreen from './AuthScreen.vue'

export default {
  title: 'Banner Lab/Auth',
  component: AuthScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Banner Lab’s log-in, over a blurred, static picture of a project. Three ways in: **Continue with Google**, **Continue with magic link**, or **email and password**. Plus the flows to **create an account** (with a 6-digit email code) and **reset a forgotten password**.',
          '',
          'Authentication will be **Clerk**. Nothing is wired to Clerk yet: every step calls `brand-studio/src/auth/mockAuth.js`, which has the same shape as the Clerk calls it stands in for (each function names its Clerk call), so wiring Clerk replaces that one file.',
          '',
          '**Prototype rules:** any email works; `taken@…` is already registered (sign-up fails) and `nobody@…` has no account (log-in fails). Log-in password `wrongpass` is rejected; anything 8+ characters works. Code `000000` is wrong; any other 6 digits work.',
        ].join('\n'),
      },
    },
  },
}

const story = (name, args = {}) => ({
  name,
  args: { mockDelay: 600, ...args },
  render: (a) => ({ components: { AuthScreen }, setup: () => ({ a }), template: '<auth-screen v-bind="a" :key="JSON.stringify(a)" />' }),
})

// ── Log in ────────────────────────────────────────────────────────────────
export const LogIn = story('Log in')
export const LogInFilled = story('Log in · filled in', { initialEmail: 'alex.smith@eventpipe.com', initialPassword: 'Presto2027' })
export const LogInWrongPassword = story('Log in · wrong password', {
  initialEmail: 'alex.smith@eventpipe.com', initialPassword: 'wrongpass',
  initialError: { field: 'password', message: 'That password isn’t right. Try again or reset it.', code: 'form_password_incorrect' },
})
export const LogInNoAccount = story('Log in · no account with that email', {
  initialEmail: 'nobody@eventpipe.com', initialPassword: 'Presto2027',
  initialError: { field: 'email', message: 'We couldn’t find an account with that email.', code: 'form_identifier_not_found' },
})
export const LogInDismissible = story('Log in · as a dialog (closable)', { dismissible: true })

// ── Magic link ────────────────────────────────────────────────────────────
export const MagicLinkEmail = story('Magic link · enter email', { initialStep: 'magic-email', initialEmail: 'alex.smith@eventpipe.com' })
export const MagicLinkSent = story('Magic link · check your email', { initialStep: 'magic-sent', initialEmail: 'alex.smith@eventpipe.com' })

// ── Create account ────────────────────────────────────────────────────────
export const CreateAccount = story('Create account', { initialStep: 'sign-up' })
export const CreateAccountWeakPassword = story('Create account · password rules', {
  initialStep: 'sign-up', initialFirstName: 'Alex', initialLastName: 'Smith', initialEmail: 'alex.smith@eventpipe.com', initialPassword: 'presto',
})
export const CreateAccountEmailTaken = story('Create account · email already registered', {
  initialStep: 'sign-up', initialFirstName: 'Alex', initialLastName: 'Smith', initialEmail: 'taken@eventpipe.com', initialPassword: 'Presto2027',
  initialError: { field: 'email', message: 'An account with this email already exists.', code: 'form_identifier_exists' },
})
export const VerifyEmail = story('Create account · verify email code', { initialStep: 'verify', initialEmail: 'alex.smith@eventpipe.com', initialFirstName: 'Alex' })
export const VerifyEmailWrongCode = story('Create account · wrong code', {
  initialStep: 'verify', initialEmail: 'alex.smith@eventpipe.com', initialFirstName: 'Alex',
  initialError: { field: 'code', message: 'That code isn’t right. Check the email and try again.', code: 'form_code_incorrect' },
})

// ── Forgot password ───────────────────────────────────────────────────────
export const ForgotPassword = story('Forgot password · email', { initialStep: 'forgot', initialEmail: 'alex.smith@eventpipe.com' })
export const ForgotPasswordCode = story('Forgot password · enter code', { initialStep: 'forgot-code', initialEmail: 'alex.smith@eventpipe.com' })
export const ForgotPasswordNew = story('Forgot password · new password', { initialStep: 'forgot-new', initialEmail: 'alex.smith@eventpipe.com' })
export const ForgotPasswordDone = story('Forgot password · updated', { initialStep: 'done', initialDoneKind: 'reset', autoContinue: false })

// ── Signed in ─────────────────────────────────────────────────────────────
export const SignedIn = story('Signed in', { initialStep: 'done', initialFirstName: 'Alex', autoContinue: false })

// ── End to end (click through every flow) ────────────────────────────────
export const FullFlow = story('Full flow (click through)', { autoContinue: false })
