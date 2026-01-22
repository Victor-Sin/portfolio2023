"use client"
import styles from "@/app/page.module.css";
import React from 'react';
import HeroSection from "@/components/UI/HeroSection";
import HomeSection from "@/components/UI/HomeSection";
import AboutSection from "@/components/UI/AboutSection";
import Marker from "@/components/UI/Marker";

export default function Home() {


  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <HeroSection />
          <HomeSection />
          <Marker />
          <AboutSection />
        </div>
      </main>
    </div>
  );
}
