import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Charge {
  x: number;
  y: number;
  value: number;
}

export function EMFieldSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fieldType, setFieldType] = useState<'electric' | 'magnetic'>('electric');
  const [charges, setCharges] = useState<Charge[]>([]);
  const [fieldStrength, setFieldStrength] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawField = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#2563eb20';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw charges
      charges.forEach(charge => {
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = charge.value > 0 ? '#ef4444' : '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Draw + or - symbol
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(charge.value > 0 ? '+' : '-', charge.x, charge.y);
      });

      if (showFieldLines && charges.length > 0) {
        // Draw field lines
        const numLines = 16;
        const lineLength = 400;
        const stepSize = 5;

        charges.forEach(charge => {
          for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / numLines) {
            let x = charge.x + 20 * Math.cos(angle);
            let y = charge.y + 20 * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(x, y);

            for (let step = 0; step < lineLength; step += stepSize) {
              const field = calculateField(x, y);
              if (!field.x && !field.y) break;

              const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);
              if (magnitude === 0) break;

              const dx = (field.x / magnitude) * stepSize;
              const dy = (field.y / magnitude) * stepSize;

              x += dx;
              y += dy;

              if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) break;

              ctx.lineTo(x, y);
            }

            ctx.strokeStyle = fieldType === 'electric' ? '#3b82f680' : '#ef444480';
            ctx.stroke();
          }
        });
      }
    };

    const calculateField = (x: number, y: number) => {
      let fieldX = 0;
      let fieldY = 0;

      charges.forEach(charge => {
        const dx = x - charge.x;
        const dy = y - charge.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;

        const magnitude = (fieldStrength * charge.value) / (distance * distance);
        fieldX += (magnitude * dx) / distance;
        fieldY += (magnitude * dy) / distance;
      });

      return { x: fieldX, y: fieldY };
    };

    const animate = () => {
      if (!isAnimating) return;
      drawField();
      animationRef.current = requestAnimationFrame(animate);
    };

    drawField();

    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [charges, fieldType, fieldStrength, isAnimating, showFieldLines]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCharges([...charges, { x, y, value: 1 }]);
  };

  const handleChargeValueChange = (index: number, value: number) => {
    const newCharges = [...charges];
    newCharges[index] = { ...newCharges[index], value };
    setCharges(newCharges);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={fieldType}
                onValueChange={(value: 'electric' | 'magnetic') => setFieldType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electric">Electric Field</SelectItem>
                  <SelectItem value="magnetic">Magnetic Field</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Field Strength</Label>
              <Slider
                value={[fieldStrength]}
                onValueChange={([value]) => setFieldStrength(value)}
                min={0.1}
                max={2}
                step={0.1}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setIsAnimating(!isAnimating)}
              variant="outline"
            >
              {isAnimating ? 'Stop Animation' : 'Start Animation'}
            </Button>
            <Button
              onClick={() => setShowFieldLines(!showFieldLines)}
              variant="outline"
            >
              {showFieldLines ? 'Hide Field Lines' : 'Show Field Lines'}
            </Button>
            <Button
              onClick={() => setCharges([])}
              variant="outline"
            >
              Clear Charges
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-[400px] border rounded-lg bg-background cursor-crosshair"
            onClick={handleCanvasClick}
          />

          {charges.length > 0 && (
            <div className="space-y-2">
              <Label>Charge Values</Label>
              <div className="grid grid-cols-2 gap-4">
                {charges.map((charge, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label>Charge {index + 1}</Label>
                    <Input
                      type="number"
                      value={charge.value}
                      onChange={(e) => handleChargeValueChange(index, parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 