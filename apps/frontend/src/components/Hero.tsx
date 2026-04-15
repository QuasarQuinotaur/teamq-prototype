import React from 'react';
import LoginButton from './LoginButton';
import HeroContent from './HeroContent';

const HERO_BG = '/hero-hanover-hq.png';

function Hero() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/45" aria-hidden />

      <LoginButton animate={!prefersReducedMotion} />

      <HeroContent animate={!prefersReducedMotion} />
    </div>
  );
}

export default Hero;
