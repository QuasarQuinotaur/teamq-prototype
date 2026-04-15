import { Button } from '@/elements/buttons/button.tsx';

function LoginButton({ animate }: { animate: boolean }) {
  const fadeClass = animate
    ? 'opacity-0 animate-[hero-fade-in_0.7s_ease-out_forwards]'
    : '';

    const handleLogin = () => {
      window.location.href = `/documents`;
    };

  return (
    <div
      className={`absolute top-6 right-8 z-20 ${fadeClass}`}
      style={animate ? { animationDelay: '400ms' } : undefined}
    >
      <Button
        variant="outline"
        size="sm"
        className="border-white/70 bg-transparent text-white hover:bg-white/15 hover:text-white"
        onClick={handleLogin}
      >
        Log in
      </Button>
    </div>
  );
}

export default LoginButton