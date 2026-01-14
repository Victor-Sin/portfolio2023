import { useState, useRef, useCallback } from "react";
import styles from "@/app/page.module.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function Meter() {
    const [temperature, setTemperature] = useState("000");
    const [pressure, setPressure] = useState("000");
    
    const prevPressureRef = useRef("000");
    const prevTemperatureRef = useRef("000");
    const animationKeyRef = useRef(0);

    // Fonction pour calculer la pression (0 à 100 bar)
    // Dans l'océan, la pression augmente linéairement : 1 bar tous les 10 mètres
    // À 100 bar, on serait à environ 1000 mètres de profondeur
    const calculatePressure = (progress) => {
        // Progression linéaire pour simuler la réalité océanique
        return Math.round(progress * 100);
    };

    // Fonction pour calculer la température basée sur la profondeur
    // Température océanique : ~18°C en surface, ~2°C à 1000m (100 bar)
    // La température diminue rapidement dans les premiers mètres (thermocline)
    const calculateTemperature = (progress) => {
        // Température de surface : 18°C
        // Température abyssale : 2°C
        // Courbe réaliste : diminution rapide au début, puis stabilisation
        // Utilise une courbe exponentielle inversée pour simuler la thermocline
        const surfaceTemp = 18;
        const abyssalTemp = 2;
        
        // Courbe qui diminue rapidement au début (thermocline) puis se stabilise
        // progress^0.7 crée une diminution plus rapide au début
        const tempProgress = Math.pow(progress, 0.7);
        const temp = surfaceTemp - (surfaceTemp - abyssalTemp) * tempProgress;
        
        return Math.round(temp);
    };

    useGSAP(() => {
        gsap.to(`.${styles.meter}`, {
            scrollTrigger: {
                trigger: `.${styles.container}`,
                toggleActions: 'play none none none',
                start: 'top bottom',
                end: '98.75% bottom',
                onUpdate: (self) => {
                    // progress va de 0 à 1
                    const progress = self.progress;
                    
                    // Calculer les valeurs basées sur la progression
                    const currentPressure = calculatePressure(progress);
                    const currentTemperature = calculateTemperature(progress);
                    
                    // Formater avec padding de 3 chiffres
                    const pressureStr = String(currentPressure).padStart(3, '0');
                    const temperatureStr = String(currentTemperature).padStart(3, '0');
                    
                    // Stocker les valeurs précédentes avant de mettre à jour
                    setPressure((prev) => {
                        prevPressureRef.current = prev;
                        return pressureStr;
                    });
                    setTemperature((prev) => {
                        prevTemperatureRef.current = prev;
                        return temperatureStr;
                    });
                },

            }
        }) 
    }, []);

    const renderDigits = useCallback((value, prevValue, keyPrefix) => {
        if (!value) return null;
        
        return value.split('').map((digit, index) => {
            const shouldAnimate = prevValue && prevValue[index] !== digit;
            const uniqueKey = `${keyPrefix}-${index}-${digit}`;
            
            // Incrémenter la clé uniquement si l'animation est nécessaire
            if (shouldAnimate) {
                animationKeyRef.current += 1;
            }
            
            return (
                <span 
                    key={shouldAnimate ? `${uniqueKey}-${animationKeyRef.current}` : uniqueKey}
                    className={`${styles.digit} ${shouldAnimate ? styles.animate : ''}`}
                >
                    {digit}
                </span>
            );
        });
    }, []);
    
    return (
        <div className={`${styles.meter}`}>
            <div className={styles.meterBar}>
                (+) {renderDigits(pressure, prevPressureRef.current, 'pressure')} BAR - {renderDigits(temperature, prevTemperatureRef.current, 'temperature')}°C
            </div>
        </div>
    )
}