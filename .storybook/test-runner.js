// Storybook test-runner config — runs an axe-core accessibility audit against
// every story headlessly (the CI WCAG 2.2 AA gate). Mirrors the live addon-a11y
// panel: same WCAG tag set, and it respects each story's `parameters.a11y`
// (stories with `a11y.test: 'off'` or `a11y.disable` are skipped — e.g. the
// Color Contrast audit story, which renders known-failing swatches on purpose).
//
// Blocking vs advisory: by default violations are REPORTED but do not fail the
// run (so the gate can land without blocking deploys on the existing backlog).
// Set A11Y_STRICT=true to make any violation fail the job.
import { getStoryContext } from '@storybook/test-runner'
import { injectAxe, configureAxe, getViolations } from 'axe-playwright'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const STRICT = process.env.A11Y_STRICT === 'true'

export default {
  async preVisit(page) {
    await injectAxe(page)
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context)
    const a11y = storyContext.parameters?.a11y
    if (!a11y || a11y.disable || a11y.test === 'off') return

    await configureAxe(page, { rules: a11y.config?.rules })

    const violations = await getViolations(page, '#storybook-root', {
      runOnly: { type: 'tag', values: WCAG_TAGS },
    })
    if (!violations.length) return

    // Report the RULE per story, not just a count. The previous output only said
    // "Found N a11y violations", so you had to open each story in Storybook to
    // learn what actually failed — which made the backlog impossible to triage,
    // and made run-to-run comparisons unreliable (the only greppable marker was
    // a debug URL that interleaves unpredictably across parallel workers, which
    // reads as flakiness even when the audit itself is deterministic).
    //
    // These lines are machine-readable — `scripts/a11y-report.mjs` groups them:
    //   A11Y:<story id>\t<rule>\t<impact>\t<node count>
    for (const v of violations) {
      console.log(`A11Y:${context.id}\t${v.id}\t${v.impact ?? 'n/a'}\t${v.nodes.length}`)
    }
    const title = `${storyContext.title} › ${storyContext.name}`
    const summary = violations.map((v) => `${v.id}×${v.nodes.length}`).join(', ')
    console.log(`[a11y] ${title} — ${summary}`)

    if (STRICT) {
      throw new Error(`${title} has ${violations.length} accessibility violation(s): ${summary}`)
    }
  },
}
