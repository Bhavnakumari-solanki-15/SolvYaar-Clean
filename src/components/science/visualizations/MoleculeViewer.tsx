import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// Fix import to handle OrbitControls properly

// Define OrbitControls interface
interface OrbitControlsInterface {
  new (camera: THREE.Camera, domElement: HTMLElement): any;
  update(): void;
  enableDamping: boolean;
  dampingFactor: number;
  dispose?: () => void;
  reset?: () => void;
}

// Empty OrbitControls placeholder that will be populated at runtime
let OrbitControls: OrbitControlsInterface;

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface Atom {
  element: string;
  position: [number, number, number];
  color: string;
}

interface Bond {
  start: [number, number, number];
  end: [number, number, number];
}

interface Molecule {
  name: string;
  atoms: Atom[];
  bonds: Bond[];
}

const molecules: Record<string, Molecule> = {
  water: {
    name: 'Water (H₂O)',
    atoms: [
      { element: 'O', position: [0, 0, 0], color: '#ff0000' },
      { element: 'H', position: [-0.8, 0.6, 0], color: '#ffffff' },
      { element: 'H', position: [0.8, 0.6, 0], color: '#ffffff' },
    ],
    bonds: [
      { start: [0, 0, 0], end: [-0.8, 0.6, 0] },
      { start: [0, 0, 0], end: [0.8, 0.6, 0] },
    ],
  },
  methane: {
    name: 'Methane (CH₄)',
    atoms: [
      { element: 'C', position: [0, 0, 0], color: '#808080' },
      { element: 'H', position: [0.8, 0.8, 0.8], color: '#ffffff' },
      { element: 'H', position: [-0.8, -0.8, 0.8], color: '#ffffff' },
      { element: 'H', position: [0.8, -0.8, -0.8], color: '#ffffff' },
      { element: 'H', position: [-0.8, 0.8, -0.8], color: '#ffffff' },
    ],
    bonds: [
      { start: [0, 0, 0], end: [0.8, 0.8, 0.8] },
      { start: [0, 0, 0], end: [-0.8, -0.8, 0.8] },
      { start: [0, 0, 0], end: [0.8, -0.8, -0.8] },
      { start: [0, 0, 0], end: [-0.8, 0.8, -0.8] },
    ],
  },
  ammonia: {
    name: 'Ammonia (NH₃)',
    atoms: [
      { element: 'N', position: [0, 0, 0], color: '#3050F8' },
      { element: 'H', position: [0.8, 0.6, 0], color: '#ffffff' },
      { element: 'H', position: [-0.4, 0.6, 0.7], color: '#ffffff' },
      { element: 'H', position: [-0.4, 0.6, -0.7], color: '#ffffff' },
    ],
    bonds: [
      { start: [0, 0, 0], end: [0.8, 0.6, 0] },
      { start: [0, 0, 0], end: [-0.4, 0.6, 0.7] },
      { start: [0, 0, 0], end: [-0.4, 0.6, -0.7] },
    ],
  },
  carbonDioxide: {
    name: 'Carbon Dioxide (CO₂)',
    atoms: [
      { element: 'C', position: [0, 0, 0], color: '#808080' },
      { element: 'O', position: [-1.2, 0, 0], color: '#ff0000' },
      { element: 'O', position: [1.2, 0, 0], color: '#ff0000' },
    ],
    bonds: [
      { start: [0, 0, 0], end: [-1.2, 0, 0] },
      { start: [0, 0, 0], end: [1.2, 0, 0] },
    ],
  },
};

export function MoleculeViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMolecule, setSelectedMolecule] = useState<string>('water');
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsInterface | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Controls - make sure THREE is available globally
    // Ensure THREE is attached to window for proper submodule loading
    if (typeof window !== 'undefined' && !window.THREE) {
      window.THREE = THREE;
    }
    
    // Check if OrbitControls is loaded, if not use window.THREE.OrbitControls
    if (!OrbitControls && window.THREE && window.THREE.OrbitControls) {
      OrbitControls = window.THREE.OrbitControls;
    } else if (!OrbitControls) {
      console.error('OrbitControls not available');
    }
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Position camera
    camera.position.z = 5;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing molecule
    sceneRef.current.clear();

    const molecule = molecules[selectedMolecule];
    if (!molecule) return;

    // Add atoms
    molecule.atoms.forEach(atom => {
      const geometry = new THREE.SphereGeometry(0.3, 32, 32);
      const material = new THREE.MeshPhongMaterial({ 
        color: atom.color,
        specular: 0x444444,
        shininess: 30
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      sceneRef.current?.add(sphere);

      // Add atom label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 64;
        canvas.height = 64;
        context.fillStyle = '#000000';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(atom.element, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(...atom.position);
        sprite.scale.set(0.5, 0.5, 0.5);
        sceneRef.current?.add(sprite);
      }
    });

    // Add bonds
    molecule.bonds.forEach(bond => {
      const start = new THREE.Vector3(...bond.start);
      const end = new THREE.Vector3(...bond.end);
      const direction = end.clone().sub(start);
      const length = direction.length();

      const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        specular: 0x444444,
        shininess: 30
      });
      const cylinder = new THREE.Mesh(geometry, material);

      // Position and rotate cylinder to connect atoms
      cylinder.position.copy(start);
      cylinder.position.add(direction.multiplyScalar(0.5));
      cylinder.lookAt(end);
      cylinder.rotateX(Math.PI / 2);

      sceneRef.current?.add(cylinder);
    });

    // Add ambient and directional lights back
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    sceneRef.current.add(directionalLight);
  }, [selectedMolecule]);

  const handleReset = () => {
    if (controlsRef.current && controlsRef.current.reset) {
      controlsRef.current.reset();
    }
    if (cameraRef.current) {
      cameraRef.current.position.z = 5;
    }
  };

  const handleZoom = (factor: number) => {
    if (cameraRef.current) {
      cameraRef.current.position.z *= factor;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-500/10 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 text-purple-500" />
          <div>
            <p className="font-medium">3D Molecule Viewer</p>
            <p className="text-muted-foreground">
              Interact with 3D molecular structures. Drag to rotate, scroll to zoom.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={selectedMolecule} onValueChange={setSelectedMolecule}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select molecule" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(molecules).map(([key, molecule]) => (
              <SelectItem key={key} value={key}>
                {molecule.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleZoom(0.8)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleZoom(1.2)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div
          ref={containerRef}
          className="w-full aspect-video bg-gradient-to-br from-purple-500/5 to-blue-500/5"
        />
      </Card>

      <div className="text-sm text-muted-foreground">
        <p className="font-medium">Molecule Information</p>
        <p className="mt-2">{molecules[selectedMolecule]?.name}</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Atoms: {molecules[selectedMolecule]?.atoms.length}</li>
          <li>Bonds: {molecules[selectedMolecule]?.bonds.length}</li>
          <li>Elements: {[...new Set(molecules[selectedMolecule]?.atoms.map(a => a.element))].join(', ')}</li>
        </ul>
      </div>
    </div>
  );
} 