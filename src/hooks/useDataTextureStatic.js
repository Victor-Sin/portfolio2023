import {useMemo, useRef, useEffect, useState, useCallback} from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

export default function useDataTextureStatic(
    width, 
    aspectRatio = 0,
    uvClassic = false,
    radius = 0.075,
    decayFactor = 0.975,
    strength = 0.5,
    influenceGain = .75,
    influenceGamma = 1
){
    const {gl} = useThree()
    const [textureVersion, setTextureVersion] = useState(0)

    // Pointer tracking refs - updated without triggering re-renders
    const pointerVelocityRef = useRef({ x: 0, y: 0 })
    const pointerRef = useRef({ x: 0, y: 0 })
    const rawPointerRef = useRef({ x: 0, y: 0 })
    const canvasBoundsRef = useRef(null)
    const aspectRef = useRef(0)
    const heightRef = useRef(0)
    const dataTextureRef = useRef(null)

    // Fonction pour créer une nouvelle texture
    const createTexture = useCallback((height) => {
        // Libérer l'ancienne texture si elle existe
        if (dataTextureRef.current) {
            dataTextureRef.current.dispose()
        }

        const data = new Float32Array(height * width * 4)
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4
            data[idx] = 0
            data[idx + 1] = 0
            data[idx + 2] = 0
            data[idx + 3] = 1.0
        }

        const newTexture = new THREE.DataTexture(
            data,
            width,
            height,
            THREE.RGBAFormat,
            THREE.FloatType
        )
        newTexture.minFilter = THREE.NearestFilter
        newTexture.magFilter = THREE.NearestFilter
        newTexture.needsUpdate = true

        dataTextureRef.current = newTexture
        return newTexture
    }, [width])

    // Calcule les bounds et retourne la nouvelle hauteur
    const computeBoundsAndHeight = useCallback(() => {
        const canvas = gl.domElement
        if (canvas) {
            canvasBoundsRef.current = canvas.getBoundingClientRect()
            aspectRef.current = aspectRatio === 0 
                ? canvasBoundsRef.current.height / canvasBoundsRef.current.width 
                : aspectRatio
            return Math.round(width * aspectRef.current)
        }
        return heightRef.current || Math.round(width)
    }, [gl, aspectRatio, width])

    // Création initiale de la texture
    const dataTexture = useMemo(() => {
        const height = computeBoundsAndHeight()
        heightRef.current = height
        return createTexture(height)
    }, [width, textureVersion, computeBoundsAndHeight, createTexture])

    // Gestion du resize
    useEffect(() => {
        const handleResize = () => {
            const newHeight = computeBoundsAndHeight()
            
            // Si la hauteur a changé, incrémenter la version pour recréer la texture
            if (newHeight !== heightRef.current) {
                heightRef.current = newHeight
                
                // Reset des états de la souris
                pointerRef.current = { x: 0, y: 0 }
                pointerVelocityRef.current = { x: 0, y: 0 }
                rawPointerRef.current = { x: 0, y: 0 }
                
                // Trigger re-création de la texture et du material
                setTextureVersion(v => v + 1)
            }
        }

        window.addEventListener("resize", handleResize, { passive: true })
        return () => window.removeEventListener("resize", handleResize)
    }, [computeBoundsAndHeight])

    function updateTexture(mousePosition){
        if(dataTexture){
            let bounds = canvasBoundsRef.current
            if (!bounds && aspectRatio === 0) {
                // Recalculer les bounds si nécessaire
                computeBoundsAndHeight()
                bounds = canvasBoundsRef.current
                if (!bounds) {
                    return // Pas de canvas disponible, skip cette frame
                }
            }

            rawPointerRef.current = { x: mousePosition.x, y: mousePosition.y }
            frameUpdateFalloff()
        }
    }

    function frameUpdateFalloff(){
        const dt = dataTexture
        if (!dt) return
        
        const data = dt.image.data
        const h = heightRef.current
        
        // Si pas de données de pointeur, decay seulement
        const rawPointer = rawPointerRef.current
        if (!rawPointer) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] *= decayFactor
                data[i + 1] *= decayFactor
                data[i + 2] *= decayFactor
            }
            dt.needsUpdate = true
            return
        }
        
        // Mise à jour de la vélocité du pointeur
        const pointerNormX = rawPointer.x
        const pointerNormY = rawPointer.y
        
        pointerVelocityRef.current.x = pointerNormX - pointerRef.current.x
        pointerVelocityRef.current.y = pointerNormY - pointerRef.current.y
        
        pointerRef.current.x = pointerNormX
        pointerRef.current.y = pointerNormY
        
        // Précalculs (hors boucle)
        const mouseRadiusX = width * radius
        const mouseRadiusY = mouseRadiusX * aspectRef.current
        const distMaxSq = mouseRadiusX * mouseRadiusX + mouseRadiusY * mouseRadiusY
        const sqrtDistMax = Math.sqrt(distMaxSq)

        const cellX = uvClassic 
            ? pointerRef.current.x * width 
            : (1 + pointerRef.current.x) * 0.5 * width
        const cellY = uvClassic 
            ? pointerRef.current.y * h 
            : (1 + pointerRef.current.y) * 0.5 * h
        
        // Bounding box pour limiter la zone d'influence
        const minX = Math.max(0, Math.floor(cellX - mouseRadiusX))
        const maxX = Math.min(width, Math.ceil(cellX + mouseRadiusX))
        const minY = Math.max(0, Math.floor(cellY - mouseRadiusY))
        const maxY = Math.min(h, Math.ceil(cellY + mouseRadiusY))
        
        // Précalcul vélocité (constant pour cette frame)
        const vxGrid = pointerVelocityRef.current.x * (width / 2)
        const vyGrid = -pointerVelocityRef.current.y * (h / 2)
        const speedGrid = Math.hypot(vxGrid, vyGrid)
        const vxCurved = Math.sign(vxGrid) * Math.pow(Math.abs(vxGrid), influenceGamma)
        const vyCurved = Math.sign(vyGrid) * Math.pow(Math.abs(vyGrid), influenceGamma)
        const speedCurved = Math.pow(speedGrid, influenceGamma)
        const len = Math.hypot(vxCurved, vyCurved) || 1
        const ndx = vxCurved / len
        const ndy = vyCurved / len
        
        // Une seule passe : decay + influence dans la bounding box
        for (let y = 0; y < h; y++) {
            const rowOffset = y * width * 4
            const inYRange = y >= minY && y < maxY
            
            for (let x = 0; x < width; x++) {
                const idx = rowOffset + x * 4
                
                // Decay (toujours appliqué)
                data[idx] *= decayFactor
                data[idx + 1] *= decayFactor
                data[idx + 2] *= decayFactor
                
                // Influence (seulement dans la bounding box)
                if (inYRange && x >= minX && x < maxX) {
                    const dx = cellX - (x + 0.5)
                    const dy = cellY - (y + 0.5)
                    const distSq = dx * dx + dy * dy
                    
                    if (distSq < distMaxSq && distSq > 0) {
                        // Un seul sqrt au lieu de deux
                        const force = Math.min(2, sqrtDistMax / Math.sqrt(distSq))
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
        dataTexture,
        textureVersion  // Pour que Refraction puisse recréer le material
    }
}