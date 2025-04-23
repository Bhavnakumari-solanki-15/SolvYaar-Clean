import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CubeWireframeCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;
    camera.position.y = 1;
    camera.position.x = 1;
    
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create cube wireframe
    const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    scene.add(wireframe);
    
    // Create inner lines (diagonals across faces)
    const innerLinesGeometry = new THREE.BufferGeometry();
    
    // Cube corners (-/+ 0.75 in each dimension)
    const size = 0.75;
    const corners: [number, number, number][] = [
      [-size, -size, -size], [size, -size, -size], [size, size, -size], [-size, size, -size],
      [-size, -size, size], [size, -size, size], [size, size, size], [-size, size, size]
    ];
    
    // Create diagonal lines across each face
    const points: THREE.Vector3[] = [];
    
    // Front face diagonal
    points.push(new THREE.Vector3(corners[0][0], corners[0][1], corners[0][2]));
    points.push(new THREE.Vector3(corners[2][0], corners[2][1], corners[2][2]));
    points.push(new THREE.Vector3(corners[1][0], corners[1][1], corners[1][2]));
    points.push(new THREE.Vector3(corners[3][0], corners[3][1], corners[3][2]));
    
    // Back face diagonal
    points.push(new THREE.Vector3(corners[4][0], corners[4][1], corners[4][2]));
    points.push(new THREE.Vector3(corners[6][0], corners[6][1], corners[6][2]));
    points.push(new THREE.Vector3(corners[5][0], corners[5][1], corners[5][2]));
    points.push(new THREE.Vector3(corners[7][0], corners[7][1], corners[7][2]));
    
    // Top face diagonal
    points.push(new THREE.Vector3(corners[3][0], corners[3][1], corners[3][2]));
    points.push(new THREE.Vector3(corners[6][0], corners[6][1], corners[6][2]));
    points.push(new THREE.Vector3(corners[2][0], corners[2][1], corners[2][2]));
    points.push(new THREE.Vector3(corners[7][0], corners[7][1], corners[7][2]));
    
    // Bottom face diagonal
    points.push(new THREE.Vector3(corners[0][0], corners[0][1], corners[0][2]));
    points.push(new THREE.Vector3(corners[5][0], corners[5][1], corners[5][2]));
    points.push(new THREE.Vector3(corners[1][0], corners[1][1], corners[1][2]));
    points.push(new THREE.Vector3(corners[4][0], corners[4][1], corners[4][2]));
    
    // Left face diagonal
    points.push(new THREE.Vector3(corners[0][0], corners[0][1], corners[0][2]));
    points.push(new THREE.Vector3(corners[7][0], corners[7][1], corners[7][2]));
    points.push(new THREE.Vector3(corners[3][0], corners[3][1], corners[3][2]));
    points.push(new THREE.Vector3(corners[4][0], corners[4][1], corners[4][2]));
    
    // Right face diagonal
    points.push(new THREE.Vector3(corners[1][0], corners[1][1], corners[1][2]));
    points.push(new THREE.Vector3(corners[6][0], corners[6][1], corners[6][2]));
    points.push(new THREE.Vector3(corners[2][0], corners[2][1], corners[2][2]));
    points.push(new THREE.Vector3(corners[5][0], corners[5][1], corners[5][2]));
    
    const innerLinesGeometries: THREE.BufferGeometry[] = [];
    for (let i = 0; i < points.length; i += 2) {
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([points[i], points[i+1]]);
      innerLinesGeometries.push(lineGeometry);
    }
    
    const innerLineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xaaaaff,
      transparent: true,
      opacity: 0.3
    });
    
    innerLinesGeometries.forEach(geometry => {
      const line = new THREE.Line(geometry, innerLineMaterial);
      scene.add(line);
    });
    
    // Add points at vertices
    const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xaaaaff,
      emissiveIntensity: 0.5
    });
    
    corners.forEach(corner => {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(corner[0], corner[1], corner[2]);
      scene.add(sphere);
    });
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate wireframe
      wireframe.rotation.x += 0.002;
      wireframe.rotation.y += 0.003;
      
      // Apply same rotation to all children (innerLines and vertex points)
      scene.children.forEach(child => {
        if (child !== wireframe && child !== ambientLight && child !== directionalLight) {
          child.rotation.x = wireframe.rotation.x;
          child.rotation.y = wireframe.rotation.y;
        }
      });
      
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
      const geometriesToDispose = [cubeGeometry, edges, sphereGeometry];
      geometriesToDispose.forEach(geometry => geometry.dispose());
      
      // Dispose inner line geometries separately
      innerLinesGeometries.forEach(geometry => geometry.dispose());
      
      [lineMaterial, innerLineMaterial, sphereMaterial].forEach(material => 
        material.dispose()
      );
      
      renderer.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={mountRef} 
      className="w-full h-full rounded-lg"
      style={{ background: 'transparent' }}
    />
  );
};

export default CubeWireframeCanvas; 