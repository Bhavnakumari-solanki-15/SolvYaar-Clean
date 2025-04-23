import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

interface CellPart {
  id: string;
  name: string;
  description: string;
  function: string;
  color: string;
  position: [number, number, number];
  scale: [number, number, number];
  shape: 'sphere' | 'cylinder' | 'cube' | 'custom';
  model?: string;
  animation?: {
    type: 'rotation' | 'pulse' | 'float';
    speed?: number;
    amplitude?: number;
  };
}

const animalCellParts: CellPart[] = [
  {
    id: 'nucleus',
    name: 'Nucleus',
    description: 'Control center of the cell',
    function: 'Contains genetic material (DNA) and controls cellular activities',
    color: '#8B4513',
    position: [0, 0, 0],
    scale: [1, 1, 1],
    shape: 'sphere',
    animation: { type: 'rotation', speed: 0.5 }
  },
  {
    id: 'nucleolus',
    name: 'Nucleolus',
    description: 'Site of ribosome production',
    function: 'Synthesizes and assembles ribosomes',
    color: '#A0522D',
    position: [0, 0, 0],
    scale: [0.5, 0.5, 0.5],
    shape: 'sphere',
    animation: { type: 'pulse', speed: 1 }
  },
  {
    id: 'mitochondria',
    name: 'Mitochondria',
    description: 'Powerhouse of the cell',
    function: 'Produces energy (ATP) through cellular respiration',
    color: '#FF6B6B',
    position: [1.5, 0, 0],
    scale: [0.3, 0.6, 0.3],
    shape: 'cylinder',
    animation: { type: 'float', speed: 0.8, amplitude: 0.2 }
  },
  {
    id: 'endoplasmic-reticulum',
    name: 'Endoplasmic Reticulum',
    description: 'Transport network',
    function: 'Synthesizes and transports proteins and lipids',
    color: '#4A90E2',
    position: [0, 0, 1.5],
    scale: [0.8, 0.2, 0.8],
    shape: 'cylinder',
    animation: { type: 'rotation', speed: 0.3 }
  },
  {
    id: 'golgi-apparatus',
    name: 'Golgi Apparatus',
    description: 'Packaging center',
    function: 'Modifies, packages, and distributes proteins',
    color: '#50E3C2',
    position: [0, 0, -1.5],
    scale: [0.6, 0.2, 0.6],
    shape: 'cube',
    animation: { type: 'pulse', speed: 0.7 }
  },
  {
    id: 'lysosome',
    name: 'Lysosome',
    description: 'Digestive system',
    function: 'Breaks down cellular waste and foreign materials',
    color: '#9B51E0',
    position: [-1.5, 0, 0],
    scale: [0.4, 0.4, 0.4],
    shape: 'sphere',
    animation: { type: 'float', speed: 1, amplitude: 0.15 }
  },
  {
    id: 'ribosome',
    name: 'Ribosome',
    description: 'Protein synthesis',
    function: 'Translates mRNA into proteins',
    color: '#FFD700',
    position: [0, 1.5, 0],
    scale: [0.2, 0.2, 0.2],
    shape: 'sphere',
    animation: { type: 'rotation', speed: 1.2 }
  },
  {
    id: 'centriole',
    name: 'Centriole',
    description: 'Cell division organizer',
    function: 'Helps organize microtubules during cell division',
    color: '#FFA500',
    position: [0, -1.5, 0],
    scale: [0.3, 0.3, 0.3],
    shape: 'cylinder',
    animation: { type: 'rotation', speed: 0.9 }
  },
  {
    id: 'peroxisome',
    name: 'Peroxisome',
    description: 'Oxidative reactions',
    function: 'Breaks down hydrogen peroxide and fatty acids',
    color: '#FF69B4',
    position: [1.5, -1.5, 0],
    scale: [0.3, 0.3, 0.3],
    shape: 'sphere',
    animation: { type: 'pulse', speed: 0.6 }
  },
  {
    id: 'cytoskeleton',
    name: 'Cytoskeleton',
    description: 'Structural support',
    function: 'Maintains cell shape and enables movement',
    color: '#808080',
    position: [0, 0, 0],
    scale: [2, 2, 2],
    shape: 'custom',
    animation: { type: 'rotation', speed: 0.2 }
  }
];

const plantCellParts: CellPart[] = [
  ...animalCellParts,
  {
    id: 'cell-wall',
    name: 'Cell Wall',
    description: 'Rigid outer layer',
    function: 'Provides structural support and protection',
    color: '#87C38F',
    position: [0, 0, 0],
    scale: [2, 2, 2],
    shape: 'sphere',
    animation: { type: 'rotation', speed: 0.1 }
  },
  {
    id: 'chloroplast',
    name: 'Chloroplast',
    description: 'Photosynthesis center',
    function: 'Converts light energy into chemical energy (glucose)',
    color: '#2ECC71',
    position: [1.5, 1.5, 0],
    scale: [0.4, 0.6, 0.4],
    shape: 'cylinder',
    animation: { type: 'float', speed: 0.7, amplitude: 0.2 }
  },
  {
    id: 'vacuole',
    name: 'Central Vacuole',
    description: 'Storage compartment',
    function: 'Stores water, nutrients, and maintains turgor pressure',
    color: '#5DADE2',
    position: [0, 0, 0],
    scale: [1.5, 1.5, 1.5],
    shape: 'sphere',
    animation: { type: 'pulse', speed: 0.5 }
  },
  {
    id: 'plasmodesmata',
    name: 'Plasmodesmata',
    description: 'Cell connections',
    function: 'Allows communication between plant cells',
    color: '#9B59B6',
    position: [0, 0, 2],
    scale: [0.1, 0.1, 0.1],
    shape: 'cylinder',
    animation: { type: 'rotation', speed: 0.4 }
  }
];

function Line({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const geometry = useMemo(() => {
    const points = [start, end].map((p) => new THREE.Vector3(...p));
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    return geometry;
  }, [start, end]);

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }))} />
  );
}

function CellPart3D({ part, isSelected, onClick }: { part: CellPart; isSelected: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    time.current += delta;

    if (part.animation) {
      switch (part.animation.type) {
        case 'rotation':
          meshRef.current.rotation.y += delta * part.animation.speed;
          break;
        case 'pulse':
          const scale = 1 + Math.sin(time.current * part.animation.speed) * 0.1;
          meshRef.current.scale.set(scale, scale, scale);
          break;
        case 'float':
          const y = Math.sin(time.current * part.animation.speed) * (part.animation.amplitude || 0.2);
          meshRef.current.position.y = part.position[1] + y;
          break;
      }
    }
  });

  const getGeometry = () => {
    switch (part.shape) {
      case 'sphere':
        return <sphereGeometry args={[1, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[1, 1, 2, 32]} />;
      case 'cube':
        return <boxGeometry args={[2, 1, 2]} />;
      case 'custom':
        if (part.id === 'cytoskeleton') {
          return (
            <group>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * Math.PI) / 6;
                const endX = Math.cos(angle) * 2;
                const endY = Math.sin(angle) * 2;
                return (
                  <Line
                    key={i}
                    start={[0, 0, 0]}
                    end={[endX, endY, 0]}
                    color={part.color}
                  />
                );
              })}
            </group>
          );
        }
        return <sphereGeometry args={[1, 32, 32]} />;
      default:
        return <sphereGeometry args={[1, 32, 32]} />;
    }
  };

  return (
    <group position={part.position} scale={part.scale}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        {getGeometry()}
        <meshStandardMaterial
          color={part.color}
          opacity={isSelected ? 1 : 0.7}
          transparent
        />
      </mesh>
      {isSelected && (
        <Text
          position={[0, part.scale[1] + 0.2, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {part.name}
        </Text>
      )}
    </group>
  );
}

function Cell3D({ cellType, selectedPart, onPartClick }: { 
  cellType: 'animal' | 'plant';
  selectedPart: string | null;
  onPartClick: (id: string) => void;
}) {
  const parts = cellType === 'animal' ? animalCellParts : plantCellParts;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setError('WebGL context lost. Please refresh the page.');
    };

    const handleContextRestored = () => {
      setError(null);
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#f0f0f0']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={10}
      />
      <Suspense fallback={null}>
        {parts.map(part => (
          <CellPart3D
            key={part.id}
            part={part}
            isSelected={selectedPart === part.id}
            onClick={() => onPartClick(part.id)}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}

export function CellViewer() {
  const [cellType, setCellType] = useState<'animal' | 'plant'>('animal');
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [view, setView] = useState<'2d' | '3d'>('3d');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cellParts = cellType === 'animal' ? animalCellParts : plantCellParts;

  const handleCellTypeChange = (value: 'animal' | 'plant') => {
    setIsTransitioning(true);
    setCellType(value);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const renderCell2D = () => {
    return (
      <div className="relative w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
        >
          {/* Cell membrane/wall */}
          <ellipse
            cx="200"
            cy="200"
            rx="180"
            ry="160"
            fill="none"
            stroke={cellType === 'plant' ? '#87C38F' : '#FFD700'}
            strokeWidth="4"
            className="transition-colors duration-300"
          />
          
          {/* If plant cell, add cell wall */}
          {cellType === 'plant' && (
            <ellipse
              cx="200"
              cy="200"
              rx="190"
              ry="170"
              fill="none"
              stroke="#87C38F"
              strokeWidth="4"
              strokeDasharray="8,4"
            />
          )}

          {/* Cell parts */}
          {cellParts.map((part) => {
            // Different shapes and positions for different organelles
            switch (part.id) {
              case 'nucleus':
                return (
                  <g key={part.id}>
                    <circle
                      cx="200"
                      cy="200"
                      r="40"
                      fill={part.color}
                      opacity={selectedPart === part.id ? 1 : 0.7}
                      className="cursor-pointer transition-opacity duration-300 hover:opacity-100"
                      onClick={() => setSelectedPart(part.id)}
                    />
                    <circle
                      cx="200"
                      cy="200"
                      r="20"
                      fill={animalCellParts[1].color}
                      opacity={selectedPart === 'nucleolus' ? 1 : 0.7}
                      className="cursor-pointer transition-opacity duration-300 hover:opacity-100"
                      onClick={() => setSelectedPart('nucleolus')}
                    />
                  </g>
                );
              case 'mitochondria':
                return Array.from({ length: 3 }).map((_, i) => (
                  <ellipse
                    key={`${part.id}-${i}`}
                    cx={150 + i * 80}
                    cy={150 + i * 40}
                    rx="20"
                    ry="12"
                    fill={part.color}
                    opacity={selectedPart === part.id ? 1 : 0.7}
                    className="cursor-pointer transition-opacity duration-300 hover:opacity-100"
                    onClick={() => setSelectedPart(part.id)}
                  />
                ));
              case 'chloroplast':
                if (cellType === 'plant') {
                  return Array.from({ length: 4 }).map((_, i) => (
                    <ellipse
                      key={`${part.id}-${i}`}
                      cx={120 + i * 60}
                      cy={280 - i * 40}
                      rx="25"
                      ry="15"
                      fill={part.color}
                      opacity={selectedPart === part.id ? 1 : 0.7}
                      className="cursor-pointer transition-opacity duration-300 hover:opacity-100"
                      onClick={() => setSelectedPart(part.id)}
                    />
                  ));
                }
                return null;
              case 'vacuole':
                if (cellType === 'plant') {
                  return (
                    <circle
                      key={part.id}
                      cx="200"
                      cy="200"
                      r="60"
                      fill={part.color}
                      opacity={selectedPart === part.id ? 1 : 0.7}
                      className="cursor-pointer transition-opacity duration-300 hover:opacity-100"
                      onClick={() => setSelectedPart(part.id)}
                    />
                  );
                }
                return null;
              case 'cytoskeleton':
                return Array.from({ length: 12 }).map((_, i) => (
                  <line
                    key={`${part.id}-${i}`}
                    x1="200"
                    y1="200"
                    x2={200 + Math.cos(i * Math.PI / 6) * 100}
                    y2={200 + Math.sin(i * Math.PI / 6) * 100}
                    stroke={part.color}
                    strokeWidth="2"
                    opacity={selectedPart === part.id ? 1 : 0.7}
                    className="cursor-pointer transition-opacity duration-300 hover:opacity-100"
                    onClick={() => setSelectedPart(part.id)}
                  />
                ));
              default:
                return null;
            }
          })}
        </svg>
      </div>
    );
  };

  const renderCell3D = () => {
    return (
      <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Cell3D
          cellType={cellType}
          selectedPart={selectedPart}
          onPartClick={setSelectedPart}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={cellType} onValueChange={handleCellTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select cell type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="animal">Animal Cell</SelectItem>
            <SelectItem value="plant">Plant Cell</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={view} onValueChange={(value: '2d' | '3d') => setView(value)} className="w-[180px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="2d">2D View</TabsTrigger>
            <TabsTrigger value="3d">3D View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${cellType}-${view}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {view === '2d' ? renderCell2D() : renderCell3D()}
            </motion.div>
          </AnimatePresence>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cell Structure</CardTitle>
            <CardDescription>
              Click on any organelle to learn more about it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPart ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {(() => {
                  const part = cellParts.find(p => p.id === selectedPart);
                  if (!part) return null;
                  return (
                    <>
                      <h3 className="font-semibold text-lg">{part.name}</h3>
                      <p className="text-sm text-muted-foreground">{part.description}</p>
                      <p className="text-sm">Function: {part.function}</p>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a cell part to view its details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 