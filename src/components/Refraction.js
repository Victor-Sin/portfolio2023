"use client"

// ============================================================
// IMPORTS
// ============================================================

// React
import { useMemo, useRef, useEffect, useCallback } from "react";

// Three.js
import { DoubleSide, Color, Vector2 } from "three";
import * as THREE from 'three/webgpu'
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";

// Three.js TSL
import {
    screenUV, screenCoordinate, time, array, texture, float, distance, log, PI,
    uniformArray, div, min, oneMinus, int, uniform, Fn, max, mat2, vec3, sin, cos,
    vec2, mat3, dot, fract, floor, mul, sub, mix, select, abs, pow, Loop, If,
    normalize, fwidth, step, vec4, smoothstep, length, add, rotate, mx_noise_float
} from 'three/tsl';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';

// Hooks & Contexts
import useScrollProgress from "@/hooks/useScrollProgress";
import useDataTextureStatic from "@/hooks/useDataTextureStatic";
import { useNavigationInfo } from "@/contexts/NavigationContext";
import { useProjectHomeActive,useProjectCount } from '@/contexts/ProjectContext';
import { useLenis } from 'lenis/react';
import useMediaQuery from "@/hooks/useMediaQuery";

// Animation
import { useGSAP } from '@gsap/react';
import { gsap } from "gsap";
import projectsData from '@/data/projects.json'


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function Refraction() {
    
    // --------------------------------------------------------
    // HOOKS & REFS
    // --------------------------------------------------------
    
    const isMobile = useMediaQuery(768);
    const materialRef = useRef();
    const glassWallRef = useRef();
    const mainRenderTarget = useFBO();
    const animProjectRef = useRef(null);
    const animLoaderRef = useRef(null);
    
    const { dataTexture: dataTextureStatic, updateTexture, textureVersion } = useDataTextureStatic(64, 0, false);
    const { size, gl, camera, viewport } = useThree();
    
    const navigationInfo = useNavigationInfo();
    const projectHomeActive = useProjectHomeActive();
    const count = useProjectCount();
    const lenis = useLenis();
    
    const project = projectsData.projects.find(project => navigationInfo.currentPage.includes('project') && navigationInfo.currentPage.includes(project.slug));
    // --------------------------------------------------------
    // UNIFORMS & COLORS
    // --------------------------------------------------------

    const optionsColors = useMemo(() => ({
        colorsCurrent: [new Color('#76869B'), new Color('#AAA97F'), new Color('#F39089')],
        colorsNext: [new Color('#9E4DCE'), new Color('#E9EB7D'), new Color('#E6D3A4')],
    }), []);

    const uniforms = useMemo(() => ({
        ASPECT: uniform(size.width / size.height),
        PROGRESS: uniform(0),
        MOUSE_POSITION: uniform(new Vector2(0, 0)),
        PROGRESS_PROJECT: uniform(0),
        PROGRESS_PROJECT_TRANSITION: uniform(0),
        PROGRESS_LOADER: uniform(0),
        PROJECT_COLORS_CURRENT: uniformArray(optionsColors.colorsCurrent),
        PROJECT_COLORS_NEXT: uniformArray(optionsColors.colorsNext),
        FLIP_UV_Y: uniform(1),           // WebGPU: flip Y, WebGL: no flip
        USE_CURSOR_EFFECT: uniform(1),   // 0 sur mobile pour économiser les FPS
    }), []);

    // --------------------------------------------------------
    // CALLBACKS & EFFECTS
    // --------------------------------------------------------

    const updateAspect = useCallback((e) => {
        uniforms.ASPECT.value = e 
            ? e.target.innerWidth / e.target.innerHeight 
            : size.width / size.height;
    }, [uniforms, size]);

    const onScrollUpdate = useCallback(({ progress }) => {
        uniforms.PROGRESS.value = progress;
    }, [uniforms]);

    const { update: updateScroll } = useScrollProgress({ onUpdate: onScrollUpdate }, 0, true);

    // Resize listener
    useEffect(() => {
        updateAspect();
        window.addEventListener("resize", updateAspect, { passive: true });
        return () => window.removeEventListener("resize", updateAspect);
    }, [updateAspect]);

    // Détection WebGL/WebGPU pour flip UV
    useEffect(() => {
        if (gl?.backend) {
            uniforms.FLIP_UV_Y.value = gl.backend.isWebGLBackend ? 0 : 1;
        }
    }, [gl, uniforms]);

    // Désactiver effet curseur sur mobile
    useEffect(() => {
        uniforms.USE_CURSOR_EFFECT.value = isMobile ? 0 : 1;
    }, [isMobile, uniforms]);

    useGSAP(() => {
        console.log(count)
        if(count != 0){
            optionsColors.colorsNext[0].set(project.colors[0])
            optionsColors.colorsNext[1].set(project.colors[1])
            optionsColors.colorsNext[2].set(project.colors[2])

            gsap.timeline().to(uniforms.PROGRESS_PROJECT_TRANSITION, {value: 1, duration: 1, ease: "linear", delay: 1, 
                onComplete: () => {
                    optionsColors.colorsCurrent[0].set(project.colors[0])
                    optionsColors.colorsCurrent[1].set(project.colors[1])
                    optionsColors.colorsCurrent[2].set(project.colors[2])
                    uniforms.PROGRESS_PROJECT_TRANSITION.value = 0
                }
            })
        }
    },[count])

    // --------------------------------------------------------
    // ANIMATIONS GSAP - NAVIGATION
    // --------------------------------------------------------

    useGSAP(() => {
        const { navigationType: navType, currentPage, previousPage } = navigationInfo;

        if (navType === 'reload' || navType === 'external') {
            // Initial load
            animLoaderRef.current?.kill();
            animProjectRef.current?.kill();
            animProjectRef.current = gsap.set(uniforms.PROGRESS_PROJECT, { 
                value: currentPage.includes('project') ? 1 : 0 
            });
            animLoaderRef.current = gsap.fromTo(uniforms.PROGRESS_LOADER, 
                { value: 0 }, 
                { value: 1, duration: 1, ease: "linear", delay: 1 }
            );
        } 
        else if (navType === 'back' || navType === 'forward') {
            // Navigation historique
            if (currentPage.includes('project')) {
                lenis?.scrollTo(0, { immediate: true, duration: 0 }) 
                    ?? window.scrollTo({ top: 0, behavior: 'instant' });
            }
            animProjectRef.current?.kill();
            animProjectRef.current = gsap.to(uniforms.PROGRESS_PROJECT, {
                value: previousPage.includes('project') ? 0 : 1,
                duration: 2, ease: "power4.inOut", delay: 1
            });
        } 
        else if (navType === 'navigate' && !currentPage.includes('project')) {
            // Retour à home
            animLoaderRef.current?.kill();
            animProjectRef.current?.kill();
            animLoaderRef.current = gsap.to(uniforms.PROGRESS_LOADER, { value: 1, duration: 1, ease: "linear", delay: 1 });
            animProjectRef.current = gsap.to(uniforms.PROGRESS_PROJECT, { value: 0, duration: 2, ease: "power4.inOut", delay: 1 });
        }
    }, [navigationInfo.navigationType, navigationInfo.currentPage, navigationInfo.previousPage]);

    useGSAP(() => {
        const isHome = navigationInfo.currentPage === "/" || navigationInfo.currentPage == null;
        if (isHome && projectHomeActive === "redirectProject") {
            animProjectRef.current?.kill();
            animProjectRef.current = gsap.to(uniforms.PROGRESS_PROJECT, { value: 1, duration: 2, ease: "power4.inOut" });
        }
    }, [projectHomeActive, navigationInfo.currentPage]);

    // ============================================================
    // FONCTIONS SHADER TSL - OCEAN LINES
    // ============================================================

    // Constantes ocean
    const WAVE_CONFIG = {
        DISTANCE_BETWEEN_LINES: float(0.15),
        GEO_ITERATIONS: int(2),
        BASE_HEIGHT: float(1.25),
        CHOPPINESS: float(5),
        ANIM_SPEED: float(1.8),
        FREQUENCY: float(0.075),
        RAYMARCH_STEPS: int(2),
        OCTAVE_MATRIX: mat2(1.6, 1.2, float(-1.2), 1.6),
    };

    const animatedWaveTime = Fn(() => 
        add(1.0, time.mul(WAVE_CONFIG.ANIM_SPEED))
    );

    // MaterialX Perlin noise optimisé (évite les appels sin() coûteux)
    const perlinNoise = Fn(([p_immutable]) => mx_noise_float(vec2(p_immutable)));

    const createRotationMatrix = Fn(([eulerAngles_immutable]) => {
        const angles = vec3(eulerAngles_immutable).toVar();
        const scX = vec2(sin(angles.x), cos(angles.x)).toVar();
        const scY = vec2(sin(angles.y), cos(angles.y)).toVar();
        const scZ = vec2(sin(angles.z), cos(angles.z)).toVar();
        const m = mat3().toVar();
        
        m.element(int(0)).assign(vec3(
            scX.y.mul(scZ.y).add(scX.x.mul(scY.x).mul(scZ.x)),
            scX.y.mul(scY.x).mul(scZ.x).add(scZ.y.mul(scX.x)),
            scY.y.negate().mul(scZ.x)
        ));
        m.element(int(1)).assign(vec3(
            scY.y.negate().mul(scX.x),
            scX.y.mul(scY.y),
            scY.x
        ));
        m.element(int(2)).assign(vec3(
            scZ.y.mul(scX.x).mul(scY.x).add(scX.y.mul(scZ.x)),
            scX.x.mul(scZ.x).sub(scX.y.mul(scZ.y).mul(scY.x)),
            scY.y.mul(scZ.y)
        ));
        return m;
    });

    const generateWaveOctave = Fn(([uv_immutable, choppiness_immutable]) => {
        const chop = float(choppiness_immutable).toVar();
        const uv = vec2(uv_immutable).toVar();
        uv.addAssign(perlinNoise(uv));
        const wave = vec2(oneMinus(abs(sin(uv)))).toVar();
        const secondary = vec2(abs(cos(uv))).toVar();
        wave.assign(mix(wave, secondary, wave));
        return pow(oneMinus(wave.x.mul(wave.y)), chop);
    });

    const oceanHeightMap = Fn(([p_immutable]) => {
        const p = vec3(p_immutable).toVar();
        const freq = float(WAVE_CONFIG.FREQUENCY).toVar();
        const amp = float(WAVE_CONFIG.BASE_HEIGHT).toVar();
        const chop = float(WAVE_CONFIG.CHOPPINESS).toVar();
        const uv = vec2(p.xz).toVar();
        uv.x.mulAssign(2);
        const height = float(0).toVar();

        Loop({ start: int(0), end: WAVE_CONFIG.GEO_ITERATIONS }, () => {
            const w = float(generateWaveOctave(uv.add(animatedWaveTime()).mul(freq), chop)).toVar();
            w.addAssign(generateWaveOctave(uv.sub(animatedWaveTime()).mul(freq), chop));
            height.addAssign(w.mul(amp));
            uv.mulAssign(WAVE_CONFIG.OCTAVE_MATRIX);
            freq.mulAssign(1.9);
            amp.mulAssign(0.22);
            chop.assign(mix(chop, 1.0, 0.2));
        });

        return p.y.sub(height);
    });

    const getRayDirection = Fn(([coords, angles]) => {
        const dir = vec3(normalize(vec3(vec2(coords).toVar().xy, float(-2)))).toVar();
        return normalize(dir).mul(createRotationMatrix(angles));
    });

    const computeLineColor = Fn(([coords, camAngles, rayOrig, limitTop, limitBot, inBetween, isLast]) => {
        const topLimit = float(limitTop).toVar();
        const botLimit = float(limitBot).toVar();
        const origin = vec3(rayOrig).toVar();
        const rayDir = vec3(getRayDirection(coords, camAngles)).toVar();
        const surface = vec3().toVar();
        
        const nearDist = float(0).toVar();
        const farDist = float(100).toVar();
        const farH = float(oceanHeightMap(origin.add(rayDir.mul(farDist)))).toVar();
        const intersect = float(0).toVar();

        If(farH.greaterThan(0), () => {
            intersect.assign(farDist);
            surface.assign(origin.add(rayDir.mul(intersect)));
        }).Else(() => {
            const nearH = float(oceanHeightMap(origin.add(rayDir.mul(nearDist)))).toVar();
            Loop({ start: int(0), end: WAVE_CONFIG.RAYMARCH_STEPS }, () => {
                intersect.assign(mix(nearDist, farDist, nearH.div(nearH.sub(farH))));
                surface.assign(origin.add(rayDir.mul(intersect)));
                const h = float(oceanHeightMap(surface)).toVar();
                If(h.lessThan(0), () => {
                    farDist.assign(intersect);
                    farH.assign(h);
                }).Else(() => {
                    nearDist.assign(intersect);
                    nearH.assign(h);
                });
            });
        });

        const lineDist = mix(
            WAVE_CONFIG.DISTANCE_BETWEEN_LINES,
            WAVE_CONFIG.DISTANCE_BETWEEN_LINES.mul(0.75),
            select(isLast.greaterThan(0), 0, inBetween)
        );
        
        const distCoord = float(
            surface.z.div(lineDist).add(
                surface.y.add(oneMinus(vec2(coords).toVar().y).add(surface.y).mul(0.35)).mul(3)
            )
        ).toVar();
        
        const intensity = float(abs(fract(distCoord).sub(0.5)).div(fwidth(distCoord))).toVar();
        intensity.assign(oneMinus(min(intensity, 1)));
        intensity.assign(pow(intensity, float(4 / 2.2)));

        return step(topLimit, distCoord).mul(step(distCoord, botLimit)).mul(vec4(intensity));
    });

    // ============================================================
    // FONCTIONS SHADER TSL - EFFETS VISUELS
    // ============================================================

    const grainEffect = Fn(([uv]) => 
        fract(sin(dot(uv, vec2(12.9898, 78.233))).mul(43758.5453123))
    );

    const partitionProgress = Fn(([progress, sequence, count]) => {
        const idx = float(0).toVar();
        Loop({ start: int(0), end: count }, ({ i }) => {
            idx.addAssign(step(sequence.element(float(i).add(1)), progress));
        });
        const start = sequence.element(idx);
        const end = sequence.element(idx.add(1));
        return vec2(smoothstep(start, end, progress), idx);
    });

    const cameraAnimation = Fn(([progress, inBetween]) => {
        const depths = array([float(-2), float(3), float(8), float(15), float(10), float(20)]);
        const tilts = array([float(0.65), float(0.87), float(1.33), float(2), float(2.8), float(3.14)]);
        const breaks = array([float(0), float(0.25), float(0.5), float(0.75), float(0.9), float(1)]);
        
        const p = partitionProgress(progress, breaks, int(6));
        const depth = mix(depths.element(p.y), depths.element(p.y.add(1)), p.x).toVar();
        const tilt = mix(tilts.element(p.y), tilts.element(p.y.add(1)), p.x).toVar();

        If(inBetween.greaterThan(0), () => {
            tilt.assign(tilts.element(int(2)).mul(0.9));
            depth.assign(depths.element(int(2)).mul(0.975));
        });

        return vec2(depth, tilt);
    });

    const cameraAnimationAlt = Fn(([progress]) => {
        const depths = array([float(-2), float(1), float(5), float(7)]);
        const tilts = array([float(0.65), float(0.87), float(1), float(1.98)]);
        const breaks = array([float(0), float(0.25), float(0.66), float(1)]);
        
        const p = partitionProgress(progress, breaks, int(4));
        return vec2(
            mix(depths.element(p.y), depths.element(p.y.add(1)), p.x),
            mix(tilts.element(p.y), tilts.element(p.y.add(1)), p.x)
        );
    });

    const circleEffect = Fn(([uv, limits]) => {
        const dist = distance(vec2(0, 0), uv).toVar();
        const limit = smoothstep(limits.x, limits.y.mul(0.9825), uniforms.PROGRESS).toVar();

        const breaks = array([float(0), float(0.25), float(0.75), float(1)]);
        const values = array([float(0), float(1), float(1), float(0)]);
        
        const p = partitionProgress(limit, breaks, int(4));
        const radius = mix(values.element(p.y), values.element(p.y.add(1)), p.x).mul(10).toVar();

        const outer = oneMinus(step(radius.x, dist));
        const inner = oneMinus(step(radius.x.sub(radius.x.mul(0.0025)), dist));
        const fill = oneMinus(smoothstep(0, radius.x.mul(1.25), dist));

        return vec2(outer.sub(inner), fill);
    });

    const computeLines = Fn(([progress, inBetween, uv]) => {
        const cam = cameraAnimation(progress, inBetween);
        const topLimit = mix(float(0), float(-150), inBetween);
        const botLimit = mix(float(115), float(315), inBetween);
        const angles = vec3(0, cam.y, 0).toVar();
        const origin = vec3(0, 10, cam.x).toVar();
        
        const color = vec4(computeLineColor(uv, angles, origin, topLimit, botLimit, inBetween, float(0))).toVar();
        If(inBetween.greaterThan(0), () => color.mulAssign(0.25)).Else(() => color.mulAssign(0.5));
        return color;
    });

    const computeLinesAlt = Fn(([progress, inProgress, uv, inBetween]) => {
        const color = float(0).toVar();
        If(inProgress.greaterThan(0), () => {
            const cam = cameraAnimationAlt(progress);
            const angles = vec3(0, cam.y, 0).toVar();
            const origin = vec3(0, 10, cam.x).toVar();
            color.assign(vec4(computeLineColor(uv, angles, origin, float(0), float(50), inBetween, float(1))).mul(0.75));
        });
        return color;
    });

    const uvFlowField = Fn(([uv_in]) => {
        const uv = vec2(uv_in).toVar();
        const center = oneMinus(length(uv));
        const t = time.mul(0.25);

        Loop({ start: 1, end: 2, type: 'float', condition: '<=' }, ({ i }) => {
            const str = float(0.8).mul(center).div(i);
            uv.x.addAssign(str.mul(sin(t.add(uv.y.mul(i)))).mul(0.21));
            uv.y.addAssign(str.mul(cos(t.add(uv.x.mul(i)))).mul(0.55));
        });

        return rotate(uv, log(length(uv)).mul(0.15));
    });

    const colorGradient = Fn(([uv_in, colors, positions, count, colorsBis, transition = 0, useProgress = 1]) => {
        const uv = vec2(uv_in).toVar();
        const center = oneMinus(length(uv));
        const t = time.mul(0.25);

        Loop({ start: 1, end: 2, type: 'float', condition: '<=' }, ({ i }) => {
            const str = float(0.8).mul(center).div(i);
            uv.x.addAssign(str.mul(sin(t.add(uv.y.mul(i)))).mul(2.1));
            uv.y.addAssign(str.mul(cos(t.add(uv.x.mul(i)))).mul(1.75));
        });

        const uvR = rotate(uv, log(length(uv)).mul(0.2));
        const finalColor = vec3(0).toVar();
        const totalWeight = float(0).toVar();

        Loop({ start: 0, end: count, type: 'float' }, ({ i }) => {
            const angle = i.mul(PI);
            const x = sin(t.mul(i.mul(0.75)).add(angle)).mul(0.5);
            const y = cos(t.mul(2).add(angle.mul(2.5)));
            const pos = positions.element(i).add(
                vec2(x, y).add(uniforms.PROGRESS.mul(i.mul(useProgress).add(float(0.25).mul(useProgress))))
            );

            const c = mix(colors.element(i), colorsBis.element(i), transition);
            const d = length(uvR.sub(pos)).toVar();
            d.assign(pow(d, 4.2));
            const w = div(1, max(0, d));

            finalColor.addAssign(c.mul(w));
            totalWeight.addAssign(w);
        });

        return finalColor.div(totalWeight);
    });

    const curvedLines = Fn(() => {
        const limit = float(20);
        const a = step(limit, screenCoordinate.x);
        const b = step(limit.add(1), screenCoordinate.x);
        return vec2(a.sub(b), b);
    });

    // ============================================================
    // CONSTRUCTION DU MATERIAL
    // ============================================================

    function buildShader(mat) {
        // Palettes de couleurs
        const colors = uniformArray([
            new Color('#DAC489'), new Color('#73CAB0'), 
            new Color('#3B4D3B'), new Color('#315261')
        ]);
        const colorsPos = uniformArray([
            new Vector2(0, -1), new Vector2(0, 0), 
            new Vector2(0, 0.25), new Vector2(0.5, 0.5)
        ]);
        
        const bgColors = uniformArray([
            new Color('#FDE7C5'), new Color('#AAA97F'), new Color('#E6D3A4')
        ]);
        const bgPos = uniformArray([
            new Vector2(0, -1), new Vector2(0.5, 0), new Vector2(0, 0)
        ]);

        // Calcul des phases de progression
        const earlyLimits = vec2(0, 0.26);
        const early = smoothstep(earlyLimits.x, earlyLimits.y, uniforms.PROGRESS).toVar();

        const midLimits = vec2(earlyLimits.y.mul(0.75), 0.8);
        const mid = step(midLimits.x, uniforms.PROGRESS).sub(step(midLimits.y.mul(0.95), uniforms.PROGRESS));

        const lastLimits = vec2(midLimits.y.mul(0.775), 1.1);
        const last = smoothstep(lastLimits.x, lastLimits.y, uniforms.PROGRESS).toVar();
        const inLast = step(lastLimits.x, uniforms.PROGRESS).sub(step(lastLimits.y, uniforms.PROGRESS));

        // UV setup
        const uvY = mix(screenUV.y, oneMinus(screenUV.y), uniforms.FLIP_UV_Y);
        const uvGPU = vec2(screenUV.x, oneMinus(screenUV.y)).toVar();
        const centered = vec2(uvGPU.mul(2).sub(1)).toVar();
        const shaderUV = vec2(centered.x.mul(uniforms.ASPECT), centered.y).toVar();

        // Effet curseur
        const cursorTex = texture(dataTextureStatic, vec2(uvGPU.x, uvY));
        const cursor = gaussianBlur(cursorTex, null, 1).rg;

        // UVs finaux
        const rotation = oneMinus(length(shaderUV.mul(2))).mul(uniforms.PROGRESS_PROJECT).mul(.15);
        const finalUV = rotate(shaderUV,rotation).add(cursor.mul(0.125));
        const linesUV = uvFlowField(shaderUV.mul(vec2(1.35))).add(cursor.mul(0.1));
        const circleUV = uvFlowField(shaderUV).add(cursor.mul(0.15));

        // Calcul des effets
        const curves = curvedLines();
        const lines = computeLines(early, mid, linesUV).mul(0.15).mul(curves.y);
        const linesAlt = computeLinesAlt(last, inLast, linesUV, mid).mul(0.15).mul(curves.y);
        const circ = circleEffect(circleUV, midLimits);
        
        const gradient = colorGradient(finalUV, colors, colorsPos, int(4), bgColors);
        const circColor = mix(float(1), circ.y, mid).mul(10);
        const innerCol = mix(float(0), circ.y.mul(gradient), mid);

        const bgGradient = colorGradient(finalUV, bgColors, bgPos, int(3), bgColors);

        // Composition
        const grain = grainEffect(finalUV).mul(0.1);
        const innerLines = lines.mul(circColor.x).add(circ.x.mul(0.35)).add(linesAlt.mul(7.5));
        const effects = vec3(1).sub(innerLines).sub(circ.y).add(innerCol);

        const loader = bgColors.element(0);
        const home = bgGradient.mul(effects);
        const project = colorGradient(
            finalUV, uniforms.PROJECT_COLORS_CURRENT, bgPos, int(3),
            uniforms.PROJECT_COLORS_NEXT, uniforms.PROGRESS_PROJECT_TRANSITION, 0
        );

        const page = mix(home, project, uniforms.PROGRESS_PROJECT);
        const final = mix(loader, page, uniforms.PROGRESS_LOADER);

        mat.colorNode = final.add(grain);
    }

    // ============================================================
    // MATERIAL & RENDER
    // ============================================================

    const material = useMemo(() => {
        if (!materialRef.current) {
            materialRef.current = new THREE.MeshBasicNodeMaterial({ side: DoubleSide });
        }
        buildShader(materialRef.current);
        materialRef.current.needsUpdate = true;
        return materialRef.current;
    }, [textureVersion, dataTextureStatic]);

    const planeZ = 1;
    const { width, height } = viewport.getCurrentViewport(camera, [0, 0, planeZ]);

    useFrame(({ pointer }) => {
        updateScroll();
        if (!isMobile) {
            updateTexture({ x: pointer.x, y: pointer.y });
            uniforms.MOUSE_POSITION.value.set(pointer.x, pointer.y);
        }
        if (mainRenderTarget.width !== size.width || mainRenderTarget.height !== size.height) {
            mainRenderTarget.setSize(size.width, size.height);
        }
    });

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <group>
            <mesh ref={glassWallRef} position={[0, 0, planeZ]}>
                <planeGeometry args={[width, height]} />
                <primitive object={material} />
            </mesh>
        </group>
    );
}
