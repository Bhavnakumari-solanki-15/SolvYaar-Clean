import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "../ui/sonner";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { solveMathProblem } from "../../lib/groq-api";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface StoryProblem {
  problem: string;
  solution: string;
  explanation: string;
  hints: string[];
  mathConcepts: string[];
}

export function QuickTools() {
  const { isAuthenticated } = useAuth();
  const [storyProblem, setStoryProblem] = useState<StoryProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [equationInput, setEquationInput] = useState("");
  const [equationResult, setEquationResult] = useState("");
  const [numberInput, setNumberInput] = useState("");
  const [conversionType, setConversionType] = useState("decimal");
  const [conversionResult, setConversionResult] = useState("");

  const generateStoryProblem = async () => {
    setIsLoading(true);
    setShowSolution(false);
    setShowHint(false);
    setCurrentHintIndex(0);
    setUserAnswer("");

    // New prompt for middle school level, only 'problem' and 'solution' fields
    const prompt = `Generate a real-world math story problem and its solution in JSON format. The problem should be appropriate for middle school students.\n\nRespond only with JSON in the following format:\n\n{\n  "problem": "A store sells pencils for $2 each. If Maya buys 4 pencils, how much does she pay?",\n  "solution": "Maya pays 4 x $2 = $8."\n}`;

    try {
      const result = await solveMathProblem({
        problem: prompt,
        type: "text"
      });

      if (!result?.solution) {
        throw new Error("No solution received");
      }

      // Try to find a JSON object in the response
      const jsonMatch = result.solution.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const cleanJson = jsonMatch[0]
        .replace(/\n/g, ' ')
        .replace(/\"/g, '"')
        .replace(/\\/g, '\\')
        .replace(/\s+/g, ' ')
        .trim();

      let parsedSolution;
      try {
        parsedSolution = JSON.parse(cleanJson);
      } catch (e) {
        throw new Error("Failed to parse JSON object");
      }

      // Fill in missing fields with defaults for robust handling
      const finalProblem = {
        problem: parsedSolution.problem || "(No problem provided)",
        solution: parsedSolution.solution || "(No solution provided)",
        explanation: parsedSolution.explanation || "",
        hints: Array.isArray(parsedSolution.hints) ? parsedSolution.hints : [],
        mathConcepts: Array.isArray(parsedSolution.mathConcepts) ? parsedSolution.mathConcepts : [],
      };

      setStoryProblem(finalProblem);
      return true;
    } catch (error) {
      console.error("Generation error:", error);
      // After max retries, use a fallback problem
      setStoryProblem({
        problem: "Sarah is shopping during a 30% off sale. She buys 3 shirts at $25 each and 2 pairs of pants at $40 each. What is her total after the discount?",
        solution: "$115.50",
        explanation: "1. Calculate cost of shirts: 3 × $25 = $75\n2. Calculate cost of pants: 2 × $40 = $80\n3. Subtotal before discount: $75 + $80 = $155\n4. Calculate 30% discount: $155 × 0.30 = $46.50\n5. Final total: $155 - $46.50 = $115.50",
        hints: [
          "First calculate the cost of all items at full price",
          "Add up all items to get the subtotal",
          "Calculate 30% of the subtotal for the discount",
          "Subtract the discount from the subtotal"
        ],
        mathConcepts: ["Multiplication", "Addition", "Percentages", "Subtraction"]
      });
      toast.info("Using a sample problem while we fix the generator.");
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const showNextHint = () => {
    if (!storyProblem || currentHintIndex >= storyProblem.hints.length - 1) return;
    setCurrentHintIndex(prev => prev + 1);
    setShowHint(true);
  };

  const checkAnswer = () => {
    if (!storyProblem || !userAnswer) return;
    
    // Clean up the answer and solution for comparison
    const cleanAnswer = userAnswer.trim().replace(/[^0-9.-]/g, '');
    const cleanSolution = storyProblem.solution.trim().replace(/[^0-9.-]/g, '');
    
    if (cleanAnswer === cleanSolution) {
      toast.success("Correct! Well done! 🎉");
      setShowSolution(true);
    } else {
      toast.error("Not quite right. Try using the hints! 💪");
    }
  };

  const handleEquation = () => {
    try {
      // Basic equation solving
      if (equationInput.includes("x^2")) {
        // Quadratic equation logic...
        const parts = equationInput.split("=");
        const left = parts[0].trim();
        const right = parts[1]?.trim() || "0";
        
        const a = left.match(/x\^2/) ? parseFloat(left.split("x^2")[0]) : 0;
        const b = left.match(/x(?!\^)/) ? parseFloat(left.split("x")[0]) : 0;
        const c = parseFloat(right);
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
          setEquationResult("No real solutions");
        } else {
          const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
          setEquationResult(`x = ${x1.toFixed(2)}, x = ${x2.toFixed(2)}`);
        }
      } else {
        // Linear equation logic...
        const parts = equationInput.split("=");
        const left = parts[0].trim();
        const right = parts[1]?.trim() || "0";
        
        const xCoeff = left.match(/x/) ? parseFloat(left.split("x")[0]) : 0;
        const constant = parseFloat(right);
        
        const solution = constant / xCoeff;
        setEquationResult(`x = ${solution.toFixed(2)}`);
      }
    } catch (error) {
      toast.error("Invalid equation format");
    }
  };

  const handleNumberConversion = () => {
    try {
      const num = parseInt(numberInput);
      if (isNaN(num)) {
        toast.error("Invalid number");
        return;
      }

      switch (conversionType) {
        case "decimal":
          setConversionResult(`Binary: ${num.toString(2)}\nHexadecimal: ${num.toString(16).toUpperCase()}`);
          break;
        case "binary":
          const decimal = parseInt(numberInput, 2);
          setConversionResult(`Decimal: ${decimal}\nHexadecimal: ${decimal.toString(16).toUpperCase()}`);
          break;
        case "hexadecimal":
          const dec = parseInt(numberInput, 16);
          setConversionResult(`Decimal: ${dec}\nBinary: ${dec.toString(2)}`);
          break;
      }
    } catch (error) {
      toast.error("Invalid number format");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-4">Sign in to use Quick Tools</h2>
        <a href="/login">
          <button className="px-4 py-2 bg-primary text-white rounded-md">Login</button>
        </a>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center mb-6">Story Problems</h2>
          
          {storyProblem ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-lg">{storyProblem.problem}</p>
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter your answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={checkAnswer} className="flex-1">
                    Check Answer
                  </Button>
                  {storyProblem.hints && storyProblem.hints.length > 0 && (
                    <Button onClick={showNextHint} variant="outline" className="flex-1">
                      {showHint ? "Next Hint" : "Get Hint"}
                    </Button>
                  )}
                </div>
              </div>

              {showHint && storyProblem.hints && storyProblem.hints.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Hint {currentHintIndex + 1}:</h3>
                  <p>{storyProblem.hints[currentHintIndex]}</p>
                </div>
              )}

              {showSolution && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Solution:</h3>
                  <p>{storyProblem.solution}</p>
                  {storyProblem.explanation && (
                    <>
                      <h3 className="font-semibold mt-4 mb-2">Explanation:</h3>
                      <p>{storyProblem.explanation}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Button
                onClick={generateStoryProblem}
                disabled={isLoading}
                size="lg"
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Story Problem
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 