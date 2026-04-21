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
        size="lg"
        className="border-border bg-white text-slate-950 shadow-sm hover:bg-zinc-50 hover:text-slate-950 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-50"
        onClick={handleLogin}
      >
        Log in
      </Button>
    </div>
  );
}

export default LoginButton