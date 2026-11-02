// Downloads for Banner Lab: single files and the ZIP of everything.
import { zipFiles } from '../export/zip.js'
import { canvasBlob } from './canvas.js'

export function saveBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

export const slug = (s) => String(s || 'logo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'logo'

export async function saveCanvas(canvas, filename, type = 'image/png', quality) {
  saveBlob(await canvasBlob(canvas, type, quality), filename)
}

export const saveText = (text, filename, type = 'image/svg+xml') => saveBlob(new Blob([text], { type }), filename)

/**
 * entries: { name, canvas?, type?, quality?, text? }
 * Canvases become PNG/JPEG bytes; text is stored as UTF-8.
 */
export async function saveZip(entries, filename) {
  const files = []
  for (const e of entries) {
    if (e.text != null) { files.push({ name: e.name, data: e.text }); continue }
    const blob = await canvasBlob(e.canvas, e.type || 'image/png', e.quality)
    files.push({ name: e.name, data: new Uint8Array(await blob.arrayBuffer()) })
  }
  saveBlob(zipFiles(files), filename)
}
