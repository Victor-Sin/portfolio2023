"use client"
import { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  // Stocker les valeurs dans des refs (ne déclenche pas de re-render)
  const countRef = useRef(1)
  const projectHomeActiveRef = useRef(false)
  
  // Un seul système de listeners pour tous les changements
  const listenersRef = useRef(new Set())
  
  // Fonction pour notifier tous les listeners avec l'état complet
  const notifyListeners = useCallback(() => {
    const state = {
      count: countRef.current,
      projectHomeActive: projectHomeActiveRef.current
    }
    listenersRef.current.forEach(listener => listener(state))
  }, [])
  
  // Fonction pour mettre à jour count
  const setCount = useCallback((newCount) => {
    if (countRef.current !== newCount) {
      countRef.current = newCount
      notifyListeners()
    }
  }, [notifyListeners])
  
  // Fonction pour mettre à jour projectHomeActive
  const setProjectHomeActive = useCallback((newValue) => {
    if (projectHomeActiveRef.current !== newValue) {
      projectHomeActiveRef.current = newValue
      notifyListeners()
    }
  }, [notifyListeners])
  
  // Fonction unique pour s'abonner aux changements
  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener)
    // Retourner une fonction de désabonnement
    return () => listenersRef.current.delete(listener)
  }, [])
  
  // La valeur du context ne change JAMAIS (même référence)
  // Donc le Provider ne re-render jamais à cause du context
  const value = useRef({
    count: countRef.current,
    setCount,
    projectHomeActive: projectHomeActiveRef.current,
    setProjectHomeActive,
    subscribe,
    getCount: () => countRef.current, // Pour lire la valeur sans s'abonner
    getProjectHomeActive: () => projectHomeActiveRef.current // Pour lire la valeur sans s'abonner
  }).current
  
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

// Hook pour lire count (re-render seulement si count change)
export function useProjectCount() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectCount must be used within ProjectProvider')
  }
  
  // État local qui sera mis à jour via subscription
  const [count, setCount] = useState(context.getCount())
  const countRef = useRef(count)
  
  useEffect(() => {
    countRef.current = count
  }, [count])
  
  useEffect(() => {
    // S'abonner aux changements - on ne met à jour que si count change
    const unsubscribe = context.subscribe((state) => {
      if (state.count !== countRef.current) {
        setCount(state.count)
      }
    })
    
    // Mettre à jour avec la valeur actuelle au cas où elle aurait changé
    setCount(context.getCount())
    
    return unsubscribe
  }, [context])
  
  return count
}

// Hook pour setCount (ne re-render JAMAIS)
export function useProjectSetCount() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectSetCount must be used within ProjectProvider')
  }
  return context.setCount
}

// Hook pour lire projectHomeActive (re-render seulement si projectHomeActive change)
export function useProjectHomeActive() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectHomeActive must be used within ProjectProvider')
  }
  
  // État local qui sera mis à jour via subscription
  const [projectHomeActive, setProjectHomeActive] = useState(context.getProjectHomeActive())
  const projectHomeActiveRef = useRef(projectHomeActive)
  
  useEffect(() => {
    projectHomeActiveRef.current = projectHomeActive
  }, [projectHomeActive])
  
  useEffect(() => {
    // S'abonner aux changements - on ne met à jour que si projectHomeActive change
    const unsubscribe = context.subscribe((state) => {
      if (state.projectHomeActive !== projectHomeActiveRef.current) {
        setProjectHomeActive(state.projectHomeActive)
      }
    })
    
    // Mettre à jour avec la valeur actuelle au cas où elle aurait changé
    setProjectHomeActive(context.getProjectHomeActive())
    
    return unsubscribe
  }, [context])
  
  return projectHomeActive
}

// Hook pour setProjectHomeActive (ne re-render JAMAIS)
export function useProjectSetHomeActive() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectSetHomeActive must be used within ProjectProvider')
  }
  return context.setProjectHomeActive
}
