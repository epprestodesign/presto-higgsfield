// Minimal Node req/res fakes for the server handlers.
import { Readable } from 'node:stream'

export function fakeReq({ method = 'GET', url = '/', headers = {}, body } = {}) {
  const chunks = body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]
  const req = Readable.from(chunks)
  return Object.assign(req, { method, url, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])) })
}

export function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v },
    end(b) { this.body = b; this.ended = true },
    get json() { return JSON.parse(this.body) },
  }
  return res
}
