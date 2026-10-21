// Payment-method logos, sourced from the repo-root /creditCards SVG set.
// Keyed by file basename (e.g. 'Visa', 'Amex', 'GooglePay'). The base files
// (no -1/-2 suffix) are the default treatment we use.
// Path is relative to THIS file (src/lib/) → repo-root /creditCards. A root-
// absolute '/creditCards/*.svg' resolves against the active Vite root, which is
// the repo root in Storybook but the sub-app root in the prototype (breaking the
// logos there); the relative form resolves to the same files from either root.
const mods = import.meta.glob('../../creditCards/*.svg', { eager: true, query: '?url', import: 'default' })

const logos = {}
for (const [path, url] of Object.entries(mods)) {
  const name = path.split('/').pop().replace('.svg', '')
  logos[name] = url
}

export const paymentLogo = (name) => logos[name] || null
export default logos
