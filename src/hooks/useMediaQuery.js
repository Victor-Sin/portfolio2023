"use client"

import { useState, useEffect } from "react"

/**
 * Hook pour détecter si la largeur de l'écran est inférieure à un seuil donné.
 * Utile pour détecter mobile/tablette/desktop.
 * 
 * @param {number} breakpoint - Largeur seuil en pixels (défaut: 768px pour mobile)
 * @returns {boolean} - true si la largeur est inférieure au seuil, false sinon
 * 
 * @example
 * const isMobile = useMediaQuery(768)
 * const isTablet = useMediaQuery(1024)
 * const isSmallScreen = useMediaQuery(480)
 */
export default function useMediaQuery(breakpoint = 768) {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(() => {
    // SSR: retourner false par défaut, sera mis à jour au montage côté client
    if (typeof window === "undefined") {
      return false
    }
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    // Fonction pour mettre à jour l'état
    const updateMatch = () => {
      setIsBelowBreakpoint(window.innerWidth < breakpoint)
    }

    // Mettre à jour immédiatement au montage (au cas où la valeur SSR serait incorrecte)
    updateMatch()

    // Écouter les changements de taille
    window.addEventListener("resize", updateMatch, { passive: true })

    return () => {
      window.removeEventListener("resize", updateMatch)
    }
  }, [breakpoint])

  return isBelowBreakpoint
}

/**
 * Hook spécialisé pour détecter mobile (seuil à 768px)
 * @returns {boolean} - true si sur mobile
 */
export function useIsMobile() {
  return useMediaQuery(768)
}

/**
 * Hook spécialisé pour détecter tablette et mobile (seuil à 1024px)
 * @returns {boolean} - true si sur tablette ou mobile
 */
export function useIsTabletOrMobile() {
  return useMediaQuery(1024)
}
