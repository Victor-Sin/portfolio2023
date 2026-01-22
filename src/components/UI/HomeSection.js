"use client"
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from '@/app/page.module.css';
import Clock from '@/components/UI/Clock';
import Meter from '@/components/UI/Meter';
import { animateSplitTextWords, animateNav, animateBlurFadeIn, cleanupAnimations } from '@/utils/gsapHelpers';

gsap.registerPlugin(ScrollTrigger);

export default function HomeSection() {
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
      start: '7% 50%',
      end: '9% 50%',
      scrub: true,
    }, {
      duration: 0.75,
      delay: 2,
      blur: 5,
      scaleYStart: 0.5,
      gapStart: "4.5rem",
      gapEnd: "5rem",
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
  }, [])

  return (
    <section className={styles.home}>
      <h2>TO CREATE TAILORED, MEANINGFUL EXPERIENCES. Deep brand INSIGHTS CREATE A UNIQUELY POWERFUL THAT NO ONE HAS ATTEMPTED, WE DELVE INTO PHILOSOPHY TO CREATE TAILORED, MEANINGFUL EXPERIENCES, DEEP BRAND INSIGHTS CREATE A UNIQUELY POWERFUL </h2>
      <span className={styles.middleLine}></span>
      <nav>
        <h3>VICTOR SIN</h3>
        <ul>
          <li>
            <a href="#">WORK</a>
          </li>
          <li>
            <a href="#">CONTACT</a>
          </li>
          <li>
            <a href="#">ABOUT</a>
          </li>
          <li>
            <a href="#" className={styles.selected}>HOME</a>
          </li>
          <li>
            <a href="#">LAB</a>
          </li>
        </ul>
        <p className={styles.date}>
          <Clock />
        </p>
      </nav>
      <div className={styles.pres}>
        <ul>
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
