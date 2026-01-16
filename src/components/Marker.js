"use client"
import { gsap } from 'gsap';
import { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import styles from '@/app/page.module.css';
import projectsData from '@/data/projects.json';
import { useProjectCount, useProjectSetCount, useProjectSetHomeActive } from '@/contexts/ProjectContext';

gsap.registerPlugin(ScrollTrigger);

export default function Marker() {
  const count = useProjectCount()
  const setCount = useProjectSetCount()
  const setProjectHomeActive = useProjectSetHomeActive()
  const prevCountRef = useRef(0);
  const animationKeyRef = useRef(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const infosRef = useRef(null);
  const buttonRef = useRef(null);

  const tl = useRef(null);
  
  // Trouver le projet actuel basé sur le count
  const currentProject = useMemo(() => {
    const projectId = count === 0 ? 1 : count;
    return projectsData.projects.find(p => p.id === projectId) || projectsData.projects[0];
  }, [count]);
  
  useEffect(() => {
    if (prevCountRef.current !== count && prevCountRef.current !== 0) {
      animationKeyRef.current += 1;
      setShouldAnimate(true);
      
      // Animation de transition : fade out avec blur
      const tl = gsap.timeline();

        // Mettre à jour prevCountRef après le fade out
        prevCountRef.current = count;

    } else if (prevCountRef.current !== count) {
      // Première fois ou transition depuis 0
      animationKeyRef.current += 1;
      setShouldAnimate(true);
      prevCountRef.current = count;
      const timer = setTimeout(() => setShouldAnimate(false), 400);
      return () => clearTimeout(timer);
    }
  }, [count]);
  
  useGSAP(() => {
    gsap.timeline({
      scrollTrigger: {
        trigger: `.${styles.projets}`,
        toggleActions: 'play reverse play reverse',
        start: 'top 15%',
        end: '575% bottom',
        pin: true,
      },
    })
   

    tl.current = gsap.timeline({ scrollTrigger: {
      trigger: `.${styles.container}`,
      toggleActions: 'play reverse play reverse',
      start: '40% bottom',
      end: '65% bottom',
    }}).to(`.${styles.nameProject}`, {
      opacity: 1,
    }).to(`.${styles.projets}`, {
      opacity: 1,
    },"<")

    
    gsap.fromTo(`.${styles.marker1}`,{
      width: '100px',
      height: '100px',
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none reverse none',
        start: '40% bottom',
        end: '40% bottom',
        onEnter: () => {
          setCount(1)
          setProjectHomeActive(true)
        },
        onLeaveBack: () => {
          setProjectHomeActive(false)
        },
        onEnterBack: () => {
          setCount(1)
        }
      },
      width: '0px',
      height: '0px',
    })

    gsap.fromTo(`.${styles.marker1}`,{
      width: '0px',
      height: '0px',
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none reverse none',
        start: '45% bottom',
        end: '45% bottom',
        onEnter: () => {
          setCount(2)
        },
        onEnterBack: () => {
          setCount(2)
        }
      },
      width: '100px',
      height: '100px',
    })

    gsap.fromTo(`.${styles.marker1}`,{
      width: '100px',
      height: '100px',
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none reverse none',
        start: '50% bottom',
        end: '50% bottom',
        onEnter: () => {
          setCount(3)
        },
        onEnterBack: () => {
          setCount(3)
        }
      },
      width: '0px',
      height: '0px',
    })

    gsap.fromTo(`.${styles.marker1}`,{
      width: '0px',
      height: '0px',
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none reverse none',
        start: '55% bottom',
        end: '55% bottom',
        onEnter: () => {
          setCount(4)
        },
        onEnterBack: () => {
          setCount(4)
        }
      },
      width: '100px',
      height: '100px',
    })

    gsap.fromTo(`.${styles.marker1}`,{
      width: '100px',
      height: '100px',
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none reverse none',
        start: '60% bottom',
        end: '60% bottom',
        onEnter: () => {
          setCount(5)
        },
        onEnterBack: () => {
          setCount(5)
        }
      },
      width: '0px',
      height: '0px',
    }) 

    gsap.fromTo(`.${styles.marker1}`,{
      width: '0px',
      height: '0px',
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none reverse none',
        start: '65% bottom',
        end: '65% bottom',
        onEnter: () => {
          setCount(6)
        },
        onEnterBack: () => {
          setCount(6)
          setProjectHomeActive(true)
        },
        onLeave: () => {
          setProjectHomeActive(false)
        },
      },
      width: '100px',
      height: '100px',
      opacity: 0,
    })
  }, []);

  return <>
  <p className={styles.nameProject}> VICTOR SIN</p>
  <div className={styles.projets}> 
    <div className={styles.headStatic}>
      <h5>PROJECTS</h5>
    </div>
    <div className={styles.infos} ref={infosRef}>
      <h5>{currentProject.title}</h5>
      <p className={styles.date}>{currentProject.date}</p>
      <p className={styles.client}>{currentProject.client}</p>
      <p className={styles.type}>{currentProject.type}</p>
    </div>
    <button ref={buttonRef} onClick={() => window.open(currentProject.link, '_blank')}>LEARN MORE</button>
    <div className={styles.counter}>
      [ 0<span 
          className={`${styles.counterNumber} ${shouldAnimate ? styles.animate : ''}`}
          key={`count-${count}-${animationKeyRef.current}`}
        >
          {count}
        </span> / 06 ]
    </div>

  </div>
  </>
}
