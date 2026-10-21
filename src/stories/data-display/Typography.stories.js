/**
 * DATA DISPLAY / Typography  →  Quasar: NONE (custom tokens + classes)
 *
 * Quasar has no <Typography> component. It ships utility classes
 * (text-h1..h6, text-subtitle1/2, text-body1/2, text-caption, text-overline).
 * We extend those in src/css/typography.scss with brand tokens + .text-display
 * and .text-lead. Use classes — not a component — for text.
 */
const meta = {
  title: 'Components/Typography & Content/Typography',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## Overview
**Typography** defines the type scale and text styles. There is no Quasar
component for this; we use **CSS classes + design tokens**. This keeps text
markup semantic (\`<h1>\`, \`<p>\`) while styling stays centralized.

## Props / usage notes
Apply classes directly:
| Class | Use |
| --- | --- |
| \`.text-display\` | Hero / marketing headline (DS token) |
| \`.text-h1\`…\`.text-h6\` | Headings (Quasar, brand-tuned) |
| \`.text-lead\` | Intro paragraph (DS token) |
| \`.text-subtitle1\` / \`.text-subtitle2\` | Section subtitles |
| \`.text-body1\` / \`.text-body2\` | Body copy |
| \`.text-caption\` | Captions / helper text |
| \`.text-overline\` | Eyebrow labels |
| \`.text-weight-{light,regular,medium,bold}\` | Weight |
| \`.text-{primary,secondary,accent,grey-7,…}\` | Color tokens |

Tokens live in \`src/css/typography.scss\` (\`--ds-text-display\`, \`--ds-font-family\`).

## UX guidance
- Use **one** \`.text-display\` or \`.text-h1\` per page.
- Don't skip heading levels for styling — pick the right \`<h*>\` then a class.
- Keep body line length ~60–75 characters for readability.

## Do / Don't
- ✅ Style with classes; keep semantic HTML tags.
- ✅ Adjust the scale centrally in \`typography.scss\`.
- ❌ Don't hard-code font sizes inline in components.
- ❌ Don't use a heading class just to make text big.

## Quasar mapping
\`Typography → custom tokens/classes\` (Quasar classes + DS \`typography.scss\`). No component.
`,
      },
    },
  },
}
export default meta

/** Basic example — a heading with a lead paragraph. */
export const Basic = {
  render: () => ({
    template: `
      <div style="max-width:640px">
        <h1 class="text-h2 q-mb-sm">Design that scales</h1>
        <p class="text-lead">A consistent type system keeps every prototype on-brand.</p>
      </div>`,
  }),
}

/** The full type scale (states = sizes here). */
export const Scale = {
  parameters: { docs: { description: { story: 'The complete type scale, largest to smallest.' } } },
  render: () => ({
    template: `
      <div class="column q-gutter-sm" style="max-width:720px">
        <div class="text-display">Display</div>
        <div class="text-h1">Heading 1</div>
        <div class="text-h2">Heading 2</div>
        <div class="text-h3">Heading 3</div>
        <div class="text-h4">Heading 4</div>
        <div class="text-h5">Heading 5</div>
        <div class="text-h6">Heading 6</div>
        <div class="text-subtitle1">Subtitle 1</div>
        <div class="text-subtitle2">Subtitle 2</div>
        <div class="text-body1">Body 1 — the default paragraph size.</div>
        <div class="text-body2">Body 2 — slightly smaller body text.</div>
        <div class="text-caption">Caption — helper and metadata text.</div>
        <div class="text-overline">OVERLINE</div>
      </div>`,
  }),
}

/** Variants: weights and color tokens. */
export const Variants = {
  render: () => ({
    template: `
      <div class="column q-gutter-xs">
        <div class="text-body1 text-weight-light">Weight: light</div>
        <div class="text-body1 text-weight-regular">Weight: regular</div>
        <div class="text-body1 text-weight-medium">Weight: medium</div>
        <div class="text-body1 text-weight-bold">Weight: bold</div>
        <div class="text-body1 text-primary">Color: primary</div>
        <div class="text-body1 text-accent">Color: accent</div>
        <div class="text-body1 text-negative">Color: negative</div>
        <div class="text-body1 text-grey-7">Color: grey-7</div>
      </div>`,
  }),
}
