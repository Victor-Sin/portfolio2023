"use client"
import Image from "next/image";
import styles from "@/app/page.module.css";
import React from 'react';
import {Canvas} from "@react-three/fiber";
import {Stats} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import {WebGPURenderer} from "three/webgpu";
import Refraction from "@/components/Refraction";
import useDataTexture from "@/hooks/useDataTextureRow";

export default function Home() {
  const {dataTexture, shiftTexture} = useDataTexture({size: 1000});


  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Canvas 
        style={{position: "fixed", top: 0, left: 0, width: "100svw", height: "100svh",background: "black"}}
           gl={async (props) => {
            const renderer = new WebGPURenderer(props)
            await renderer.init()
            return renderer
          }}>
            <Stats />
            <Refraction />
        </Canvas>
        <div className={styles.test} >
        </div>
        <div className={styles.test}>
          <p>Hello</p>
        </div>
        <div className={styles.test}>
          <p>Hello</p>
        </div>
      </main>
    </div>
  );
}
