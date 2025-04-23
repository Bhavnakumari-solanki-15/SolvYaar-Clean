import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MathJax } from 'better-react-mathjax';

type Point = {
  x: number;
  y: number;
};

const BifurcationDiagram = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rMin, setRMin] = useState(2.9);
  const [rMax, setRMax] = useState(4.0);
  const [iterations, setIterations] = useState(200);
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const calculateBifurcationPoints = () => {
    setIsLoading(true);
    const newPoints: Point[] = [];
    const steps = 1000;
    const rStep = (rMax - rMin) / steps;
    const discardIterations = 100;

    for (let i = 0; i <= steps; i++) {
      const r = rMin + i * rStep;
      let x = 0.5; // Initial value

      // Discard transient behavior
      for (let j = 0; j < discardIterations; j++) {
        x = r * x * (1 - x);
      }

      // Collect points for bifurcation diagram
      for (let j = 0; j < iterations; j++) {
        x = r * x * (1 - x);
        newPoints.push({ x: r, y: x });
      }
    }

    setPoints(newPoints);
    setIsLoading(false);
  };

  const drawDiagram = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw points
    ctx.fillStyle = '#8b5cf6';
    const width = canvas.width;
    const height = canvas.height;

    points.forEach(point => {
      const x = ((point.x - rMin) / (rMax - rMin)) * width;
      const y = height - point.y * height;
      
      ctx.fillRect(x, y, 1, 1);
    });

    // Draw axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    
    // x-axis
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();
    
    // y-axis
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    
    // Draw tick marks and labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    
    // x-axis ticks
    const xStep = (rMax - rMin) / 5;
    for (let i = 0; i <= 5; i++) {
      const value = rMin + i * xStep;
      const x = (i / 5) * width;
      
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - 5);
      ctx.stroke();
      
      ctx.fillText(value.toFixed(1), x - 10, height - 8);
    }
    
    // y-axis ticks
    for (let i = 0; i <= 5; i++) {
      const y = height - (i / 5) * height;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(5, y);
      ctx.stroke();
      
      ctx.fillText((i / 5).toFixed(1), 8, y + 4);
    }
  };

  useEffect(() => {
    if (points.length > 0) {
      drawDiagram();
    }
  }, [points]);

  useEffect(() => {
    // Initial calculation
    calculateBifurcationPoints();
    
    // Resize handler
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = Math.min(400, window.innerHeight - 350);
          drawDiagram();
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="chaos-section">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 bg-[var(--chaos-card-bg)] border-[var(--chaos-border)]">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Bifurcation Diagram</CardTitle>
                <CardDescription>The logistic map x<sub>n+1</sub> = r·x<sub>n</sub>·(1-x<sub>n</sub>)</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfo(!showInfo)}
                className="text-[var(--chaos-text)] opacity-70 hover:opacity-100"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full relative">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-purple-500" />
                    <p className="mt-2 text-white">Calculating...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-6 items-start pt-0">
            <div className="w-full sm:w-1/2">
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <Label>r Range: [{rMin.toFixed(2)} - {rMax.toFixed(2)}]</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Slider
                      value={[rMin]}
                      min={1}
                      max={rMax - 0.1}
                      step={0.01}
                      onValueChange={(values) => setRMin(values[0])}
                      className="my-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Slider
                      value={[rMax]}
                      min={rMin + 0.1}
                      max={4}
                      step={0.01}
                      onValueChange={(values) => setRMax(values[0])}
                      className="my-2"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Iterations: {iterations}</Label>
                </div>
                <Slider
                  value={[iterations]}
                  min={50}
                  max={500}
                  step={10}
                  onValueChange={(values) => setIterations(values[0])}
                  className="my-2"
                />
              </div>
            </div>
            <div className="w-full sm:w-1/2 flex flex-col items-center">
              <Button 
                onClick={calculateBifurcationPoints} 
                disabled={isLoading}
                className="w-full mb-2 bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Calculating...' : 'Recalculate'}
              </Button>
              <p className="text-xs text-center mt-1 opacity-70">
                Higher iterations give more detail but take longer to calculate
              </p>
            </div>
          </CardFooter>
        </Card>
        
        {showInfo && (
          <Card className="flex-1 bg-[var(--chaos-card-bg)] border-[var(--chaos-border)]">
            <CardHeader>
              <CardTitle>Understanding the Bifurcation Diagram</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">What is this diagram?</h4>
                <p>
                  The bifurcation diagram visualizes how the logistic map function behaves as we change its parameter r.
                  It shows the points where the system becomes chaotic.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">The Logistic Map</h4>
                <p className="mb-2">
                  The logistic map is a simple mathematical function:
                </p>
                <div className="my-3 flex justify-center">
                  <MathJax>{"\\(x_{n+1} = r \\cdot x_n \\cdot (1 - x_n)\\)"}</MathJax>
                </div>
                <p>
                  This equation is used to model population growth with limited resources.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Features to observe:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>For r &lt; 3, the system converges to a single value</li>
                  <li>At r ≈ 3, the first bifurcation occurs (period doubling)</li>
                  <li>As r increases, the system undergoes more bifurcations</li>
                  <li>At r ≈ 3.57, chaos begins</li>
                  <li>"Windows of order" appear within the chaos</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Chaos Theory Implications</h4>
                <p>
                  This simple equation demonstrates how deterministic systems can produce complex, 
                  unpredictable behavior - a fundamental concept in chaos theory.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BifurcationDiagram; 