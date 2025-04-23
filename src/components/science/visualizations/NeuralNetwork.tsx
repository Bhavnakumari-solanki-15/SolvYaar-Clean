import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Neuron {
  id: string;
  x: number;
  y: number;
  connections: string[];
  activation: number;
}

interface NetworkConfig {
  layers: number;
  neuronsPerLayer: number;
  connectionDensity: number;
  signalSpeed: number;
}

export function NeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [config, setConfig] = useState<NetworkConfig>({
    layers: 3,
    neuronsPerLayer: 4,
    connectionDensity: 0.5,
    signalSpeed: 1
  });
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<'random' | 'sequential' | 'wave'>('random');

  const initializeNetwork = () => {
    const newNeurons: Neuron[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const layerSpacing = width / (config.layers + 1);
    const neuronSpacing = height / (config.neuronsPerLayer + 1);

    // Create neurons
    for (let layer = 0; layer < config.layers; layer++) {
      for (let neuron = 0; neuron < config.neuronsPerLayer; neuron++) {
        const id = `n-${layer}-${neuron}`;
        newNeurons.push({
          id,
          x: (layer + 1) * layerSpacing,
          y: (neuron + 1) * neuronSpacing,
          connections: [],
          activation: 0
        });
      }
    }

    // Create connections
    newNeurons.forEach((neuron, index) => {
      const layer = parseInt(neuron.id.split('-')[1]);
      if (layer < config.layers - 1) {
        const nextLayerNeurons = newNeurons.filter(n => {
          const nextLayer = parseInt(n.id.split('-')[1]);
          return nextLayer === layer + 1;
        });

        nextLayerNeurons.forEach(nextNeuron => {
          if (Math.random() < config.connectionDensity) {
            neuron.connections.push(nextNeuron.id);
          }
        });
      }
    });

    setNeurons(newNeurons);
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    neurons.forEach(neuron => {
      neuron.connections.forEach(connectionId => {
        const targetNeuron = neurons.find(n => n.id === connectionId);
        if (targetNeuron) {
          ctx.beginPath();
          ctx.moveTo(neuron.x, neuron.y);
          ctx.lineTo(targetNeuron.x, targetNeuron.y);
          ctx.strokeStyle = `rgba(100, 100, 255, ${Math.max(neuron.activation, targetNeuron.activation)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });

    // Draw neurons
    neurons.forEach(neuron => {
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 100, ${neuron.activation})`;
      ctx.fill();
      ctx.strokeStyle = '#666';
      ctx.stroke();
    });
  };

  const updateNetwork = () => {
    if (!isRunning) return;

    setNeurons(prevNeurons => {
      const newNeurons = [...prevNeurons];
      
      // Update activations based on selected pattern
      switch (selectedPattern) {
        case 'random':
          newNeurons.forEach(neuron => {
            if (Math.random() < 0.1) {
              neuron.activation = Math.random();
            }
          });
          break;
        case 'sequential':
          newNeurons.forEach((neuron, index) => {
            const time = Date.now() / 1000;
            const phase = (index / newNeurons.length) * Math.PI * 2;
            neuron.activation = Math.max(0, Math.sin(time + phase));
          });
          break;
        case 'wave':
          newNeurons.forEach(neuron => {
            const layer = parseInt(neuron.id.split('-')[1]);
            const time = Date.now() / 1000;
            const phase = (layer / config.layers) * Math.PI * 2;
            neuron.activation = Math.max(0, Math.sin(time + phase));
          });
          break;
      }

      // Propagate activations
      newNeurons.forEach(neuron => {
        if (neuron.activation > 0) {
          neuron.connections.forEach(connectionId => {
            const targetNeuron = newNeurons.find(n => n.id === connectionId);
            if (targetNeuron) {
              targetNeuron.activation = Math.min(1, targetNeuron.activation + neuron.activation * 0.3);
            }
          });
        }
        // Decay activation
        neuron.activation = Math.max(0, neuron.activation - 0.05);
      });

      return newNeurons;
    });
  };

  useEffect(() => {
    initializeNetwork();
  }, [config]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      drawNetwork();
      updateNetwork();
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [neurons, isRunning]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Neural Network Simulator</CardTitle>
            <CardDescription>
              Visualize neural connections and signal transmission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Network Configuration</Label>
              <div className="space-y-4">
                <div>
                  <Label>Layers</Label>
                  <Slider
                    value={[config.layers]}
                    min={2}
                    max={5}
                    step={1}
                    onValueChange={([value]) => setConfig({ ...config, layers: value })}
                  />
                </div>
                <div>
                  <Label>Neurons per Layer</Label>
                  <Slider
                    value={[config.neuronsPerLayer]}
                    min={2}
                    max={8}
                    step={1}
                    onValueChange={([value]) => setConfig({ ...config, neuronsPerLayer: value })}
                  />
                </div>
                <div>
                  <Label>Connection Density</Label>
                  <Slider
                    value={[config.connectionDensity]}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => setConfig({ ...config, connectionDensity: value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Signal Pattern</Label>
              <Select value={selectedPattern} onValueChange={(value: 'random' | 'sequential' | 'wave') => setSelectedPattern(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random Activation</SelectItem>
                  <SelectItem value="sequential">Sequential Wave</SelectItem>
                  <SelectItem value="wave">Layer Wave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? 'Stop' : 'Start'} Simulation
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
} 