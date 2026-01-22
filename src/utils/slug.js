/**
 * Génère un slug à partir d'un titre (utilitaire optionnel)
 * Exemple: "CALENDAR KEMPINSKI 2025" -> "calendar-kempinski-2025"
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Trouve un projet par son slug (utilise le champ slug du JSON)
 */
export function findProjectBySlug(slug, projects) {
  return projects.find(project => project.slug === slug)
}
