import { useEffect, useRef, useState } from 'react';
import { useTheme } from './theme-provider';
import BIRDS from 'vanta/dist/vanta.birds.min';
import * as THREE from 'three';

export function AnimatedBackground({ children }: { children: React.ReactNode }) {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        BIRDS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: theme === 'dark' ? 0x071127 : 0xf8fafc,
          color1: theme === 'dark' ? 0xa855f7 : 0x7c3aed, // Purple
          color2: theme === 'dark' ? 0x3b82f6 : 0x6366f1, // Blue
          colorMode: "variance",
          birdSize: 1,
          wingSpan: 30,
          speedLimit: 5,
          separation: 20,
          alignment: 20,
          cohesion: 20,
          quantity: 3
        })
      );
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  // Update colors when theme changes
  useEffect(() => {
    if (vantaEffect) {
      vantaEffect.setOptions({
        backgroundColor: theme === 'dark' ? 0x071127 : 0xf8fafc,
        color1: theme === 'dark' ? 0xa855f7 : 0x7c3aed,
        color2: theme === 'dark' ? 0x3b82f6 : 0x6366f1,
      });
    }
  }, [theme]);

  return (
    <div ref={vantaRef} className="fixed inset-0 -z-10">
      {children}
    </div>
  );
} 