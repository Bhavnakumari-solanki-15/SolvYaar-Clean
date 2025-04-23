import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info, Play, Pause, RotateCcw, Eye, EyeOff } from "lucide-react";
import * as THREE from 'three';
// Fix import to handle OrbitControls properly
// Import THREE to global window object to make submodules work
// This OrbitControls reference will be filled at runtime with the loaded implementation

// Define OrbitControls interface
interface OrbitControlsInterface {
  new (camera: THREE.Camera, domElement: HTMLElement): any;
  update(): void;
  enableDamping: boolean;
  dampingFactor: number;
  dispose(): void;
}

// Empty OrbitControls placeholder that will be populated at runtime
let OrbitControls: OrbitControlsInterface;

interface PlanetData {
  name: string;
  radius: number;
  mass: number;
  color: string;
  atmosphereColor: string;
  temperature: number;
  description: string;
  hasRings?: boolean;
  hasAtmosphere?: boolean;
}

const PLANETS: Record<string, PlanetData> = {
  mercury: {
    name: "Mercury",
    radius: 2439.7,
    mass: 3.285e23,
    color: "#A0522D",
    atmosphereColor: "#FF9F1C",
    temperature: 440,
    description: "The smallest planet in our solar system and nearest to the Sun.",
    hasAtmosphere: false
  },
  venus: {
    name: "Venus",
    radius: 6051.8,
    mass: 4.867e24,
    color: "#DEB887",
    atmosphereColor: "#FFD700",
    temperature: 737,
    description: "Venus has a thick atmosphere that creates a strong greenhouse effect.",
    hasAtmosphere: true
  },
  earth: {
    name: "Earth",
    radius: 6371,
    mass: 5.972e24,
    color: "#4169E1",
    atmosphereColor: "#87CEEB",
    temperature: 288,
    description: "Our home planet, the only known planet with liquid water on its surface.",
    hasAtmosphere: true
  },
  mars: {
    name: "Mars",
    radius: 3389.5,
    mass: 6.39e23,
    color: "#CD5C5C",
    atmosphereColor: "#FFA07A",
    temperature: 210,
    description: "The Red Planet, featuring the largest volcano in the solar system.",
    hasAtmosphere: true
  },
  jupiter: {
    name: "Jupiter",
    radius: 69911,
    mass: 1.898e27,
    color: "#DEB887",
    atmosphereColor: "#F4A460",
    temperature: 165,
    description: "The largest planet in our solar system, with a prominent Great Red Spot.",
    hasAtmosphere: true
  },
  saturn: {
    name: "Saturn",
    radius: 58232,
    mass: 5.683e26,
    color: "#F4A460",
    atmosphereColor: "#FFE4B5",
    temperature: 134,
    description: "Known for its beautiful ring system, made mostly of ice particles.",
    hasRings: true,
    hasAtmosphere: true
  }
};

export function SpacePhysicsExplorer() {
  const [selectedPlanet, setSelectedPlanet] = useState<string>("earth");
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAtmospheres, setShowAtmospheres] = useState(true);
  const [timeScale, setTimeScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControlsInterface>();
  const planetsRef = useRef<THREE.Group[]>([]);
  const timeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Update atmosphere visibility when toggle changes
  const updateAtmosphereVisibility = useCallback(() => {
    planetsRef.current.forEach((group, index) => {
      const planetKeys = Object.keys(PLANETS);
      if (index < planetKeys.length) {
        const planet = PLANETS[planetKeys[index]];
        if (planet.hasAtmosphere && group.children.length > 1) {
          const atmosphere = group.children[1] as THREE.Mesh;
          atmosphere.visible = showAtmospheres;
        }
      }
    });
  }, [showAtmospheres]);

  // Handle time scale updates
  const updateTimeScale = useCallback((newScale: number) => {
    setTimeScale(newScale);
    // Reset the time reference to avoid sudden jumps
    timeRef.current = 0;
    lastUpdateRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 100, 200);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls - make sure THREE is available globally
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
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2);
    scene.add(sunLight);

    // Create sun
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Add sun glow
    const sunGlowGeometry = new THREE.SphereGeometry(22, 32, 32);
    const sunGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xffff00) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity * (0.8 + 0.2 * sin(time * 2.0)));
        }
      `,
      transparent: true,
      side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sun.add(sunGlow);

    // Create planets
    Object.entries(PLANETS).forEach(([key, planet], index) => {
      const group = new THREE.Group();
      const distance = (index + 1) * 50;
      
      // Planet sphere
      const planetGeometry = new THREE.SphereGeometry(planet.radius * 0.0001, 32, 32);
      const planetMaterial = new THREE.MeshStandardMaterial({
        color: planet.color,
        roughness: 0.7,
        metalness: 0.3
      });
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      group.add(planetMesh);

      // Atmosphere if planet has one
      if (planet.hasAtmosphere) {
        const atmosphereGeometry = new THREE.SphereGeometry(planet.radius * 0.00012, 32, 32);
        const atmosphereMaterial = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(planet.atmosphereColor) },
            time: { value: 0 }
          },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float time;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(color, intensity * (0.6 + 0.4 * sin(time)));
            }
          `,
          transparent: true,
          side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.visible = showAtmospheres;
        group.add(atmosphere);
      }

      // Rings for Saturn
      if (planet.hasRings) {
        const ringGeometry = new THREE.RingGeometry(
          planet.radius * 0.00015,
          planet.radius * 0.00025,
          64
        );
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0xA0522D,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 3;
        group.add(rings);
      }

      // Orbit line
      const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 128);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      scene.add(orbit);

      // Position planet
      group.position.x = distance;
      scene.add(group);
      planetsRef.current.push(group);
    });

    // Animation function
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !controlsRef.current) return;

      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000; // Convert to seconds
      lastUpdateRef.current = now;

      if (isPlaying) {
        timeRef.current += deltaTime * timeScale;

        // Update planet positions with smooth time-based movement
        planetsRef.current.forEach((group, index) => {
          const planetKeys = Object.keys(PLANETS);
          if (index < planetKeys.length) {
            const speed = 0.2 / (index + 1);
            const angle = timeRef.current * speed;
            const distance = (index + 1) * 50;

            group.position.x = Math.cos(angle) * distance;
            group.position.z = Math.sin(angle) * distance;
            group.rotation.y += 0.01 * timeScale;

            // Update atmosphere shader time
            const planet = PLANETS[planetKeys[index]];
            if (planet.hasAtmosphere && group.children.length > 1) {
              const atmosphere = group.children[1] as THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
              if (atmosphere.material instanceof THREE.ShaderMaterial) {
                atmosphere.material.uniforms.time.value = timeRef.current;
              }
            }
          }
        });

        // Update sun glow if it exists
        const sun = sceneRef.current.children.find(child => 
          child instanceof THREE.Mesh && 
          child.material instanceof THREE.MeshStandardMaterial && 
          child.material.emissive?.equals(new THREE.Color(0xffff00))
        );

        if (sun && sun.children.length > 0) {
          const sunGlow = sun.children[0] as THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
          if (sunGlow.material instanceof THREE.ShaderMaterial) {
            sunGlow.material.uniforms.time.value = timeRef.current;
          }
        }
      }

      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    lastUpdateRef.current = Date.now();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [showAtmospheres]);

  // Update atmosphere visibility when toggle changes
  useEffect(() => {
    updateAtmosphereVisibility();
  }, [showAtmospheres, updateAtmosphereVisibility]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Space Physics Explorer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-blue-500/10 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium">Interactive Solar System</p>
                <p className="text-muted-foreground">
                  Explore an enhanced solar system with atmospheric effects, planet information, and interactive controls.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Planet</Label>
              <Select value={selectedPlanet} onValueChange={setSelectedPlanet}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLANETS).map(([key, planet]) => (
                    <SelectItem key={key} value={key}>
                      {planet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Scale</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[timeScale]}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onValueChange={([value]) => updateTimeScale(value)}
                />
                <span className="text-sm text-gray-500 min-w-[4rem]">{timeScale}x</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                updateTimeScale(1);
                setIsPlaying(true);
                timeRef.current = 0;
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAtmospheres(!showAtmospheres)}
              className={showAtmospheres ? "bg-blue-100 dark:bg-blue-900" : ""}
            >
              {showAtmospheres ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>

          <div
            ref={containerRef}
            className="h-[600px] w-full bg-black rounded-lg overflow-hidden"
          />

          {selectedPlanet && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{PLANETS[selectedPlanet].name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Radius:</span> {PLANETS[selectedPlanet].radius.toLocaleString()} km</p>
                  <p><span className="font-medium">Mass:</span> {PLANETS[selectedPlanet].mass.toExponential(2)} kg</p>
                  <p><span className="font-medium">Temperature:</span> {PLANETS[selectedPlanet].temperature}K</p>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {PLANETS[selectedPlanet].description}
                </p>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Controls:
              <br />
              • Click and drag to rotate view
              <br />
              • Scroll to zoom in/out
              <br />
              • Toggle atmospheres with the eye button
              <br />
              • Select planets to view detailed information
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 