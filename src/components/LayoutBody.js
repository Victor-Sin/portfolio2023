"use client"

import { Canvas, useFrame } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import Refraction from "@/components/Refraction";
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect, useState, useRef } from 'react'
import useForceWebGLBackend from "@/hooks/useForceWebGLBackend";
import useMediaQuery from "@/hooks/useMediaQuery";
import ProjectImage from "@/components/ProjectImage";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { useNavigationInfo } from "@/contexts/NavigationContext";
import { LoaderProvider, useIsLoaded, useSetSceneReady } from "@/contexts/LoaderContext";
import { Stats } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import styles from "@/app/page.module.css";


// Détecte quand la scène 3D a rendu ses premiers frames
// (= shaders compilés + textures chargées via Suspense de useTexture)
function SceneReadyDetector() {
  const setSceneReady = useSetSceneReady()
  const frameCount = useRef(0)
  const signaled = useRef(false)

  useFrame(() => {
    if (!signaled.current) {
      frameCount.current++
      // Attendre 2 frames : le 1er appel useFrame précède le rendu,
      // le 2e frame garantit que le pipeline GPU est créé
      if (frameCount.current >= 2) {
        signaled.current = true
        setSceneReady()
      }
    }
  })

  return null
}

// Overlay HTML plein écran — masque tout pendant le chargement initial
// La couleur correspond à bgColors[0] du shader Refraction (#FDE7C5)
function Loader() {
  const isLoaded = useIsLoaded()
  const [shouldRender, setShouldRender] = useState(() => !isLoaded)

  useEffect(() => {
    if (isLoaded) {
      // Retirer du DOM après la fin de la transition CSS
      const timer = setTimeout(() => setShouldRender(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  if (!shouldRender) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#FDE7C5',
      zIndex: 9999,
      opacity: isLoaded ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      pointerEvents: isLoaded ? 'none' : 'all',
    }} />
  )
}

export default function LayoutBody({ children }) {
  const { forceWebGL, ready } = useForceWebGLBackend()
  const isMobile = useMediaQuery(768)
  const lenis = useLenis((lenis) => {
    // called every scroll
  })


  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  const navigationInfo = useNavigationInfo()
  const previousPageRef = useRef(navigationInfo.currentPage)
  
  // Reset scroll et recalculer les dimensions de Lenis lors des changements de page
  // Basé sur la doc Lenis: autoResize utilise ResizeObserver mais ne capte pas 
  // toujours les changements de contenu SPA, donc on appelle resize() manuellement
  useEffect(() => {
    if (!lenis) return
    
    const fromProjectPage = previousPageRef.current?.includes('project')
    const toProjectPage = navigationInfo.currentPage?.includes('project')
    const pageChanged = previousPageRef.current !== navigationInfo.currentPage
    
    previousPageRef.current = navigationInfo.currentPage
    
    // Si on change de type de page (projet <-> home)
    if (pageChanged && fromProjectPage !== toProjectPage) {
      // Reset immédiat du scroll
      lenis.scrollTo(0, { immediate: true })
      
      // Double RAF pour garantir que le DOM est rendu (technique standard)
      // Frame 1: React a commité les changements
      // Frame 2: Le navigateur a peint le nouveau contenu
      let rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          lenis.resize()
          
          // Gérer le hash si présent (ex: /#work)
          const hash = window.location.hash?.substring(1)
          if (!toProjectPage && hash) {
            const element = document.getElementById(hash)
            if (element) {
              lenis.scrollTo(element, { offset: 0 })
            }
          }
        })
      })
      
      return () => cancelAnimationFrame(rafId)
    }
  }, [lenis, navigationInfo.currentPage])
  useGSAP(() => {
    const navType = navigationInfo.navigationType
    const currentPage = navigationInfo.currentPage
    const previousPage = navigationInfo.previousPage
    console.log(navType, currentPage, previousPage,"PAGE NAVIGATION")

    if(navType === 'navigate'){
        gsap.fromTo(`.${styles.container}`, {
          opacity: 0,
        }, {
            opacity: 1,
            duration: 2,
            ease: "power3.out",
            delay: 1,
        })
    }

},[navigationInfo.navigationType,navigationInfo.currentPage,navigationInfo.previousPage])

  return (
    <LoaderProvider>
      <ProjectProvider>
        <ReactLenis root options={{ duration: 2}}/>
        <Loader />
        <div className={styles.canvasContainer}>
        {ready && (
          <Canvas 
            style={{position: "fixed", top: 0, left: 0, width: "100dvw", height: "100lvh", background: "black", zIndex: 0}}
            gl={async (props) => {
              const renderer = new WebGPURenderer({ ...props, forceWebGL })
              await renderer.init()
              return renderer
            }}
            dpr={isMobile ? 1 : 1.25}
          >
            <SceneReadyDetector />
            <Refraction />
             <ProjectImage/>
           </Canvas>
        )}
        <Stats />
        <span className="lateralBar"></span>  
        {children}
        </div>
      </ProjectProvider>
    </LoaderProvider>
  )
}
