import { describe, it, expect } from 'vitest'
import { cutout } from '../../server/cutout.js'

const PNG = 'data:image/png;base64,iVBORw0KGgo='
const res = (status, { type = 'image/png', body = 'PNGDATA', json = {} } = {}) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: () => type },
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  json: async () => json,
})

describe('AI cut-out (Photoroom)', () => {
  it('sends the image with the key and returns a PNG data URL', async () => {
    let sent
    const fetchFn = async (url, opts) => { sent = { url, opts }; return res(200) }
    const r = await cutout(PNG, { apiKey: 'sandbox_k', fetchFn })
    expect(sent.url).toBe('https://sdk.photoroom.com/v1/segment')
    expect(sent.opts.headers['x-api-key']).toBe('sandbox_k')
    expect(sent.opts.body.get('image_file')).toBeTruthy()
    expect(r.src).toMatch(/^data:image\/png;base64,/)
    expect(r.credits).toBe(1)
  })
  it('explains what went wrong', async () => {
    await expect(cutout(PNG, {})).rejects.toMatchObject({ status: 412, code: 'photoroom_not_configured' })
    await expect(cutout('data:text/plain;base64,aGk=', { apiKey: 'k' })).rejects.toMatchObject({ code: 'bad_image' })
    await expect(cutout(PNG, { apiKey: 'k', fetchFn: async () => res(402) })).rejects.toMatchObject({ code: 'photoroom_credits' })
    await expect(cutout(PNG, { apiKey: 'k', fetchFn: async () => res(400, { type: 'application/json', json: { detail: 'Image too small' } }) }))
      .rejects.toThrow(/Image too small/)
  })
})
