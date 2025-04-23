import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Undo2, Save, Trash2, Check, Loader2, Grid2X2, Shapes } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { InlineMath } from 'react-katex';
import { groq } from '@/lib/groq-api';
import { Textarea } from "@/components/ui/textarea";

interface DrawingCanvasProps {
  onSave: (imageData: string) => void;
  onClear: () => void;
}

// Mathematical shapes and symbols for recognition
const mathSymbols = {
  // Basic operators
  plus: [[0, 0.5], [1, 0.5], [0.5, 0], [0.5, 1]],
  minus: [[0, 0.5], [1, 0.5]],
  multiply: [[0, 0], [1, 1], [0.5, 0.5], [0, 1], [1, 0]],
  divide: [[0.5, 0.2], [0.5, 0.8], [0.5, 0.5], [0.5, 0.5]],
  
  // Comparison
  equals: [[0, 0.3], [1, 0.3], [0, 0.7], [1, 0.7]],
  lessThan: [[0.8, 0], [0.2, 0.5], [0.8, 1]],
  greaterThan: [[0.2, 0], [0.8, 0.5], [0.2, 1]],
  
  // Brackets
  leftParenthesis: [[0.7, 0], [0.3, 0.5], [0.7, 1]],
  rightParenthesis: [[0.3, 0], [0.7, 0.5], [0.3, 1]],
  
  // Special symbols
  squareRoot: [[0, 0.7], [0.2, 1], [0.4, 0], [1, 0]],
  integral: [[0.7, 0], [0.5, 0.5], [0.7, 1], [0.3, 1]],
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<"pen" | "eraser" | "shape">("pen");
  const [lineWidth, setLineWidth] = useState(3);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [gridOpacity, setGridOpacity] = useState(0.2);
  const [selectedShape, setSelectedShape] = useState<keyof typeof mathSymbols | null>(null);
  const [shapePreview, setShapePreview] = useState<{ x: number; y: number } | null>(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [latexPreview, setLatexPreview] = useState('');
  const [solution, setSolution] = useState<{
    steps: string[];
    answer: string;
    explanation: string;
  } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial canvas style
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "#000000";

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add grid pattern for math
    drawGrid(ctx, canvas.width, canvas.height);

    // Save initial state
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory([initialState]);
    setHistoryIndex(0);

    setContext(ctx);
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = `rgba(229, 231, 235, ${gridOpacity})`; // Light gray grid with configurable opacity
    ctx.lineWidth = 0.5;
    
    // Draw horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw coordinate axes
    ctx.strokeStyle = `rgba(59, 130, 246, ${gridOpacity * 2})`; // Blue axes
    ctx.lineWidth = 1;
    
    // x-axis
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // y-axis
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    ctx.restore();
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !context) return;

      // Save current drawing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Resize canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Redraw white background
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Redraw grid
      drawGrid(context, canvas.width, canvas.height);
      
      // Restore drawing
      context.putImageData(imageData, 0, 0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [context, gridSize, gridOpacity]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (tool === "shape" && selectedShape) {
      setShapePreview({ x, y });
    } else {
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling when drawing on touch devices
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (tool === "shape" && selectedShape && shapePreview) {
      // Update shape preview position
      setShapePreview({ x, y });
      
      // Redraw canvas with shape preview
      const currentState = drawingHistory[historyIndex];
      context.putImageData(currentState, 0, 0);
      drawMathSymbol(selectedShape, shapePreview.x, shapePreview.y, x - shapePreview.x, y - shapePreview.y);
    } else {
      if (tool === "eraser") {
        context.strokeStyle = "#ffffff";
        context.lineWidth = 20;
      } else {
        context.strokeStyle = "#000000";
        context.lineWidth = lineWidth;
      }
      
      context.lineTo(x, y);
      context.stroke();
    }
    
    setHasDrawing(true);
  };

  const drawMathSymbol = (
    symbol: keyof typeof mathSymbols,
    startX: number,
    startY: number,
    width: number,
    height: number
  ) => {
    if (!context) return;
    
    const points = mathSymbols[symbol];
    const symbolWidth = Math.abs(width);
    const symbolHeight = Math.abs(height);
    
    context.beginPath();
    context.strokeStyle = "#000000";
    context.lineWidth = lineWidth;
    
    points.forEach((point, index) => {
      const x = startX + point[0] * symbolWidth;
      const y = startY + point[1] * symbolHeight;
      
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    context.closePath();
    setIsDrawing(false);
    
    if (tool === "shape" && selectedShape && shapePreview) {
      // Draw the final shape
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = shapePreview.x;
      const y = shapePreview.y;
      
      drawMathSymbol(selectedShape, x, y, 50, 50); // Fixed size for shapes
      setShapePreview(null);
    }
    
    // Save state for undo
    const canvas = canvasRef.current;
    const newImageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Remove any redo states
    const newHistory = drawingHistory.slice(0, historyIndex + 1);
    newHistory.push(newImageData);
    
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !context || !canvasRef.current) return;
    
    const newIndex = historyIndex - 1;
    const imageData = drawingHistory[newIndex];
    
    context.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
    
    // Check if we're back to initial state
    if (newIndex === 0) {
      setHasDrawing(false);
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false);
        setDrawingHistory([]);
        setHistoryIndex(-1);
        onClear(); // Call the parent's clear function
      }
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    if (!hasDrawing) {
      toast.error("Please draw your math problem before solving");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");
      onSave(imageData);
    } catch (error) {
      console.error("Error saving drawing:", error);
      toast.error("Failed to process drawing. Please try again.");
    }
  };

  const processDrawing = async () => {
    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/png');
      
      // Use Groq to recognize the drawn math
      const recognizedMath = await groq.recognizeMathFromText(imageData);
      setRecognizedText(recognizedMath);
      
      // Convert to LaTeX
      const latex = await groq.convertToLatex(recognizedMath);
      setLatexPreview(latex);

      toast.success("Drawing processed successfully");
    } catch (error) {
      console.error("Error processing drawing:", error);
      toast.error("Failed to process drawing");
    } finally {
      setIsProcessing(false);
    }
  };

  const recognizeMath = async () => {
    if (!canvasRef.current) return;

    try {
      setIsProcessing(true);
      toast.info("Processing your drawing...");

      // Get canvas data as base64 image
      const imageData = canvasRef.current.toDataURL('image/png');

      // Create a Blob from the base64 image
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create a File object from the Blob
      const file = new File([blob], "math-drawing.png", { type: 'image/png' });

      // Use Groq API to process the image
      const text = await groq.recognizeMathFromImage(file);
      setRecognizedText(text);

      toast.success("Math expression recognized!");
    } catch (error) {
      console.error("Error recognizing math:", error);
      toast.error("Failed to recognize math expression. Please try again with clearer writing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const solveMath = async () => {
    if (!recognizedText.trim()) {
      toast.error("Please draw and recognize a math expression first");
      return;
    }

    try {
      setIsProcessing(true);
      toast.info("Solving your math problem...");

      const solution = await groq.recognizeMathFromText(`Solve the following math problem step by step and explain each step clearly:

      ${recognizedText}

      Provide your response in this format:
      
      SOLUTION:
      1. [First step explanation]
      2. [Second step explanation]
      ...

      ANSWER:
      [Final answer]

      EXPLANATION:
      [Any additional explanations or diagrams needed]`);

      // Parse the solution response
      const solutionParts = solution.split('\n\n');
      const steps = solutionParts.find(part => part.startsWith('SOLUTION:'))?.split('\n').slice(1) || [];
      const answer = solutionParts.find(part => part.startsWith('ANSWER:'))?.split('\n')[1] || '';
      const explanation = solutionParts.find(part => part.startsWith('EXPLANATION:'))?.split('\n').slice(1).join('\n') || '';

      setSolution({
        steps,
        answer,
        explanation
      });

      toast.success("Problem solved successfully!");
    } catch (error) {
      console.error("Error solving math:", error);
      toast.error("Failed to solve the math problem. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row md:justify-between gap-2">
        <div className="flex space-x-2 flex-wrap gap-y-2">
          <Button 
            variant={tool === "pen" ? "default" : "outline"} 
            size="sm" 
            onClick={() => {
              setTool("pen");
              setSelectedShape(null);
            }}
          >
            Pen
          </Button>
          <Button 
            variant={tool === "eraser" ? "default" : "outline"} 
            size="sm" 
            onClick={() => {
              setTool("eraser");
              setSelectedShape(null);
            }}
          >
            <Eraser className="h-4 w-4 mr-2" /> Eraser
          </Button>
          <Button 
            variant={tool === "shape" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setTool("shape")}
          >
            <Shapes className="h-4 w-4 mr-2" /> Shapes
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="h-4 w-4 mr-2" /> Undo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isProcessing || !hasDrawing}
          size="sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save & Solve
            </>
          )}
        </Button>
      </div>

      {/* Shape selector */}
      {tool === "shape" && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.keys(mathSymbols).map((symbol) => (
            <Button
              key={symbol}
              variant={selectedShape === symbol ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedShape(symbol as keyof typeof mathSymbols)}
              className="h-10"
            >
              {symbol}
            </Button>
          ))}
        </div>
      )}

      {/* Grid controls */}
      <div className="space-y-4 mb-4">
        <div className="flex items-center gap-4">
          <Grid2X2 className="h-4 w-4" />
          <div className="flex-1">
            <Slider
              value={[gridSize]}
              onValueChange={(value) => setGridSize(value[0])}
              min={10}
              max={50}
              step={5}
            />
          </div>
          <span className="text-sm text-muted-foreground w-12">
            {gridSize}px
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm">Opacity</span>
          <div className="flex-1">
            <Slider
              value={[gridOpacity * 100]}
              onValueChange={(value) => setGridOpacity(value[0] / 100)}
              min={0}
              max={100}
              step={5}
            />
          </div>
          <span className="text-sm text-muted-foreground w-12">
            {Math.round(gridOpacity * 100)}%
          </span>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full aspect-[4/3] touch-none"
        />
      </div>

      {recognizedText && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Recognized Math:</h3>
          <Card>
            <CardContent className="p-4">
              <p className="text-lg">{recognizedText}</p>
              {latexPreview && (
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground mb-2">Preview:</div>
                  <div className="text-lg">
                    <InlineMath math={latexPreview} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Button
        onClick={processDrawing}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Process"}
      </Button>

      <div className="flex justify-between">
        <Button
          onClick={recognizeMath}
          disabled={isProcessing}
          className="px-8"
        >
          {isProcessing ? "Processing..." : "Recognize Math"}
        </Button>
        <Button
          onClick={solveMath}
          disabled={isProcessing || !recognizedText.trim()}
          className="px-8"
        >
          {isProcessing ? "Solving..." : "Solve"}
        </Button>
      </div>

      {solution && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="text-lg font-medium mb-3">Solution Steps:</h4>
              <ol className="list-decimal list-inside space-y-2">
                {solution.steps.map((step, index) => (
                  <li key={index} className="text-base pl-2">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-lg font-medium mb-2">Final Answer:</h4>
              <p className="text-base bg-muted/30 p-3 rounded-md">{solution.answer}</p>
            </div>

            {solution.explanation && (
              <div className="pt-4 border-t">
                <h4 className="text-lg font-medium mb-2">Additional Explanation:</h4>
                <p className="text-base">{solution.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DrawingCanvas;
