import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { toast } from "./ui/sonner";
import { Loader2 } from "lucide-react";
import { groq } from "../lib/groq-api";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface LatexInputProps {
  onSave: (expression: string) => void;
  onClear: () => void;
}

interface Solution {
  problemStatement: string;
  steps: {
    number: number;
    description: string;
    equation: string;
    explanation?: string;
  }[];
  finalAnswer: string;
}

const LatexInput: React.FC<LatexInputProps> = ({ onSave, onClear }) => {
  const [latexInput, setLatexInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);

  const templates = [
    { label: "Fraction", template: "\\frac{a}{b}" },
    { label: "Square Root", template: "\\sqrt{x}" },
    { label: "Integral", template: "\\int_{a}^{b} x dx" },
    { label: "Sum", template: "\\sum_{i=1}^{n} x_i" },
    { label: "Power", template: "x^{n}" },
    { label: "Matrix", template: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
    { label: "Limit", template: "\\lim_{x \\to \\infty} f(x)" },
    { label: "Derivative", template: "\\frac{d}{dx} f(x)" },
  ];

  const insertTemplate = (template: string) => {
    const textArea = document.querySelector('textarea');
    if (!textArea) return;

    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const before = latexInput.substring(0, start);
    const after = latexInput.substring(end);

    setLatexInput(before + template + after);
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(start + template.length, start + template.length);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLatexInput(e.target.value);
    setPreviewError(null);
  };

  const validateLatex = (latex: string): boolean => {
    try {
      <BlockMath math={latex} />;
      return true;
    } catch {
      setPreviewError("Invalid LaTeX syntax. Please check your input.");
      return false;
    }
  };

  const parseSolutionResponse = (response: string): Solution => {
    const stepRegex = /STEP_(\d+):\n(.+?)\nEQUATION_\1:\n(.+?)(?:\nEXPLANATION_\1:\n(.+?))?(?=\nSTEP_|\nFINAL_ANSWER:|\n?$)/gs;
    const finalAnswerRegex = /FINAL_ANSWER:\n(.+)/s;

    const steps: Solution["steps"] = [];
    let match;
    while ((match = stepRegex.exec(response)) !== null) {
      const [, number, description, equation, explanation] = match;
      steps.push({
        number: parseInt(number),
        description: description.trim(),
        equation: equation.trim(),
        explanation: explanation?.trim(),
      });
    }

    const finalMatch = finalAnswerRegex.exec(response);
    const finalAnswer = finalMatch ? finalMatch[1].trim() : "Could not parse final answer";

    return {
      problemStatement: latexInput,
      steps,
      finalAnswer,
    };
  };

  const handleSolve = async () => {
    if (!latexInput.trim()) {
      toast.error("Please enter a mathematical expression");
      return;
    }

    if (!validateLatex(latexInput)) return;

    try {
      setIsProcessing(true);
      toast.info("Processing your expression...");

      const response = await groq.recognizeMathFromText(`
        Solve this mathematical expression step by step.
        Make each step concise, clear, and easy to read.
        Use only necessary LaTeX, avoid extra environments or verbose text.
        ${latexInput}

        Format the response like this:
        PROBLEM_STATEMENT:
        [LaTeX problem]

        STEP_1:
        [short description]
        EQUATION_1:
        [LaTeX]

        STEP_2:
        [short description]
        EQUATION_2:
        [LaTeX]

        FINAL_ANSWER:
        [LaTeX]
      `);

      const parsedSolution = parseSolutionResponse(response);
      setSolution(parsedSolution);
      onSave(latexInput);
      toast.success("Problem solved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while solving. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setLatexInput("");
    setSolution(null);
    setPreviewError(null);
    onClear();
  };

  return (
    <div className="space-y-8">
      {/* Floating neumorphic LaTeX template buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-2">
        {templates.map((template, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => insertTemplate(template.template)}
            className="relative px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/60 shadow-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all duration-200 neumorph-btn hover:shadow-[0_0_24px_#a855f7] hover:bg-purple-100/60 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            style={{ boxShadow: '0 2px 12px 0 rgba(168,85,247,0.08)' }}
          >
            {template.label}
          </button>
        ))}
      </div>

      {/* Glassy textarea input card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-400/30 p-8 max-w-2xl mx-auto flex flex-col gap-4"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-base font-semibold text-purple-500" style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}>Enter LaTeX Expression:</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-primary"
            disabled={!latexInput && !solution}
          >
            Clear All
          </Button>
        </div>
        <textarea
          value={latexInput}
          onChange={handleInputChange}
          placeholder="Enter your LaTeX expression (e.g., \\frac{1}{2} or \\int x^2 dx)"
          className="min-h-[120px] w-full rounded-xl px-4 py-3 bg-white/30 dark:bg-slate-800/40 border border-purple-400/20 focus:ring-4 focus:ring-purple-500/40 shadow-inner text-lg glassy-caret transition-all duration-200 outline-none"
          style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif', caretColor: '#a855f7', fontSize: '1.2rem', boxShadow: '0 2px 24px 0 rgba(168,85,247,0.10)' }}
        />

        {/* Preview block as floating LaTeX card */}
        {latexInput && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="mt-2 mb-2 px-6 py-4 bg-gradient-to-br from-purple-200/40 to-blue-100/30 rounded-2xl border border-purple-400/30 shadow-lg flex flex-col items-center"
          >
            <span className="text-xs text-purple-400 mb-2 font-mono">Preview:</span>
            {previewError ? (
              <p className="text-destructive text-sm">{previewError}</p>
            ) : (
              <BlockMath math={latexInput} />
            )}
          </motion.div>
        )}

        {/* Solve button with 3D neon effect */}
        <Button
          onClick={handleSolve}
          disabled={isProcessing || !latexInput.trim()}
          className="w-full px-10 py-3 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl rounded-2xl transition-all duration-200 active:scale-95 active:shadow-inner hover:shadow-[0_0_32px_#a855f7] focus:ring-4 focus:ring-purple-500/40 neon-btn"
          style={{ boxShadow: '0 0 32px #a855f7, 0 2px 12px 0 rgba(168,85,247,0.10)' }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Solve"
          )}
        </Button>
      </motion.div>

      {/* Output Section */}
      <AnimatePresence>
        {solution && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="mt-8 space-y-8 max-w-3xl mx-auto"
          >
            {/* 🧩 Problem Statement */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="relative bg-gradient-to-br from-orange-300/10 to-yellow-100/10 backdrop-blur-xl rounded-3xl shadow-xl border-l-8 border-orange-400/80 overflow-visible mb-2"
            >
              <div className="absolute -left-2 top-6 w-2 h-20 bg-orange-400/80 rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="flex-1 p-8 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🧩</span>
                  <h3 className="text-lg font-bold tracking-tight">Problem Statement</h3>
                </div>
                <div className="text-base">
                  <BlockMath math={solution.problemStatement} />
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
                {solution.steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    className={`relative group flex items-start gap-3 p-3 rounded-xl bg-white/30 dark:bg-slate-800/30 border-l-4 shadow-md hover:shadow-[0_0_16px] transition-all cursor-pointer hover:bg-blue-400/10 ${['border-blue-300/60','border-purple-300/60','border-teal-300/60','border-pink-300/60','border-green-300/60','border-yellow-300/60','border-orange-300/60'][index % 7]}`}
                    style={{ fontSize: '1rem', minHeight: 'unset' }}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-base shadow group-hover:scale-110 transition-transform ${['bg-blue-300','bg-purple-300','bg-teal-300','bg-pink-300','bg-green-300','bg-yellow-300','bg-orange-300'][index % 7]}`}>{step.number}</span>
                    <div className="flex-1 text-base font-mono bg-slate-900/5 rounded px-2 py-1 z-10">
                      <ReactMarkdown>{step.description}</ReactMarkdown>
                      <div className="overflow-x-auto py-2 my-1 bg-white/40 rounded px-2">
                        <BlockMath math={step.equation} />
                      </div>
                      {step.explanation && (
                        <div className="mt-2 text-xs text-muted-foreground break-words whitespace-pre-wrap pl-2 border-l-2 border-muted">
                          <ReactMarkdown>{step.explanation}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ✅ Final Answer Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
              className="relative flex items-center justify-center mt-4"
            >
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">✅</span>
                  <h3 className="text-base font-bold tracking-tight">Final Answer</h3>
                </div>
                <div className="font-mono text-2xl font-extrabold text-white bg-gradient-to-br from-violet-400/80 to-green-300/80 shadow rounded-2xl px-6 py-4 border-2 border-violet-300/60 animate-glow-pulse speech-bubble">
                  <BlockMath math={`\\boxed{${solution.finalAnswer}}`} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LatexInput;
