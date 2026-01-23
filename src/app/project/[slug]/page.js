"use client"
import { use } from 'react'
import { useRouter } from 'next/navigation'
import projectsData from '@/data/projects.json'
import { findProjectBySlug } from '@/utils/slug'
import styles from './page.module.css'
import Clock from '@/components/UI/Clock'
import { useGSAP } from '@gsap/react';
import { gsap } from "gsap";
import { useProjectSetHomeActive, useProjectSetCount } from '@/contexts/ProjectContext';
import Navigation from '@/components/UI/Navigation';

export default function ProjectPage({ params }) {
  // Utiliser use() pour accéder aux params (Next.js 15)
  const { slug } = use(params)
  const router = useRouter()
  const setProjectHomeActive = useProjectSetHomeActive()
  const project = findProjectBySlug(slug, projectsData.projects)
  const setCount = useProjectSetCount()


  useGSAP(() => {
    gsap.fromTo(`.${styles.projectPage}`, {
      opacity: 0,
    }, {
      opacity: 1,
      duration: 1,
      delay: 2,
      ease: "linear"
    })
  },[])

  function handleClick(id) {
      setProjectHomeActive("redirectHome")
      setTimeout(() => {
        router.push(`/#${id}`)
        setProjectHomeActive(null)
      }, 2000)
  }

  return (
    <div className={styles.projectPage}>
      <div className={styles.projectContent}>
        <Navigation 
          variant="project" 
          selectedItem="WORK" 
          onItemClick={handleClick}
          customStyles={{ selected: styles.selected }}
        />
        <span className={styles.middleLine}></span>
        <div className={styles.projectDetails}>
          <h3>SERIAL KILLERS</h3>
          <div className={styles.projectInfo}>
            <p className={styles.projectDescription}>
            IN THIS VIDEO GAME, CRAFTED IN UNITY AS A FINAL 
            year project for BDDI AT GOBELINS SCHOOL OF THE IMAGE, 
            EMBARK ON AN EPIC AND EMOTIONAL JOURNEY THROUGH THE EYES OF TWIN BROTHERS. 
            TAKE THE TIME TO LOSE YOURSELF IN THIS BEAUTIFUL CELL-SHADED WORLD.

{'\n\n'}IN THIS VIDEO GAME, CRAFTED IN UNITY AS A FINAL 
            year project for BDDI AT GOBELINS SCHOOL OF THE IMAGE, EMBARK ON AN EPIC AND EMOTIONAL JOURNEY THROUGH THE EYES OF TWIN BROTHERS. TAKE THE TIME TO LOSE YOURSELF IN THIS BEAUTIFUL CELL-SHADED WORLD, ENTIRELY CREATED BY OUR TEAM, AND LET YOUR IMAGINATION TAKE FLIGHT. EXPERIENCE A UNIQUE JOURNEY THROUGH THE DREAMLIKE LANDSCAPES OF STRO
            </p>
            <p className={styles.date}>DECEMBER 2023</p>
          </div>
        </div>

      </div>
      <div className={styles.projectImages} >
        <div className={styles.head}><Clock></Clock></div>
        <span className={styles.middleLine}></span>
        <div className={styles.imagesDetails}>
          <p className={styles.imagesNumber}>Image N°1</p>
          <div className={styles.projInfos}>
            <div className={styles.projCubes}>
              <span className={styles.cube}></span>
              <span className={styles.cube}></span>
              <span className={styles.cube}></span>
              <span className={styles.cube}></span>
              <span className={styles.cube}></span>
            </div>
            <div className={styles.projDescription}>
              <p><b>CREDITS : </b> IBRAHIMA KABA ; LINA ABBOUSAIR ; JESSY RANGASAMY</p>
              <p><b>STATUS : </b>DONE</p>
              <p><b>STACK : </b> UNITY ; C# ; SHADERGRAPH ;</p>
              <p><b>JOB : </b> FRONT-END DEVELOPER ; GAME DEVELOPER ;</p>
              <p><b>LINK : </b> <a href="https://example.com/project1">https://example.com/project1</a></p>
            </div>
          </div>
          <div className={styles.imageContainer}>
            <img src="/images/p1.jpg" alt="Image 1" />
            <img src="/images/p2.jpg" alt="Image 2" />
            <img src="/images/p3.jpg" alt="Image 3" />
            <img src="/images/p4.jpg" alt="Image 4" />
            <img src="/images/p5.jpg" alt="Image 5" />
            <img src="/images/p6.jpg" alt="Image 6" />
          </div>
        </div>
      </div>
    </div>
  )
}
