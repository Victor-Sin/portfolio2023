"use client"
import styles from '@/app/page.module.css';
import Clock from '@/components/UI/Clock/Clock';
import Meter from '@/components/UI/Meter';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animateSplitTextChars, animateSplitTextWords, animateNav, cleanupAnimations } from '@/utils/gsapHelpers';
import Navigation from '@/components/UI/Navigation';
import useMediaQuery from "@/hooks/useMediaQuery"
gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const isMobile = useMediaQuery(768)  // < 768px


  useGSAP(() => {
    const navTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: `.${styles.about}`,
        toggleActions: 'play none reverse none',
        start: '-100% 50%',
        end: 'top 50%',
        scrub: true,
      }
    });

    const navResult = animateNav(`.${styles.about} nav ul`, null, {
      duration: 0.75,
      delay: 2,
      blur: 5,
      scaleYStart: isMobile ? 1 : 0.5,
      gapStart: isMobile ? "3rem" : "5rem",
      gapEnd: isMobile ? "3.5rem" : "5rem",
      ease: "linear",
      timeline: navTimeline
    });

    const splitTextChars = animateSplitTextChars(`.${styles.about} h2`, {
      duration: 2,
      delay: 0,
      staggerAmount: 0.75,
      blur: 20,
      ease: "power2.out",
      scrollTrigger: {
        trigger: `.${styles.about}`,
        toggleActions: 'play none none none',
        start: 'top 50%',
        end: 'top 50%',
      }
    });
    let splitTextPres = null;
    let splitTextAbout = null;
    if(!isMobile){

    splitTextPres = animateSplitTextWords(`.${styles.presentation}`, {
      trigger: `.${styles.presentation}`,
      toggleActions: 'play none none none',
      start: '-0% bottom',
      end: '100% 85%',
      scrub: true,
    }, {
      duration: 0.75,
      delay: 2,
      staggerAmount: 1,
      blur: 5
    });


      splitTextAbout = animateSplitTextWords(`.${styles.aboutContent} li p`, {
      trigger: `.${styles.aboutContent} ul`,
      toggleActions: 'play none none none',
      start: '-100% 80%',
      end: '80% 80%',
      scrub: true,
    }, {
      duration: 0.75,
      delay: 2,
      staggerAmount: 1,
      blur: 5
    });
  }
    return () => {
      cleanupAnimations([
        { timeline: navTimeline, scrollTrigger: navTimeline.scrollTrigger },
        splitTextChars,
        splitTextPres,
        splitTextAbout
      ]);
    };
  }, [isMobile])

  return (
    <section className={styles.about} id="about">
      <Meter></Meter>

      <Navigation 
        variant="about" 
        selectedItem="HOME"
        customStyles={{ selected: styles.selected }}
      />
      <h2>ABOUT ME</h2>
      <div className={styles.lineContainer}>
        <span className={styles.middleLine}></span>
      </div>
      <div className={styles.aboutContent}>
        <ul>
          <li>
            <h5>(+) SKILLS</h5>
          </li>
          <ul>
            <li>
              <p>- <strong>FRONT-END DEVELOPMENT</strong> : JS ;
                 REACT.JS ; REACT NATIVE ; NEXT.JS ; GSAP ; THREE.JS ; PYTHON ; ARDUINO ; UNITY
              </p>
            </li>
          </ul>
          <ul>
            <li>
              <p>- <strong>BACK-END DEVELOPMENT</strong> : PHP ;
                LARAVEL ; MYSQL ; POSTGRESQL ; NODE.JS</p>
            </li>
          </ul>
        </ul>
        <p className={styles.presentation}>
         I’m Victor Sin, a creative developer based in Paris, graduated from Gobelins Paris. I blend interactive design and engineering to build immersive experiences — from expressive WebGL interfaces to interactive games and installations. I see every project as an opportunity to experiment, explore new ideas, and merge motion, intention, and clarity, bringing concepts to life with both technical precision and creative sensitivity.
        </p>
      </div>
      <p className={styles.copyright}>
        <span> © </span> VICTOR SIN 2026
      </p>
      <p className={styles.designedBy}>[ DESIGNED BY VALERIA FLORARIU ]</p>
      <p className={styles.date}>
        <Clock />
      </p>
    </section>
  );
}
