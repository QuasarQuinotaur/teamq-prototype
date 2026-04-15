function HeroContent({ animate }: { animate: boolean }) {
    const fadeBase = animate
     ? 'opacity-0 animate-[hero-fade-in_0.7s_ease-out_forwards]'
     : '';

  return (
    <div className="relative z-10 flex h-full items-center pl-16 select-none text-white">
      <div className="max-w-xl space-y-6">
        <img
          src="/CombinationMark.png"
          alt="Hanover Insurance"
          className={`h-32 w-auto brightness-0 invert select-none ${fadeBase}`}
          style={animate ? { animationDelay: '0ms' } : undefined}
        />
      </div>
    </div>
  );
}

export default HeroContent