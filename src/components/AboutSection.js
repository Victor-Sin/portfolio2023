"use client"
import styles from '@/app/page.module.css';
import Clock from '@/components/UI/Clock';
import Meter from '@/components/UI/Meter';

export default function AboutSection() {
  return (
    <section className={styles.about}>
      <Meter></Meter>

      <nav>
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
      </nav>
      <h2>CONTACT ME</h2>
      <span className={styles.middleLine}></span>
      <div className={styles.aboutContent}>
        <ul>
          <li>
            <h5>(+) SKILLS</h5>
          </li>
          <ul>
            <li>
              <p>- <strong>FRONT-END DEVELOPMENT</strong> : SASS ; JS ;
                TYPESCRIPT; REACT.JS REACT NATIVE ;
                ANGULAR; GSAP; THREE.JS; UNITY
              </p>
            </li>
          </ul>
          <ul>
            <li>
              <p>- <strong>BACK-END DEVELOPMENT</strong> : PHP ;
                LARAVEL ; MYSQL ; POSTGRESQL ; NODE.JS ; EXPRESS</p>
            </li>
          </ul>
        </ul>
        <p className={styles.presentation}>
          I am Victor Sin, a Creative Developer based in Paris. I thrive in creating immersive experiences between the 
          reality and digital. Whether it's through the intricate patterns of Three.js or the limitless possibilities 
          of Unity, I delight in bringing life to a range of platforms - from installations and video games to dynamic websites. With an eye for composition, I also delve into web and game design, as part of my approach to creating memorable and sensational experiences.
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
