"use client"

import {useFBO, useTexture} from "@react-three/drei";
import {useMemo, useRef, useEffect, useCallback, useState} from "react";
import {DoubleSide, PlaneGeometry, RepeatWrapping, Color, Vector2} from "three";
import * as THREE from 'three/webgpu'
import {useFrame, useThree} from "@react-three/fiber";
import {screenUV,screenCoordinate,time,array,texture, float,distance,log,rotate,PI,uniformArray,div,tanh,oneMinus, int, uniform, Fn,max, add, mat2, vec3, sin, cos, vec2, mat3, dot, fract, floor, mul, sub, mix, select, abs, pow, Loop, If, normalize, fwidth, step, vec4, smoothstep, length } from 'three/tsl';
import { computeLineColor } from "@/utils/Lines";
import { gaussianBlur,  } from 'three/addons/tsl/display/GaussianBlurNode.js';
import useDataTextureRow from "@/hooks/useDataTextureRow";
import useScrollProgress from "@/hooks/useScrollProgress";
import useDataTextureStatic from "@/hooks/useDataTextureStatic";
import { useNavigationInfo } from "@/contexts/NavigationContext";
import { useProjectHomeActive, useProjectCount } from '@/contexts/ProjectContext';
import { useLenis } from 'lenis/react';
import useMediaQuery from "@/hooks/useMediaQuery"
import { useGSAP } from '@gsap/react';
import { gsap } from "gsap";

export default function Refraction(){
    const isMobile = useMediaQuery(768)  // < 768px

    const materialRef = useRef()
    const glassWallRef = useRef()
    const mainRenderTarget = useFBO();
    const count = useProjectCount()
    const projectHomeActive = useProjectHomeActive()
    const { dataTexture: dataTextureStatic, updateTexture } = useDataTextureStatic(64, 0, false );
    const { size, gl } = useThree()
    const aspect = size.width / size.height
    
    // Navigation partagée via le contexte
    const navigationInfo = useNavigationInfo()
    
    // Accès à l'instance Lenis pour le scroll
    const lenis = useLenis()

    const optionsColors = useMemo(() => {
        return {
            colorsCurrent: [new Color('#76869B'), new Color('#AAA97F'), new Color('#F39089')],
            colorsNext: [new Color('#9E4DCE'), new Color('#E9EB7D'), new Color('#E6D3A4')],
        }
    },[])
 
    
    const textureNoise = useTexture("/images/noise.png")
    textureNoise.wrapT = RepeatWrapping
    textureNoise.wrapS = RepeatWrapping

    const uniforms = useMemo(() => {
        return {
            ASPECT: uniform(aspect),
            PROGRESS: uniform(0),
            MOUSE_POSITION: uniform(new Vector2(0,0)),
            PROGRESS_PROJECT: uniform(0),
            PROGRESS_PROJECT_TRANSITION: uniform(0),
            PROGRESS_LOADER: uniform(0),
            PROJECT_COLORS_CURRENT: uniformArray(optionsColors.colorsCurrent),
            PROJECT_COLORS_NEXT: uniformArray(optionsColors.colorsNext),
            // WebGPU: screenUV.y=0 en haut → flip (1-y). WebGL: screenUV.y=0 en bas → pas de flip.
            FLIP_UV_Y: uniform(1),
            // 0 sur mobile pour désactiver texture curseur + gaussianBlur (économie FPS au scroll).
            USE_CURSOR_EFFECT: uniform(1),
        }
    },[])

    function updateAspect(e){
        if(e){
            uniforms.ASPECT.value = e.target.innerWidth / e.target.innerHeight;
        }else{
            uniforms.ASPECT.value = size.width / size.height;
        }
    }

    const onUpdateCallback = useCallback(({ progress,velocity }) => {
        uniforms.PROGRESS.value = progress;
    }, [uniforms]);
  
    // Hook: update uniforms.PROGRESS with normalized scroll and keep resize -> aspect
    const {  update } = useScrollProgress({
        onUpdate: onUpdateCallback
    },0, true);

    useEffect(() => {
        updateAspect();
        window.addEventListener("resize", updateAspect, { passive: true });
        return () => {
            window.removeEventListener("resize", updateAspect);
        };
    }, []);

    useEffect(() => {
        if (gl?.backend != null) {
            uniforms.FLIP_UV_Y.value = gl.backend.isWebGLBackend ? 0 : 1;
        }
    }, [gl]);

    useEffect(() => {
        uniforms.USE_CURSOR_EFFECT.value = isMobile ? 0 : 1;
    }, [isMobile]);

    useGSAP(() => {
        const navType = navigationInfo.navigationType
        const currentPage = navigationInfo.currentPage
        const previousPage = navigationInfo.previousPage
        
        if(navType === 'reload' || navType === 'external'){
            // Le scroll revient automatiquement en haut grâce à scrollRestoration: 'manual' dans layout.js
            
            if(currentPage.includes('project')){
                gsap.set(uniforms.PROGRESS_PROJECT, {value: 1})
            }
            else if(currentPage === '/'){
                gsap.set(uniforms.PROGRESS_PROJECT, {value: 0})
            }
            gsap.fromTo(uniforms.PROGRESS_LOADER, {value: 0}, {
                value: 1,
                duration: 1,
                ease: "linear",
                delay: 1,
            })
  
            // ANIMATION D'ARRIVER SITE GLOBALE
        }
        else if(navType === 'back' || navType === 'forward'){
            // Si on arrive sur une page project, remettre le scroll en haut
            if (currentPage.includes('project')) {
                if (lenis) {
                    lenis.scrollTo(0, { immediate: true, duration: 0 })
                } else if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                }
            }
            
            const isProjectPage = previousPage.includes('project')
            gsap.to(uniforms.PROGRESS_PROJECT, 
                {
                    value: isProjectPage ? 0 : 1, 
                    duration: 1, 
                    ease: "linear", 
                    delay: 1
                }
            )
        }
        else if(navType === 'navigate' && !currentPage.includes('project')){
            gsap.to(uniforms.PROGRESS_LOADER, {
                value: 1,
                duration: 1,
                ease: "linear",
                delay: 1,
            })
            gsap.to(uniforms.PROGRESS_PROJECT, {value: 0, duration: 1, ease: "linear", delay: 1})
        }

    },[navigationInfo.navigationType,navigationInfo.currentPage,navigationInfo.previousPage])

    useGSAP(() => {
        if(((navigationInfo.currentPage == "/" || navigationInfo.currentPage == null) && projectHomeActive == "redirectProject")){
            gsap.to(uniforms.PROGRESS_PROJECT, {value: 1, duration: 1, ease: "linear"})
        }
    },[projectHomeActive,navigationInfo.currentPage])

/*     useGSAP(() => {
        if(count == 5){
            optionsColors.colorsNext[0].set('#949494')
            optionsColors.colorsNext[1].set('#EEF13A')
            optionsColors.colorsNext[2].set('#D6516E')



            gsap.timeline().to(uniforms.PROGRESS_PROJECT_TRANSITION, {value: 1, duration: 1, ease: "linear", delay: 1, 
                onComplete: () => {
                    optionsColors.colorsCurrent[0].set('#949494')
                    optionsColors.colorsCurrent[1].set('#EEF13A')
                    optionsColors.colorsCurrent[2].set('#D6516E')
                    uniforms.PROGRESS_PROJECT_TRANSITION.value = 0
                            }
            })
        }
    },[count]) */



    const grainTextureEffect = Fn(([_uv]) => {
        return fract(sin(dot(_uv, vec2(12.9898, 78.233))).mul(43758.5453123))
      })
    

    const partionProgress = Fn(([progress_ref,partition_sequence,lengthPartition]) => {
        const sequenceIndex = float(0).toVar()
        Loop({start: int(0), end: lengthPartition}, ({i}) => {
            sequenceIndex.addAssign(step(partition_sequence.element(float(i).add(float(1))), progress_ref))
        })
        const segmentStart = partition_sequence.element(sequenceIndex);
        const segmentEnd = partition_sequence.element(sequenceIndex.add(float(1)));
        const localProgress = smoothstep(segmentStart, segmentEnd, progress_ref);
        
        return vec2(localProgress,sequenceIndex)
    })

    const cameraAnimation = Fn(([earlyProgress,inBetween,lastProgress, inLastProgress]) => {
        // DÉFINITION DES POINTS CLÉS DE L'ANIMATION (séquentiel)
        const progress = earlyProgress;

        const depthKeyframes = array([float(-2.0), float(3.0), float(8.0), float(15.0), float(10.0), float(20.0)]);
        const tiltKeyframes = array([float(0.65), float(0.87), float(1.33), float(2.), float(2.8), float(3.14)]);
        const progressBreakpoints = array([float(0.0), float(0.25), float(0.5), float(0.75), float(0.9), float(1.0)]);
        const numberBreakpoints = int(6);
          
        const cameraProgress = partionProgress(progress, progressBreakpoints, numberBreakpoints);
        // INTERPOLATION AUTOMATIQUE ENTRE LES VALEURS
        const cameraDepth = mix(
            depthKeyframes.element(cameraProgress.y), 
            depthKeyframes.element(cameraProgress.y.add(float(1))), 
            cameraProgress.x
        ).toVar();
        
        const cameraTiltAngle = mix(
            tiltKeyframes.element(cameraProgress.y), 
            tiltKeyframes.element(cameraProgress.y.add(float(1))), 
            cameraProgress.x
        ).toVar();

        If(inBetween.greaterThan(0.0), () => {
            cameraTiltAngle.assign(tiltKeyframes.element(int(2)).mul(0.9));
            cameraDepth.assign(depthKeyframes.element(int(2)).mul(0.975));
        })

        return vec2(cameraDepth, cameraTiltAngle)
    })

    const cameraAnimationBis = Fn(([lastProgress, inLastProgress]) => {
        // DÉFINITION DES POINTS CLÉS DE L'ANIMATION (séquentiel)
        const progress = lastProgress;

        const depthKeyframes = array([float(-2.0), float(1.0), float(5.0), float(7)]);
        const tiltKeyframes = array([float(0.65), float(0.87), float(1.), float(1.98)]);
        const progressBreakpoints = array([float(0.0), float(0.25), float(0.66), float(1)]);
        const numberBreakpoints = int(4);
          
        const cameraProgress = partionProgress(progress, progressBreakpoints, numberBreakpoints);
        // INTERPOLATION AUTOMATIQUE ENTRE LES VALEURS
        const cameraDepth = mix(
            depthKeyframes.element(cameraProgress.y), 
            depthKeyframes.element(cameraProgress.y.add(float(1))), 
            cameraProgress.x
        ).toVar();
        
        const cameraTiltAngle = mix(
            tiltKeyframes.element(cameraProgress.y), 
            tiltKeyframes.element(cameraProgress.y.add(float(1))), 
            cameraProgress.x
        ).toVar();

        return vec2(cameraDepth, cameraTiltAngle)
    })



    const circle = Fn(([shadertoyUV,inBetweenLimits,earlyProgressLimits]) => {
        const _uv = shadertoyUV.toVar();
        _uv.y.addAssign(.15);
        
        const circle = distance(vec2(0,0),shadertoyUV).toVar();
        const circleShadow = distance(vec2(0,0),_uv).toVar();
        const limit = smoothstep(inBetweenLimits.x,inBetweenLimits.y.mul(0.9825), uniforms.PROGRESS).toVar()

        const progressBreakpoints = array([float(0.0), float(0.25), float(0.75), float(1.0)]);
        const valuesProgress = array([float(0), float(1.0), float(1.0), float(0.0)]);

        const numberBreakpoints = int(4);

        const circleProgressPartition = partionProgress(limit, progressBreakpoints, numberBreakpoints);
        const circleProgress = mix(
            valuesProgress.element(circleProgressPartition.y), 
            valuesProgress.element(circleProgressPartition.y.add(float(1))), 
            circleProgressPartition.x
        ).mul(10).toVar();

        const bottomLimit = circleProgress.x.sub(circleProgress.x.mul(0.0025));
        const outerBorder = float(1).sub(step(circleProgress.x,circle));
        const innerBorder = float(1).sub(step(bottomLimit,circle));
        const inner = float(1).sub(smoothstep(0,circleProgress.x.mul(1.25),circle));

        const border = outerBorder.sub(innerBorder).toVar();

        return vec2(border,inner)
    })

    const computeLines = Fn(([earlyProgress,inBetween,shadertoyUV]) => {
        const cameraAnim = cameraAnimation(earlyProgress,inBetween)
        const lineLimitTop = mix(float( 0.0 ),float( -150.0 ),inBetween)
        const lineLimitBottom = mix(float( 115.0 ),float( 315.0 ),inBetween);
        const cameraAngles = vec3( float( 0.0 ), cameraAnim.y, float( 0.0 ) ).toVar();
        const rayOrigin = vec3( float( 0.), 10, cameraAnim.x).toVar();
        const baseLineColor = vec4( computeLineColor( shadertoyUV, cameraAngles, rayOrigin, lineLimitTop, lineLimitBottom, inBetween, float(0) ) ).toVar()

        If(inBetween.greaterThan(0), () => {
            baseLineColor.mulAssign(0.25)
        }).Else(() => {
            baseLineColor.mulAssign(0.5)

        })
    
        return baseLineColor;
    })
    
    const computeLinesLast = Fn(([lastProgress,inLastProgress,shadertoyUV,inBetween]) => {
        const baseLineColorBis = float(0).toVar();
    
        If(inLastProgress.greaterThan(0.0), () => {
            const cameraAnimBis = cameraAnimationBis(lastProgress,inLastProgress)
            const lineLimitTopBis = float(-0);
            const lineLimitBottomBis = float(50);
            const rayOriginBis = vec3( float( 0.), 10, cameraAnimBis.x).toVar();
            const cameraAnglesBis = vec3( float( 0.0 ), cameraAnimBis.y, float( 0.0 ) ).toVar();
            baseLineColorBis.assign(vec4( computeLineColor( shadertoyUV, cameraAnglesBis, rayOriginBis, lineLimitTopBis, lineLimitBottomBis, inBetween, float(1) ) ).mul(0.75));
        })
        
        return baseLineColorBis;
    })



    const colorGradient = Fn(([uv_immutable,colors,colorsPos,colorsCount,colorsBis,transitionProgress = 0, useProgress = 1]) => {

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

        const _time = time.mul(.25);

        // Domain warping and rotation - this is a placeholder for now
        const uvR = _uv
        const angle = log(length(uvR)).mul(0.2)
        uvR.assign(rotate(uvR, angle))
        const finalColor = vec3(0).toVar()
        const totalWeight = float(0).toVar()

        // Loop through all color spots and blend them together
        Loop({ start: 0, end: colorsCount, type: 'float' }, ({ i }) => {
            // Calculate control point
            // Base angle for this color spot - creates different starting positions
            const baseAngle = i.mul(PI)
            
            // Calculate the position of a control point in a circular motion (using sine/cosine with the angle will place points around a circle)
            // Note that we're using _time here, which will make these positions animated
            const x = sin(_time.mul(i.mul(0.75)).add(baseAngle)).mul(0.5)
            const y = cos(_time.mul(2).add(baseAngle.mul(2.5))).mul(1)
            const pos = colorsPos.element(i).add(vec2(x,y).add(uniforms.PROGRESS.mul(i.mul(useProgress).add(float(0.25).mul(useProgress)))))
        
            // Get a specific color
            const _c = mix(colors.element(i),colorsBis.element(i),transitionProgress)
        
            // Determine weightings
            // Calculate distance from current fragment to this color spot
            const dist = length(uvR.sub(pos)).toVar()
            dist.assign(pow(dist,4.2))
            
            // Calculate weight based on distance - closer spots have higher weight
            const weight = div(1, max(0, dist))
            
            // Accumulate color and total weight
            finalColor.addAssign(_c.mul(weight))
            totalWeight.addAssign(weight)
        })
    
        return finalColor.div(totalWeight)
    })

    const curvedLines = Fn(() => {
        const limit = float(20)

        const lineA = step(limit, screenCoordinate.x)
        const lineB = step(limit.add(1), screenCoordinate.x)

        const finalLine = lineA.sub(lineB)
        return vec2(finalLine,lineB)
    })

    
    const uvFlowField = Fn(([uv_immutable]) => {

        const _uv = vec2(uv_immutable).toVar();
        const uv0 = vec2(uv_immutable).toVar();
        const radius = length(uv0)
        const center = oneMinus(radius)

        const amp1 = float(.21)
        const amp2 = float(.55)
        const _d = float(0.8)
        Loop({ start: 1, end: 2, type: 'float', condition: '<=' }, ({ i }) => {
            const strength = _d.mul(center).div(i)
           
            _uv.x.addAssign(strength.mul(sin(_time.add(_uv.y.mul(i)))).mul(amp1))
            _uv.y.addAssign(strength.mul(cos(_time.add(_uv.x.mul(i)))).mul(amp2))
          })

        const _time = time.mul(0.25);

        // Domain warping and rotation - this is a placeholder for now
        const uvR = _uv
        const angle = log(length(uvR)).mul(0.15)
        uvR.assign(rotate(uvR, angle))

        return uvR
    })


    function fragmentMat(mat){
        const colors = uniformArray([new Color('#DAC489'), new Color('#73CAB0'), new Color('#3B4D3B'), new Color('#315261')]);
        const colorsPos = uniformArray([new Vector2(0,-1), new Vector2(0,0), new Vector2(0,0.25), new Vector2(0.5,0.5)])
        const colorsCount = int(4);

        const colorsBackground = uniformArray([new Color('#FDE7C5'), new Color('#AAA97F'), new Color('#E6D3A4')]);
        const colorsPosBackground = uniformArray([new Vector2(0,-1), new Vector2(0.5,0),new Vector2(0,0)]);
        const colorsCountBackground = int(3);

        const earlyProgressLimits = vec2(0,0.26);
        const earlyProgress = smoothstep(earlyProgressLimits.x, earlyProgressLimits.y, uniforms.PROGRESS).toVar()

        const inBetweenLimits = vec2(earlyProgressLimits.y.mul(0.75),.8);
        const inBetween = step(inBetweenLimits.x,uniforms.PROGRESS).sub(step(inBetweenLimits.y.mul(0.95),uniforms.PROGRESS));

        const lastLimits = vec2(inBetweenLimits.y.mul(0.775),1.1);
        const lastProgress = smoothstep(lastLimits.x, lastLimits.y, uniforms.PROGRESS).toVar()
        const inLastProgress = step(lastLimits.x,uniforms.PROGRESS).sub(step(lastLimits.y,uniforms.PROGRESS));

        // WebGPU: screenUV.y=0 en haut → on flip (1-y). WebGL: screenUV.y=0 en bas → on garde screenUV.y.
        const uvY = mix(screenUV.y, float(1.0).sub(screenUV.y), uniforms.FLIP_UV_Y);
        const uvWebGPU = vec2(screenUV.x, float(1.0).sub(screenUV.y)).toVar();
        const centered = vec2( uvWebGPU.mul( 2.0 ).sub( 1.0 ) ).toVar();
        const aspectNode = float( uniforms.ASPECT );
        const shadertoyUV = vec2( centered.x.mul( aspectNode ), centered.y ).toVar();
        // Sur mobile (USE_CURSOR_EFFECT=0) on skip texture + gaussianBlur pour garder les FPS au scroll.
        const velocityCursor = vec2(0, 0).toVar();
        If(uniforms.USE_CURSOR_EFFECT.greaterThan(0), () => {
            const textureCursor = texture(dataTextureStatic, vec2(uvWebGPU.x, uvY));
            const cursor = gaussianBlur(textureCursor, null, 1);
            velocityCursor.assign(cursor.rg);
        });

        const distordUv = vec2( centered.x.mul( aspectNode ).mul(.75), centered.y.mul(1.5) );

        const finalUV = shadertoyUV.add(velocityCursor.mul(.125))
        const finalUVLines = uvFlowField(shadertoyUV.mul(vec2(1.35))).add(velocityCursor.mul(.1))
        const circleUV = uvFlowField(shadertoyUV).add(velocityCursor.mul(.15))

        const curvedLinesVal = curvedLines()

        const baseLineColor = computeLines(earlyProgress,inBetween,finalUVLines).mul(0.15).mul(curvedLinesVal.y);
        const baseLineColorBis = computeLinesLast(lastProgress,inLastProgress,finalUVLines,inBetween).mul(0.15).mul(curvedLinesVal.y);
        const circleVal = circle(circleUV,inBetweenLimits);
        const colorGradientVal = colorGradient(finalUV,colors,colorsPos,colorsCount,colorsBackground);
        const circleColor = mix(float(1),circleVal.y,inBetween).mul(10);
        const innerColor = mix(float(0),circleVal.y.mul(colorGradientVal),inBetween).mul(1);

        const colorGradientValBackground = colorGradient(finalUV,colorsBackground,colorsPosBackground,colorsCountBackground,colorsBackground);


        const _grain = grainTextureEffect(finalUV).mul(0.1)
        const innerColors = baseLineColor.mul(circleColor.x).add(circleVal.x.mul(0.35)).add(baseLineColorBis.mul(7.5))
        const effectsColor = vec3(1).sub(innerColors).sub(circleVal.y.mul(1)).add(innerColor)

        const loaderBackground = colorsBackground.element(0);
        const homeBackground = colorGradientValBackground.mul(effectsColor)
        const projectBackground = colorGradient(finalUV,uniforms.PROJECT_COLORS_CURRENT,colorsPosBackground,colorsCountBackground,uniforms.PROJECT_COLORS_NEXT,uniforms.PROGRESS_PROJECT_TRANSITION,0);
        
        const finalPageBackground = mix(homeBackground,projectBackground,uniforms.PROGRESS_PROJECT);
        const finalBackground = mix(loaderBackground,finalPageBackground,uniforms.PROGRESS_LOADER);
        mat.colorNode = finalBackground.add(_grain)
   
    }

    const material = useMemo(() => {

        if(!materialRef.current){
            materialRef.current = new THREE.MeshBasicNodeMaterial({
            side: DoubleSide,
             })
        }
        fragmentMat(materialRef.current)

        console.log("rerender material")
        return materialRef.current;
    },[])


    const planeZ = 1
    const { camera, viewport } = useThree()
    const { width, height } = viewport.getCurrentViewport(camera, [0,0,planeZ])

    const frameCountRef = useRef(0);
    useFrame((state) => {
        const { gl, scene, camera, pointer } = state;
        // Sur mobile : mettre à jour le scroll moins souvent pour alléger le main thread pendant le scroll.
        update();
       
        if (!isMobile) {
            updateTexture({ x: pointer.x, y: pointer.y });
            uniforms.MOUSE_POSITION.value.x = pointer.x;
            uniforms.MOUSE_POSITION.value.y = pointer.y;
        }
        if (mainRenderTarget.width !== size.width || mainRenderTarget.height !== size.height) {
            mainRenderTarget.setSize(size.width, size.height);
        }
    });

    return (
        <group>
            <mesh ref={glassWallRef} position={[0,0,planeZ]} >
                <planeGeometry args={[width, height]} />
                <primitive object={material} />
            </mesh>
        </group>

    )
}



