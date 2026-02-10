"use client"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const LoaderContext = createContext(null)

// Temps minimum de chargement simulé (en ms)
// Le loader reste visible au moins ce temps, même si tout est prêt avant
const MIN_LOADING_TIME = 2000

export function LoaderProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const minTimeReady = useRef(false)
  const sceneReady = useRef(false)

  const checkAndSetLoaded = useCallback(() => {
    if (minTimeReady.current && sceneReady.current) {
      setIsLoaded(true)
    }
  }, [])

  // Timer minimum simulé
  useEffect(() => {
    const timer = setTimeout(() => {
      minTimeReady.current = true
      checkAndSetLoaded()
    }, MIN_LOADING_TIME)
    return () => clearTimeout(timer)
  }, [checkAndSetLoaded])

  // Appelé depuis le Canvas quand la scène 3D a rendu ses premiers frames
  // (shaders compilés + textures chargées via Suspense de useTexture)
  const setSceneReady = useCallback(() => {
    sceneReady.current = true
    checkAndSetLoaded()
  }, [checkAndSetLoaded])

  return (
    <LoaderContext.Provider value={{ isLoaded, setSceneReady }}>
      {children}
    </LoaderContext.Provider>
  )
}

// Hook complet
export function useLoader() {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error('useLoader must be used within LoaderProvider')
  }
  return context
}

// Hook lecture seule : true quand le chargement est terminé
export function useIsLoaded() {
  return useLoader().isLoaded
}

// Hook pour signaler que la scène 3D est prête (appeler depuis un composant dans le Canvas)
export function useSetSceneReady() {
  return useLoader().setSceneReady
}
