import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export interface ConfettiHandle {
  fire: () => void;
  stop: () => void;
}

interface ConfettiProps {
  duration?: number;
  numberOfPieces?: number;
  colors?: string[];
}

const CONFETTI_COLORS = ['#ffffff', '#bfd7ed', '#7bafd4', '#2563a8', '#1e3a5f'];

const Confetti = forwardRef<ConfettiHandle, ConfettiProps>(({
  duration = 4000,
  numberOfPieces = 600,
  colors = CONFETTI_COLORS,
}, ref) => {
  const { width, height } = useWindowSize();
  const [isRunning, setIsRunning] = useState(false);
  const [pieces, setPieces] = useState(0);

  const fire = useCallback(() => {
    setIsRunning(true);
    setPieces(numberOfPieces);
    setTimeout(() => setPieces(0), duration);
  }, [duration, numberOfPieces]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setPieces(0);
  }, []);

  useImperativeHandle(ref, () => ({ fire, stop }));

  if (!isRunning) return null;

  return createPortal(
    <ReactConfetti
      width={width}
      height={height}
      numberOfPieces={pieces}
      recycle={false}
      colors={colors}
      onConfettiComplete={() => setIsRunning(false)}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
    />,
    document.body
  );
});

export default Confetti;