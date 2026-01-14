"use client"
import styles from "@/app/page.module.css";
import React from 'react';
import HeroSection from '@/components/HeroSection';
import HomeSection from '@/components/HomeSection';
import AboutSection from '@/components/AboutSection';
import Marker from '@/components/Marker';

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
