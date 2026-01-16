"use client"
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from "gsap/SplitText";
import { useGSAP } from '@gsap/react';
import styles from '@/app/page.module.css';
import Clock from '@/components/UI/Clock';
import Meter from '@/components/UI/Meter';

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);

export default function HomeSection() {
  useGSAP(() => {
    const split = SplitText.create(`.${styles.home} h2`, {
      type: "chars, words"
    })

    gsap.fromTo(split.words, {
      filter: "blur(5px)",
      opacity: 0,
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none none none',
        start: '4.66% 50%',
        end: '8% 50%',
        scrub: true,
      },
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.75,
      scale: 1,
      delay: 2,
      stagger: {
        amount: 1,
      }
    })

    gsap.fromTo(`.${styles.home} nav ul `, {
      filter: "blur(5px)",
      scaleY: 0.5,
      opacity: 0,
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none none none',
        start: '7% 50%',
        end: '9% 50%',
        scrub: true,
      },
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.75,
      scaleY: 1,
      delay: 2,
      stagger: {
        amount: 1,
        from: "random"
      }
    })

    gsap.fromTo(`.${styles.home} .${styles.date} `, {
      filter: "blur(5px)",
      opacity: 0,
    }, {
      scrollTrigger: {
        trigger: `.${styles.container}`,
        toggleActions: 'play none none none',
        start: '8.5% 50%',
        end: '9.5% 50%',
        scrub: true,
      },
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.75,
      scale: 1,
      delay: 2,
    })
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
