"use client"

import {useFBO, useTexture} from "@react-three/drei";
import {useMemo, useRef, useEffect} from "react";
import {DoubleSide, RepeatWrapping, Color, Vector2} from "three";
import * as THREE from 'three/webgpu'
import {useFrame, useThree} from "@react-three/fiber";
import {uv,screenUV,positionGeometry,time,texture, float,distance,log,rotate,EmptyTexture,uniformArray,div,tanh,oneMinus, int, uniform, Fn,max, add, mat2, vec3, sin, cos, vec2, mat3, dot, fract, floor, mul, sub, mix, select, abs, pow, Loop, If, normalize, fwidth, step, vec4, smoothstep, length } from 'three/tsl';
import { gaussianBlur,  } from 'three/addons/tsl/display/GaussianBlurNode.js';
import useDataTextureStatic from "@/hooks/useDataTextureStatic";
import { useProjectCount } from "@/contexts/ProjectContext";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import styles from '@/app/page.module.css';
import { cleanupAnimations } from "@/utils/gsapHelpers";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useNavigationDetection from "@/hooks/useNavigationDetection";
gsap.registerPlugin(ScrollTrigger);


export default function ProjectImage(){
    const materialRef = useRef()
    const glassWallRef = useRef()
    const tlInRef = useRef(null)
    const tlOutRef = useRef(null)
    const { dataTexture: dataTextureStatic, updateTexture } = useDataTextureStatic(96,4/3,true );
    const count = useProjectCount()
    const navigationInfo = useNavigationDetection()

    const { size } = useThree()
    const aspect = size.width / size.height
    const [proj1, proj2, proj3, proj4, proj5, proj6] = useTexture([
        "/images/p1.jpg",
        "/images/p2.jpg",
        "/images/p3.jpg",
        "/images/p4.jpg",
        "/images/p5.jpg",
        "/images/p6.jpg",
    ])
    
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
            VELOCITY: uniform(0),
            COUNT: uniform(count),
            OPACITY: uniform(0)
        }
    },[])

    useEffect(() => {
        uniforms.COUNT.value = count
    },[count])
    
    useGSAP(() => {
        if(navigationInfo.currentPage == "/"){
            tlInRef.current = gsap.timeline({ scrollTrigger: {
                trigger: `.${styles.container}`,
                toggleActions: 'play reverse play reverse',
                start: '35% bottom',
                end: '40% bottom',
                scrub: true,
              }}).fromTo(uniforms.OPACITY, {value: 0}, {
                value:  1 ,
                duration: 2 ,
                ease: "linear"
               })
    
    
           tlOutRef.current = gsap.timeline({ scrollTrigger: {
            trigger: `.${styles.container}`,
            toggleActions: 'play reverse play reverse',
            start: '68% bottom',
            end: '69% bottom',
            scrub: true,
          }}).to(uniforms.OPACITY, {
            value: 0,
            duration: 2 ,
            ease: "linear"
           })
        }
        else{
            if(tlInRef.current && tlOutRef.current){
            cleanupAnimations([
                { timeline: tlInRef.current, scrollTrigger: tlInRef.current.scrollTrigger },
                { timeline: tlOutRef.current, scrollTrigger: tlOutRef.current.scrollTrigger },
            ]);
        }}
   

        return () => {
            if(tlInRef.current && tlOutRef.current){
                cleanupAnimations([
                        { timeline: tlInRef.current, scrollTrigger: tlInRef.current.scrollTrigger },
                        { timeline: tlOutRef.current, scrollTrigger: tlOutRef.current.scrollTrigger },
                    ]);
            }
        };
   
    },[navigationInfo.currentPage])

    function updateAspect(e){
        if(e){
            uniforms.ASPECT.value = e.target.innerWidth / e.target.innerHeight;
        }else{
            uniforms.ASPECT.value = size.width / size.height;
        }
    }


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
        const {inputUV2, inputUV = uv , strength = 0.01, radial = 0.5, direction = vec2(0, 0) } = props || {}
    
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

        const returnVec4 = vec4(0,0,0,0).toVar()

    
        // Sample input texture at different offsets for each channel
        If(uniforms.COUNT.equal(1), () => {
            returnVec4.assign(vec4(texture(proj1,rOffset).r, texture(proj1,gOffset).g, texture(proj1,bOffset).b, 1).toVar())
        })
        .ElseIf(uniforms.COUNT.equal(2), () => {
            returnVec4.assign(vec4(texture(proj2,rOffset).r, texture(proj2,gOffset).g, texture(proj2,bOffset).b, 1).toVar())
        })
        .ElseIf(uniforms.COUNT.equal(3), () => {
            returnVec4.assign(vec4(texture(proj3,rOffset).r, texture(proj3,gOffset).g, texture(proj3,bOffset).b, 1).toVar())
        })
        .ElseIf(uniforms.COUNT.equal(4), () => {
            returnVec4.assign(vec4(texture(proj4,rOffset).r, texture(proj4,gOffset).g, texture(proj4,bOffset).b, 1).toVar())
        })
        .ElseIf(uniforms.COUNT.equal(5), () => {
            returnVec4.assign(vec4(texture(proj5,rOffset).r, texture(proj5,gOffset).g, texture(proj5,bOffset).b, 1).toVar())
        })
        .ElseIf(uniforms.COUNT.equal(6), () => {
            returnVec4.assign(vec4(texture(proj6,rOffset).r, texture(proj6,gOffset).g, texture(proj6,bOffset).b, 1).toVar())
        })
        .Else(() => {
            returnVec4.assign(vec4(texture(proj1,rOffset).r, texture(proj1,gOffset).g, texture(proj1,bOffset).b, 1).toVar())
        })  

        return returnVec4
        

    



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

    const getTextureMap = Fn(() => {
      return proj1
    })
    

    function fragmentMat(mat){
        const uvWebGPU = vec2( screenUV.x, float( 1.0 ).sub( screenUV.y ) ).toVar();
        const centered = vec2( uvWebGPU.mul( 2.0 ).sub( 1.0 ) ).toVar();
        const aspectNode = float( uniforms.ASPECT );
        const shadertoyUV = vec2( centered.x.mul( aspectNode ), centered.y ).toVar();

        const _velocity = texture(dataTextureStatic,uv()).gr
        const flowflied = uvFlowField(uv())
        const flowfliedBis = uvFlowField(shadertoyUV)

        const strengthbis =  distance(uv().add(length(flowflied).mul(0.05)), vec2(0.5)).mul(.5);
        const strength = distance(shadertoyUV, vec2(0.5)).mul(3);

        const _grain = grainTextureEffect(flowflied).mul(0.05)

        const uvTest = flowflied.mul(0.05)

        // Récupérer l'alpha de la texture originale
        const blurredColor = gaussianBlur(chromaticAberrationEffect({inputUV2:flowflied,inputUV:uv().add(uvTest.mul(.5)), strength: 0.05}).add(uvTest.mul(2)),null,10)
        
        // Créer le vec4 final avec l'alpha de la texture originale
        const finalColor = vec4(blurredColor.rgb.add(_grain), oneMinus(strengthbis).mul(uniforms.OPACITY))
        mat.colorNode = finalColor

        const position = positionGeometry.add(length(uvTest))
        mat.positionNode = position
    }

    const material = useMemo(() => {

        if(!materialRef.current){
            materialRef.current = new THREE.MeshBasicNodeMaterial({
            side: DoubleSide,
            alpha: true,
            transparent: true,
            depthWrite: false,
             })
        }
        fragmentMat(materialRef.current)
        return materialRef.current;
    },[count])

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



