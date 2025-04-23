import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from './theme-provider';
// Import Three.js to make it available in component scope
import * as THREE from 'three';

// Define the window interface to include the VANTA object
declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

export default function BackgroundFX() {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Load scripts from CDN
  useEffect(() => {
    const loadScripts = async () => {
      // Skip if already loaded
      if (window.VANTA && window.THREE) {
        setScriptsLoaded(true);
        return;
      }

      try {
        // Check if Three.js is available from the bundle
        if (!window.THREE) {
          // First try to load Three from the global context (may already be loaded by another component)
          if (typeof THREE !== 'undefined') {
            window.THREE = THREE;
          } else {
            // Load Three.js from CDN as fallback
            const threeScript = document.createElement('script');
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js';
            threeScript.async = true;
            document.head.appendChild(threeScript);

            // Wait for Three.js to load
            await new Promise<void>((resolve) => {
              threeScript.onload = () => resolve();
            });
          }
        }

        // Load Vanta Birds from CDN
        const vantaScript = document.createElement('script');
        vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.birds.min.js';
        vantaScript.async = true;
        document.head.appendChild(vantaScript);

        // Wait for Vanta to load
        await new Promise<void>((resolve) => {
          vantaScript.onload = () => resolve();
        });

        setScriptsLoaded(true);
      } catch (error) {
        console.error('Failed to load scripts:', error);
      }
    };

    loadScripts();

    // Cleanup function to remove scripts on unmount
    return () => {
      // We don't remove the scripts as they might be used elsewhere
    };
  }, []);

  // Initialize Vanta effect once scripts are loaded
  useEffect(() => {
    let effectInstance: any;

    const initVanta = () => {
      if (!vantaRef.current || !scriptsLoaded || !window.VANTA) return;

      effectInstance = window.VANTA.BIRDS({
        el: vantaRef.current,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundColor: resolvedTheme === 'dark' ? 0x071127 : 0xffffff,
        color1: resolvedTheme === 'dark' ? 0x4f46e5 : 0x7c3aed,
        color2: resolvedTheme === 'dark' ? 0x6d28d9 : 0x4f46e5,
        colorMode: "lerp",
        birdSize: resolvedTheme === 'dark' ? 0.8 : 1.0,
        wingSpan: resolvedTheme === 'dark' ? 35 : 40,
        speedLimit: resolvedTheme === 'dark' ? 3 : 4,
        separation: resolvedTheme === 'dark' ? 35 : 30,
        alignment: resolvedTheme === 'dark' ? 40 : 35,
        cohesion: resolvedTheme === 'dark' ? 40 : 35,
        quantity: resolvedTheme === 'dark' ? 3 : 4
      });

      setVantaEffect(effectInstance);
    };

    // Clean up before reinitializing
    if (vantaEffect) {
      vantaEffect.destroy();
      setVantaEffect(null);
    }

    // Only initialize if scripts are loaded
    if (scriptsLoaded) {
      initVanta();
    }

    return () => {
      if (effectInstance) effectInstance.destroy();
    };
  }, [resolvedTheme, scriptsLoaded]);

  return (
    <div
      ref={vantaRef}
      className="fixed inset-0 -z-10"
      style={{
        minHeight: '100vh',
        opacity: resolvedTheme === 'dark' ? 0.7 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
}
