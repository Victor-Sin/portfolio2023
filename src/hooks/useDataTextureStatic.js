import {useMemo, useRef, useEffect} from "react";
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

    // Pointer tracking refs - updated without triggering re-renders
    const pointerVelocityRef = useRef({ x: 0, y: 0 })
    const pointerRef = useRef({ x: 0, y: 0 })
    const rawPointerRef = useRef({ x: 0, y: 0 })
    const canvasBoundsRef = useRef(null)
    const aspectRef = useRef(0)
    const heightRef = useRef(0)

    const updateCanvasBounds = () => {
        const canvas = gl.domElement
        if (canvas) {
          canvasBoundsRef.current = canvas.getBoundingClientRect()
          aspectRef.current = canvasBoundsRef.current.height / canvasBoundsRef.current.width 
          heightRef.current = width*aspectRef.current
      }
    }

    const dataTexture = useMemo(() => {
        if(aspectRatio == 0){
            updateCanvasBounds()
        }
        else{
            aspectRef.current = aspectRatio;
            heightRef.current = width*aspectRef.current
            console.log(aspectRatio,heightRef.current)

        }
        const data = new Float32Array(heightRef.current * width * 4);

        for (let i = 0; i < width * heightRef.current; i++) {
            const idx = i * 4
            data[idx] = Math.random() // R channel
            data[idx + 1] = Math.random() // G channel
            data[idx + 2] = Math.random() // B channel
            data[idx + 3] = 1.0 // A channel
          }

        const dataTexture = new THREE.DataTexture(
            data,
            width,
            heightRef.current,
            THREE.RGBAFormat,
            THREE.FloatType)
        dataTexture.minFilter = dataTexture.magFilter = THREE.NearestFilter
        dataTexture.needsUpdate = true

        return dataTexture
    },[width])

    useEffect(() => {
        if(aspectRatio == 0){
            updateCanvasBounds()
            window.addEventListener("resize", updateCanvasBounds, { passive: true });
        }
      
        return () => {
            window.removeEventListener("resize", updateCanvasBounds);
        };
    },[])

    function updateTexture(mousePosition){
        if(dataTexture ){
            let bounds = canvasBoundsRef.current
            if (!bounds && aspectRatio == 0) {
              updateCanvasBounds()
              bounds = canvasBoundsRef.current
              if (!bounds) {
                throw new Error('Canvas bounds not found')
              }
            }

            rawPointerRef.current = {x: mousePosition.x , y: mousePosition.y}

            frameUpdateFalloff()
        }
    }

    function frameUpdateFalloff(){
        const dt = dataTexture
        if (!dt) {
            return
        }
        
        // Use accurate pointer position from DOM events, or fallback to decay only if not available
        const rawPointer = rawPointerRef.current
        if (!rawPointer) {
            // No pointer data available, decay existing values only
            const data = dt.image.data
            for (let i = 0; i < data.length; i += 4) {
            data[i] *= decayFactor
            data[i + 1] *= decayFactor
            data[i + 2] *= decayFactor
            }
            dt.needsUpdate = true
            return
        }
        
        const pointerNormX = rawPointer.x
        const pointerNormY = rawPointer.y
        
        const prevPointerX = pointerRef.current.x
        const prevPointerY = pointerRef.current.y
        
        pointerVelocityRef.current.x = pointerNormX - prevPointerX
        pointerVelocityRef.current.y = pointerNormY - prevPointerY
        
        pointerRef.current.x = pointerNormX
        pointerRef.current.y = pointerNormY
        
        const data = dt.image.data

        const size = width * heightRef.current
        
        // Map pointer into grid coordinates
        const mouseRadiusX = width * radius
        const mouseRadiusY = mouseRadiusX * aspectRef.current

        const cellX =  uvClassic ?  (pointerRef.current.x) * width  : (1 + pointerRef.current.x) * 0.5 * width 
        const cellY =  uvClassic ? (pointerRef.current.y) * heightRef.current  : (1 + pointerRef.current.y) * 0.5 * heightRef.current 
        
        // Decay existing values (RGB channels only)
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= decayFactor
            data[i + 1] *= decayFactor
            data[i + 2] *= decayFactor
        }
        
        // Apply influence using a 1 / dist falloff, clamped near the center
        for (let x = 0; x < width; x++)
            for (let y = 0; y < heightRef.current; y++) {
            const cellCenterX = x + 0.5
            const cellCenterY = y + 0.5
            const dist = (cellX - cellCenterX) ** 2 + (cellY - cellCenterY) ** 2
            const distMax = mouseRadiusX ** 2 + mouseRadiusY ** 2
            if (dist < distMax && dist > 0) {
                const dataIndex = 4 * (x + width * y)
                let force = Math.sqrt(distMax) / Math.sqrt(dist )
                force = Math.max(0, Math.min(force, 2))        
                // Convert pointer velocity (pixels) into grid-space velocity with per-axis scale
                const vxGrid = pointerVelocityRef.current.x * (width / 2)
                const vyGrid = -pointerVelocityRef.current.y * (heightRef.current / 2)
                const speedGrid = Math.hypot(vxGrid, vyGrid)
        
                // Shape the response with gamma, then scale with gain*strength
                const vxCurved = Math.sign(vxGrid) * Math.pow(Math.abs(vxGrid), influenceGamma)
                const vyCurved = Math.sign(vyGrid) * Math.pow(Math.abs(vyGrid), influenceGamma)
                const speedCurved = Math.pow(speedGrid, influenceGamma)
        
                // Encode displacement direction scaled by magnitude (shader applies its own gain)
                const scale = influenceGain * strength * force
                const dispBase = scale * speedCurved
                const len = Math.hypot(vxCurved, vyCurved) || 1
                const ndx = vxCurved / len
                const ndy = vyCurved / len
        
                // Invert horizontal displacement so consumer shaders don't need to
                data[dataIndex] += dispBase * -ndx // R: direction X (scaled, inverted)
                data[dataIndex + 1] += dispBase * ndy // G: direction Y (scaled)
                data[dataIndex + 2] += scale * speedCurved // B channel = speed magnitude
            }
        }
        
        dt.needsUpdate = true
        
        // Decay pointer velocity symmetrically and zero-out near 0 to stop tail injection
        pointerVelocityRef.current.x *= decayFactor
        pointerVelocityRef.current.y *= decayFactor
        const EPS = 1e-3
        if (Math.abs(pointerVelocityRef.current.x) < EPS) {
            pointerVelocityRef.current.x = 0
        }
        if (Math.abs(pointerVelocityRef.current.y) < EPS) {
            pointerVelocityRef.current.y = 0
        }
          
    }

    return {
        updateTexture,
        dataTexture
    }
}