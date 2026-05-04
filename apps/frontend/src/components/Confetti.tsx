import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";

export interface ConfettiHandle {
  fire: () => void;
  stop: () => void;
}

interface ConfettiProps {
  duration?: number;
  numberOfPieces?: number;
}

function resolveCSSVar(name: string) {
  if (typeof window === "undefined") return "#ffffff";

  const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();

  // already valid color
  if (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl")) {
    return value;
  }

  // Tailwind-style: "221 83% 53%" → convert to hsl()
  if (value.includes("%")) {
    return `hsl(${value})`;
  }

  return "#ffffff";
}

const Confetti = forwardRef<ConfettiHandle, ConfettiProps>(
    ({ duration = 4000, numberOfPieces = 600 }, ref) => {
      const { width, height } = useWindowSize();
      const [isRunning, setIsRunning] = useState(false);
      const [pieces, setPieces] = useState(0);

      const colors = useMemo(() => {
        return [
          resolveCSSVar("--primary"),
          resolveCSSVar("--secondary"),
          resolveCSSVar("--accent"),
          resolveCSSVar("--foreground"),
          resolveCSSVar("--muted-foreground"),
        ];
      }, []);

      const fire = useCallback(() => {
        setIsRunning(true);
        setPieces(numberOfPieces);

        setTimeout(() => {
          setPieces(0);
        }, duration);
      }, [duration, numberOfPieces]);

      const stop = useCallback(() => {
        setIsRunning(false);
        setPieces(0);
      }, []);

      useImperativeHandle(ref, () => ({ fire, stop }));

      const show = isRunning || pieces > 0;

      if (!show) return null;

      return createPortal(
          <ReactConfetti
              width={width}
              height={height}
              numberOfPieces={pieces}
              recycle={false}
              colors={colors}
              onConfettiComplete={() => setIsRunning(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 9999,
                pointerEvents: "none",
              }}
          />,
          document.body
      );
    }
);

export default Confetti;