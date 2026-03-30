import { Button } from '@/components/ui/button';

function HeroContent({ animate }: { animate: boolean }) {
  const fadeBase = animate
    ? 'opacity-0 animate-[hero-fade-in_0.7s_ease-out_forwards]'
    : '';

  return (
    <div className="relative z-10 flex h-full items-center pl-16 select-none">
      <div className="max-w-xl space-y-6">
        <h1
          className={`text-6xl select-none font-bold tracking-tight text-white lg:text-7xl ${fadeBase}`}
          style={animate ? { animationDelay: '0ms' } : undefined}
        >
          Hanover Insurance
        </h1>
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
          <Button size="lg">Get a Quote</Button>
        </div>
      </div>
    </div>
  );
}

export default HeroContent