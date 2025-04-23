import React, { useRef, useState, useEffect } from 'react';
import { useCollaborativeRoom, DrawEvent } from '@/contexts/CollaborativeRoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Eraser, Download, Trash } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Whiteboard color options
const COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFF00', // Yellow
  '#FF8800', // Orange
];

// Pen size options
const PEN_SIZES = [2, 4, 8, 12];

export const CollaborativeWhiteboard: React.FC = () => {
  // Get drawing context from collaborative room
  const { userId, sendDrawEvent, drawEvents } = useCollaborativeRoom();
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [color, setColor] = useState<string>('#000000');
  const [penSize, setPenSize] = useState<number>(4);
  const [currentDrawId, setCurrentDrawId] = useState<string>('');
  const [currentPoints, setCurrentPoints] = useState<{x: number, y: number}[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [eraserMode, setEraserMode] = useState<boolean>(false);
  
  // Resize the canvas when the component mounts or the window resizes
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const width = container.clientWidth;
          const height = Math.max(400, container.clientHeight);
          setCanvasSize({ width, height });
        }
      }
    };
    
    // Initial resize
    resizeCanvas();
    
    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);
  
  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        canvasCtxRef.current = ctx;
      }
    }
  }, [canvasSize]);
  
  // Process and render all drawing events
  useEffect(() => {
    if (!canvasCtxRef.current || !canvasRef.current) return;
    
    // Clear canvas for complete redraw
    const ctx = canvasCtxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Group events by drawId to optimize rendering
    const groupedEvents = new Map();
    
    drawEvents.forEach(event => {
      const key = `${event.drawId}-${event.userId}`;
      if (!groupedEvents.has(key)) {
        groupedEvents.set(key, []);
      }
      groupedEvents.get(key).push(event);
    });
    
    // Render each drawing stroke
    groupedEvents.forEach(events => {
      if (events.length === 0) return;
      
      const firstEvent = events[0] as DrawEvent;
      
      // Set up drawing style
      ctx.strokeStyle = firstEvent.color;
      
      // Set line width based on color or penSize
      if (firstEvent.color === '#FFFFFF') {
        // Eraser - use larger size
        ctx.lineWidth = 16;
      } else {
        // Regular pen - use pen size
        ctx.lineWidth = penSize;
      }
      
      // Start a new path
      ctx.beginPath();
      
      // Start at the first point
      if (firstEvent.points.length > 0) {
        const pt = firstEvent.points[0];
        ctx.moveTo(pt.x, pt.y);
        
        // For single-point events, draw a dot
        if (firstEvent.points.length === 1 && events.length === 1) {
          ctx.arc(pt.x, pt.y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw lines through all points in all events
          events.forEach((event: DrawEvent) => {
            event.points.forEach((pt: {x: number, y: number}, idx: number) => {
              if (idx > 0 || event !== firstEvent) {
                ctx.lineTo(pt.x, pt.y);
              }
            });
          });
          
          // Stroke the path
          ctx.stroke();
        }
      }
    });
  }, [drawEvents, penSize]);
  
  // Handle pointer down (start drawing)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // Capture the pointer
    canvasRef.current.setPointerCapture(e.pointerId);
    
    // Calculate position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Start drawing
    setIsDrawing(true);
    
    // Generate a new draw ID for this drawing session
    const drawId = `${userId}-${Date.now()}`;
    setCurrentDrawId(drawId);
    
    // Store the initial point
    const point = { x, y };
    setCurrentPoints([point]);
    
    // Send start draw event
    sendDrawEvent({
      type: 'startDraw',
      points: [point],
      color: eraserMode ? '#FFFFFF' : color,
      drawId
    });
    
    // Immediately draw a dot at the starting point for instant feedback
    if (canvasCtxRef.current) {
      const ctx = canvasCtxRef.current;
      ctx.fillStyle = eraserMode ? '#FFFFFF' : color;
      ctx.beginPath();
      ctx.arc(x, y, (eraserMode ? 8 : (penSize/2)), 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Handle pointer move (continue drawing)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    // Calculate position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add the new point
    const newPoint = { x, y };
    setCurrentPoints(prevPoints => [...prevPoints, newPoint]);
    
    // Draw line directly for immediate feedback
    if (canvasCtxRef.current) {
      const ctx = canvasCtxRef.current;
      
      if (currentPoints.length > 0) {
        const lastPoint = currentPoints[currentPoints.length - 1];
        
        ctx.strokeStyle = eraserMode ? '#FFFFFF' : color;
        ctx.lineWidth = eraserMode ? 16 : penSize;
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    
    // Send move event, but throttle sending to reduce traffic
    if (currentPoints.length % 5 === 0) {
      sendDrawEvent({
        type: 'drawMove',
        points: [...currentPoints, newPoint],
        color: eraserMode ? '#FFFFFF' : color,
        drawId: currentDrawId
      });
    }
  };
  
  // Handle pointer up (end drawing)
  const handlePointerUp = () => {
    if (!isDrawing) return;
    
    // End drawing
    setIsDrawing(false);
    
    // Send end draw event with all points
    sendDrawEvent({
      type: 'endDraw',
      points: currentPoints,
      color: eraserMode ? '#FFFFFF' : color,
      drawId: currentDrawId
    });
    
    // Reset current points
    setCurrentPoints([]);
  };
  
  // Handle pointer out (end drawing if leaving canvas)
  const handlePointerOut = () => {
    if (isDrawing) {
      handlePointerUp();
    }
  };
  
  // Clear whiteboard
  const clearWhiteboard = () => {
    if (canvasCtxRef.current && canvasRef.current) {
      canvasCtxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      toast({
        title: "Whiteboard Cleared",
        description: "The whiteboard has been cleared locally. Other users will not see this change."
      });
    }
  };
  
  // Download whiteboard as image
  const downloadWhiteboard = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Whiteboard Downloaded",
        description: "The whiteboard has been downloaded as a PNG image."
      });
    }
  };
  
  // Toggle eraser mode
  const toggleEraserMode = () => {
    setEraserMode(prev => !prev);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <div className="p-2 border-b flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={eraserMode ? "eraser" : "pen"}>
            <ToggleGroupItem 
              value="pen" 
              aria-label="Pen" 
              onClick={() => setEraserMode(false)}
              className={!eraserMode ? "bg-primary text-primary-foreground" : ""}
            >
              Pen
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="eraser" 
              aria-label="Eraser" 
              onClick={toggleEraserMode}
              className={eraserMode ? "bg-primary text-primary-foreground" : ""}
            >
              <Eraser className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          {!eraserMode && (
            <>
              <div className="flex gap-1">
                {PEN_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setPenSize(size)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                      penSize === size ? 'border-primary bg-primary/10' : 'border-gray-300'
                    }`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{
                        width: size,
                        height: size,
                      }}
                    />
                  </button>
                ))}
              </div>
              
              <div className="flex gap-1">
                {COLORS.map((colorOption) => (
                  <button
                    key={colorOption}
                    onClick={() => setColor(colorOption)}
                    className={`w-6 h-6 rounded-full ${
                      color === colorOption ? 'ring-2 ring-primary ring-offset-1' : ''
                    }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearWhiteboard}>
            <Trash className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={downloadWhiteboard}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
      
      <CardContent className="flex-grow p-0 relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border-0 w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerOut}
          style={{ background: 'white' }}
        />
      </CardContent>
    </Card>
  );
};
