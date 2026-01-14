"use client"

import {useFBO, useTexture} from "@react-three/drei";
import {useMemo, useRef, useEffect} from "react";
import {DoubleSide, RepeatWrapping, Color, Vector2} from "three";
import * as THREE from 'three/webgpu'
import {useFrame, useThree} from "@react-three/fiber";
import {uv,screenUV,screenCoordinate,time,array,texture, float,positionGeometry,log,rotate,PI,uniformArray,div,tanh,oneMinus, int, uniform, Fn,max, add, mat2, vec3, sin, cos, vec2, mat3, dot, fract, floor, mul, sub, mix, select, abs, pow, Loop, If, normalize, fwidth, step, vec4, smoothstep, length } from 'three/tsl';
import { computeLineColor } from "./Lines";
import { gaussianBlur,  } from 'three/addons/tsl/display/GaussianBlurNode.js';
import useDataTextureRow from "@/hooks/useDataTextureRow";
import useScrollProgress from "@/hooks/useScrollProgress";
import useDataTextureStatic from "@/hooks/useDataTextureStatic";

export default function ProjectImage(){
    const materialRef = useRef()
    const glassWallRef = useRef()
    const { dataTexture: dataTextureStatic, updateTexture } = useDataTextureStatic(96,4/3,true );

    const { size } = useThree()
    const aspect = size.width / size.height
    const mapTexture = useTexture("/images/p1.jpg")
    const mapTexture2 = useTexture("/images/p2.jpg")

    
    const textureNoise = useTexture("/images/noise.png")
    textureNoise.wrapT = RepeatWrapping
    textureNoise.wrapS = RepeatWrapping

    const uniforms = useMemo(() => {
        return {
            ASPECT: uniform(aspect),
            CAMERA_HEIGHT: uniform(10),
            CAMERA_TILT_ANGLE: uniform(0.97),
            PROGRESS: uniform(0),
            BACKGROUND_COLOR: uniform(new Color('#FDE7C5')),
            MOUSE_POSITION: uniform(new Vector2(0,0)),
            VELOCITY: uniform(0)
        }
    },[])

    function updateAspect(e){
        if(e){
            uniforms.ASPECT.value = e.target.innerWidth / e.target.innerHeight;
        }else{
            uniforms.ASPECT.value = size.width / size.height;
        }
    }
  
    // Hook: update uniforms.PROGRESS with normalized scroll and keep resize -> aspect
    const { progress, velocity, speed, update } = useScrollProgress({
        onUpdate: ({ progress,velocity }) => {
                uniforms.PROGRESS.value = progress;
        }
    },0, true);

    useEffect(() => {
        updateAspect();
        window.addEventListener("resize", updateAspect, { passive: true });
        return () => {
            window.removeEventListener("resize", updateAspect);
        };
    }, []);



    const grainTextureEffect = Fn(([_uv]) => {
        return fract(sin(dot(_uv, vec2(12.9898, 78.233))).mul(43758.5453123))
      })

      
    /**
     * Creates a chromatic aberration effect by separating RGB channels.
     * @param {Object} props - Effect parameters
     * @param {vec4} props.input - The input color texture from the scene
     * @param {number} [props.strength=0.01] - Strength of the aberration offset
     * @param {number} [props.radial=1.0] - Amount of radial distortion (0 = directional, 1 = radial from center)
     * @param {vec2} [props.direction=vec2(1,0)] - Direction of aberration when radial=0
     * @returns {vec4} The chromatic aberration processed color
     */
    const chromaticAberrationEffect = Fn((props) => {
        const { input,inputUV2, inputUV = uv , strength = 0.01, radial = 0.5, direction = vec2(0, 0) } = props || {}
    
        // We need to use the built-in uv() here to work as a post-processing effect
        const _uv = inputUV.toVar()
    
        const _strength = float(strength)
        const _radial = float(radial)
        const _direction = direction.toVar()
    
        // Calculate offset direction
        const center = vec2(0.5, 0.5).toVar()
        const toCenter = _uv.sub(center).toVar()
        const dist = length(toCenter).toVar()
    
        // Mix between directional and radial
        const radialDir = normalize(toCenter).toVar()
        const offsetDir = normalize(_direction.mul(float(1).sub(_radial)).add(radialDir.mul(_radial))).toVar()
    
        // Create different offsets for each channel
        const offset = offsetDir.mul(_strength).mul(dist.add(0.5)).add(inputUV2.r.mul(0.015)).toVar()
    
        const rOffset = _uv.add(offset.mul(1.0)).toVar()
        const gOffset = _uv.toVar()
        const bOffset = _uv.sub(offset.mul(1.0)).toVar()

    
        // Sample input texture at different offsets for each channel
        const rSample = texture(input,rOffset)
        const gSample = texture(input,gOffset)
        const bSample =texture(input,bOffset)
        const colorA = vec4(rSample.r, gSample.g, bSample.b, 1)
        // Combine RGB channels with original alpha
        return  colorA
    })

    const uvFlowField = Fn(([uv_immutable]) => {

        const _uv = vec2(uv_immutable).toVar();
        const uv0 = vec2(uv_immutable).toVar();
        const radius = length(uv0)
        const center = oneMinus(radius)

        const amp1 = float(2.1)
        const amp2 = float(1.75)
        const _d = float(0.8)
        Loop({ start: 1, end: 2, type: 'float', condition: '<=' }, ({ i }) => {
            const strength = _d.mul(center).div(i)
           
            _uv.x.addAssign(strength.mul(sin(_time.add(_uv.y.mul(i)))).mul(amp1))
            _uv.y.addAssign(strength.mul(cos(_time.add(_uv.x.mul(i)))).mul(amp2))
          })

        const _time = time.mul(1);

        // Domain warping and rotation - this is a placeholder for now
        const uvR = _uv
        const angle = log(length(uvR)).mul(0.2)
        uvR.assign(rotate(uvR, angle))

        return uvR
    })
    

    function fragmentMat(mat){
        const uvWebGPU = vec2( screenUV.x, float( 1.0 ).sub( screenUV.y ) ).toVar();
        const centered = vec2( uvWebGPU.mul( 2.0 ).sub( 1.0 ) ).toVar();
        const aspectNode = float( uniforms.ASPECT );
        const shadertoyUV = vec2( centered.x.mul( aspectNode ), centered.y ).toVar();

        const _velocity = texture(dataTextureStatic,uv()).gr
        const flowflied = uvFlowField(uv())
        const _grain = grainTextureEffect(flowflied).mul(0.05)

        const uvTest = flowflied.mul(0.15)

        mat.colorNode = gaussianBlur(chromaticAberrationEffect({input:mapTexture,inputUV2:flowflied,inputUV:uv(), strength: 0.05}),null,10).add(_grain)
    }

    const material = useMemo(() => {

        if(!materialRef.current){
            materialRef.current = new THREE.MeshBasicNodeMaterial({
            side: DoubleSide,
             })
        }
        fragmentMat(materialRef.current)
        return materialRef.current;
    },[])

    const planeZ = 1.5
    const scale = 3;
    const { camera, viewport } = useThree()
    const { width, height } = viewport.getCurrentViewport(camera, [0,0,planeZ])

    useFrame((state) => {
        const { gl, scene, camera, pointer } = state;
  /*       uniforms.MOUSE_POSITION.value.x = pointer.x ;
        uniforms.MOUSE_POSITION.value.y = pointer.y; */
        updateTexture({x: uniforms.MOUSE_POSITION.value.x, y: uniforms.MOUSE_POSITION.value.y })

    })

    const handleMove = (e) => {
        const intersection = e.intersections[0]
        if(intersection){
            uniforms.MOUSE_POSITION.value.x = intersection.uv.x ;
            uniforms.MOUSE_POSITION.value.y =  intersection.uv.y;
        }
    }


    return (
        <group>
            <mesh ref={glassWallRef} position={[0,0,planeZ]} onPointerMove={handleMove}>
                <planeGeometry args={[1.66, 2.5,100,100]} />
                <primitive object={material} />
            </mesh>
        </group>

    )
}



