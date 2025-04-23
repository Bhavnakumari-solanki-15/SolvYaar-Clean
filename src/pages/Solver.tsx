import { useState } from "react";
import MathInput from "../components/MathInput";
import MathOutput from "../components/MathOutput";
import { MathProblem, MathSolution } from "../lib/groq-api";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { 
  LogIn, Lightbulb, ScrollText, Sparkles, Brain, BookOpen,
  BookMarked, Calculator, BarChart3, Ruler, LineChart, 
  BookText, Sigma, Dices
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { useToast } from "../components/ui/use-toast";
import { solverService } from "../services/solverService";
import { MathToolsDialog } from "../components/math-tools/MathToolsDialog";

type ToolType = "unit-converter" | "graphing-tool" | "formula-sheet" | "topic-explorer" | "story-problem-generator" | "brain-booster";

const QuickAction = ({ icon: Icon, label, onClick, color = "purple" }: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
  color?: "purple" | "blue" | "green" | "orange"
}) => (
  <Button
    variant="ghost"
    className={`group flex flex-col items-center justify-center h-24 w-full bg-white/60 dark:bg-gray-800/40 
      hover:bg-${color}-50/80 dark:hover:bg-${color}-900/40 rounded-xl transition-all p-4 
      border border-${color}-200/50 dark:border-${color}-700/30 shadow-sm hover:shadow-md`}
    onClick={onClick}
  >
    <div className={`p-2 rounded-lg bg-${color}-100/80 dark:bg-${color}-900/80 
      group-hover:bg-${color}-200/80 dark:group-hover:bg-${color}-800/80 transition-colors mb-2`}>
      <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
    </div>
    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">{label}</span>
  </Button>
);

export default function Solver() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);

  const handleSubmit = async (mathProblem: MathProblem) => {
    setLoading(true);
    try {
      const result = await solverService.solveText(mathProblem.problem);
      
      if (!result.solution || result.error) {
        toast({
          title: "Error",
          description: result.error || "Failed to solve the problem",
          variant: "destructive",
        });
        return;
      }
      
      setProblem(mathProblem);
      setSolution(result.solution);
      
      toast({
        title: "Solution found!",
        description: "Your problem has been solved successfully.",
      });
    } catch (error) {
      console.error("Error solving problem:", error);
      toast({
        title: "Error",
        description: "Failed to solve the problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickInsert = (text: string) => {
    // Implementation for quick insert functionality
    console.log("Quick insert:", text);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            {/* Input Card */}
            <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-purple-300/50 
              dark:border-purple-500/20 shadow-xl mb-8">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Math Problem Solver</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Enter your math problem below and get step-by-step solutions
                  </p>
                  {!isAuthenticated && (
                    <Button variant="outline" asChild className="mt-2">
                      <Link to="/login" className="flex items-center space-x-2">
                        <LogIn className="h-4 w-4" />
                        <span>Sign in to save solutions</span>
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <QuickAction icon={Sigma} label="Sum/Series" onClick={() => quickInsert("\\sum")} />
                  <QuickAction icon={Ruler} label="Geometry" onClick={() => quickInsert("area=")} color="blue" />
                  <QuickAction icon={Calculator} label="Algebra" onClick={() => quickInsert("solve")} color="green" />
                  <QuickAction icon={LineChart} label="Calculus" onClick={() => quickInsert("\\frac{d}{dx}")} color="orange" />
                </div>

                <MathInput 
                  onSubmit={handleSubmit} 
                  isLoading={loading}
                  onClear={() => {
                    setSolution(null);
                    setProblem(null);
                  }}
                />
              </div>
            </Card>

            {/* Solution Output */}
            {(problem || loading) && (
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-purple-300/50 
                dark:border-purple-500/20 shadow-xl">
                <div className="p-6">
                  <MathOutput problem={problem} solution={solution} loading={loading} />
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Math Tools */}
            <Card className="bg-gradient-to-br from-white/90 to-purple-50/90 dark:from-gray-900/90 
              dark:to-purple-900/40 backdrop-blur-2xl border-purple-300/50 dark:border-purple-500/20 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-100/80 dark:bg-purple-900/50">
                  <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Math Tools</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Essential calculators & converters</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("unit-converter")}
                >
                  <Ruler className="h-4 w-4 mr-2" />
                  Unit Converter
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("graphing-tool")}
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Graphing Calculator
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("formula-sheet")}
                >
                  <BookText className="h-4 w-4 mr-2" />
                  Formula Sheet
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("topic-explorer")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Topic Explorer
                </Button>
              </div>
            </Card>

            {/* Brain Boosters */}
            <Card className="bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-gray-900/90 
              dark:to-blue-900/40 backdrop-blur-2xl border-blue-300/50 dark:border-blue-500/20 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-100/80 dark:bg-blue-900/50">
                  <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Brain Boosters</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Challenge yourself</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("brain-booster")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Math Puzzles
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("story-problem-generator")}
                >
                  <Dices className="h-4 w-4 mr-2" />
                  Problem Generator
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Math Tools Dialog */}
      {selectedTool && (
        <MathToolsDialog
          open={true}
          onOpenChange={() => setSelectedTool(null)}
          tool={selectedTool}
        />
      )}
    </div>
  );
}
