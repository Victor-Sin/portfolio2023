import {useMemo, useRef, useEffect, useCallback} from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

export default function useDataTextureStatic(
    simulationSize = 256,
    uvClassic = false,
    radius = 0.075,
    decayFactor = 0.98,
    strength = 0.5,
    influenceGain = 1.3,
    influenceGamma = 1
){
    const {gl} = useThree()
    const simWidth = simulationSize
    const simHeight = simulationSize

    // Pointer tracking refs - updated without triggering re-renders
    const pointerVelocityRef = useRef({ x: 0, y: 0 })
    const pointerRef = useRef({ x: 0, y: 0 })
    const normalizedPointerRef = useRef({ x: 0, y: 0 })
    const canvasBoundsRef = useRef(null)
    const dataTextureRef = useRef(null)
    const resizeRafRef = useRef(0)
    const influenceScaleRef = useRef({ x: 1, y: 1 })
    const EPSILON_ASPECT = 1e-6

    const getCursorScales = useCallback((aspect) => {
        const safeAspect = Math.max(EPSILON_ASPECT, aspect || 1)
        return {
            // Match Refraction.js (592-598):
            // cursorCanonical = vec2(ndcX, ndcY / aspectSafe)
            x: 1,
            y: safeAspect
        }
    }, [EPSILON_ASPECT])

    // Création unique de la texture (aucune réallocation pendant le resize)
    const createTexture = useCallback(() => {
        if (dataTextureRef.current) return dataTextureRef.current

        const data = new Float32Array(simWidth * simHeight * 4)
        for (let i = 0; i < simWidth * simHeight; i++) {
            const idx = i * 4
            data[idx] = 0
            data[idx + 1] = 0
            data[idx + 2] = 0
            data[idx + 3] = 1.0
        }

        const newTexture = new THREE.DataTexture(
            data,
            simWidth,
            simHeight,
            THREE.RGBAFormat,
            THREE.FloatType
        )
        newTexture.minFilter = THREE.NearestFilter
        newTexture.magFilter = THREE.NearestFilter
        newTexture.needsUpdate = true

        dataTextureRef.current = newTexture
        return newTexture
    }, [simHeight, simWidth])

    // Met a jour uniquement les bounds (independant de la texture)
    const updateCanvasMetrics = useCallback(() => {
        const canvas = gl.domElement
        if (canvas) {
            canvasBoundsRef.current = canvas.getBoundingClientRect()
        }
    }, [gl])

    // Creation initiale
    const dataTexture = useMemo(() => {
        updateCanvasMetrics()
        return createTexture()
    }, [createTexture, updateCanvasMetrics])

    // Resize: mise a jour des metrics seulement
    useEffect(() => {
        const handleResize = () => {
            if (resizeRafRef.current) {
                cancelAnimationFrame(resizeRafRef.current)
            }
            resizeRafRef.current = requestAnimationFrame(() => {
                updateCanvasMetrics()
                // Recaler le centre pointeur apres resize (repere NDC [-1, 1])
                normalizedPointerRef.current.x = 0
                normalizedPointerRef.current.y = 0
                pointerRef.current.x = 0
                pointerRef.current.y = 0
                pointerVelocityRef.current.x = 0
                pointerVelocityRef.current.y = 0
                resizeRafRef.current = 0
            })
        }

        window.addEventListener("resize", handleResize, { passive: true })
        return () => {
            window.removeEventListener("resize", handleResize)
            if (resizeRafRef.current) {
                cancelAnimationFrame(resizeRafRef.current)
                resizeRafRef.current = 0
            }
        }
    }, [updateCanvasMetrics])

    function updateTexture(mousePosition){
        if(dataTexture){
            let bounds = canvasBoundsRef.current
            if (!bounds) {
                updateCanvasMetrics()
                bounds = canvasBoundsRef.current
                if (!bounds) {
                    return // Pas de canvas disponible, skip cette frame
                }
            }

            // mousePosition (R3F pointer) arrive en NDC [-1, 1].
            // On reprojecte via les bounds canvas puis on conserve un repere NDC [-1, 1].
            const clientX = ((mousePosition.x + 1) * 0.5) * bounds.width + bounds.left
            const clientY = ((1 - (mousePosition.y + 1) * 0.5) * bounds.height) + bounds.top
            const normalizedX = ((clientX - bounds.left) / bounds.width) * 2 - 1
            const normalizedY = (1 - ((clientY - bounds.top) / bounds.height)) * 2 - 1

            // Aligne l'interaction CPU sur le sampling shader:
            // ndcX inchange, ndcY divise par aspect.
            const aspect = bounds.width > 0 && bounds.height > 0
                ? bounds.width / bounds.height
                : 1
            const { x: scaleX, y: scaleY } = getCursorScales(aspect)
            influenceScaleRef.current.x = scaleX
            influenceScaleRef.current.y = scaleY

            normalizedPointerRef.current.x = Math.min(1, Math.max(-1, normalizedX / scaleX))
            normalizedPointerRef.current.y = Math.min(1, Math.max(-1, normalizedY / scaleY))
            frameUpdateFalloff()
        }
    }

    function frameUpdateFalloff(){
        const dt = dataTexture
        if (!dt) return
        if (!dt.image || !dt.image.data) return
        
        const data = dt.image.data
        const h = simHeight
        const bounds = canvasBoundsRef.current
        const aspect = bounds && bounds.width > 0 && bounds.height > 0
            ? bounds.width / bounds.height
            : 1
        
        // Mise à jour de la vélocité du pointeur
        const pointerNormX = normalizedPointerRef.current.x
        const pointerNormY = normalizedPointerRef.current.y
        
        pointerVelocityRef.current.x = pointerNormX - pointerRef.current.x
        pointerVelocityRef.current.y = pointerNormY - pointerRef.current.y
        
        pointerRef.current.x = pointerNormX
        pointerRef.current.y = pointerNormY
        
        // Précalculs (hors boucle)
        const { x: scaleX, y: scaleY } = getCursorScales(aspect)
        influenceScaleRef.current.x = scaleX
        influenceScaleRef.current.y = scaleY
        // Rayon de reference en espace "vue corrigee" (cercle constant a l'ecran)
        const baseRadius = Math.max(1, simWidth * radius )
        // Rayon en espace texture (pour la bounding box)
        const mouseRadiusX = Math.max(1, baseRadius  * scaleX/scaleY  )
        const mouseRadiusY = Math.max(1, baseRadius / scaleX/ scaleY  )

        const cellX = uvClassic
            ? pointerRef.current.x * simWidth
            : (1 + pointerRef.current.x) * 0.5 * simWidth
        const cellY = uvClassic
            ? pointerRef.current.y * h
            : (1 + pointerRef.current.y) * 0.5 * h
        
        // Bounding box pour limiter la zone d'influence
        const minX = Math.max(0, Math.floor(cellX - mouseRadiusX))
        const maxX = Math.min(simWidth, Math.ceil(cellX + mouseRadiusX ))
        const minY = Math.max(0, Math.floor(cellY - mouseRadiusY))
        const maxY = Math.min(h, Math.ceil(cellY + mouseRadiusY))
        
        // Metrique isotrope derivee directement des rayons (171-172),
        // afin de conserver un cercle quel que soit l'aspect ratio.
        const isoScaleX = baseRadius / mouseRadiusX
        const isoScaleY = baseRadius / mouseRadiusY

        // Précalcul vélocité dans le meme espace isotrope que la distance radiale.
        const vxGrid = pointerVelocityRef.current.x * isoScaleX * (simWidth / 2) 
        const vyGrid = -pointerVelocityRef.current.y * isoScaleY * (h / 2)
        const speedGrid = Math.hypot(vxGrid, vyGrid)
        const vxCurved = Math.sign(vxGrid) * Math.pow(Math.abs(vxGrid ), influenceGamma)
        const vyCurved = Math.sign(vyGrid) * Math.pow(Math.abs(vyGrid), influenceGamma)
        const speedCurved = Math.pow(speedGrid, influenceGamma)
        const len = Math.hypot(vxCurved, vyCurved) || 1
        const ndx = vxCurved / len
        const ndy = vyCurved / len
        
        // Une seule passe : decay + influence dans la bounding box
        for (let y = 0; y < h; y++) {
            const rowOffset = y * simWidth * 4
            const inYRange = y >= minY && y < maxY
            
            for (let x = 0; x < simWidth; x++) {
                const idx = rowOffset + x * 4
                
                // Decay (toujours appliqué)
                data[idx] *= decayFactor
                data[idx + 1] *= decayFactor
                data[idx + 2] *= decayFactor
                
                // Influence (seulement dans la bounding box)
                if (inYRange && x >= minX && x < maxX) {
                    const dx = cellX - (x + 0.5)
                    const dy = cellY - (y + 0.5)
                    // Distance isotrope normalisee par les rayons X/Y (171-172).
                    // distSqNorm < 1 definit toujours un cercle visuel.
                    const dxIso = dx / mouseRadiusX
                    const dyIso = dy / mouseRadiusY
                    const distSqNorm = dxIso * dxIso + dyIso * dyIso
                    
                    if (distSqNorm < 1 && distSqNorm > 0) {
                        // Un seul sqrt au lieu de deux
                        const force = Math.min(2, 1 / Math.sqrt(distSqNorm))
                        const scale = influenceGain * strength * force
                        const dispBase = scale * speedCurved
                        
                        data[idx] += dispBase * -ndx      // R: direction X (inverted)
                        data[idx + 1] += dispBase * ndy   // G: direction Y
                        data[idx + 2] += scale * speedCurved // B: speed magnitude
                    }
                }
            }
        }
        
        dt.needsUpdate = true
        
        // Decay vélocité pointeur
        pointerVelocityRef.current.x *= decayFactor
        pointerVelocityRef.current.y *= decayFactor
        const EPS = 1e-3
        if (Math.abs(pointerVelocityRef.current.x) < EPS) pointerVelocityRef.current.x = 0
        if (Math.abs(pointerVelocityRef.current.y) < EPS) pointerVelocityRef.current.y = 0
    }

    return {
        updateTexture,
        dataTexture
    }
}