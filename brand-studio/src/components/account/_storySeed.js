// Story-only seeding for the account/publishing stories.
import { useSessionStore } from '../../stores/session.js'
import { conceptsFor } from '../../stories/_helpers.js'

/** Give a project its six concepts and select one, so thumbnails look real. */
export function withConcepts(project, selectIndex) {
  const items = conceptsFor(project)
  project.concepts.items = items
  project.concepts.selectedId = items[selectIndex].id
  project.brandKit.direction = items[selectIndex].direction
  return project
}

/**
 * Decorator: seed the session. `signedIn` signs a demo organizer in;
 * `projects` seeds the dashboard ('demo' | 'none').
 */
export const withSession = ({ signedIn = true, projects = 'demo' } = {}) => (story) => ({
  components: { story },
  setup() {
    const session = useSessionStore()
    session.user = signedIn ? { id: 'usr_demo', email: 'dana@heartlandcup.example.com', name: 'Dana Whitaker', provider: 'password' } : null
    if (projects === 'demo') {
      session.seedDemoProjects()
      const [a, b, c] = session.projects
      withConcepts(a, 2)
      withConcepts(b, 0)
      withConcepts(c, 4)
    } else session.projects = []
  },
  template: '<story />',
})
