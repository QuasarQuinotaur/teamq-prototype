import React, { Suspense, useEffect, useRef, useState } from 'react';
import LoginButton from './LoginButton';
import HeroContent from './HeroContent';
// import ConfettiButton from './ConfettiButton';
const BeamsCanvas = React.lazy(() => import('./ui/Beams'));

const BEAMS_CONFIG = {
  beamWidth: 3.8,
  beamHeight: 30,
  beamNumber: 21,
  lightColor: '#a1b6d6',
  speed: 2,
  noiseIntensity: 1.75,
  scale: 0.18,
  rotation: 30,
} as const;

function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion || !heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div
        ref={heroRef}
        className="relative h-screen"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)' }}
      >
        <LoginButton animate />
        
        <HeroContent animate={false} />
      </div>
    );
  }

  return (
    <div ref={heroRef} className="relative h-screen overflow-hidden">
      {/* Beams background */}
      <div className="absolute inset-0" style={{ willChange: 'transform' }}>
        <Suspense fallback={<div className="w-full h-full bg-white" />}>
          <BeamsCanvas {...BEAMS_CONFIG} />
        </Suspense>
      </div>

      <LoginButton animate />

      {/* Content overlay */}
      <HeroContent animate />
    </div>
  );
}

export default Hero;