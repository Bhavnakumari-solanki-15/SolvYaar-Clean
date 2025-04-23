import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { toast } from "../ui/sonner";
import { generatePoints } from "../../lib/mathExpressionParser";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../components/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Plus, Trash, Save, Loader2, Settings, ZoomIn, ZoomOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

// Define placeholders for Recharts components
let LineChart: any = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-full text-muted-foreground">
    Loading chart components...
  </div>
);
let Line: any = () => null;
let XAxis: any = () => null;
let YAxis: any = () => null;
let CartesianGrid: any = () => null;
let Tooltip: any = () => null;
let ResponsiveContainer: any = ({ children }: { children: React.ReactNode }) => <div className="h-full">{children}</div>;
let Legend: any = () => null;

interface Graph {
  id: string;
  expression: string;
  color: string;
  points: { x: number; y: number }[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--info))",
];

export function GraphingTool() {
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [currentExpression, setCurrentExpression] = useState("");
  const [range, setRange] = useState({ start: -10, end: 10, step: 0.5 });
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { theme } = useTheme();
  const [rechartsLoaded, setRechartsLoaded] = useState(false);
  
  // Load Recharts from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Recharts) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/recharts@2.9.3/umd/Recharts.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Recharts && mounted) {
          // Assign components from window.Recharts
          ResponsiveContainer = window.Recharts.ResponsiveContainer;
          LineChart = window.Recharts.LineChart;
          Line = window.Recharts.Line;
          XAxis = window.Recharts.XAxis;
          YAxis = window.Recharts.YAxis;
          CartesianGrid = window.Recharts.CartesianGrid;
          Legend = window.Recharts.Legend;
          Tooltip = window.Recharts.Tooltip;
          
          // Force re-render
          setRechartsLoaded(true);
        }
      };
      
      // Append script to document
      document.head.appendChild(script);
    } else if (window.Recharts) {
      // Recharts already loaded
      ResponsiveContainer = window.Recharts.ResponsiveContainer;
      LineChart = window.Recharts.LineChart;
      Line = window.Recharts.Line;
      XAxis = window.Recharts.XAxis;
      YAxis = window.Recharts.YAxis;
      CartesianGrid = window.Recharts.CartesianGrid;
      Legend = window.Recharts.Legend;
      Tooltip = window.Recharts.Tooltip;
      
      setRechartsLoaded(true);
    }
    
    let mounted = true;
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddGraph = () => {
    if (!currentExpression) {
      toast.error("Please enter an expression");
      return;
    }

    setLoading(true);
    try {
      const expr = currentExpression.includes('=') ? currentExpression.split('=')[1].trim() : currentExpression.trim();
      const points = generatePoints(expr, range);
      
      if (points.length === 0) {
        toast.error("Could not generate any valid points for this expression");
        return;
      }

      const newGraph: Graph = {
        id: Date.now().toString(),
        expression: currentExpression,
        color: COLORS[graphs.length % COLORS.length],
        points,
      };

      setGraphs(prev => [...prev, newGraph]);
      setCurrentExpression("");
      toast.success("Graph added successfully!");
    } catch (error) {
      toast.error("Failed to generate graph. Please check your expression.");
      console.error("Graph error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGraph = (id: string) => {
    setGraphs(prev => prev.filter(graph => graph.id !== id));
    toast.success("Graph removed");
  };

  const handleRangeChange = (value: number[]) => {
    setRange(prev => ({
      ...prev,
      start: value[0],
      end: value[1]
    }));
  };

  const handleStepChange = (value: number[]) => {
    setRange(prev => ({
      ...prev,
      step: value[0]
    }));
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(newZoom, 0.1), 10);
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold tracking-tight">Function Grapher</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => handleZoom('in')}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleZoom('out')}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Enter expression (e.g., x^2, sin(x), 2x + 1)"
              value={currentExpression}
              onChange={(e) => setCurrentExpression(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAddGraph}
              disabled={loading || !currentExpression}
              className="shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Graph
            </Button>
          </div>

          <Tabs defaultValue="range" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="range">Range</TabsTrigger>
              <TabsTrigger value="step">Step Size</TabsTrigger>
            </TabsList>
            <TabsContent value="range" className="space-y-4">
              <div className="space-y-2">
                <Label>X-Axis Range</Label>
                <Slider
                  min={-20}
                  max={20}
                  step={1}
                  value={[range.start, range.end]}
                  onValueChange={handleRangeChange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{range.start}</span>
                  <span>{range.end}</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="step" className="space-y-4">
              <div className="space-y-2">
                <Label>Step Size</Label>
                <Slider
                  min={0.1}
                  max={2}
                  step={0.1}
                  value={[range.step]}
                  onValueChange={handleStepChange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0.1</span>
                  <span>{range.step}</span>
                  <span>2.0</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-[400px] mt-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4"
        >
          {!rechartsLoaded ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading chart components...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))"
                />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  domain={['auto', 'auto']} 
                  label={{ 
                    value: 'X', 
                    position: 'bottom',
                    fill: 'hsl(var(--foreground))'
                  }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  type="number" 
                  domain={['auto', 'auto']} 
                  label={{ 
                    value: 'Y', 
                    angle: -90, 
                    position: 'left',
                    fill: 'hsl(var(--foreground))'
                  }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  content={({ active, payload, label }: { active?: boolean; payload?: any[]; label?: any }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="font-medium">x = {label}</span>
                            </div>
                            {payload.map((entry, index) => (
                              <div key={index} className="text-right font-mono">
                                y = {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {graphs.map((graph) => (
                  <Line
                    key={graph.id}
                    type="monotone"
                    data={graph.points}
                    dataKey="y"
                    stroke={graph.color}
                    dot={false}
                    strokeWidth={2}
                    name={graph.expression}
                    isAnimationActive={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Graphs</h3>
          <div className="grid gap-4">
            {graphs.map((graph) => (
              <motion.div
                key={graph.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: graph.color }}
                  />
                  <span className="font-mono">{graph.expression}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveGraph(graph.id)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 