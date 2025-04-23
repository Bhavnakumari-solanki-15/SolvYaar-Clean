import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";
import { useHistory } from "../contexts/HistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { MathProblem, MathSolution } from "../lib/groq-api";
import { InputType, ToolType } from "../types/history";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area } from "recharts";
import { Clock, Copy, Download, ThumbsUp, Info, BookOpen, ChevronRight, Lightbulb, FileText, Brain, CheckCircle, List, Target } from "lucide-react";
import { toast } from "./ui/sonner";
import { supabase } from "../integrations/supabase/client";
import Katex from "katex";
import "katex/dist/katex.min.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

// Modern color palette with better contrast
const CHART_COLORS = {
  primary: [
    'hsl(var(--primary))',
    'hsl(var(--primary)/0.8)',
    'hsl(var(--primary)/0.6)',
  ],
  accent: [
    'hsl(var(--accent))',
    'hsl(var(--accent)/0.8)',
    'hsl(var(--accent)/0.6)',
  ],
  muted: [
    'hsl(var(--muted))',
    'hsl(var(--muted)/0.8)',
    'hsl(var(--muted)/0.6)',
  ]
};

// Enhanced rendering component for math solutions with LaTeX support
const FormattedMath = ({ text, className = "" }: { text: string, className?: string }) => {
  // Process text to highlight boxed answers with a special style and render LaTeX
  const processText = () => {
    if (!text) return { __html: "" };

    // First replace boxed answers with a special style
    let processedText = text.replace(/【(.*?)】/g, '<span class="bg-primary/20 px-2 py-1 rounded text-primary font-semibold">$1</span>');
    
    // Replace common mathematical notations before LaTeX processing
    processedText = processedText
      // Fractions (a/b)
      .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
      // Square roots
      .replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}')
      // Powers/Exponents (x^n)
      .replace(/([a-zA-Z\d]+)\^(\d+)/g, '$1^{$2}')
      // Greek letters
      .replace(/\b(alpha|beta|gamma|delta|theta|pi|sigma|omega)\b/g, '\\$1')
      // Mathematical symbols
      .replace(/!=|≠/g, '\\neq')
      .replace(/<=/g, '\\leq')
      .replace(/>=/g, '\\geq')
      .replace(/\+-/g, '\\pm')
      .replace(/infinity|∞/g, '\\infty')
      .replace(/\*/g, '\\times')
      // Subscripts (x_1)
      .replace(/([a-zA-Z])_(\d+)/g, '$1_{$2}')
      // Vectors (with arrows)
      .replace(/vec\((.*?)\)/g, '\\vec{$1}')
      // Absolute values
      .replace(/\|([^|]+)\|/g, '\\left|$1\\right|')
      // Integrals
      .replace(/integral/g, '\\int')
      .replace(/integral_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '\\int_{$1}^{$2}')
      // Summations
      .replace(/sum_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '\\sum_{$1}^{$2}')
      // Limits
      .replace(/lim_([a-zA-Z0-9]+)/g, '\\lim_{$1}')
      // Derivatives
      .replace(/d\/dx/g, '\\frac{d}{dx}')
      .replace(/d\^2\/dx\^2/g, '\\frac{d^2}{dx^2}')
      // Matrices
      .replace(/matrix\[(.*?)\]/g, (match, content) => {
        const rows = content.split(';');
        return '\\begin{pmatrix}' + 
          rows.map(row => row.trim().split(',').join(' & ')).join(' \\\\ ') + 
          '\\end{pmatrix}';
      });

    // Find all potential LaTeX expressions (both inline and display)
    const latexRegex = /\$(.*?)\$|\$\$(.*?)\$\$/g;
    let match;
    let lastIndex = 0;
    let result = "";
    
    while ((match = latexRegex.exec(processedText)) !== null) {
      // Add text before the LaTeX
      result += processedText.substring(lastIndex, match.index);
      
      // Determine if it's display or inline LaTeX
      const isDisplay = match[0].startsWith("$$");
      const latexContent = isDisplay ? match[2] : match[1];
      
      try {
        // Render LaTeX to HTML with enhanced options
        const html = Katex.renderToString(latexContent, {
          throwOnError: false,
          displayMode: isDisplay,
          strict: false,
          trust: true,
          macros: {
            // Add common macros
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\Q': '\\mathbb{Q}',
            '\\C': '\\mathbb{C}',
            '\\diff': '\\mathrm{d}',
            '\\grad': '\\nabla',
            '\\divg': '\\nabla\\cdot',
            '\\curl': '\\nabla\\times'
          }
        });
        result += html;
      } catch (e) {
        // Fallback to original text if rendering fails
        console.warn('LaTeX rendering failed:', e);
        result += match[0];
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    result += processedText.substring(lastIndex);
    
    return { __html: result };
  };
  
  return (
    <div className={`math-render ${className}`}>
      <div 
        className="whitespace-pre-line prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={processText()}
      />
    </div>
  );
};

interface MathOutputProps {
  problem: MathProblem | null;
  solution: MathSolution | null;
  loading: boolean;
}

const MathOutput: React.FC<MathOutputProps> = ({ problem, solution, loading }) => {
  const { addToHistory } = useHistory();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("solution");
  const [graphData, setGraphData] = useState<any[] | null>(null);
  const [solutionSaved, setSolutionSaved] = useState(false);
  const [visibleHints, setVisibleHints] = useState(0);
  const [chartType, setChartType] = useState<'line' | 'scatter' | 'area'>('line');
  
  // Determine the best chart type based on the data and topic
  useEffect(() => {
    if (solution && solution.topic) {
      const topic = solution.topic.toLowerCase();
      if (topic.includes('statistic') || topic.includes('data')) {
        setChartType('scatter');
      } else if (topic.includes('calculus') && topic.includes('area')) {
        setChartType('area');
      } else {
        setChartType('line');
      }
    }
  }, [solution]);
  
  // Fix the infinite loop by adding solutionSaved to prevent multiple saves
  useEffect(() => {
    if (solution && !loading && problem && !solutionSaved) {
      addToHistory(
        problem.type as InputType || 'text',
        'solver' as ToolType,
        problem.problem,
        solution.solution,
        solution.topic
      );
      setSolutionSaved(true);
      
      // Save solution to Supabase if user is authenticated
      if (isAuthenticated && user) {
        saveSolutionToSupabase(problem, solution);
      }
      
      // Use the plot data from the solution if available
      if (solution.plotData) {
        setGraphData(solution.plotData);
      } else if (solution.visualization) {
        setGraphData(solution.visualization);
      } else if (problem.problem.toLowerCase().includes("graph") || 
                problem.problem.toLowerCase().includes("plot") ||
                problem.problem.toLowerCase().includes("equation")) {
        // Create appropriate sample data based on the detected topic
        if (solution.topic?.toLowerCase().includes('quadratic')) {
          const demoData = Array.from({ length: 21 }, (_, i) => ({
            x: i - 10,
            y: Math.pow(i - 10, 2) / 10,
          }));
          setGraphData(demoData);
        } else if (solution.topic?.toLowerCase().includes('trigonometry')) {
          const demoData = Array.from({ length: 41 }, (_, i) => ({
            x: i * 0.2 - 4,
            y: Math.sin(i * 0.2 - 4),
          }));
          setGraphData(demoData);
        } else {
          // Default linear data
          const demoData = Array.from({ length: 21 }, (_, i) => ({
            x: i - 10,
            y: (i - 10) * 0.5,
          }));
          setGraphData(demoData);
        }
      } else {
        setGraphData(null);
      }
    }
  }, [solution, loading, problem, addToHistory, solutionSaved, isAuthenticated, user]);
  
  // Save solution to Supabase
  const saveSolutionToSupabase = async (problem: MathProblem, solution: MathSolution) => {
    try {
      const historyData = {
        user_id: user?.id || '',
        problem: problem.problem,
        problem_type: problem.type || 'text',
        solution: solution.solution,
        steps: solution.steps || [],
        explanation: solution.explanation || null,
        topic: solution.topic || 'General Mathematics',
        visualization: solution.visualization || solution.plotData || null,
        latex: typeof problem.content === 'string' ? problem.content : null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('math_history')
        .insert(historyData);
        
      if (error) {
        console.error("Error saving solution to Supabase:", error);
      }
    } catch (err) {
      console.error("Failed to save solution to Supabase:", err);
    }
  };
  
  // Reset solutionSaved when problem changes
  useEffect(() => {
    if (problem) {
      setSolutionSaved(false);
      setVisibleHints(0);
    }
  }, [problem]);
  
  const stepColors = [
    'border-blue-400/80',
    'border-purple-400/80',
    'border-teal-400/80',
    'border-pink-400/80',
    'border-green-400/80',
    'border-yellow-400/80',
    'border-orange-400/80',
  ];

  const formatSolutionSteps = (solution: MathSolution) => {
    if (!solution) return null;
    const steps = solution.steps || [];
    const explanation = solution.explanation || '';
    const topic = solution.topic || 'General Mathematics';

    return (
      <div className="space-y-8">
        {/* 🧩 Problem Statement */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative flex items-stretch bg-gradient-to-br from-orange-300/10 to-yellow-100/10 backdrop-blur-xl rounded-3xl shadow-xl border-l-8 border-orange-400/80 overflow-visible mb-2"
        >
          <div className="absolute -left-2 top-6 w-2 h-20 bg-orange-400/80 rounded-full blur-xl opacity-60 animate-pulse" />
          <div className="flex-1 p-8 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧩</span>
              <h3 className="text-lg font-bold tracking-tight">Problem Statement</h3>
            </div>
            <div className="text-base">
              <FormattedMath text={problem?.problem || ''} />
            </div>
          </div>
        </motion.div>

        {/* 🔍 Step-by-Step Solution */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔍</span>
            <h3 className="text-lg font-bold tracking-tight">Step-by-Step Solution</h3>
          </div>
          <div className="flex flex-col gap-4">
            {solution.steps && solution.steps.length > 0 ? solution.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.4, type: 'spring' }}
                className={`relative group flex items-start gap-4 p-5 rounded-2xl bg-white/20 dark:bg-slate-800/40 border-l-8 shadow-xl hover:shadow-[0_0_24px] transition-all cursor-pointer hover:bg-blue-400/10 ${stepColors[index % stepColors.length]}`}
              >
                <span className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform ${stepColors[index % stepColors.length]}`}>{index + 1}</span>
                <div className="flex-1 text-base font-mono bg-slate-900/10 rounded-lg px-4 py-2">
                  <FormattedMath text={step} />
                </div>
              </motion.div>
            )) : solution.explanation && (
              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
                className="text-muted-foreground text-base"
              >
                {solution.explanation.split('\n').map((line, i) => (
                  <div key={i} className="mb-1">
                    <FormattedMath text={line} />
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* 📚 Concept Used / Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="relative flex items-stretch bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-3xl shadow-xl border border-slate-400/30 overflow-hidden hover:scale-[1.025] hover:shadow-2xl transition-transform group"
        >
          <div className="flex-1 p-8 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">ℹ️</span>
              <h3 className="text-base font-semibold tracking-tight">Concept Used / Additional Info</h3>
            </div>
            {solution && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="mr-1">📘</span>
                  <span className="font-medium">{getConceptInfo(solution).mainConcept}</span>
                </div>
                <div className="space-y-1">
                  {getConceptInfo(solution).keyPoints.map((point, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="mr-1">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ✅ Final Answer Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
          className="relative flex items-center justify-center mt-6"
        >
          <div className="relative w-full flex justify-center">
            <div className="relative z-10 flex flex-col items-center w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✅</span>
                <h3 className="text-lg font-bold tracking-tight">Final Answer</h3>
              </div>
              {renderFinalAnswer(solution)}
            </div>
          </div>
        </motion.div>

        {/* Graph if available */}
        {graphData && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl shadow-xl p-6 mt-8"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📊</span> Visualization
            </h3>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[600px]">
                {renderChart()}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const handleCopy = () => {
    if (!solution) return;
    
    const textToCopy = solution.solution;
        
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));
  };
  
  const handleDownload = () => {
    if (!solution) return;
    
    const content = `Problem: ${problem?.problem}\n\nSolution: ${solution.solution}`;
    const filename = "math_solution.txt";
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Solution downloaded");
  };
  
  const showNextHint = () => {
    if (solution?.hints && visibleHints < solution.hints.length) {
      setVisibleHints(prev => prev + 1);
    }
  };
  
  // Render chart based on data type and topic
  const renderChart = () => {
    if (!graphData || graphData.length === 0) return null;
    
    const chartConfig = {
      width: 600,
      height: 300,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      gridStroke: "hsl(var(--border))",
      textColor: "hsl(var(--muted-foreground))",
      axisColor: "hsl(var(--foreground))",
      tooltipStyle: {
        background: "hsl(var(--background)/0.95)",
        border: "hsl(var(--border))",
        borderRadius: "0.5rem",
        padding: "0.5rem",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
      }
    };
    
    if (chartType === 'scatter') {
      return (
        <ScatterChart 
          width={chartConfig.width} 
          height={chartConfig.height} 
          margin={chartConfig.margin}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={chartConfig.gridStroke}
          />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="X" 
            stroke={chartConfig.axisColor}
            tick={{ fill: chartConfig.textColor }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Y" 
            stroke={chartConfig.axisColor}
            tick={{ fill: chartConfig.textColor }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
              
              const point = payload[0].payload;
              if (typeof point.x !== 'number' || typeof point.y !== 'number') return null;

              return (
                <div 
                  className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm"
                  style={chartConfig.tooltipStyle}
                >
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">x = {point.x.toFixed(4)}</span>
                    </div>
                    <div className="text-right font-mono">
                      y = {point.y.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Scatter 
            name="Values" 
            data={graphData} 
            fill="hsl(var(--primary))"
          />
        </ScatterChart>
      );
    } else if (chartType === 'area') {
      return (
        <AreaChart 
          width={chartConfig.width} 
          height={chartConfig.height} 
          data={graphData} 
          margin={chartConfig.margin}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={chartConfig.gridStroke}
          />
          <XAxis 
            dataKey="x" 
            stroke={chartConfig.axisColor}
            tick={{ fill: chartConfig.textColor }}
          />
          <YAxis 
            stroke={chartConfig.axisColor}
            tick={{ fill: chartConfig.textColor }}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length || !payload[0]?.value) return null;
              
              const value = payload[0].value;
              if (typeof value !== 'number' || typeof label !== 'number') return null;

              return (
                <div 
                  className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm"
                  style={chartConfig.tooltipStyle}
                >
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">x = {label.toFixed(4)}</span>
                    </div>
                    <div className="text-right font-mono">
                      y = {value.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Area 
            type="monotone" 
            dataKey="y" 
            stroke="hsl(var(--primary))" 
            fill="hsl(var(--primary)/0.2)"
            strokeWidth={2}
          />
        </AreaChart>
      );
    } else {
      return (
        <LineChart 
          width={chartConfig.width} 
          height={chartConfig.height} 
          data={graphData} 
          margin={chartConfig.margin}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={chartConfig.gridStroke}
          />
          <XAxis 
            dataKey="x" 
            stroke={chartConfig.axisColor}
            tick={{ fill: chartConfig.textColor }}
          />
          <YAxis 
            stroke={chartConfig.axisColor}
            tick={{ fill: chartConfig.textColor }}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length || !payload[0]?.value) return null;
              
              const value = payload[0].value;
              if (typeof value !== 'number' || typeof label !== 'number') return null;

              return (
                <div 
                  className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur-sm"
                  style={chartConfig.tooltipStyle}
                >
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">x = {label.toFixed(4)}</span>
                    </div>
                    <div className="text-right font-mono">
                      y = {value.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="hsl(var(--primary))" 
            activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
            strokeWidth={2}
          />
        </LineChart>
      );
    }
  };
  
  // Function to generate PDF
  const generatePDF = async () => {
    try {
      toast.info("Generating PDF...");
      
      // Initialize jsPDF
      const pdf = new jsPDF();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Set up styling constants
      const margin = 20;
      const contentWidth = pdfWidth - (2 * margin);
      let yPosition = margin;
      
      // Header with logo and title
      pdf.setFillColor(76, 29, 149); // violet-800
      pdf.rect(0, 0, pdfWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SolvYaar Solution', margin, 28);
      yPosition = 50;

      // Problem Statement Section
      pdf.setFillColor(251, 146, 60, 0.1); // orange-400 with opacity
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 40, 'F');
      pdf.setDrawColor(251, 146, 60);
      pdf.setLineWidth(0.5);
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 40);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Problem Statement', margin, yPosition + 5);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const problemText = problem?.problem || '';
      const wrappedProblem = pdf.splitTextToSize(problemText, contentWidth);
      pdf.text(wrappedProblem, margin, yPosition + 20);
      yPosition += 50;

      // Step-by-Step Solution Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Step-by-Step Solution', margin, yPosition);
      yPosition += 10;

      if (solution?.steps && solution.steps.length > 0) {
        solution.steps.forEach((step, index) => {
          // Step circle with number
          pdf.setFillColor(76, 29, 149); // violet-800
          pdf.circle(margin + 10, yPosition + 5, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text((index + 1).toString(), margin + 7, yPosition + 8);
          
          // Step content
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(12);
          const wrappedStep = pdf.splitTextToSize(step, contentWidth - 30);
          pdf.text(wrappedStep, margin + 25, yPosition + 5);
          
          yPosition += (wrappedStep.length * 7) + 15;
          
          // Add new page if needed
          if (yPosition > pdfHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
        });
      } else if (solution?.explanation) {
        const wrappedExplanation = pdf.splitTextToSize(solution.explanation, contentWidth);
        pdf.text(wrappedExplanation, margin, yPosition);
        yPosition += (wrappedExplanation.length * 7) + 15;
      }

      // Final Answer Section
      if (yPosition > pdfHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFillColor(139, 92, 246, 0.1); // violet-500 with opacity
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 40, 'F');
      pdf.setDrawColor(139, 92, 246);
      pdf.setLineWidth(0.5);
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 40);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Final Answer', margin, yPosition + 5);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const finalAnswer = isTheoryQuestion(problem?.problem || '') 
        ? formatTheoryAnswer(solution?.solution || '')
        : solution?.solution || '';
      const wrappedAnswer = pdf.splitTextToSize(finalAnswer, contentWidth);
      pdf.text(wrappedAnswer, margin, yPosition + 20);

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      const today = new Date().toLocaleDateString();
      pdf.text(`Generated by SolvYaar on ${today}`, margin, pdfHeight - 10);
      pdf.text('www.solvyaar.com', pdfWidth - margin - 40, pdfHeight - 10);

      // Save the PDF
      pdf.save('solvyaar-solution.pdf');
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };
  
  const isTheoryQuestion = (text: string): boolean => {
    // Check if the question is theory-based (starts with what, who, why, when, where, how)
    const theoryKeywords = /^(what|who|why|when|where|how)\s/i;
    return theoryKeywords.test(text.toLowerCase());
  };

  const formatTheoryAnswer = (solution: string): string => {
    // Remove any LaTeX or special formatting
    return solution
      .replace(/A classic!\s*Here's the solution:\s*/i, '')
      .replace(/【|】/g, '')
      .replace(/\\\w+{([^}]*)}/g, '$1')
      .trim();
  };

  const renderFinalAnswer = (solution: MathSolution) => {
    const isTheory = problem?.problem && isTheoryQuestion(problem.problem);

    if (isTheory) {
      return (
        <div className="font-sans text-lg text-white bg-gradient-to-br from-violet-500/90 to-green-400/90 shadow-2xl rounded-3xl px-12 py-8 border-4 border-violet-400/80 animate-glow-pulse speech-bubble">
          <div className="space-y-4">
            <p className="font-medium text-xl mb-2">Summary:</p>
            <p className="leading-relaxed">{formatTheoryAnswer(solution.solution)}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="font-mono text-4xl font-extrabold text-white bg-gradient-to-br from-violet-500/90 to-green-400/90 shadow-2xl rounded-3xl px-12 py-8 border-4 border-violet-400/80 animate-glow-pulse speech-bubble">
        <FormattedMath text={solution.solution} />
      </div>
    );
  };

  const getConceptInfo = (solution: MathSolution) => {
    if (!solution) return null;

    // For theory questions
    if (problem?.problem && isTheoryQuestion(problem.problem)) {
      return {
        mainConcept: solution.topic || 'General Knowledge',
        keyPoints: [
          'Definition and core concepts',
          'Key principles and applications',
          'Real-world examples and uses',
        ]
      };
    }

    // For math questions
    const topic = solution.topic?.toLowerCase() || '';
    if (topic.includes('algebra')) {
      return {
        mainConcept: 'Algebraic Operations',
        keyPoints: [
          'Variable manipulation and equations',
          'Function analysis and properties',
          'Solution methods and techniques',
        ]
      };
    } else if (topic.includes('calculus')) {
      return {
        mainConcept: 'Calculus Concepts',
        keyPoints: [
          'Derivatives and rates of change',
          'Integration and area calculations',
          'Limit analysis and continuity',
        ]
      };
    } else if (topic.includes('geometry')) {
      return {
        mainConcept: 'Geometric Principles',
        keyPoints: [
          'Shape properties and relationships',
          'Spatial reasoning and visualization',
          'Measurement and calculations',
        ]
      };
    } else if (topic.includes('trigonometry')) {
      return {
        mainConcept: 'Trigonometric Functions',
        keyPoints: [
          'Angle measurements and ratios',
          'Periodic function properties',
          'Triangle relationships',
        ]
      };
    }

    // Default case
    return {
      mainConcept: 'Mathematical Concepts',
      keyPoints: [
        'Problem-solving strategies',
        'Logical reasoning',
        'Mathematical properties',
      ]
    };
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!problem || !solution) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Core Concept */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold">Core Concept</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300">{solution.explanation}</p>
      </Card>

      {/* Key Points */}
      {solution.keyPoints && solution.keyPoints.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold">Key Points</h3>
          </div>
          <ul className="list-disc list-inside space-y-2">
            {solution.keyPoints.map((point, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">{point}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Solution Steps */}
      {solution.steps && solution.steps.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <List className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Solution Steps</h3>
          </div>
          <ScrollArea className="h-[300px] pr-4">
            <ol className="list-decimal list-inside space-y-4">
              {solution.steps.map((step, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">{step}</li>
              ))}
            </ol>
          </ScrollArea>
        </Card>
      )}

      {/* Final Answer & Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <CheckCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold">Final Answer</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{solution.solution}</p>
        </Card>

        {solution.verification && (
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                <Info className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold">Verification</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">{solution.verification}</p>
          </Card>
        )}
      </div>

      {/* Hints */}
      {solution.hints && solution.hints.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-pink-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900">
              <Lightbulb className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold">Helpful Hints</h3>
          </div>
          <ul className="list-disc list-inside space-y-2">
            {solution.hints.map((hint, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">{hint}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Related Concepts */}
      {solution.relatedConcepts && solution.relatedConcepts.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900">
              <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold">Related Concepts</h3>
          </div>
          <ul className="list-disc list-inside space-y-2">
            {solution.relatedConcepts.map((concept, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">{concept}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default MathOutput;
