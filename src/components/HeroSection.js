"use client"
import { gsap } from 'gsap';
import { SplitText } from "gsap/SplitText";
import { useGSAP } from '@gsap/react';
import styles from '@/app/page.module.css';
import Clock from '@/components/UI/Clock';
import Meter from '@/components/UI/Meter';

gsap.registerPlugin(SplitText);

export default function HeroSection() {
  function animHomeBlur(elt, duration, delay) {
    gsap.fromTo(elt, {
      filter: "blur(20px)",
      opacity: 0,
    }, {
      opacity: 1,
      filter: "blur(0px)",
      duration: duration,
      scale: 1,
      delay: delay,
    })
  }

  useGSAP(() => {
    const split = SplitText.create(`.${styles.hero} h1`, {
      type: "chars, words"
    })

    gsap.fromTo(split.chars, {
      filter: "blur(20px)",
      opacity: 0,
    }, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.75,
      scale: 1,
      delay: 2,
      stagger: {
        amount: 1,
        from: "random"
      }
    })

    animHomeBlur(`.${styles.hero} .${styles.pressure}`, 1.5, 2.75)
    animHomeBlur(`.${styles.hero} .${styles.date}`, 2.5, 2.5)
    animHomeBlur(`.${styles.scrollIndicator}`, 1.5, 2.5)
  }, [])

  return (
    <section className={styles.hero}>
      <div className={styles.scrollIndicator}>(X)  [ SCROLL ]</div>
      <span className={styles.middleLine}></span>
      <h1>CREATIVE DEV</h1>
      <p className={styles.pressure}>
        <Meter></Meter>
      </p>
      <p className={styles.date}>
        <Clock />
      </p>
    </section>
  );
}
