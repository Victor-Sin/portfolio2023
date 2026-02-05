"use client"

import localFont from 'next/font/local'
import { Canvas } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import Refraction from "@/components/Refraction";
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect, useState, useRef } from 'react'
import useForceWebGLBackend from "@/hooks/useForceWebGLBackend";
import useMediaQuery from "@/hooks/useMediaQuery";
import "@/app/globals.css";
import ProjectImage from "@/components/ProjectImage";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { NavigationProvider, useNavigationInfo } from "@/contexts/NavigationContext";
import { Stats } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import styles from "@/app/page.module.css";


const parasitype = localFont({
  variable: "--font-parasitype",
  // Chemins de fichiers relatifs à ce fichier (src/app/layout.js) vers public/fonts/...
  src: [
    {
      path: "../../public/fonts/parasitype/Parasitype-ExtraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

const courierNew = localFont({
  variable: "--font-courier-new",
  src: [
    {
        path: "../../public/fonts/courierNew/CourierNewPSMT.ttf",
        weight: "400",
        style: "normal",
      },
      {
        path: "../../public/fonts/courierNew/CourierNewPS-ItalicMT.ttf",
        weight: "400",
        style: "italic",
      },
      {
        path: "../../public/fonts/courierNew/CourierNewPS-BoldMT.ttf",
        weight: "700",
        style: "normal",
      },
      {
        path: "../../public/fonts/courierNew/CourierNewPS-BoldItalicMT.ttf",
        weight: "700",
        style: "italic",
      },
  ],
});


function LayoutBody({ children }) {
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
    <ProjectProvider>
      <ReactLenis root options={{duration: 1.5, lerp: 2}}/>
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
          <Refraction />
          <ProjectImage/>
        </Canvas>
      )}
      <Stats />
      <span className="lateralBar"></span>  
      {children}
      </div>
    </ProjectProvider>
  )
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${parasitype.variable} ${courierNew.variable}`}>
        <NavigationProvider>
          <LayoutBody>{children}</LayoutBody>
        </NavigationProvider>
      </body>
    </html>
  );
}
