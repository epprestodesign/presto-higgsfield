// Imagery library — loads from the hosted imagery repo at runtime, with a small
// committed local set as offline/public fallback.
//
//   Remote (dynamic): set VITE_IMAGERY_URL to the imagery Pages base, e.g.
//     https://epprestodesign.github.io/presto-ds-imagery
//   New images pushed to that repo appear here on next load — no DS rebuild.
//   Fallback (offline / URL unset / fetch fails): src/assets/hotel/*.jpg
//
// Library + builder live in: github.com/epprestodesign/presto-ds-imagery
import localManifest from '../assets/hotel/manifest.local.json'

const BASE = (import.meta.env.VITE_IMAGERY_URL || '').replace(/\/$/, '')

// Local fallback files (the committed set), resolved to bundled URLs.
const localFiles = import.meta.glob('../assets/hotel/*.jpg', { eager: true, query: '?url', import: 'default' })
const localUrl = (file) => {
  const hit = Object.entries(localFiles).find(([k]) => k.endsWith('/' + file))
  return hit ? hit[1] : ''
}
const localData = Object.fromEntries(
  Object.entries(localManifest).map(([cat, arr]) => [cat, arr.map((e) => ({ ...e, url: localUrl(e.file) }))]),
)

let cache = null

/** Load the full library — remote manifest if VITE_IMAGERY_URL is set, else local. */
export async function loadImagery() {
  if (cache) return cache
  if (BASE) {
    try {
      const m = await fetch(`${BASE}/manifest.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json() })
      cache = Object.fromEntries(
        Object.entries(m).map(([cat, arr]) => [cat, arr.map((e) => ({ ...e, url: `${BASE}/${e.file}` }))]),
      )
      return cache
    } catch { /* fall through to local */ }
  }
  cache = localData
  return cache
}

// Synchronous local accessors (instant; the committed fallback set).
export const categories = Object.keys(localData)
export const getImages = (cat) => localData[cat] || []
export const randomImage = (cat) => {
  const list = cat ? getImages(cat) : Object.values(localData).flat()
  return list.length ? list[Math.floor(Math.random() * list.length)] : null
}
