import { describe, it, expect } from 'vitest'
import { crc32, zipFiles } from '../export/zip.js'
import { slugify, sponsorAdSizes } from '../export/assetPackage.js'

describe('zip writer', () => {
  it('computes CRC-32', () => {
    expect(crc32(new TextEncoder().encode('hello'))).toBe(0x3610a686)
    expect(crc32(new Uint8Array())).toBe(0)
  })

  it('writes a readable store-only archive', async () => {
    const blob = zipFiles([{ name: 'a.txt', data: 'hi' }, { name: 'dir/b.bin', data: new Uint8Array([1, 2, 3]) }])
    const buf = new DataView(await blob.arrayBuffer())
    expect(buf.getUint32(0, true)).toBe(0x04034b50)
    // End of central directory: 22 bytes at the end, entry count at +10.
    const eocd = buf.byteLength - 22
    expect(buf.getUint32(eocd, true)).toBe(0x06054b50)
    expect(buf.getUint16(eocd + 10, true)).toBe(2)
    // Total = locals (30+name+data each) + central (46+name each) + 22.
    expect(buf.byteLength).toBe(30 + 5 + 2 + 30 + 9 + 3 + 46 + 5 + 46 + 9 + 22)
  })
})

describe('asset package', () => {
  it('slugifies event names', () => {
    expect(slugify('Heartland Invitational Soccer Cup 2027')).toBe('heartland-invitational-soccer-cup-2027')
    expect(slugify('Café · Résumé')).toBe('cafe-resume')
    expect(slugify('')).toBe('event')
  })

  it('collects each sponsor’s placed sizes plus mobile fallbacks', () => {
    const project = {
      pages: { landing: { enabled: true, sections: { ads: { visible: true } } }, browse: { enabled: true }, details: { enabled: false } },
      ads: {
        enabled: true,
        placements: {
          landing: [{ slot: 'landing.afterContent', size: '300x250', count: 3, sponsorIds: ['s1'] }],
          browse: [{ slot: 'browse.rail', size: '160x600', count: 2, sponsorIds: ['s1', 's2'] }],
          details: [{ slot: 'details.bottom', size: '970x250', count: 1, sponsorIds: ['s2'] }],
        },
      },
    }
    const sizes = sponsorAdSizes(project)
    expect([...sizes.get('s1')].sort()).toEqual(['160x600', '300x250', '320x100'])
    expect([...sizes.get('s2')]).toEqual(['160x600']) // details page is off; rail has no mobile unit
  })

  it('exports nothing for ads when ads are off', () => {
    expect(sponsorAdSizes({ ads: { enabled: false } }).size).toBe(0)
  })
})
