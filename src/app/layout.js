"use client"

import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local'
import { Canvas } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import Refraction from "@/components/Refraction";
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect } from 'react'
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
  const lenis = useLenis((lenis) => {
    // called every scroll
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  const navigationInfo = useNavigationInfo()
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
      <Canvas 
        style={{position: "fixed", top: 0, left: 0, width: "100svw", height: "100svh", background: "black", zIndex: 0}}
        gl={async (props) => {
          const renderer = new WebGPURenderer(props)
          await renderer.init()
          return renderer
        }}
      >
        <Refraction />
        <ProjectImage/>
      </Canvas>
      <span className="lateralBar"></span>  
      {children}
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
