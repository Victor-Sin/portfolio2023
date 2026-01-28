"use client"
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from '@/app/page.module.css';
import Clock from '@/components/UI/Clock';
import Meter from '@/components/UI/Meter';
import { animateSplitTextWords, animateNav, animateBlurFadeIn, cleanupAnimations } from '@/utils/gsapHelpers';
import Navigation from '@/components/UI/Navigation';
import useMediaQuery from "@/hooks/useMediaQuery"


gsap.registerPlugin(ScrollTrigger);

export default function HomeSection() {
  const isMobile = useMediaQuery(768)  // < 768px

  
  useGSAP(() => {
    const splitText1 = animateSplitTextWords(`.${styles.home} h2`, {
      trigger: `.${styles.container}`,
      toggleActions: 'play none none none',
      start: '4.66% 50%',
      end: '8% 50%',
      scrub: true,
    }, {
      duration: 0.75,
      delay: 2,
      staggerAmount: 1,
      blur: 5
    });

    const splitText2 = animateSplitTextWords(`.${styles.home} .${styles.pres} li`, {
      trigger: `.${styles.home} .${styles.pres}`,
      toggleActions: 'play none none none',
      start: '-50% bottom',
      end: '100% 65%',
      scrub: true,
    }, {
      duration: 0.75,
      delay: 2,
      staggerAmount: 1,
      blur: 5
    });

    const navResult = animateNav(`.${styles.home} nav ul`, {
      trigger: `.${styles.container}`,
      toggleActions: 'play none none none',
      start: isMobile ? '5.5% 50%' : '7% 50%',
      end: isMobile ? '8% 50%' : '9% 50%',
      scrub: true,
    }, {
      duration: 0.75,
      delay: 2,
      blur: 5,
      scaleYStart: isMobile ? 1 : 0.5,
      gapStart: isMobile ? "3rem" : "4.5rem",
      gapEnd: isMobile ? "3.5rem" : "5rem",
      ease: "circ.out"
    });

    const blurFade = animateBlurFadeIn(`.${styles.home} .${styles.date}`, {
      trigger: `.${styles.container}`,
      toggleActions: 'play none none none',
      start: '4.66% 50%',
      end: '8% 50%',
    }, {
      duration: 0.75,
      delay: 2,
      blur: 5
    });

    return () => {
      cleanupAnimations([splitText1, splitText2, navResult, blurFade]);
    };
  }, [isMobile])

  return (
    <section className={styles.home} id="contact">
      <h2>TO CREATE TAILORED, MEANINGFUL EXPERIENCES. Deep brand INSIGHTS CREATE A UNIQUELY POWERFUL THAT NO ONE HAS ATTEMPTED, WE DELVE INTO PHILOSOPHY TO CREATE TAILORED, MEANINGFUL EXPERIENCES, DEEP BRAND INSIGHTS CREATE A UNIQUELY POWERFUL </h2>
      <span className={styles.middleLine}></span>
      <Navigation 
        variant={isMobile ? "homeMobile" : "home"} 
        selectedItem="HOME"
        customStyles={{ selected: styles.selected, date: styles.date }}
      />
      <div className={styles.pres}>
        <ul>
          <li className={styles.titleMobile}>VICTOR SIN</li>
          <li>(+) CONTACT</li>
          <li >
            <ul className={styles.contact}>
              <li>- SIN.VICTOR@OUTLOOK.FR</li>
              <li>- <a href="https://www.linkedin.com/in/victor-sin-/">LinkedIn</a></li>
              <li>- <a href="https://www.twitter.com/victor_sin_/">Twitter</a></li>
            </ul>
          </li>
          <li>(+) WHERE</li>
          <li>
            <ul>
              <li>- PARIS, FRANCE</li>
            </ul>
          </li>
          <li>(+) SERVICES PROVIDED</li>
          <li>
            <ul>
              <li>- WEB DEVELOPMENT</li>
              <li>- UI/UX DESIGN</li>
              <li>- INTERACTIVE EXPERIENCES</li>
            </ul>
          </li>
        </ul>
      </div>
      <Meter></Meter>
    </section>
  );
}
