"use client"

import { createContext, useContext } from "react"
import useNavigationDetection from "@/hooks/useNavigationDetection"

const NavigationContext = createContext(null)

/**
 * Provider qui appelle useNavigationDetection() une seule fois
 * et partage la même valeur à tous les composants consommateurs.
 */
export function NavigationProvider({ children }) {
  const navigationInfo = useNavigationDetection()

  return (
    <NavigationContext.Provider value={navigationInfo}>
      {children}
    </NavigationContext.Provider>
  )
}

/**
 * Hook pour accéder aux infos de navigation partagées.
 * Même valeur pour tous les composants qui l'utilisent.
 *
 * @returns {Object} navigationInfo - { currentPage, navigationType, previousPage }
 */
export function useNavigationInfo() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigationInfo must be used within NavigationProvider")
  }
  return context
}
