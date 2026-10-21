// Convert freshly generated PNG banners to web-sized JPEGs (macOS `sips`) and
// update the manifest. Photos → 2400px wide, abstracts → 1536px. Idempotent.
//
//   node scripts/optimize-generated.mjs [dir=brand-studio/src/assets/imagery/generated]
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.resolve(ROOT, process.argv[2] || 'brand-studio/src/assets/imagery/generated')
const manifestPath = path.join(DIR, 'manifest.json')
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []

let n = 0
for (const entry of manifest) {
  if (!entry.file.endsWith('.png')) continue
  const src = path.join(DIR, entry.file)
  if (!fs.existsSync(src)) continue
  const out = entry.file.replace(/\.png$/, '.jpg')
  const width = entry.kind === 'abstract' ? 1536 : 2400
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '--resampleWidth', String(width), src, '--out', path.join(DIR, out)], { stdio: 'ignore' })
  fs.rmSync(src)
  entry.file = out
  n++
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`Optimized ${n} image(s) in ${path.relative(ROOT, DIR)}`)
