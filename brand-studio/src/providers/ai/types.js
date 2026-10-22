// AI generation provider contract. The UI only ever talks to this interface,
// so swapping the mock for Higgsfield, Recraft or Ideogram is a config change.
//
// Artwork is BACKGROUND ONLY. Logos, headlines, dates and buttons stay as live
// DOM elements layered on top (BrandHero / AdCreative) so they remain
// editable, accessible and pixel-sharp. Every prompt says "no text, no logos".

/**
 * @typedef {'concepts'|'variations'|'regenerate'} GenerationKind
 *
 * @typedef {Object} GenerationRequest
 * @property {GenerationKind} kind
 * @property {string} projectId
 * @property {Object} brandKit            colors, typography, keywords, imagery refs
 * @property {Object} event               name, category, city (context for prompts)
 * @property {string[]} [directions]      for 'concepts' — which directions to cover
 * @property {number} [perDirection]      for 'concepts' — concepts per direction (default 2)
 * @property {Object} [concept]           for 'variations' / 'regenerate' — the source concept
 * @property {number} [count]             for 'variations' (default 3)
 * @property {number} [seed]
 *
 * @typedef {'queued'|'running'|'succeeded'|'failed'|'canceled'} JobStatus
 *
 * @typedef {Object} GenerationJob
 * @property {string} id
 * @property {string} provider
 * @property {GenerationKind} kind
 * @property {JobStatus} status
 * @property {number} progress            0..1
 * @property {string} [stage]             human-readable step ("Composing layouts")
 * @property {Concept[]} results
 * @property {{code:string,message:string}} [error]
 * @property {number} cost                credits consumed (0 for mock)
 * @property {string} createdAt
 *
 * @typedef {Object} Concept
 * @property {string} id
 * @property {'signature'|'energy'|'premium'} direction
 * @property {string} title
 * @property {string} rationale
 * @property {'presto'|'centered'} layout  Always centered (Presto standard); legacy values render as 'presto'
 * @property {Object} treatment           { background, foreground, accent, imageId, imageSrc, overlay, pattern }
 * @property {string} headingFont         font id (theme/fonts.js)
 * @property {string} prompt              the background-art prompt sent to the model
 * @property {number} seed
 * @property {string|null} parentId       set on variations
 * @property {number} version
 * @property {string} provider
 * @property {string} model
 * @property {string} createdAt
 *
 * @typedef {Object} AIProvider
 * @property {string} id
 * @property {string} label
 * @property {boolean} available          false when the backend isn't configured
 * @property {(req: GenerationRequest) => Promise<GenerationJob>} createJob
 * @property {(jobId: string) => Promise<GenerationJob>} getJob
 * @property {(jobId: string, cb: (job: GenerationJob) => void) => () => void} subscribe
 * @property {(jobId: string) => Promise<void>} cancelJob
 */

export const JOB_TERMINAL = ['succeeded', 'failed', 'canceled']

export class ProviderNotConfiguredError extends Error {
  constructor(provider) {
    super(`${provider} is not connected yet. Brand Studio generates concepts through a secure EventPipe backend; until that is deployed, use the demo generator.`)
    this.code = 'provider_not_configured'
  }
}
