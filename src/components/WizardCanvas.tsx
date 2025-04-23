import React, { useEffect, useRef, useState } from 'react';
// Import Three.js directly
import * as THREE from 'three';

// Add Three.js to Window interface
declare global {
  interface Window {
    THREE: any;
  }
}

const WizardCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  
  // Make THREE available globally
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.THREE) {
      // Use the imported THREE
      window.THREE = THREE;
      setThreeLoaded(true);
    } else if (window.THREE) {
      setThreeLoaded(true);
    }
  }, []);
  
  // Main Three.js setup effect
  useEffect(() => {
    if (!mountRef.current || !threeLoaded) return;
    
    // Use the imported THREE instead of window.THREE
    // const THREE = window.THREE;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);
    
    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x4700b3, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    
    // Creating the glowing orb (core)
    const coreGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    
    // Glowing blue material
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x3311bb,
      emissive: 0x1133ff,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
    
    // First orbital ring
    const ring1Geometry = new THREE.TorusGeometry(1.8, 0.05, 16, 100);
    const ring1Material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xaaaaff,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });
    
    const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
    ring1.rotation.x = Math.PI / 2;
    ring1.rotation.y = Math.PI / 6;
    scene.add(ring1);
    
    // Second orbital ring
    const ring2Geometry = new THREE.TorusGeometry(2.2, 0.05, 16, 100);
    const ring2Material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xaaffaa,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.7,
    });
    
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = Math.PI / 4;
    ring2.rotation.z = Math.PI / 3;
    scene.add(ring2);
    
    // Small orbital particles
    const particles: any[] = [];
    const particleGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const particleMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x33aaff, emissive: 0x3366ff }),
      new THREE.MeshStandardMaterial({ color: 0x55ffaa, emissive: 0x33cc66 }),
      new THREE.MeshStandardMaterial({ color: 0xffaa22, emissive: 0xff6611 }),
    ];
    
    // Add particles to ring1
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const particle = new THREE.Mesh(particleGeometry, particleMaterials[i % 3]);
      particle.position.x = 1.8 * Math.cos(angle);
      particle.position.y = 0;
      particle.position.z = 1.8 * Math.sin(angle);
      particle.userData = { 
        ring: ring1, 
        orbitRadius: 1.8, 
        orbitSpeed: 0.01, 
        orbitAngle: angle 
      };
      scene.add(particle);
      particles.push(particle);
    }
    
    // Add particles to ring2
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2;
      const particle = new THREE.Mesh(particleGeometry, particleMaterials[i % 3]);
      particle.position.x = 2.2 * Math.cos(angle);
      particle.position.y = 2.2 * Math.sin(angle);
      particle.position.z = 0;
      particle.userData = { 
        ring: ring2, 
        orbitRadius: 2.2, 
        orbitSpeed: 0.005, 
        orbitAngle: angle 
      };
      scene.add(particle);
      particles.push(particle);
    }
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Gentle rotation of the core
      core.rotation.y += 0.005;
      core.rotation.x += 0.002;
      
      // Rotate rings
      ring1.rotation.z += 0.004;
      ring2.rotation.y += 0.003;
      
      // Update particles
      particles.forEach(particle => {
        const userData = particle.userData;
        userData.orbitAngle += userData.orbitSpeed;
        
        if (userData.ring === ring1) {
          // Particles on ring1
          particle.position.x = userData.orbitRadius * Math.cos(userData.orbitAngle);
          particle.position.z = userData.orbitRadius * Math.sin(userData.orbitAngle);
          // Transform based on ring rotation
          const ringRotationMatrix = new THREE.Matrix4().makeRotationX(ring1.rotation.x);
          const rotationMatrix = new THREE.Matrix4().makeRotationZ(ring1.rotation.z);
          ringRotationMatrix.multiply(rotationMatrix);
          particle.position.applyMatrix4(ringRotationMatrix);
        } else {
          // Particles on ring2
          particle.position.x = userData.orbitRadius * Math.cos(userData.orbitAngle);
          particle.position.y = userData.orbitRadius * Math.sin(userData.orbitAngle);
          // Transform based on ring rotation
          const ringRotationMatrix = new THREE.Matrix4().makeRotationX(ring2.rotation.x);
          const rotationMatrix = new THREE.Matrix4().makeRotationZ(ring2.rotation.z);
          ringRotationMatrix.multiply(rotationMatrix);
          particle.position.applyMatrix4(ringRotationMatrix);
        }
      });
      
      // Gentle camera movement
      camera.position.x = Math.sin(Date.now() * 0.0005) * 0.5;
      camera.position.y = Math.cos(Date.now() * 0.0005) * 0.3;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of resources
      [coreGeometry, ring1Geometry, ring2Geometry, particleGeometry].forEach(geometry => 
        geometry.dispose()
      );
      
      [coreMaterial, ring1Material, ring2Material, ...particleMaterials].forEach(material => 
        material.dispose()
      );
      
      renderer.dispose();
    };
  }, [threeLoaded]);
  
  return (
    <div 
      ref={mountRef} 
      className="w-full h-full rounded-lg"
      style={{ background: 'transparent' }}
    >
      {!threeLoaded && (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
          Loading 3D elements...
        </div>
      )}
    </div>
  );
};

export default WizardCanvas; 