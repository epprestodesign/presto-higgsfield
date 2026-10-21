// Story smoke + interaction test runner (Playwright).
//
// Renders every story whose id matches the filter, waits for it to finish
// (including its play function), and fails on render errors, play-function
// failures, or uncaught page errors. Stand-in for @storybook/test-runner,
// which currently fails under Node 25 / Jest 30 ("module.register() is not
// supported in Jest").
//
//   pnpm storybook                     # in another terminal
//   node scripts/run-stories.mjs [idPrefix=brand-studio | '*' for all] [url=http://localhost:6006]
import { chromium } from 'playwright'

const ARG = process.argv[2] || 'brand-studio'
const PREFIX = ARG === '*' ? '' : ARG
const BASE = (process.argv[3] || 'http://localhost:6006').replace(/\/$/, '')
const CONCURRENCY = 4
const TIMEOUT_MS = 45000

const index = await fetch(`${BASE}/index.json`).then((r) => r.json())
const stories = Object.values(index.entries).filter((e) => e.type === 'story' && e.id.startsWith(PREFIX))
console.log(`Running ${stories.length} stories matching "${PREFIX}"…`)

const browser = await chromium.launch()
const results = []

async function run(story) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  // Collect Storybook channel events from inside the preview.
  await page.addInitScript(() => {
    window.__bsEvents = []
    const attach = () => {
      const ch = window.__STORYBOOK_ADDONS_CHANNEL__
      if (!ch) return setTimeout(attach, 20)
      for (const ev of ['storyFinished', 'storyRendered', 'playFunctionThrewException', 'storyThrewException', 'storyErrored', 'storyMissing']) {
        ch.on(ev, (payload) => window.__bsEvents.push({ ev, payload: JSON.parse(JSON.stringify(payload ?? null, (k, v) => (v instanceof Error ? { message: v.message } : v))) }))
      }
    }
    attach()
  })
  const started = Date.now()
  let status = 'pass'
  let detail = ''
  try {
    await page.goto(`${BASE}/iframe.html?id=${story.id}&viewMode=story`, { timeout: TIMEOUT_MS })
    await page.waitForFunction(() => window.__bsEvents?.some((e) => ['storyFinished', 'playFunctionThrewException', 'storyThrewException', 'storyErrored', 'storyMissing'].includes(e.ev)), null, { timeout: TIMEOUT_MS })
    const events = await page.evaluate(() => window.__bsEvents)
    const bad = events.find((e) => ['playFunctionThrewException', 'storyThrewException', 'storyErrored', 'storyMissing'].includes(e.ev))
    const finished = events.find((e) => e.ev === 'storyFinished')
    if (bad) { status = 'fail'; detail = `${bad.ev}: ${bad.payload?.message || bad.payload?.title || JSON.stringify(bad.payload).slice(0, 300)}` }
    else if (finished?.payload?.status === 'error') { status = 'fail'; detail = 'storyFinished with error status' }
    else if (pageErrors.length) { status = 'fail'; detail = `pageerror: ${pageErrors[0]}` }
  } catch (e) {
    status = 'fail'
    detail = `timeout/exception: ${e.message.split('\n')[0]}`
  }
  await page.close()
  results.push({ id: story.id, status, detail, ms: Date.now() - started })
  process.stdout.write(status === 'pass' ? '.' : 'F')
}

const queue = [...stories]
await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (queue.length) await run(queue.shift()) }))
await browser.close()

const failed = results.filter((r) => r.status === 'fail')
console.log(`\n\n${results.length - failed.length} passed, ${failed.length} failed`)
for (const f of failed) console.log(`  ✗ ${f.id}\n      ${f.detail}`)
process.exit(failed.length ? 1 : 0)
