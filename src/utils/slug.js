/**
 * Trouve un projet par son slug (utilise le champ slug du JSON)
 */
export function findProjectBySlug(slug, projects) {
  return projects.find(project => project.slug === slug)
}
