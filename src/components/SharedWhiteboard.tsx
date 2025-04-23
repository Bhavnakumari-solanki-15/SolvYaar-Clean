import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eraser, Pen, Trash2 } from 'lucide-react';

interface DrawEvent {
  type: 'pen' | 'eraser' | 'clear';
  userId: string;
  userName: string;
  points: {x: number, y: number}[];
  color: string;
  timestamp: number;
  drawId: string;
}

interface SharedWhiteboardProps {
  roomCode: string;
  userId: string;
  userName: string;
  drawEvents: DrawEvent[];
  isHost: boolean;
}

export function SharedWhiteboard({ roomCode, userId, userName, drawEvents, isHost }: SharedWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const lastPointRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redrawCanvas();
    };

    // Initial resize
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
    socketRef.current = socket;

    // Handle draw events from other users
    socket.on('newDrawEvent', (event: DrawEvent) => {
      drawOnCanvas(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Redraw all events when drawEvents prop changes
    redrawCanvas();
  }, [drawEvents]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all events
    drawEvents.forEach(event => {
      drawOnCanvas(event);
    });
  };

  const drawOnCanvas = (event: DrawEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = event.color;
    ctx.lineWidth = event.type === 'eraser' ? 20 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (event.type === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.beginPath();
    event.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointRef.current = { x, y };

    // Start new drawing event
    const drawEvent: DrawEvent = {
      type: tool,
      userId,
      userName,
      points: [{ x, y }],
      color: tool === 'eraser' ? '#FFFFFF' : brushColor,
      timestamp: Date.now(),
      drawId: Date.now().toString()
    };

    if (socketRef.current) {
      socketRef.current.emit('drawEvent', { roomCode, event: drawEvent });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lastPoint = lastPointRef.current;
    if (!lastPoint) return;

    // Add point to current drawing event
    const drawEvent: DrawEvent = {
      type: tool,
      userId,
      userName,
      points: [lastPoint, { x, y }],
      color: tool === 'eraser' ? '#FFFFFF' : brushColor,
      timestamp: Date.now(),
      drawId: Date.now().toString()
    };

    if (socketRef.current) {
      socketRef.current.emit('drawEvent', { roomCode, event: drawEvent });
    }

    lastPointRef.current = { x, y };
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleClear = () => {
    if (!canvasRef.current || !socketRef.current) return;

    const drawEvent: DrawEvent = {
      type: 'clear',
      userId,
      userName,
      points: [],
      color: '#FFFFFF',
      timestamp: Date.now(),
      drawId: Date.now().toString()
    };

    socketRef.current.emit('drawEvent', { roomCode, event: drawEvent });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center space-x-4 p-4 bg-white border-b">
        <Button
          variant={tool === 'pen' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('pen')}
        >
          <Pen className="h-4 w-4 mr-2" />
          Pen
        </Button>
        <Button
          variant={tool === 'eraser' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('eraser')}
        >
          <Eraser className="h-4 w-4 mr-2" />
          Eraser
        </Button>
        <div className="flex items-center space-x-2">
          <span className="text-sm">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={([value]) => setBrushSize(value)}
            min={1}
            max={20}
            step={1}
            className="w-24"
          />
        </div>
        {tool === 'pen' && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">Color:</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        )}
        {isHost && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Canvas
          </Button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-100 p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white rounded-lg shadow-sm"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
} 