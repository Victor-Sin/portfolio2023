"use client"
import { use, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import projectsData from '@/data/projects.json'
import { findProjectBySlug } from '@/utils/slug'
import styles from './page.module.css'
import Clock from '@/components/UI/Clock/Clock'
import { useGSAP } from '@gsap/react';
import { gsap } from "gsap";
import { useProjectSetHomeActive, useProjectSetCount, useProjectCount } from '@/contexts/ProjectContext';
import Navigation from '@/components/UI/Navigation';
import { animateNav, animateSplitTextChars, animateSplitTextWords, addFadeInOutBlur } from '@/utils/gsapHelpers';
import { useNavigationInfo } from "@/contexts/NavigationContext";
import useMediaQuery from "@/hooks/useMediaQuery"
import Image from 'next/image'
export default function ProjectPage({ params }) {
  const isMobile = useMediaQuery(768)  // < 768px
  const { slug } = use(params)
  const router = useRouter()
  const setProjectHomeActive = useProjectSetHomeActive()
  const project = findProjectBySlug(slug, projectsData.projects)
  const setCount = useProjectSetCount()
  const count = useProjectCount()
  const haveBeenAnimate = useRef(false)
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
      gapStart: isMobile ? "3rem" : "5rem",
      gapEnd: isMobile ? "3.5rem" : "5rem",
      delay: 0,
      ease: "linear",
      timeline: tl.current,
      position: "<+.15",
    });

    gsap.set(`.${styles.projectDetails} h3`, { opacity: 1 });

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
      width: isMobile ? "100vw" : "100%",
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

    if(!haveBeenAnimate.current){
      haveBeenAnimate.current = true
      tl.current?.kill()
      tlImages.current?.kill()
      if(fromProjectPage && toProjectPage){
        animationOutReverse()
      }
      else if(navigationInfo.navigationType === 'navigate'){
        animationIn(0)
      }
      else{
        animationIn(2)
      }
    }

    // Cleanup: kill les timelines uniquement (pas de reset haveBeenAnimate ici car le cleanup
    // s'exécute aussi lors des changements de dépendances, pas seulement au démontage)
    return () => {
      tl.current?.kill()
      tlImages.current?.kill()
    }
  },[navigationInfo.navigationType,navigationInfo.currentPage,navigationInfo.previousPage])

  // Reset haveBeenAnimate uniquement au démontage du composant (changement de page)
  useEffect(() => {
    return () => {
      haveBeenAnimate.current = false
    }
  }, [])

  useEffect(() => {
    if(count !== project.id){
      setCount(project.id)
    }
  }, [project.id, count])

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

  const animationOut = contextSafe((onComplete) => {
    tl.current?.kill()
    tlImages.current?.kill()

    let completed = 0;
    const checkComplete = () => { if(++completed === 2 && onComplete) onComplete() };

    tl.current = gsap.timeline({ onComplete: checkComplete });
    tl.current.timeScale(2);
    tl.current.to(`.${styles.projectDetails} h3`, {
      opacity: 0,
      filter: "blur(20px)",
      duration: 2,
      ease: "power2.in",
    })
    .to(`.${styles.projectDescription}`, {
      opacity: 0,
      duration: 2,
      ease: "power2.in",
    }, "<+.15")
    .to(`.${styles.date}`, {
      opacity: 0,
      duration: 2,
      ease: "power2.in",
    }, "<");

    tlImages.current = gsap.timeline({ onComplete: checkComplete });
    tlImages.current.timeScale(2);

    addFadeInOutBlur(tlImages.current);
    tlImages.current
    .fadeOutBlur(`.${styles.projectImages} .${styles.imagesNumber}`, { x: 20, duration: 1, position: "<+.25" })
    .to(`.${styles.cube}`, {
      opacity: 0,
      scale: 0.25,
      duration: .75,
      ease: "back.in(1.27)",
      stagger: 0.05,
    }, "<+.35")
    .to(`.${styles.projDescription} p`, {
      x: -10,
      opacity: 0,
      filter: "blur(5px)",
      duration: 1,
      ease: "power2.in",
      stagger: 0.075,
    }, "<+.35")
    .to(`.${styles.imageContainer} img`, {
      opacity: 0,
      filter: "blur(20px) grayscale(100%)",
      scale: 1.2,
      duration: 1,
      ease: "power2.in",
      stagger: 0.15,
    }, "<+.2")
    .to(`.${styles.imageContainer} .${styles.imageFrame}`, {
      clipPath: "inset(35% 35% 35% 35%)",
      duration: 1,
      ease: "power3.in",
      stagger: 0.15,
    }, "<");
  })

  const animationOutReverse = contextSafe(() => {
    tl.current = gsap.timeline();
    tl.current.timeScale(2);

    gsap.set(`.${styles.projectDetails} h3`, { opacity: 1 });

    animateSplitTextChars(`.${styles.projectDetails} h3`, {
      duration: 2,
      delay: 0,
      staggerAmount: 0.75,
      blur: 20,
      ease: "power2.out",
      timeline: tl.current,
      position: "<+.15",
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
    tlImages.current.timeScale(2);
    addFadeInOutBlur(tlImages.current);
    tlImages.current
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
    }, "<");
  })

  const handleClickNextProject = contextSafe(() => {
    haveBeenAnimate.current = false
    animationOut(() => {
      router.push(`/project/${project.nextProject}`)
    })
  })

  return (
    <div className={styles.projectPage}>
      <div className={`${styles.mobileClock} ${styles.date}`}>
        <Clock></Clock>
      </div>
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
          <h3>{project.innerTitle}</h3>
          <div className={styles.projectInfo}>
            <div className={styles.projectDescription}>
            {project.mainContent.map((content, index) => (
              <p key={index}>{content}</p>
            ))}
            <button onClick={handleClickNextProject}>        
                <span>LEARN MORE</span>
            </button>
            </div>
            <div className={styles.date}>
            {project.date}
            </div>
          </div>
        </div>

      </div>
      <div className={styles.projectImages} >
        <div className={styles.head}><Clock></Clock></div>
        <div className={styles.middleLineContainer}>
          <span className={styles.middleLine}></span>
        </div>        
        <div className={styles.imagesDetails}>
          <p className={styles.imagesNumber}>Image N°{project.imagesProject.length}</p>
          <div className={styles.projInfos}>
            <div className={styles.projCubes}>
            {project.imagesProject.map((image, index) => (
                         <span className={styles.cube}></span>
            ))}
          
            </div>
            <div className={styles.projDescription}>
              {
                Object.keys(project.details).map((detail, index) => (
                  <p key={index}><b>{detail} : </b> {project.details[detail]}</p>
                ))
              }
            </div>
          </div>
          <div className={styles.imageContainer}>
            {project.imagesProject.map((image, index) => (
              <div className={styles.imageFrame} key={index}>
                <Image src={image} alt={`Image ${index + 1}`} width={1000} height={1000} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
