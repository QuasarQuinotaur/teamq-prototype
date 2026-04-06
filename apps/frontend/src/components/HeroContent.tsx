import { Button } from '@/elements/buttons/button.tsx';
// import ConfettiButto from '@/components/Confetti'
import type { ConfettiHandle } from './Confetti';
import { useRef } from 'react';
import Confetti from './Confetti';

function HeroContent({ animate }: { animate: boolean }) {
    const fadeBase = animate
     ? 'opacity-0 animate-[hero-fade-in_0.7s_ease-out_forwards]'
     : '';

    const confettiRef = useRef<ConfettiHandle>(null);

  return (
    <div className="relative z-10 flex h-full items-center pl-16 select-none">
      <div className="max-w-xl space-y-6">
        <img
          src="/CombinationMark.png"
          alt="Hanover Insurance"
          className={`h-32 w-auto brightness-0 invert select-none ${fadeBase}`}
          style={animate ? { animationDelay: '0ms' } : undefined}
        />
        <p
          className={`text-lg text-gray-500 ${fadeBase}`}
          style={animate ? { animationDelay: '160ms' } : undefined}
        >
          Trusted coverage for what matters most.
        </p>
        <div
          className={fadeBase}
          style={animate ? { animationDelay: '320ms' } : undefined}
        >
          <Confetti ref={confettiRef}/>
          <Button size="lg" onClick={() => confettiRef.current?.fire()}>Get a Quote</Button>
        </div>
      </div>
    </div>
  );
}

export default HeroContent