// Google Maps JS API loader — injects the script once, on demand, with the
// marker library (for AdvancedMarkerElement / price pills).
//
// Key source: VITE_GOOGLE_MAPS_API_KEY
//   - local dev: gitignored .env
//   - deployed : GitHub Actions secret GOOGLE_MAPS_API_KEY (wired in deploy.yml)
// A Maps JS key is necessarily exposed client-side — restrict it by HTTP
// referrer + API in Google Cloud Console.
const BUILD_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

let promise = null

/** True when a build-time Maps key is configured (so the UI can fall back). */
export const hasMapsKey = () => !!BUILD_KEY

/**
 * Load (or reuse) the Google Maps JS API. Resolves with `google.maps`.
 * Uses `keyOverride` (e.g. a key pasted at runtime) when given, else the
 * build-time VITE_GOOGLE_MAPS_API_KEY.
 */
export function loadGoogleMaps (keyOverride) {
  const key = keyOverride || BUILD_KEY
  if (!key) return Promise.reject(new Error('Missing Google Maps API key'))
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) { resolve(window.google.maps); return }
    const cb = '__prestoGmapsReady'
    window[cb] = () => resolve(window.google.maps)
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=marker&loading=async&callback=${cb}`
    s.async = true
    s.onerror = () => { promise = null; reject(new Error('Failed to load Google Maps JS API')) }
    document.head.appendChild(s)
  })
  return promise
}
