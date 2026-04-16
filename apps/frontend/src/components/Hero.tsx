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
      {/* Localized vignette behind logo/brand — fades out into the photo */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_75%_115%_at_18%_50%,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.22)_42%,transparent_68%)]"
        aria-hidden
      />

      <LoginButton animate={!prefersReducedMotion} />

      <HeroContent animate={!prefersReducedMotion} />
    </div>
  );
}

export default Hero;
