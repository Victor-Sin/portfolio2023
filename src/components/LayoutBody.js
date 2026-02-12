"use client"

import "@/lib/webgpu-polyfill";
import { Canvas, useFrame } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import Refraction from "@/components/Refraction";
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect, useState, useRef, startTransition } from 'react'
import useForceWebGLBackend from "@/hooks/useForceWebGLBackend";
import ProjectImage from "@/components/ProjectImage";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { useNavigationInfo } from "@/contexts/NavigationContext";
import { LoaderProvider, useIsLoaded, useSetSceneReady } from "@/contexts/LoaderContext";
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
  const loaderRef = useRef(null)

  // Quand chargé : fade out du loader
  useEffect(() => {
    if (!isLoaded) return

    const tween = gsap.to(loaderRef.current, {
      opacity: 0,
      duration: 1,
      delay: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        if (loaderRef.current) {
          loaderRef.current.style.pointerEvents = 'none'
        }
      }
    })

    return () => tween.kill()
  }, [isLoaded])

  return (
    <div className={styles.loader} ref={loaderRef}>
        <span className={styles.middleLine}></span>
       <div className={styles.loaderContent}>  
        <div className={styles.loaderText}>
          <span>LOADING</span>
         </div>
      </div>
    </div>
  )
}

export default function LayoutBody({ children }) {
  const { forceWebGL, ready } = useForceWebGLBackend()
  const [canvasDeferred, setCanvasDeferred] = useState(false)

  // Différer le montage du Canvas pour laisser le HTML/CSS se peindre
  // avant que la compilation shader WebGPU ne bloque le main thread.
  // Double RAF : frame 1 = React commit, frame 2 = browser paint.
  // startTransition marque le montage comme non-urgent.
  useEffect(() => {
    if (ready) {
      let rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          startTransition(() => setCanvasDeferred(true))
        })
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [ready])
  const lenis = useLenis()


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
        <div className={styles.canvasContainer}>
        {ready && canvasDeferred && (
          <Canvas 
            style={{position: "fixed", top: 0, left: 0, width: "100dvw", height: "100lvh", background: "black", zIndex: 0}}
            gl={async (props) => {
              const renderer = new WebGPURenderer({ ...props, forceWebGL })
              await renderer.init()
              return renderer
            }}
            dpr={1.25}
          >
            <SceneReadyDetector />
            <Refraction />
             <ProjectImage/>
           </Canvas>
        )}
        <Loader />
        <span className={styles.lateralBar}></span>  
        {children}
        </div>
      </ProjectProvider>
    </LoaderProvider>
  )
}
