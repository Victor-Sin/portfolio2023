"use client"

import { useState, useEffect } from "react"

/**
 * Indique si le backend WebGL 2 doit être forcé (WebGPU désactivé).
 * Utile quand WebGPU pose des problèmes de perfs (Safari, Chrome/Chromium).
 * @returns {{ forceWebGL: boolean, ready: boolean }}
 */
export default function useForceWebGLBackend() {
  const [state, setState] = useState({ forceWebGL: false, ready: false })

  useEffect(() => {
    if (typeof navigator === "undefined") return
    const ua = navigator.userAgent
    const vendor = navigator.vendor ?? ""

    // WebGPU non disponible → forcer WebGL
    const hasWebGPU = !!navigator.gpu

    const isSafari =
      (/^((?!chrome|android).)*safari/i.test(ua) && !/Chromium|CriOS/.test(ua)) ||
      /Apple/.test(vendor) ||
      (/Safari/.test(ua) && !/Chrome/.test(ua))

    //const isChromium = /Chrome|Chromium|Edg|OPR/i.test(ua)
    const isChromium = false

    const shouldForce = !hasWebGPU || !!isSafari || !!isChromium

    console.log({ hasWebGPU, isSafari, isChromium, shouldForce }, "FORCE WEBGL BACKEND")

    setState({ forceWebGL: shouldForce, ready: true })
  }, [])

  return state
}
