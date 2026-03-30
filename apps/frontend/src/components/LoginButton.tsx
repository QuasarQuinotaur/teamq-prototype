import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function LoginButton({ animate }: { animate: boolean }) {
  const fadeClass = animate
    ? 'opacity-0 animate-[hero-fade-in_0.7s_ease-out_forwards]'
    : '';

  return (
    <div
      className={`absolute top-6 right-8 z-20 ${fadeClass}`}
      style={animate ? { animationDelay: '400ms' } : undefined}
    >
      <Button variant="outline" size="sm">
        <Link to="/documents">Log in</Link>
      </Button>
    </div>
  );
}

export default LoginButton