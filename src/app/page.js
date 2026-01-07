"use client"
import styles from "@/app/page.module.css";
import React from 'react';
export default function Home() {


  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container} >
          <section className={styles.home} >
            <div className={styles.scrollIndicator}>(X)  [ SCROLL ]</div>
            <span className={styles.middleLine}></span>
            <h1>CREATIVE DEV</h1>
            <p className={styles.pressure}>
              (+) 221 BAR - 245°
            </p>
            <p className={styles.date}>
              SUN12:00:00
            </p>
          </section>
          <section className={styles.about} >
            <h2>TO CREATE TAILORED, MEANINGFUL EXPERIENCES. Deep brand INSIGHTS CREATE A UNIQUELY POWERFUL THAT NO ONE HAS ATTEMPTED, WE DELVE INTO PHILOSOPHY TO CREATE TAILORED, MEANINGFUL EXPERIENCES, DEEP BRAND INSIGHTS CREATE A UNIQUELY POWERFUL </h2>
            <span className={styles.middleLine}></span>
            <nav>
              <h3>VICTOR SIN</h3>
              <ul>
                <li>
                  <p>(X)</p>
                </li>
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
              </ul>
              <p className={styles.date}>
                SUN12:00:00
              </p>
            </nav>
          </section>
        </div>
      </main>
    </div>
  );
}
