import * as THREE from 'three';

// Make THREE available globally for modules that expect it
if (typeof window !== 'undefined' && !window.THREE) {
  window.THREE = THREE;
}

// Define types for dynamically loaded components
export interface OrbitControlsType {
  new (camera: THREE.Camera, domElement: HTMLElement): any;
  update(): void;
  enableDamping: boolean;
  dampingFactor: number;
  dispose(): void;
  reset?: () => void;
}

// Load Recharts dynamically
export const loadRecharts = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;
  
  if (window.Recharts) {
    return window.Recharts;
  }
  
  try {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/recharts@2.9.3/umd/Recharts.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Recharts) {
          resolve(window.Recharts);
        } else {
          reject(new Error('Failed to load Recharts'));
        }
      };
      script.onerror = () => {
        reject(new Error('Error loading Recharts script'));
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Error loading Recharts:', error);
    return null;
  }
};

// Define the type for the Recharts window extension
declare global {
  interface Window {
    THREE: any; // Use 'any' to avoid conflicts with other declarations
    Recharts: any;
  }
}

export default {
  loadRecharts,
}; 