"use client"
import { use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import projectsData from '@/data/projects.json'
import { findProjectBySlug } from '@/utils/slug'
import styles from './page.module.css'
import Clock from '@/components/UI/Clock'
import { useGSAP } from '@gsap/react';
import { gsap } from "gsap";
import { useProjectSetHomeActive, useProjectSetCount } from '@/contexts/ProjectContext';
import Navigation from '@/components/UI/Navigation';
import { animateNav, animateSplitTextChars, animateSplitTextWords, addFadeInOutBlur } from '@/utils/gsapHelpers';
import { useNavigationInfo } from "@/contexts/NavigationContext";

export default function ProjectPage({ params }) {
  // Utiliser use() pour accéder aux params (Next.js 15)
  const { slug } = use(params)
  const router = useRouter()
  const setProjectHomeActive = useProjectSetHomeActive()
  const project = findProjectBySlug(slug, projectsData.projects)
  const setCount = useProjectSetCount()
  const tl = useRef(null)
  const tlImages = useRef(null)
  const navigationInfo = useNavigationInfo()
  const {contextSafe} = useGSAP()

  const animationIn = contextSafe((delay = 2) => {

    tl.current = gsap.timeline();
    tl.current.fromTo(`.${styles.projectContent} .${styles.middleLineContainer}`, {
      width: "0%",
    }, {
      delay: delay,
      width: "100%",
      duration: 1.5,
      ease: "power3.out",
    });
    animateNav(`.${styles.projectContent} nav ul`, null, {
      duration: 0.75,
      blur: 5,
      scaleYStart: 1,
      gapStart: "5rem",
      gapEnd: "5rem",
      delay: 0,
      ease: "linear",
      timeline: tl.current,
      position: "<+.15",
    });

    animateSplitTextChars(`.${styles.projectDetails} h3`, {
      duration: 2,
      delay: 0,
      staggerAmount: 0.75,
      blur: 20,
      ease: "power2.out",
      timeline: tl.current,
      position: "<+.15",
      scrollTrigger: {
        trigger: `.${styles.about}`,
        toggleActions: 'play none none none',
        start: 'top 50%',
        end: 'top 50%',
      }
    });
    tl.current.fromTo(`.${styles.projectDescription}`, {
      opacity: 0,
    }, {
      opacity: 1,
      duration: 3,
      ease: "power2.out",
    },">-2")
    .fromTo(`.${styles.date}`, {
      opacity: 0,
    }, {
      opacity: 1,
      duration: 2,
      ease: "power2.out",
    },"<");

    tlImages.current = gsap.timeline();
    tlImages.current.fromTo(`.${styles.projectImages} .${styles.middleLineContainer}`, {
      width: "0%",
    }, {
      width: "100%",
      duration: 1.5,
      delay: delay,
      ease: "power3.out",
    });

    addFadeInOutBlur(tlImages.current);
    tlImages.current
    .fadeInBlur(`.${styles.projectImages} .${styles.head}`, { x: 20,duration:1,position: "<+.15" })
    .fadeInBlur(`.${styles.projectImages} .${styles.imagesNumber}`, { x: 20,duration:1,position: "<+.25" })
    .fromTo(`.${styles.cube}`, {
      opacity: 0,
      scale: 0.25,
    }, {
      scale: 1,
      opacity: 1,
      duration: .75,
      ease: "back.out(1.27)",
      stagger: 0.05,
    }, "<+.35")
    .fromTo(`.${styles.projDescription} p`, {
      x: -10,
      opacity: 0,
      filter: "blur(5px)",
    }, {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      duration: 1,
      ease: "power2.out",
      stagger: 0.075,
    }, "<+.35")
    .fromTo(`.${styles.imageContainer} img`, {
      opacity: 0,
      filter: "blur(20px) grayscale(100%)",
      scale: 1.2
    }, {
      opacity: 1,
      filter: "blur(0px) grayscale(0%)",
      duration: 2,
      scale:1,
      ease: "power2.out",
      stagger: 0.15,
    }, "<+.2")
    .fromTo(`.${styles.imageContainer} .${styles.imageFrame}`, {
      clipPath: "inset(25% 25% 25% 25%)",
    }, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1,
      ease: "power3.out",
      stagger: 0.15,

    }, "<")



 

  })


  useGSAP(() => {
    const fromProjectPage = navigationInfo.previousPage?.includes('project')
    const toProjectPage = navigationInfo.currentPage?.includes('project')
 
    if(!(fromProjectPage && toProjectPage)){
      console.log("not navigate project page")
      console.log(navigationInfo.navigationType)
      if(navigationInfo.navigationType === 'navigate'){
        animationIn(0)
      }
      else{
        animationIn(2)
      }
    }
 

    return () => {
      tl.current.kill()
      tlImages.current.kill()
    }
  },[navigationInfo.navigationType,navigationInfo.currentPage,navigationInfo.previousPage])

  function handleClick(id) {
      // Accélérer la réversion en x2 ou x3
      const revertSpeed = 2; // Ajustez cette valeur (2 = x2, 3 = x3, etc.)
      
      if (tl.current) {
        tl.current.timeScale(revertSpeed);
        tl.current.reverse();
      }
      
      if (tlImages.current) {
        tlImages.current.timeScale(revertSpeed);
        tlImages.current.reverse();
      }
      
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
        <div className={styles.middleLineContainer}>
          <span className={styles.middleLine}></span>
        </div>
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
        <div className={styles.middleLineContainer}>
          <span className={styles.middleLine}></span>
        </div>        
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
            <div className={styles.imageFrame}>
            <img src="/images/p1.jpg" alt="Image 1" />
            </div>
            <div className={styles.imageFrame}>
            <img src="/images/p2.jpg" alt="Image 2" />
            </div>
            <div className={styles.imageFrame}>
            <img src="/images/p3.jpg" alt="Image 3" />
            </div>
            <div className={styles.imageFrame}>
            <img src="/images/p4.jpg" alt="Image 4" />
            </div>
            <div className={styles.imageFrame}>
            <img src="/images/p5.jpg" alt="Image 5" />
            </div>
            <div className={styles.imageFrame}>
            <img src="/images/p6.jpg" alt="Image 6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
