import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  RefreshCcw, 
  Upload, 
  X,
  Calculator,
  RotateCcw,
  Trash2,
  Sparkles
} from "lucide-react";
import { groq, MathProblem, MathSolution } from "@/lib/groq-api";
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import ProblemInput from "@/components/ProblemInput";
import MathOutput from "@/components/MathOutput";
import MathInput from "@/components/MathInput";
import LatexInput from "@/components/LatexInput";
import DrawingCanvas from "@/components/DrawingCanvas";

type InputType = 'text' | 'image' | 'voice' | 'latex' | 'file';

const UnifiedSolver = () => {
  const [activeTab, setActiveTab] = useState<InputType>('text');
  const [currentProblem, setCurrentProblem] = useState<MathProblem>({ 
    problem: '', 
    type: 'text' 
  });
  const [currentSolution, setCurrentSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Add hover effect state
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic gradient colors
  const gradientColors = {
    light: {
      primary: 'from-blue-500 to-purple-500',
      secondary: 'from-emerald-500 to-cyan-500',
      accent: 'from-rose-500 to-pink-500'
    },
    dark: {
      primary: 'from-blue-600 to-purple-600',
      secondary: 'from-emerald-600 to-cyan-600',
      accent: 'from-rose-600 to-pink-600'
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as InputType);
    setCurrentProblem({ 
      problem: '', 
      type: value as MathProblem['type'] 
    });
    setCurrentSolution(null);
    setImagePreview(null);
  };

  // Handle file drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      // Here you would also want to extract text from image using OCR
      // For now, we'll just use the image name as placeholder
      setCurrentProblem({ problem: `Image: ${file.name}`, type: 'image' });
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceInput = () => {
    // Start recording logic here
    // For now, just a placeholder
    toast.info("Voice recording started");
  };

  // Handle problem submission
  const handleSubmit = async (problem: MathProblem | string) => {
    const problemText = typeof problem === 'string' ? problem : problem.problem;
    
    if (!problemText.trim()) {
      toast.error("Please enter a problem first");
      return;
    }

    setLoading(true);
    try {
      const response = await groq.recognizeMathFromText(
        `Solve this math problem step-by-step and provide the solution in LaTeX format:
        ${problemText}
        
        Format your response as:
        LATEX:
        [LaTeX formatted solution]
        
        STEPS:
        1. [First step]
        2. [Second step]
        ...
        
        EXPLANATION:
        [Detailed explanation]`
      );

      const parts = response.split('\n\n');
      const latex = parts.find(p => p.startsWith('LATEX:'))?.replace('LATEX:', '').trim() || '';
      const steps = parts.find(p => p.startsWith('STEPS:'))?.split('\n').slice(1) || [];
      const explanation = parts.find(p => p.startsWith('EXPLANATION:'))?.replace('EXPLANATION:', '').trim() || '';

      setCurrentSolution({ 
        solution: latex,
        explanation,
        steps,
        latex,
        topic: 'General Mathematics'
      });
      setCurrentProblem({ 
        problem: problemText, 
        type: activeTab as MathProblem['type'] 
      });
    } catch (error) {
      console.error('Error solving problem:', error);
      toast.error('Failed to solve the problem');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCurrentProblem({ problem: '', type: 'text' });
    setCurrentSolution(null);
    setImagePreview(null);
    toast.success("All inputs and solutions cleared");
  };

  const handleRefresh = async () => {
    if (currentSolution) {
      await handleSubmit(currentProblem.problem);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/80 backdrop-blur-2xl">
      <div className="relative w-full max-w-4xl mx-auto space-y-8 p-6 bg-white/10 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_40px_0_rgba(168,85,247,0.18)] border border-purple-400/20 flex flex-col items-center animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            Math Problem Solver
          </h1>
          <p className="text-muted-foreground mt-2">Choose your preferred input method</p>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-2" />

            <div className="mt-4 min-h-[320px]">
              <AnimatePresence mode='wait'>
                {activeTab === 'text' && (
                  <TabsContent value="text" asChild forceMount>
                    <motion.div
                      key="text"
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -32 }}
                      transition={{ duration: 0.35, type: 'spring' }}
                    >
                      <div className="bg-white/20 dark:bg-slate-800/40 rounded-2xl shadow-xl border border-purple-400/20 focus-within:ring-4 focus-within:ring-purple-500/40 transition-all min-h-[200px]">
                        <MathInput 
                          onSubmit={(problem: string | MathProblem) => handleSubmit(problem)} 
                          isLoading={loading} 
                          onClear={handleClear}
                        />
                      </div>
                    </motion.div>
                  </TabsContent>
                )}
                {activeTab === 'image' && (
                  <TabsContent value="image" asChild forceMount>
                    <motion.div
                      key="image"
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -32 }}
                      transition={{ duration: 0.35, type: 'spring' }}
                    >
                      <div className="bg-white/20 dark:bg-slate-800/40 rounded-2xl shadow-xl border border-purple-400/20 focus-within:ring-4 focus-within:ring-purple-500/40 transition-all min-h-[200px]">
                        <DrawingCanvas 
                          onSave={(imageData: string) => handleSubmit(`Image: ${imageData}`)} 
                          onClear={handleClear}
                        />
                      </div>
                    </motion.div>
                  </TabsContent>
                )}
                {activeTab === 'voice' && (
                  <TabsContent value="voice" asChild forceMount>
                    <motion.div
                      key="voice"
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -32 }}
                      transition={{ duration: 0.35, type: 'spring' }}
                    >
                      <ProblemInput onSubmit={handleSubmit} />
                    </motion.div>
                  </TabsContent>
                )}
                {activeTab === 'latex' && (
                  <TabsContent value="latex" asChild forceMount>
                    <motion.div
                      key="latex"
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -32 }}
                      transition={{ duration: 0.35, type: 'spring' }}
                    >
                      <LatexInput onSave={(latex: string) => handleSubmit(latex)} onClear={handleClear} />
                    </motion.div>
                  </TabsContent>
                )}
                {activeTab === 'file' && (
                  <TabsContent value="file" asChild forceMount>
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -32 }}
                      transition={{ duration: 0.35, type: 'spring' }}
                    >
                      <Card className="bg-gradient-to-br from-slate-50/10 to-slate-100/10 dark:from-slate-800/40 dark:to-slate-900/60 shadow-2xl border border-violet-400/30 rounded-2xl">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <Upload className="h-12 w-12 mx-auto mb-4 text-violet-500 drop-shadow-[0_0_8px_#a855f7]" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Upload PDF, DOCX, or image files
                            </p>
                            <Input
                              type="file"
                              accept=".pdf,.docx,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setCurrentProblem({ 
                                  problem: `File: ${file.name}`, 
                                  type: 'file' as MathProblem['type'],
                                  fileType: file.type.includes('pdf') ? 'pdf' : 
                                           file.type.includes('docx') ? 'docx' : undefined
                                });
                              }}
                              id="file-upload"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg hover:shadow-[0_0_24px_#a855f7]"
                            >
                              Choose File
                            </Button>
                          </div>
                          {currentProblem.problem && currentProblem.problem.startsWith('File:') && (
                            <div className="mt-4 relative p-4 bg-slate-100/10 dark:bg-slate-800/40 rounded-lg border border-violet-400/30">
                              <p className="text-sm text-center pr-10">{currentProblem.problem}</p>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md"
                                onClick={() => {
                                  setCurrentProblem({ 
                                    problem: '', 
                                    type: 'file' as MathProblem['type'] 
                                  });
                                  setCurrentSolution(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </div>

        {/* Solution Section */}
        <div className="mt-8 w-full">
          <AnimatePresence>
            {currentSolution && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.35, type: 'spring' }}
                className="bg-white/10 dark:bg-slate-900/60 rounded-2xl shadow-xl border border-purple-400/20 p-6"
              >
                <MathOutput 
                  problem={currentProblem} 
                  solution={currentSolution} 
                  loading={loading} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between gap-4 w-full mt-6">
          <Button
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl rounded-2xl py-4 text-lg font-bold transition-all duration-200 active:scale-95 active:shadow-inner hover:shadow-[0_0_32px_#a855f7] focus:ring-4 focus:ring-purple-500/40"
            onClick={handleRefresh}
            disabled={!currentProblem.problem || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Solving...
              </div>
            ) : (
              "Extract & Solve"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!currentProblem.problem && !currentSolution && !imagePreview}
            className="flex items-center gap-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg rounded-2xl py-4 text-lg font-bold hover:shadow-[0_0_24px_#a855f7]"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSolver; 