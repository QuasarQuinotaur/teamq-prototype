import { Button } from '@/elements/buttons/button.tsx';

function LoginButton({ animate }: { animate: boolean }) {
  const fadeClass = animate
    ? 'opacity-0 animate-[hero-fade-in_0.7s_ease-out_forwards]'
    : '';

    const handleLogin = () => {
      window.location.href = `http://localhost:3000/login`;
    };

  return (
    <div
      className={`absolute top-6 right-8 z-20 ${fadeClass}`}
      style={animate ? { animationDelay: '400ms' } : undefined}
    >
      <Button variant="outline" size="sm" onClick={handleLogin}>Log in</Button>
    </div>
  );
}

export default LoginButton