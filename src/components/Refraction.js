import {useFBO, useTexture} from "@react-three/drei";
import {useMemo, useRef} from "react";
import {DoubleSide, PlaneGeometry, RepeatWrapping} from "three";
import * as THREE from 'three/webgpu'
import {useFrame, useThree} from "@react-three/fiber";
import {useControls} from "leva";
import {screenUV,time,min,array, float, int, uniform, Fn, add, mat2, vec3, sin, cos, vec2, mat3, dot, fract, floor, mul, sub, mix, uv, abs, pow, Loop, If, normalize, fwidth, step, vec4, smoothstep, length } from 'three/tsl';

export default function Refraction(){
    const meshRef = useRef()
    const glassWallRef = useRef()
    const mainRenderTarget = useFBO();


    const textureNoise = useTexture("/images/noise.png")
    textureNoise.wrapT = RepeatWrapping
    textureNoise.wrapS = RepeatWrapping

    const uniforms = useMemo(() => {
        return {
            CAMERA_HEIGHT: uniform(10),
            CAMERA_TILT_ANGLE: uniform(0.97),
            PROGRESS: uniform(0)
        }
    },[])

    const props = useControls(
        {
            CAMERA_HEIGHT: { value: uniforms.CAMERA_HEIGHT.value, min: -20, max: 20, onChange: (value) => {
                uniforms.CAMERA_HEIGHT.value = value
            }},
            CAMERA_TILT_ANGLE: { value: uniforms.CAMERA_TILT_ANGLE.value, min: -2, max: 2, onChange: (value) => {
                uniforms.CAMERA_TILT_ANGLE.value = value
            } },
            PROGRESS: { value: uniforms.PROGRESS.value, min: 0, max: 1, onChange: (value) => {
                uniforms.PROGRESS.value = value
            } }
        }
    )

    
  

    const DISTANCE_BETWEEN_LINES = float( 0.2 );
    const WAVE_GEO_ITERATIONS = int( int( 2 ) );
    const WAVE_BASE_HEIGHT = float( 1.25 );
    const WAVE_CHOPPINESS = float( 5. );
    const WAVE_ANIM_SPEED = float( 1.8 );
    const WAVE_FREQUENCY = float( 0.075 );
    const RAYMARCH_STEPS = int( int( 10 ) );

 
    const { size } = useThree()
    const aspect = size.width / size.height
    
    const animatedWaveTime = /*#__PURE__*/ Fn( () => {
    
        return add( 1.0, time.mul( WAVE_ANIM_SPEED ) );
    
    } ).setLayout( {
        name: 'animatedWaveTime',
        type: 'float',
        inputs: []
    } );
    
    const OCTAVE_MATRIX = mat2( 1.6, 1.2, float( - 1.2 ), 1.6 );
    
    const createRotationMatrix = /*#__PURE__*/ Fn( ( [ eulerAngles_immutable ] ) => {
    
        const eulerAngles = vec3( eulerAngles_immutable ).toVar();
        const sinCosX = vec2( sin( eulerAngles.x ), cos( eulerAngles.x ) ).toVar();
        const sinCosY = vec2( sin( eulerAngles.y ), cos( eulerAngles.y ) ).toVar();
        const sinCosZ = vec2( sin( eulerAngles.z ), cos( eulerAngles.z ) ).toVar();
        const rotationMatrix = mat3().toVar();
        rotationMatrix.element( int( 0 ) ).assign( vec3( sinCosX.y.mul( sinCosZ.y ).add( sinCosX.x.mul( sinCosY.x ).mul( sinCosZ.x ) ), sinCosX.y.mul( sinCosY.x ).mul( sinCosZ.x ).add( sinCosZ.y.mul( sinCosX.x ) ), sinCosY.y.negate().mul( sinCosZ.x ) ) );
        rotationMatrix.element( int( 1 ) ).assign( vec3( sinCosY.y.negate().mul( sinCosX.x ), sinCosX.y.mul( sinCosY.y ), sinCosY.x ) );
        rotationMatrix.element( int( 2 ) ).assign( vec3( sinCosZ.y.mul( sinCosX.x ).mul( sinCosY.x ).add( sinCosX.y.mul( sinCosZ.x ) ), sinCosX.x.mul( sinCosZ.x ).sub( sinCosX.y.mul( sinCosZ.y ).mul( sinCosY.x ) ), sinCosY.y.mul( sinCosZ.y ) ) );
    
        return rotationMatrix;
    
    } ).setLayout( {
        name: 'createRotationMatrix',
        type: 'mat3',
        inputs: [
            { name: 'eulerAngles', type: 'vec3' }
        ]
    } );
    
    const randomHash = /*#__PURE__*/ Fn( ( [ p_immutable ] ) => {
    
        const p = vec2( p_immutable ).toVar();
        const h = float( dot( p, vec2( 127.1, 311.7 ) ) ).toVar();
    
        return fract( sin( h ).mul( 43758.5453123 ) );
    
    } ).setLayout( {
        name: 'randomHash',
        type: 'float',
        inputs: [
            { name: 'p', type: 'vec2' }
        ]
    } );
    
    const perlinNoise = /*#__PURE__*/ Fn( ( [ p_immutable ] ) => {
    
        const p = vec2( p_immutable ).toVar();
        const integerPart = vec2( floor( p ) ).toVar();
        const fractionalPart = vec2( fract( p ) ).toVar();
        const smoothedCurve = vec2( fractionalPart.mul( fractionalPart ).mul( sub( 3.0, mul( 2.0, fractionalPart ) ) ) ).toVar();
    
        return float( - 1.0 ).add( mul( 2.0, mix( mix( randomHash( integerPart.add( vec2( 0.0, 0.0 ) ) ), randomHash( integerPart.add( vec2( 1.0, 0.0 ) ) ), smoothedCurve.x ), mix( randomHash( integerPart.add( vec2( 0.0, 1.0 ) ) ), randomHash( integerPart.add( vec2( 1.0, 1.0 ) ) ), smoothedCurve.x ), smoothedCurve.y ) ) );
    
    } ).setLayout( {
        name: 'perlinNoise',
        type: 'float',
        inputs: [
            { name: 'p', type: 'vec2' }
        ]
    } );
    
    const generateWaveOctave = /*#__PURE__*/ Fn( ( [ uv_immutable, choppiness_immutable ] ) => {
    
        const choppiness = float( choppiness_immutable ).toVar();
        const uv = vec2( uv_immutable ).toVar();
        uv.addAssign( perlinNoise( uv ) );
        const waveShape = vec2( sub( 1.0, abs( sin( uv ) ) ) ).toVar();
        const secondaryWave = vec2( abs( cos( uv ) ) ).toVar();
        waveShape.assign( mix( waveShape, secondaryWave, waveShape ) );
    
        return pow( sub( 1.0, waveShape.x.mul( waveShape.y ) ), choppiness );
    
    } ).setLayout( {
        name: 'generateWaveOctave',
        type: 'float',
        inputs: [
            { name: 'uv', type: 'vec2' },
            { name: 'choppiness', type: 'float' }
        ]
    } );
    
    const oceanHeightMap = /*#__PURE__*/ Fn( ( [ p_immutable ] ) => {
    
        const p = vec3( p_immutable ).toVar();
        const frequency = float( WAVE_FREQUENCY ).toVar();
        const amplitude = float( WAVE_BASE_HEIGHT ).toVar();
        const choppiness = float( WAVE_CHOPPINESS ).toVar();
        const uv = vec2( p.xz ).toVar();
        uv.x.mulAssign( 2. );
        const totalHeight = float( 0.0 ).toVar();
    
        Loop( { start: int( 0 ), end: WAVE_GEO_ITERATIONS }, ( { i } ) => {
    
            const wave = float( generateWaveOctave( uv.add( animatedWaveTime() ).mul( frequency ), choppiness ) ).toVar();
            wave.addAssign( generateWaveOctave( uv.sub( animatedWaveTime() ).mul( frequency ), choppiness ) );
            totalHeight.addAssign( wave.mul( amplitude ) );
            uv.mulAssign( OCTAVE_MATRIX );
            frequency.mulAssign( 1.9 );
            amplitude.mulAssign( 0.22 );
            choppiness.assign( mix( choppiness, 1.0, 0.2 ) );
    
        } );
    
        return p.y.sub( totalHeight );
    
    } ).setLayout( {
        name: 'oceanHeightMap',
        type: 'float',
        inputs: [
            { name: 'p', type: 'vec3' }
        ]
    } );
    
    const getRayDirection = /*#__PURE__*/ Fn( ( [ normCoords_immutable, cameraAngles_immutable ] ) => {
    
        const cameraAngles = vec3( cameraAngles_immutable ).toVar();
        const normCoords = vec2( normCoords_immutable ).toVar();
        const dir = vec3( normalize( vec3( normCoords.xy, float( - 2.0 ) ) ) ).toVar();
    
        return normalize( dir ).mul( createRotationMatrix( cameraAngles ) );
    
    } ).setLayout( {
        name: 'getRayDirection',
        type: 'vec3',
        inputs: [
            { name: 'normCoords', type: 'vec2' },
            { name: 'cameraAngles', type: 'vec3' }
        ]
    } );
    
    const computeLineColor = /*#__PURE__*/ Fn( ( [ normalizedCoords_immutable, cameraAngles_immutable, rayOrigin_immutable, lineLimit_immutable,lineLimitBis_immutable ] ) => {
    
        const lineLimitTop = float( lineLimit_immutable ).toVar();
        const lineLimitBottom = float( lineLimitBis_immutable ).toVar();
        const rayOrigin = vec3( rayOrigin_immutable ).toVar();
        const cameraAngles = vec3( cameraAngles_immutable ).toVar();
        const normalizedCoords = vec2( normalizedCoords_immutable ).toVar();
        const rayDirection = vec3( getRayDirection( normalizedCoords, cameraAngles ) ).toVar();
        const surfacePoint = vec3().toVar();
        
        // Inline traceOceanSurface
        const nearDistance = float( 0.0 ).toVar();
        const farDistance = float( 100.0 ).toVar();
        const farHeight = float( oceanHeightMap( rayOrigin.add( rayDirection.mul( farDistance ) ) ) ).toVar();
        const intersectionDistance = float( 0.0 ).toVar();
        
        If( farHeight.greaterThan( 0.0 ), () => {
            intersectionDistance.assign( farDistance );
            surfacePoint.assign( rayOrigin.add( rayDirection.mul( intersectionDistance ) ) );
        } ).Else( () => {
            const nearHeight = float( oceanHeightMap( rayOrigin.add( rayDirection.mul( nearDistance ) ) ) ).toVar();
            Loop( { start: int( 0 ), end: RAYMARCH_STEPS }, ( { i } ) => {
                intersectionDistance.assign( mix( nearDistance, farDistance, nearHeight.div( nearHeight.sub( farHeight ) ) ) );
                surfacePoint.assign( rayOrigin.add( rayDirection.mul( intersectionDistance ) ) );
                const currentHeight = float( oceanHeightMap( surfacePoint ) ).toVar();
                If( currentHeight.lessThan( 0.0 ), () => {
                    farDistance.assign( intersectionDistance );
                    farHeight.assign( currentHeight );
                } ).Else( () => {
                    nearDistance.assign( intersectionDistance );
                    nearHeight.assign( currentHeight );
                } );
            } );
        } );
        
        const distanceCoord = float( surfacePoint.z.div( DISTANCE_BETWEEN_LINES ).add( surfacePoint.y.add( sub( 1.0, normalizedCoords.y ).add( surfacePoint.y ).mul( 0.35 ) ).mul( 3.0 ) ) ).toVar();
        const intensity = float( abs( fract( distanceCoord ).sub( 0.5 ) ).div( fwidth( distanceCoord ) ) ).toVar();
        intensity.assign( float(1).sub(min(intensity,1)) );
        intensity.assign(pow(intensity,float(1.0/2.2)));
    
        return step( lineLimitTop, distanceCoord ).mul(step( distanceCoord, lineLimitBottom)).mul( vec4( intensity ) )
    
    } ).setLayout( {
        name: 'computeLineColor',
        type: 'vec4',
        inputs: [
            { name: 'normalizedCoords', type: 'vec2' },
            { name: 'cameraAngles', type: 'vec3' },
            { name: 'rayOrigin', type: 'vec3' },
            { name: 'lineLimit', type: 'float' }
        ]
    } );


    function fragmentMat(mat, aspectValue){
       // DÉFINITION DES POINTS CLÉS DE L'ANIMATION (séquentiel)
       const depthKeyframes = array([float(-2.0), float(2.0), float(10.0), float(20.0), float(15.0), float(20.0)]);
       const tiltKeyframes = array([float(0.65), float(0.87), float(1.33), float(2.), float(2.8), float(3.14)]);
       const progressBreakpoints = array([float(0.0), float(0.25), float(0.5), float(0.75), float(0.9), float(1.0)]);
         
       // TROUVER L'INTERVALLE COURANT AUTOMATIQUEMENT

       
       // Trouver entre quels points clés nous sommes
       const segmentIndex = float(
        step( progressBreakpoints.element(1), uniforms.PROGRESS)
        .add(step(progressBreakpoints.element(2), uniforms.PROGRESS))
        .add(step(progressBreakpoints.element(3), uniforms.PROGRESS))
        .add(step(progressBreakpoints.element(4), uniforms.PROGRESS))
        .add(step(progressBreakpoints.element(5), uniforms.PROGRESS))
    );

       // CALCUL DU PROGRÈS LOCAL DANS LE SEGMENT [0, 1]
       const segmentStart = progressBreakpoints.element(segmentIndex);
       const segmentEnd = progressBreakpoints.element(segmentIndex.add(1));
       const localProgress = smoothstep(segmentStart, segmentEnd, uniforms.PROGRESS).toVar();
       
       // INTERPOLATION AUTOMATIQUE ENTRE LES VALEURS
 
       const cameraDepth = mix(
           depthKeyframes.element(segmentIndex), 
           depthKeyframes.element(segmentIndex.add(1)), 
           localProgress
       ).toVar();
       
       const cameraTiltAngle = mix(
           tiltKeyframes.element(segmentIndex), 
           tiltKeyframes.element(segmentIndex.add(1)), 
           localProgress
       ).toVar();

        const lineLimitTop = float( 0.0 ).toVar();
        const lineLimitBottom = float( 115.0 ).toVar();
        const cameraAngles = vec3( float( 0.0 ), cameraTiltAngle, float( 0.0 ) ).toVar();
        const rayOrigin = vec3( float( 0. ), 10, cameraDepth).toVar();
        // WebGPU flip Y, then convert to Shadertoy-style normalized coords:
        // normalized = vec2( aspect*(2*uv.x-1), 2*uv.y-1 )
        const uvWebGPU = vec2( screenUV.x, float( 1.0 ).sub( screenUV.y ) ).toVar();
        const centered = vec2( uvWebGPU.mul( 2.0 ).sub( 1.0 ) ).toVar();
        const aspectNode = float( aspectValue );
        const shadertoyUV = vec2( centered.x.mul( aspectNode ), centered.y ).toVar();
        const baseLineColor = vec4( computeLineColor( shadertoyUV, cameraAngles, rayOrigin, lineLimitTop, lineLimitBottom ) ).toVar();
        mat.colorNode = baseLineColor
    }


    const material = useMemo(() => {

        const mat = new THREE.MeshBasicNodeMaterial({
            side: DoubleSide,
        })
        fragmentMat(mat, aspect)
        return mat;
    },[aspect,])

    const planeZ = 1.5
    const { camera, viewport } = useThree()
    const { width, height } = viewport.getCurrentViewport(camera, [0,0,planeZ])

    useFrame((state) => {
        const { gl, scene, camera } = state;
        glassWallRef.current.visible = false;
        gl.setRenderTarget(mainRenderTarget);
        gl.render(scene, camera);


        // Pass the texture data to our shader material
        gl.setRenderTarget(null);
        // Show the mesh
        glassWallRef.current.visible = true;
    })

    return (
        <group>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1.5,32,32]}></sphereGeometry>
                <meshStandardMaterial roughness={.5} metalness={0.5} color={"red"}></meshStandardMaterial>
            </mesh>
            <mesh ref={glassWallRef} position={[0,0,planeZ]}>
                <planeGeometry args={[width, height]} />
                <primitive object={material} />
            </mesh>
        </group>

    )
}



