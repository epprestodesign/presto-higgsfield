import { describe, it, expect } from 'vitest'
import { parseHash, buildHash, cleanParams } from '../flows/deepLink.js'

describe('deep links', () => {
  it('round-trips a studio view in a stable order', () => {
    const hash = buildHash('studio', { panel: 'ads', page: 'browse', example: 'heartland', device: 'mobile', dialog: 'export', concept: 2 })
    expect(hash).toBe('#/studio?example=heartland&concept=2&page=browse&device=mobile&panel=ads&dialog=export')
    expect(parseHash(hash)).toEqual({ step: 'studio', params: { example: 'heartland', concept: '2', page: 'browse', device: 'mobile', panel: 'ads', dialog: 'export' } })
  })

  it('handles bare steps and empty hashes', () => {
    expect(parseHash('#/home')).toEqual({ step: 'home', params: {} })
    expect(parseHash('')).toEqual({ step: '', params: {} })
    expect(buildHash('intake', { step: '', page: undefined })).toBe('#/intake')
  })

  it('drops unknown or invalid values', () => {
    expect(cleanParams({ page: 'nope', device: 'mobile', concept: 'x', example: '../evil', foo: 1, dialog: 'export' })).toEqual({ device: 'mobile', dialog: 'export' })
  })
})
