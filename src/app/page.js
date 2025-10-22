"use client"
import Image from "next/image";
import styles from "@/app/page.module.css";
import React from 'react';
import {Canvas} from "@react-three/fiber";
import {AdaptiveDpr, AdaptiveEvents, Stats} from "@react-three/drei";
import {WebGPURenderer} from "three/webgpu";
import Refraction from "@/components/Refraction";
import * as THREE from "three";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Canvas style={{width: "100svw", height: "100svh",background: "black"}} onCreated={state => state.gl.setClearColor("red")} 
           gl={async (props) => {
            const renderer = new WebGPURenderer(props)
            await renderer.init()
            return renderer
          }}>
            <Stats></Stats>
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
            <Environment
                    preset="studio"
                    environmentIntensity={1.5}
                    blur={0.5}
                    resolution={16}
                    background
                    backgroundBlurriness={0.5}
                />
              <ambientLight intensity={Math.PI / 2}/>
           
              <Refraction />
            </Canvas>
      </main>
    </div>
  );
}
