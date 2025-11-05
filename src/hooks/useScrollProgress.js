import { useEffect, useRef, useState } from "react";

// Minimal hook: progress (0..1), velocity (px/s signed), speed (px/s abs)
// Extras: optional onUpdate callback and SSR/no-scroll fallbackProgress
export default function useScrollProgress({ onUpdate, fallbackProgress = 0 } = {}) {
    const [progress, setProgress] = useState(fallbackProgress);
    const [velocity, setVelocity] = useState(0);
    const [speed, setSpeed] = useState(0);

    const rafIdRef = useRef(null);
    const lastYRef = useRef(0);
    const lastTRef = useRef(0);

    useEffect(() => {
        if (typeof window === "undefined") {
            // SSR: allow consumer to still get notified with fallback once
            if (typeof onUpdate === "function") {
                onUpdate({ progress: fallbackProgress, velocity: 0, speed: 0 });
            }
            return;
        }

        const update = () => {
            const doc = document.documentElement;
            const max = Math.max(0, doc.scrollHeight - window.innerHeight);
            const y = window.scrollY || 0;
            const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
            setProgress(p);

            const now = performance.now();
            if (lastTRef.current) {
                const dt = (now - lastTRef.current) / 1000;
                if (dt > 0) {
                    const v = (y - lastYRef.current) / dt;
                    setVelocity(v);
                    setSpeed(Math.abs(v));
                    if (typeof onUpdate === "function") {
                        onUpdate({ progress: p, velocity: v, speed: Math.abs(v) });
                    }
                }
            } else if (typeof onUpdate === "function") {
                onUpdate({ progress: p, velocity: 0, speed: 0 });
            }

            lastTRef.current = now;
            lastYRef.current = y;
        };

        const onScrollOrResize = () => {
            if (rafIdRef.current != null) return;
            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;
                update();
            });
        };

        update();
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize, { passive: true });
        return () => {
            if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
            window.removeEventListener("scroll", onScrollOrResize);
            window.removeEventListener("resize", onScrollOrResize);
        };
    }, [onUpdate, fallbackProgress]);

    return { progress, velocity, speed };
}

