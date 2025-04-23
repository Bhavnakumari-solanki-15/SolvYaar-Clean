import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function WavePhenomena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveType, setWaveType] = useState('sine');
  const [frequency, setFrequency] = useState(1);
  const [amplitude, setAmplitude] = useState(50);
  const [phase, setPhase] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!isPlaying) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWave(ctx, canvas.width, canvas.height);
      setPhase(prev => (prev + 0.05) % (2 * Math.PI));
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, waveType, frequency, amplitude, phase]);

  const drawWave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    for (let x = 0; x < width; x++) {
      const xPos = x;
      let yPos = height / 2;

      switch (waveType) {
        case 'sine':
          yPos += amplitude * Math.sin((x * frequency * 0.02) + phase);
          break;
        case 'square':
          yPos += amplitude * Math.sign(Math.sin((x * frequency * 0.02) + phase));
          break;
        case 'triangle':
          yPos += amplitude * (2 * Math.abs(((x * frequency * 0.02) + phase) % (2 * Math.PI) / Math.PI - 1) - 1);
          break;
        case 'sawtooth':
          yPos += amplitude * (((x * frequency * 0.02) + phase) % (2 * Math.PI) / Math.PI - 1);
          break;
      }

      if (x === 0) {
        ctx.moveTo(xPos, yPos);
      } else {
        ctx.lineTo(xPos, yPos);
      }
    }

    ctx.stroke();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col space-y-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-[400px] border rounded-lg bg-background"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wave Type</Label>
              <Select value={waveType} onValueChange={setWaveType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sine">Sine Wave</SelectItem>
                  <SelectItem value="square">Square Wave</SelectItem>
                  <SelectItem value="triangle">Triangle Wave</SelectItem>
                  <SelectItem value="sawtooth">Sawtooth Wave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Slider
                value={[frequency]}
                onValueChange={([value]) => setFrequency(value)}
                min={0.1}
                max={5}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Amplitude</Label>
              <Slider
                value={[amplitude]}
                onValueChange={([value]) => setAmplitude(value)}
                min={10}
                max={100}
                step={1}
              />
            </div>

            <div>
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-full"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 