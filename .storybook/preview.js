import { setup } from '@storybook/vue3-vite'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import * as QComponents from 'quasar'

// Icon + font extras
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/roboto-font/roboto-font.css'

// Quasar core styles — imported from SASS source so our brand
// variables (src/css/quasar.variables.scss) are applied.
import 'quasar/src/css/index.sass'

// Our global styles + component-level overrides.
import '../src/css/app.scss'

// Register Quasar as a Vue plugin for every story, then globally
// register every Q* component so any story template can use <q-*>
// tags directly without per-file imports.
setup((app) => {
  // App-level providers (Quasar plugins). These power the imperative
  // patterns used by the design system: Snackbar (Notify), programmatic
  // Dialog, and Backdrop/Loading overlays.
  app.use(Quasar, { plugins: { Notify, Dialog, Loading } })

  for (const [name, component] of Object.entries(QComponents)) {
    if (
      /^Q[A-Z]/.test(name) &&
      component &&
      (component.render || component.setup || component.__name || component.name)
    ) {
      app.component(name, component)
    }
  }
})

/** @type { import('@storybook/vue3-vite').Preview } */
const preview = {
  parameters: {
    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        grey: { name: 'grey', value: '#f5f5f7' },
        dark: { name: 'dark', value: '#141218' }
      }
    },
    // Mobile QA presets — flip any story to a phone width from the toolbar.
    // Primary target is 390 (iPhone 12/13/14); 360 is the small-Android floor and
    // 414 the large-phone ceiling of the 360–414 band we design to. No default is
    // forced, so stories stay responsive/desktop until you pick a viewport (or a
    // story opts in via `globals: { viewport: { value: 'mobile' } }`).
    viewport: {
      options: {
        mobileSm: { name: 'Mobile — 360', styles: { width: '360px', height: '800px' } },
        mobile: { name: 'Mobile — 390 (target)', styles: { width: '390px', height: '844px' } },
        mobileLg: { name: 'Mobile — 414', styles: { width: '414px', height: '896px' } },
        tablet: { name: 'Tablet — 768', styles: { width: '768px', height: '1024px' } },
      },
    },
    // Accessibility (addon-a11y / axe-core). Audit every story against WCAG 2.2
    // level A + AA. The extra 2.1/2.2 tags cover criteria added after 2.0 (e.g.
    // 2.2's focus-appearance / target-size). Findings show in the Accessibility
    // panel mapped to their WCAG success criterion; 'todo' surfaces them without
    // failing local dev (the CI run enforces).
    a11y: {
      test: 'todo',
      config: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Design-system information architecture: order the sidebar the way
    // designers/product think, not alphabetically. Raw Quasar lives under
    // "Catalog" at the bottom for reference during migration.
    options: {
      storySort: {
        order: [
          'Getting Started', ['Introduction', 'Architecture & Conventions', 'User Journey & Build Spec', 'Story Template'],
          'Widgets & Embeds', ['R&D Overview'],
          'Foundations', [
            'Colors', 'Palette', 'Color Contrast', 'Typography', 'Icons', 'Imagery',
            'Spacing', 'Border Radius', 'Elevation', 'Breakpoints', 'Motion',
          ],
          'Components', [
            'Actions', [
              'Button', 'Dialog', 'Modal', 'Side Panel', 'Backdrop',
            ],
            'Forms', [
              'Text Field', 'Text Area', 'Select', 'Autocomplete', 'Checkbox', 'Checkbox Tree',
              'Radio Group', 'Choice Chips', 'Switch', 'Date Picker', 'Time Picker',
              'Slider', 'Range', 'Rating', 'Quantity Stepper', 'Phone Field', 'Transfer List',
            ],
            'Feedback & Status', [
              'Alert', 'Banner', 'Badge', 'Snackbar', 'Toast', 'Progress', 'Skeleton',
            ],
            'Layout & Structure', [
              'Box', 'Card', 'Container', 'Grid', 'Stack', 'Divider', 'Section Header',
              'List', 'List Item', 'Accordion', 'Tabs', 'Table',
            ],
            'Media & Visuals', [
              'Avatar', 'Icon', 'Image List', 'Display Ad', 'Hero Banner', 'Rating',
            ],
            'Typography & Content', [
              'Typography', 'Chip', 'Amenity', 'Tooltip',
            ],
          ],
          'App Shell', [
            'Global Nav & Cart', 'Cart Flyout', 'Cart Behavior', 'Added To Cart', 'Page Frame',
            'Mobile',
          ],
          'Landing Page', [
            'Book Reservation', 'Group Block',
            'Components', ['Teams Booking Widget', 'Core Booking Widget'],
            'Mobile',
          ],
          'Browse Hotels', [
            'Book Reservation', 'Group Block',
            'Components', [
              // Grouped by page region — top bar, left rail, results, right rail, footer.
              'Top Bar', ['Breadcrumbs', 'Results Toolbar'],
              'Left Rail', ['Filter Rail', 'Search & Filters', 'Hotel Map'],
              'Results', [
                'Hotel Listing Card',
                'Result States', ['Book Reservation', 'Group Block', ['Full Results', 'Partial Results', 'No Results', 'Error', 'Loading']],
                'Availability Dialog', 'Empty States', 'Loading States', 'Forms',
              ],
              'Right Rail', ['Display Ads', ['160×600', '160×320', '120×600']],
              'Footer', ['Pagination'],
            ],
            'Mobile',
          ],
          'Hotel Details', [
            'Book Reservation', 'Group Block',
            'Components', [
              // Both flow folders list their components in the SAME order.
              'Book Reservation', ['Rooms', 'Room Card', 'Room Booking Dialog'],
              'Group Block', ['Rooms', 'Room Card', 'Room Booking Dialog'],
              'Photo Gallery', 'Detail Tabs', 'Hotel Summary Header', 'Amenities', 'Policies & Property',
            ],
            'Mobile',
          ],
          'Checkout Experience Expanded', [
            'Overview', ['Book Reservation', 'Group Block'],
          ],
          'Checkout Experience', [
            'Book Reservation', 'Group Block',
            'Components', [
              'Book Reservation', ['Review Order', 'Contact Info', 'Reservation Guests', 'Payment', 'Review Reservation'],
              'Group Block', ['Review Order', 'Contact Info', 'Review Reservation'],
            ],
            'Old Designs',
            'Mobile',
          ],
          'Confirmation', [
            'Book Reservation', 'Group Block',
            'Mobile',
          ],
          '*',
          'Manage Booking', [
            'Account',
          ],
          // Feature workstream — forked team-name touchpoints. Pinned to the very
          // bottom so it reads as a separate R&D area, not part of the rigid flow.
          'Team Name Qualifiers', [
            'Overview',
            'Book Reservation', [
              'Booking Widget',
              'Add a Team',
              'Team Name Select',
              'Checkout Contact & Qualifiers',
              'Order Rail Summary',
              'Confirmation',
            ],
            'Group Block', [
              'Booking Widget',
              'Add a Team',
              'Contact & Teams',
              'Group Block Details',
              'Confirmation',
            ],
          ],
        ],
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
}

export default preview
