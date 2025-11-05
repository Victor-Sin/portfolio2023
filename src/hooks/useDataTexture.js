import {Plane, useTexture} from "@react-three/drei";
import {useMemo, useRef} from "react";
import * as THREE from "three";

export default function useDataTexture({size}){

    const dataTexture = useMemo(() => {
        return new THREE.DataTexture(
            new Float32Array(size * 4),
            size,
            1,
            THREE.RGBAFormat,
            THREE.FloatType)
    },[size])

    function shiftTexture(dataEntry){
        if(dataTexture ){
            const data = dataTexture.image.data;
            // Décalage : copie les anciennes valeurs vers l'avant
            data.set(data.subarray(0, (size - 1) * 4),4);

            // 🔹 Modifier manuellement les 4 premières valeurs (RGBA du premier pixel)
            data[0] = dataEntry.x;  // R = x
            data[1] = dataEntry.y;  // G = y
            data[2] = dataEntry.z;  // B = z
            data[3] = dataEntry.w;  // A = in dashing

            dataTexture.needsUpdate = true
        }
    }

    return {
        shiftTexture,
        dataTexture
    }
}