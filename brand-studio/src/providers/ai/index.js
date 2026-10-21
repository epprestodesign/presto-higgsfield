// Provider registry. `VITE_AI_PROVIDER` picks the default; anything that is
// not available (no backend configured) falls back to the mock.
import { createMockProvider } from './mockProvider.js'
import { createRemoteProvider } from './remoteProvider.js'

export const PROVIDER_CATALOG = [
  { id: 'mock', label: 'Demo generator', model: 'mock-v1', note: 'Free, instant sample concepts. No AI credits used.' },
  { id: 'higgsfield', label: 'Higgsfield Marketing Studio', model: 'flare', note: 'Photographic + promotional banner art.' },
  { id: 'recraft', label: 'Recraft', model: 'recraft-v3', note: 'Vector-style graphics and patterns.' },
  { id: 'ideogram', label: 'Ideogram', model: 'ideogram-v3', note: 'Bold graphic compositions.' },
]

let mock = null
const remotes = {}

export function getProvider(id = import.meta.env?.VITE_AI_PROVIDER || 'mock', opts = {}) {
  if (id !== 'mock') {
    const meta = PROVIDER_CATALOG.find((p) => p.id === id)
    if (meta) {
      remotes[id] ||= createRemoteProvider({ ...meta, ...opts })
      if (remotes[id].available) return remotes[id]
    }
  }
  mock ||= createMockProvider(opts)
  return mock
}

export const providerStatus = () =>
  PROVIDER_CATALOG.map((p) => ({ ...p, available: p.id === 'mock' || !!import.meta.env?.VITE_AI_API_BASE }))

export { createMockProvider }
