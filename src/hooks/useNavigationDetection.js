"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Hook personnalisé pour détecter les informations de navigation
 * 
 * @returns {Object} navigationInfo - Objet contenant :
 *   - currentPage: string - La page actuelle (pathname)
 *   - navigationType: 'reload' | 'external' | 'back' | 'forward' | 'navigate' - Type de navigation
 *   - previousPage: string | null - La page précédente (pathname ou null)
 */
/**
 * Normalise le pathname en enlevant tout hash/ancre
 * @param {string} path - Le pathname à normaliser
 * @returns {string} - Le pathname sans hash
 */
const normalizePathname = (path) => {
    if (!path) return path
    // Enlever tout hash/ancre (#...) du pathname
    return path.split('#')[0]
}

export default function useNavigationDetection() {
    const rawPathname = usePathname()
    // Normaliser le pathname pour enlever tout hash/ancre
    const pathname = normalizePathname(rawPathname)
    const navigationHistoryRef = useRef([])
    const previousPathnameRef = useRef(null)
    const navigationStateRef = useRef({
        isInitialized: false,
        historyLength: 0,
        lastHistoryLength: 0,
        isPopState: false // Flag pour détecter les événements popstate
    })
    
    // État contenant les informations de navigation
    const [navigationInfo, setNavigationInfo] = useState({
        currentPage: null,
        navigationType: null, // 'reload' | 'external' | 'back' | 'forward' | 'navigate'
        previousPage: null
    })

    // Détecter le type de navigation initial (au premier chargement)
    const detectInitialNavigationType = () => {
        if (typeof window === 'undefined' || typeof performance === 'undefined') {
            return 'navigate'
        }

        try {
            const navigationEntries = performance.getEntriesByType('navigation')
            if (navigationEntries.length > 0) {
                const navEntry = navigationEntries[0]
                // Type de navigation selon PerformanceNavigationTiming
                if (navEntry.type === 'reload') {
                    return 'reload'
                } else if (navEntry.type === 'back_forward') {
                    // C'est un back ou forward, on le détectera avec l'historique
                    return 'back_forward'
                } else if (navEntry.type === 'navigate') {
                    // Peut être externe ou interne
                    // Si referrer est différent de l'origine, c'est externe
                    if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
                        return 'external'
                    }
                    return 'navigate'
                }
            }
        } catch (e) {
            console.warn('Navigation detection error:', e)
        }

        // Fallback: vérifier le referrer
        if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
            return 'external'
        }

        return 'navigate'
    }

    // Détecter si c'est un back ou forward en comparant la longueur de l'historique
    const detectBackForward = () => {
        if (typeof window === 'undefined') return null
        
        const currentHistoryLength = window.history.length
        const state = navigationStateRef.current

        if (!state.isInitialized) {
            state.lastHistoryLength = currentHistoryLength
            state.historyLength = currentHistoryLength
            return null
        }

        // Si la longueur de l'historique a diminué ou est restée la même, c'est probablement un back
        // Si elle a augmenté, c'est probablement un forward (rare mais possible)
        // En réalité, on utilise plutôt la position dans notre historique interne
        const currentIndex = navigationHistoryRef.current.indexOf(pathname)
        const previousIndex = navigationHistoryRef.current.indexOf(previousPathnameRef.current)

        if (currentIndex !== -1 && previousIndex !== -1) {
            if (currentIndex < previousIndex) {
                return 'back'
            } else if (currentIndex > previousIndex) {
                return 'forward'
            }
        }

        // Si la longueur de l'historique a diminué, c'est probablement un back
        if (currentHistoryLength < state.lastHistoryLength) {
            return 'back'
        }

        return null
    }

    // Écouter les événements popstate pour détecter back/forward
    useEffect(() => {
        if (typeof window === 'undefined') return

        const handlePopState = (event) => {
            navigationStateRef.current.isPopState = true
            // Le pathname sera mis à jour automatiquement par Next.js
        }

        window.addEventListener('popstate', handlePopState)
        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [])

    // Navigation detection logic
    useEffect(() => {
        if (typeof window === 'undefined') return

        // Initialisation au premier chargement
        if (!navigationStateRef.current.isInitialized) {
            const initialType = detectInitialNavigationType()
            
            // Si c'est un back_forward détecté par Performance API, on essaie de le préciser
            let finalType = initialType
            if (initialType === 'back_forward') {
                // On ne peut pas vraiment savoir au premier chargement si c'est back ou forward
                // On le mettra à jour lors du prochain changement de pathname
                finalType = 'back_forward'
            }

            const referrerPath = document.referrer 
                ? normalizePathname(new URL(document.referrer).pathname)
                : null

            const initialInfo = {
                currentPage: pathname,
                navigationType: finalType,
                previousPage: referrerPath
            }
            setNavigationInfo(initialInfo)
            previousPathnameRef.current = pathname
            navigationHistoryRef.current = [pathname]
            navigationStateRef.current.isInitialized = true
            navigationStateRef.current.historyLength = window.history.length
            navigationStateRef.current.lastHistoryLength = window.history.length
            console.log('Navigation Info (Initial):', initialInfo)
            return
        }

        // Navigation subséquente
        if (previousPathnameRef.current !== pathname) {
            // previousPathnameRef.current contient la page qu'on vient de quitter
            let previousPath = previousPathnameRef.current
            let navType = 'navigate'
            
            // Debug: vérifier les valeurs
            console.log('Navigation detection:', {
                currentPathname: pathname,
                previousPathnameRef: previousPathnameRef.current,
                history: [...navigationHistoryRef.current]
            })

            // Si on a détecté un popstate, c'est un back ou forward
            if (navigationStateRef.current.isPopState) {
                const backForwardType = detectBackForward()
                navType = backForwardType || 'back' // Par défaut back si on ne peut pas déterminer
                navigationStateRef.current.isPopState = false // Reset le flag
            } else {
                // Pour les navigations subséquentes, performance.getEntriesByType('navigation')
                // retourne toujours l'entrée initiale, donc on ne peut pas l'utiliser pour détecter un reload
                // Un reload serait détecté lors de l'initialisation, pas ici
                // Donc si ce n'est pas un popstate, c'est forcément une navigation normale
                navType = 'navigate'
            }

            // Mettre à jour l'historique interne et déterminer la page précédente
            const currentIndex = navigationHistoryRef.current.indexOf(pathname)
            
            // Si c'est un back ou forward, utiliser l'historique pour trouver la page précédente
            if (navType === 'back' || navType === 'forward') {
                // previousPathnameRef.current contient la page qu'on vient de quitter (c'est la page précédente)
                // Mais si c'est null, on doit la trouver dans l'historique
                if (!previousPath || previousPath === null) {
                    // Trouver la page précédente dans l'historique
                    if (currentIndex !== -1) {
                        if (navType === 'back' && currentIndex > 0) {
                            // Pour un back, la page précédente est celle avant dans l'historique
                            previousPath = navigationHistoryRef.current[currentIndex - 1]
                        } else if (navType === 'forward' && currentIndex < navigationHistoryRef.current.length - 1) {
                            // Pour un forward, la page précédente est celle après dans l'historique
                            previousPath = navigationHistoryRef.current[currentIndex + 1]
                        } else {
                            // Si on ne peut pas déterminer, utiliser previousPathnameRef.current même s'il est null
                            previousPath = previousPathnameRef.current
                        }
                    } else {
                        // Si la page actuelle n'est pas dans l'historique, utiliser previousPathnameRef.current
                        previousPath = previousPathnameRef.current
                    }
                }
                // On navigue dans l'historique, on ne change pas l'ordre
            } else if (currentIndex === -1) {
                // Nouvelle page, l'ajouter à l'historique
                navigationHistoryRef.current.push(pathname)
            } else {
                // Navigation normale vers une nouvelle page
                navigationHistoryRef.current.push(pathname)
            }

            const newInfo = {
                currentPage: pathname,
                navigationType: navType,
                previousPage: previousPath
            }
            setNavigationInfo(newInfo)
            previousPathnameRef.current = pathname
            navigationStateRef.current.lastHistoryLength = window.history.length
            console.log('Navigation Info:', newInfo)
        }
    }, [pathname])

    return navigationInfo
}
