// ID + slug helpers. IDs are prefixed so a serialized project is self-describing
// (prj_…, bk_…, cpt_…, spn_…, plc_…). Supabase will issue UUIDs server-side
// later; these stay as the client-side draft IDs.
export const uid = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`

export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// Slugs that would collide with app routes on the published-demo host.
export const RESERVED_SLUGS = ['app', 'api', 'admin', 'studio', 'login', 'signup', 'dashboard', 'new', 'edit', 'preview', 'demo', 'eventpipe', 'presto']

/** Returns an error string, or '' when the slug is valid. */
export function validateSlug(slug) {
  if (!slug) return 'Choose a URL for your page.'
  if (slug.length < 3) return 'Use at least 3 characters.'
  if (slug.length > 60) return 'Use 60 characters or fewer.'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return 'Use lowercase letters, numbers and single hyphens.'
  if (RESERVED_SLUGS.includes(slug)) return 'That URL is reserved. Try adding your event year.'
  return ''
}
