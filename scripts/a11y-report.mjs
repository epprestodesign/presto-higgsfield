// Groups the accessibility audit's per-story output into a triage report, so the
// backlog can be read as "which rules, which components" rather than a flat list
// of ~120 failing stories.
//
//   pnpm a11y:ci > a11y.log 2>&1 || true
//   node scripts/a11y-report.mjs a11y.log
//
// Reads the `A11Y:<story id>\t<rule>\t<impact>\t<nodes>` lines emitted by
// .storybook/test-runner.js. Pass --json for machine-readable output.
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const file = args.find((a) => !a.startsWith('--'))

if (!file) {
  console.error('usage: node scripts/a11y-report.mjs <a11y-log> [--json]')
  process.exit(2)
}

// Strip ANSI colour codes and the test-runner's "[A11Y] " concurrently prefix.
const ANSI = /\[[0-9;]*m/g
const rows = readFileSync(file, 'utf8')
  .replace(ANSI, '')
  .split('\n')
  .map((l) => l.replace(/^\[A11Y\]\s*/, '').trim())
  .filter((l) => l.startsWith('A11Y:'))
  .map((l) => {
    const [story, rule, impact, nodes] = l.slice('A11Y:'.length).split('\t')
    return { story, rule, impact, nodes: Number(nodes) || 0 }
  })

if (!rows.length) {
  console.error(`No "A11Y:" lines found in ${file}. Did the run use the current .storybook/test-runner.js?`)
  process.exit(1)
}

// De-duplicate: a story can be visited once per browser project.
const seen = new Set()
const unique = rows.filter((r) => {
  const k = `${r.story}\t${r.rule}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

// The top-level Storybook section, e.g. "browse-hotels-components-..." → the
// area owning the component. Good enough to show where a rule concentrates.
const area = (story) => story.split('--')[0].split('-').slice(0, 2).join('-')

const byRule = new Map()
for (const r of unique) {
  if (!byRule.has(r.rule)) byRule.set(r.rule, { rule: r.rule, impact: r.impact, stories: [], nodes: 0 })
  const e = byRule.get(r.rule)
  e.stories.push(r.story)
  e.nodes += r.nodes
  // Keep the most severe impact seen for the rule.
  const order = ['minor', 'moderate', 'serious', 'critical']
  if (order.indexOf(r.impact) > order.indexOf(e.impact)) e.impact = r.impact
}

const ranked = [...byRule.values()].sort((a, b) => b.stories.length - a.stories.length)
const storiesAffected = new Set(unique.map((r) => r.story))

if (asJson) {
  console.log(JSON.stringify({
    totals: { rules: ranked.length, stories: storiesAffected.size, findings: unique.length },
    rules: ranked.map((r) => ({ rule: r.rule, impact: r.impact, stories: r.stories.length, nodes: r.nodes, examples: r.stories.slice(0, 5) })),
  }, null, 2))
  process.exit(0)
}

console.log('ACCESSIBILITY BACKLOG (WCAG 2.2 AA)')
console.log('='.repeat(72))
console.log(`${storiesAffected.size} stories affected · ${ranked.length} distinct rules · ${unique.length} story/rule findings`)
console.log()
console.log('BY RULE (most widespread first)')
console.log('-'.repeat(72))
console.log('rule'.padEnd(34) + 'impact'.padEnd(11) + 'stories'.padStart(8) + 'nodes'.padStart(8))
for (const r of ranked) {
  console.log(r.rule.padEnd(34) + String(r.impact).padEnd(11) + String(r.stories.length).padStart(8) + String(r.nodes).padStart(8))
}

console.log()
console.log('WHERE EACH RULE CONCENTRATES')
console.log('-'.repeat(72))
for (const r of ranked) {
  const areas = new Map()
  for (const s of r.stories) areas.set(area(s), (areas.get(area(s)) || 0) + 1)
  const top = [...areas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([a, n]) => `${a} (${n})`).join(', ')
  console.log(`${r.rule}\n    ${top}`)
  console.log(`    e.g. ${r.stories.slice(0, 2).join(', ')}`)
}
