import React, { useState, useEffect } from "react";
import { 
  Clock, 
  FileUp, 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Send, 
  Trophy, 
  Lightbulb, 
  ListChecks, 
  BarChart3,
  TimerReset,
  Plus,
  BookOpen,
  Info as InfoIcon,
  Gamepad2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { badgeService } from '@/services/badgeService';
import { BadgeCategory } from '@/types/badge.types';
import TransformTrekGame from "@/games/transform-trek/TransformTrekGame";
import NumberMazeGame from "@/games/number-maze/NumberMazeGame";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

// Types for our practice module
interface PracticeQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

interface PracticeSet {
  id: string;
  title: string;
  topic: string;
  questions: PracticeQuestion[];
  timeLimit: number; // in seconds
}

// Improved TopicSelection component with better styling and layout
const TopicSelection = ({ 
  onGenerateQuestions,
  onGameSelect 
}: { 
  onGenerateQuestions: (topic: string) => void;
  onGameSelect: (game: string) => void;
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const topics = [
    "Algebra", "Calculus", "Geometry", "Trigonometry", 
    "Statistics", "Probability", "Linear Algebra", "Number Theory",
    "Differential Equations", "Discrete Mathematics",
    "Custom Topic"
  ];

  const games = [
    {
      id: "transform-trek",
      name: "Transform Trek",
      description: "Master geometric transformations through an interactive journey",
      topic: "Geometry",
      icon: "🔄"
    },
    {
      id: "number-maze",
      name: "Number Maze",
      description: "Solve math problems to navigate through a maze",
      topic: "Arithmetic",
      icon: "🧩"
    }
  ];

  const handleGenerateQuestions = () => {
    if (!selectedTopic) {
      toast({
        title: "Selection required",
        description: "Please select a topic",
        variant: "destructive"
      });
      return;
    }

    if (isCustomTopic && !customTopic.trim()) {
      toast({
        title: "Custom topic required",
        description: "Please enter your custom topic",
        variant: "destructive"
      });
      return;
    }

    onGenerateQuestions(isCustomTopic ? customTopic : selectedTopic);
  };

  const handleTopicChange = (value: string) => {
    setSelectedTopic(value);
    setIsCustomTopic(value === "Custom Topic");
  };

  return (
    <Card className="w-full max-w-3xl mx-auto border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      <CardHeader className="space-y-4 pb-6 pt-8">
        <div className="flex items-center mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white mr-4 shadow-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-400 bg-clip-text text-transparent">
              Practice It — Learn, Solve & Level Up!
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Pick a topic or play interactive games to master mathematics!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-8">
        <Tabs defaultValue="topic" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800/50">
            <TabsTrigger value="topic" className="rounded-md text-sm py-2.5">
              <BookOpen className="h-4 w-4 mr-2" /> Choose a Topic
            </TabsTrigger>
            <TabsTrigger value="games" className="rounded-md text-sm py-2.5">
              <Gamepad2 className="h-4 w-4 mr-2" /> Interactive Games
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topic" className="space-y-6 pt-2">
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="topic" className="text-sm font-medium">Select a Math Topic</Label>
              <Select
                value={selectedTopic}
                onValueChange={handleTopicChange}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Choose a topic to practice" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isCustomTopic && (
                <div className="mt-2">
                  <Label htmlFor="customTopic" className="text-sm font-medium">Enter Your Custom Topic</Label>
                  <Input
                    id="customTopic"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g., Complex Analysis, Graph Theory, etc."
                    className="mt-1 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
            </div>
            
            <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 p-4 bg-indigo-50/50 dark:bg-indigo-900/10">
              <div className="flex items-start">
                <InfoIcon className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  After selecting a topic, our AI will generate a personalized set of questions to help you practice and improve your skills in that area of mathematics.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-6 pt-2">
            <div className="grid gap-4">
              {games.map((game) => (
                <Card key={game.id} className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors border border-indigo-100 dark:border-indigo-900/40 shadow-sm overflow-hidden" onClick={() => onGameSelect(game.id)}>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 text-white mr-4 shadow-sm">
                        <span className="text-xl">{game.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{game.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
                      </div>
                      </div>
                      <Button 
                        className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGameSelect(game.id);
                        }}
                      >
                        Play Game
                      </Button>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 p-4 bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex items-start">
                <InfoIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Interactive games provide a fun and engaging way to learn mathematical concepts through gameplay and visual interactions.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-end pb-8 px-8 pt-4">
        <Button 
          onClick={handleGenerateQuestions}
          disabled={!selectedTopic || (isCustomTopic && !customTopic.trim())}
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500 px-6 py-6 h-11 shadow-md hover:shadow-lg transition-all"
        >
          Generate Questions <Brain className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Step 2: Questions Display Component with improved styling
const QuestionsDisplay = ({
  practiceSet,
  userAnswers,
  setUserAnswers,
  currentQuestion,
  setCurrentQuestion,
  timer,
  onSubmit,
  showHints,
  setShowHints
}: {
  practiceSet: PracticeSet;
  userAnswers: (number | null)[];
  setUserAnswers: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  currentQuestion: number;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>;
  timer: number;
  onSubmit: () => void;
  showHints: boolean;
  setShowHints: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const question = practiceSet.questions[currentQuestion];
  const isLast = currentQuestion === practiceSet.questions.length - 1;
  const isFirst = currentQuestion === 0;
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [saveResults, setSaveResults] = useState(true);
  const [hintTimeLeft, setHintTimeLeft] = useState<number>(8);
  const [hintUsed, setHintUsed] = useState<boolean[]>(new Array(practiceSet.questions.length).fill(false));
  
  // Export the saveResults state to the parent component
  useEffect(() => {
    // Set the saveResults value in localStorage
    localStorage.setItem('saveResults', saveResults.toString());
  }, [saveResults]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setUserAnswers(newAnswers);
  };
  
  const handleNext = () => {
    if (!isLast) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const toggleHint = () => {
    if (!showHints && !hintUsed[currentQuestion]) {
      // Start the hint timer when showing a hint for the first time
      setHintTimeLeft(8);
      const newHintUsed = [...hintUsed];
      newHintUsed[currentQuestion] = true;
      setHintUsed(newHintUsed);
      setShowHints(true);
    } else {
      setShowHints(!showHints);
    }
  };

  const questionsCompleted = userAnswers.filter(answer => answer !== null).length;
  const completionPercentage = (questionsCompleted / practiceSet.questions.length) * 100;
  
  // Hint timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (showHints && hintTimeLeft > 0 && hintUsed[currentQuestion]) {
      interval = setInterval(() => {
        setHintTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (hintTimeLeft === 0 && showHints) {
      setShowHints(false);
      setHintTimeLeft(8); // Reset for next use
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showHints, hintTimeLeft, hintUsed, currentQuestion]);
  
  // Reset hint timer when changing questions
  useEffect(() => {
    if (hintUsed[currentQuestion]) {
      setHintTimeLeft(0); // Already used
    } else {
      setHintTimeLeft(8); // Fresh hint
    }
  }, [currentQuestion, hintUsed]);
  
  // Set auto-submit preference in the parent component
  useEffect(() => {
    const autoSubmitHandler = () => {
      if (autoSubmit && timer === 0) {
        onSubmit();
      }
    };
    
    if (timer === 0) {
      autoSubmitHandler();
    }
    
    return () => {};
  }, [timer, autoSubmit, onSubmit]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      <div className="lg:w-2/3">
        <Card className="mb-6 border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                🧪 Your Practice Set is Ready!
              </CardTitle>
              <Badge variant="outline" className="font-medium text-xs uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {question.topic} • {question.difficulty}
              </Badge>
            </div>
            <CardDescription className="text-sm mt-2">
              {practiceSet.title} - Question {currentQuestion + 1} of {practiceSet.questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6 md:p-8">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              <h3 className="font-semibold text-xl mb-3 text-indigo-900 dark:text-indigo-200">Question {currentQuestion + 1}:</h3>
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">{question.text}</p>
              
              {showHints && question.hint && (
                <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1.5">
                    <div className="flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      <span className="font-medium text-sm">Hint:</span>
                    </div>
                    {hintUsed[currentQuestion] && hintTimeLeft > 0 && (
                      <span className="text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                        {hintTimeLeft}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">{question.hint}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-medium">Select your answer:</Label>
              <RadioGroup value={userAnswers[currentQuestion]?.toString() || ""} onValueChange={(value) => handleAnswer(parseInt(value))} className="space-y-3 mt-2">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-200 dark:border-slate-700/50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} className="text-indigo-600 dark:text-indigo-400" />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-slate-700 dark:text-slate-300">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between py-6 px-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={isFirst}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={toggleHint}
                disabled={hintTimeLeft === 0 && !showHints && hintUsed[currentQuestion]}
                className={`border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 ${
                  hintUsed[currentQuestion] && !showHints && hintTimeLeft === 0 
                    ? "opacity-50 cursor-not-allowed" 
                    : ""
                }`}
              >
                <Lightbulb className="mr-2 h-4 w-4" /> 
                {showHints 
                  ? "Hide Hint" 
                  : hintUsed[currentQuestion] && hintTimeLeft === 0 
                    ? "Hint Used" 
                    : "Show Hint"
                }
              </Button>
              
              {isLast ? (
                <Button 
                  onClick={onSubmit}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500 shadow-md hover:shadow-lg transition-all px-5"
                  disabled={userAnswers.some(answer => answer === null)}
                >
                  Submit All <Send className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500 shadow-md hover:shadow-lg transition-all px-5"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="lg:w-1/3">
        <Card className="sticky top-24 border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5 text-indigo-500" />
              Timer & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="text-center p-6 bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-400">
                {formatTime(timer)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Time Remaining</p>
            </div>
            
            <div>
              <div className="flex justify-between mb-2 text-sm font-medium">
                <span className="text-slate-700 dark:text-slate-300">Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400">{questionsCompleted} of {practiceSet.questions.length}</span>
              </div>
              <Progress value={completionPercentage} className="h-2.5 bg-slate-100 dark:bg-slate-800" />
            </div>
            
            <div className="py-4">
              <div className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Question Navigator</div>
              <div className="grid grid-cols-5 gap-2">
                {practiceSet.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={userAnswers[index] !== null ? "default" : "outline"}
                    className={`h-11 w-full p-0 ${
                      currentQuestion === index ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                    } ${
                      userAnswers[index] !== null ? 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white border-0' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator className="bg-slate-100 dark:bg-slate-800" />
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center py-1.5">
                <Checkbox 
                  id="save-results" 
                  checked={saveResults}
                  onCheckedChange={(checked) => setSaveResults(!!checked)}
                  className="text-indigo-600 dark:text-indigo-500 border-slate-300 dark:border-slate-600"
                />
                <label htmlFor="save-results" className="ml-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  Save results to my history
                </label>
              </div>
              
              <div className="flex items-center py-1.5">
                <Checkbox 
                  id="auto-submit" 
                  checked={autoSubmit}
                  onCheckedChange={(checked) => setAutoSubmit(!!checked)}
                  className="text-indigo-600 dark:text-indigo-500 border-slate-300 dark:border-slate-600"
                />
                <label htmlFor="auto-submit" className="ml-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  Auto-submit when timer ends
                </label>
              </div>
            </div>
            
            <Button 
              onClick={onSubmit} 
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500 shadow-md hover:shadow-lg transition-all py-5 h-auto"
              disabled={userAnswers.some(answer => answer === null)}
            >
              Submit All Answers <Send className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Step 3: Results Summary Component
const ResultsSummary = ({
  practiceSet,
  userAnswers,
  timeTaken,
  onPracticeMore,
  practiceHistory,
  userBadges
}: {
  practiceSet: PracticeSet;
  userAnswers: (number | null)[];
  timeTaken: number;
  onPracticeMore: () => void;
  practiceHistory: any[];
  userBadges: any[];
}) => {
  const correctAnswers = userAnswers.reduce((count: number, answer, index) => {
    if (answer === null) return count;
    return count + (answer === practiceSet.questions[index].correctAnswer ? 1 : 0);
  }, 0);
  
  const accuracy = Math.round((correctAnswers / practiceSet.questions.length) * 100);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Identify strengths and weaknesses based on topics
  const topicResults: Record<string, { total: number, correct: number }> = {};
  
  practiceSet.questions.forEach((question, index) => {
    if (!topicResults[question.topic]) {
      topicResults[question.topic] = { total: 0, correct: 0 };
    }
    
    topicResults[question.topic].total += 1;
    if (userAnswers[index] === question.correctAnswer) {
      topicResults[question.topic].correct += 1;
    }
  });
  
  const strengths = Object.entries(topicResults)
    .filter(([_, stats]) => (stats.correct / stats.total) >= 0.7)
    .map(([topic]) => topic);
    
  const weaknesses = Object.entries(topicResults)
    .filter(([_, stats]) => (stats.correct / stats.total) < 0.5)
    .map(([topic]) => topic);

  // Calculate stars based on performance (1-5)
  const stars = Math.max(1, Math.min(5, Math.ceil(accuracy / 20)));
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900">
            <Trophy className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Your Practice Results</CardTitle>
        <CardDescription>
          {practiceSet.title} - {practiceSet.topic}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {correctAnswers}/{practiceSet.questions.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Score</p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {accuracy}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatTime(timeTaken)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Time Taken</p>
          </div>
        </div>
        
        <div className="flex justify-center py-2">
          {[...Array(5)].map((_, i) => (
            <Trophy 
              key={i} 
              className={`h-8 w-8 ${
                i < stars 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300 dark:text-gray-600'
              }`} 
            />
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h3 className="font-medium">Performance Breakdown:</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              <h4 className="font-medium">Strengths:</h4>
            </div>
            <div className="ml-7 flex flex-wrap gap-2">
              {strengths.length > 0 ? (
                strengths.map(topic => (
                  <Badge key={topic} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800">
                    {topic}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Keep practicing to discover your strengths!</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <ArrowRight className="text-amber-500 mr-2 h-5 w-5" />
              <h4 className="font-medium">Areas to Improve:</h4>
            </div>
            <div className="ml-7 flex flex-wrap gap-2">
              {weaknesses.length > 0 ? (
                weaknesses.map(topic => (
                  <Badge key={topic} className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800">
                    {topic}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Great job! No major weaknesses detected.</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4 pt-2">
          <h3 className="font-medium">Question Review:</h3>
          <div className="space-y-4">
            {practiceSet.questions.map((question, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  userAnswers[index] === question.correctAnswer
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Question {index + 1}</span>
                  {userAnswers[index] === question.correctAnswer ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Correct
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Incorrect
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm">{question.text}</p>
                <div className="mt-2 text-sm space-y-1">
                  <div className="flex items-start">
                    <span className="font-medium mr-2">Your answer:</span>
                    <span className={userAnswers[index] === question.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {userAnswers[index] !== null ? question.options[userAnswers[index]] : 'Not answered'}
                    </span>
                  </div>
                  {userAnswers[index] !== question.correctAnswer && (
                    <div className="flex items-start">
                      <span className="font-medium mr-2">Correct answer:</span>
                      <span className="text-green-600 dark:text-green-400">
                        {question.options[question.correctAnswer]}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start mt-1 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span className="font-medium mr-2">Explanation:</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {question.explanation}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4 pt-2">
        <Button 
          variant="outline"
          onClick={onPracticeMore}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Practice More
        </Button>
        <Button
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0 hover:from-indigo-600 hover:to-cyan-500"
          onClick={() => window.location.reload()}
        >
          <TimerReset className="mr-2 h-4 w-4" />
          Try New Set
        </Button>
      </CardFooter>
    </Card>
  );
};

// Mock data generator for development purposes
const generateMockPracticeSet = (topic: string, fromPdf: boolean = false): PracticeSet => {
  const difficulties = ['easy', 'medium', 'hard'] as const;
  
  // Generate questions based on the topic
  let questions: PracticeQuestion[] = [];
  
  if (topic === 'Algebra' || (fromPdf && Math.random() > 0.7)) {
    questions = [
      {
        id: 1,
        text: "Solve the quadratic equation: 2x² - 5x - 3 = 0",
        options: ["x = 3 or x = -0.5", "x = 3 or x = 0.5", "x = -3 or x = 0.5", "x = -3 or x = -0.5"],
        correctAnswer: 0,
        explanation: "Using the quadratic formula x = (-b ± √(b² - 4ac))/2a where a=2, b=-5, c=-3. We get x = (5 ± √(25 + 24))/4 = (5 ± √49)/4 = (5 ± 7)/4, which gives x = 3 or x = -0.5",
        topic: "Algebra",
        difficulty: "medium",
        hint: "Apply the quadratic formula: x = (-b ± √(b² - 4ac))/2a"
      },
      {
        id: 2,
        text: "If f(x) = 3x² - 4x + 2 and g(x) = 2x - 1, find (f ∘ g)(3)",
        options: ["47", "41", "35", "29"],
        correctAnswer: 0,
        explanation: "(f ∘ g)(x) = f(g(x)) = f(2x - 1) = 3(2x - 1)² - 4(2x - 1) + 2. For x = 3, g(3) = 2(3) - 1 = 5. Then f(5) = 3(5)² - 4(5) + 2 = 3(25) - 20 + 2 = 75 - 20 + 2 = 47.",
        topic: "Algebra",
        difficulty: "hard",
        hint: "First calculate g(3), then use the result as input for f(x)"
      },
      {
        id: 3,
        text: "Simplify the expression: (3x² - 6x) ÷ (x - 2)",
        options: ["3x, x ≠ 2", "3x - 6, x ≠ 2", "3x, x = 2", "3x + 6, x ≠ 2"],
        correctAnswer: 0,
        explanation: "Factoring the numerator: 3x² - 6x = 3x(x - 2). Then (3x² - 6x) ÷ (x - 2) = 3x(x - 2) ÷ (x - 2) = 3x, where x ≠ 2 (to avoid division by zero).",
        topic: "Algebra",
        difficulty: "medium",
        hint: "Try factoring the numerator to find a common factor with the denominator"
      }
    ];
  } else if (topic === 'Calculus' || (fromPdf && Math.random() > 0.5)) {
    questions = [
      {
        id: 1,
        text: "Find the derivative of f(x) = x³ sin(x)",
        options: ["3x² sin(x) + x³ cos(x)", "3x² sin(x) - x³ cos(x)", "x³ cos(x)", "3x² sin(x)"],
        correctAnswer: 0,
        explanation: "Using the product rule: f'(x) = (x³)' · sin(x) + x³ · (sin(x))' = 3x² · sin(x) + x³ · cos(x)",
        topic: "Calculus",
        difficulty: "medium",
        hint: "Apply the product rule: (u·v)' = u'·v + u·v'"
      },
      {
        id: 2,
        text: "Evaluate the indefinite integral: ∫(3x² + 4x - 2)dx",
        options: ["x³ + 2x² - 2x + C", "3x³ + 4x² - 2x + C", "x³ + 2x² - 2x", "3x³/3 + 4x²/2 - 2x + C"],
        correctAnswer: 0,
        explanation: "Integrate term by term: ∫(3x² + 4x - 2)dx = 3∫x²dx + 4∫xdx - 2∫dx = 3(x³/3) + 4(x²/2) - 2x + C = x³ + 2x² - 2x + C",
        topic: "Calculus",
        difficulty: "easy",
        hint: "Integrate each term separately and remember to increase the exponent by 1 and divide by the new exponent"
      },
      {
        id: 3,
        text: "Find the limit: lim(x→0) (sin(3x)/x)",
        options: ["3", "1", "0", "∞"],
        correctAnswer: 0,
        explanation: "Using the limit rule lim(x→0) (sin(ax)/x) = a, we get lim(x→0) (sin(3x)/x) = 3",
        topic: "Calculus",
        difficulty: "medium",
        hint: "Remember that lim(x→0) (sin(x)/x) = 1 and try using a substitution"
      },
      {
        id: 4,
        text: "Find the area under the curve f(x) = 4x - x² from x = 0 to x = 4",
        options: ["16/3", "8", "32/3", "16"],
        correctAnswer: 2,
        explanation: "Area = ∫₀⁴ (4x - x²)dx = [2x² - x³/3]₀⁴ = (2(16) - 64/3) - 0 = 32 - 64/3 = 96/3 - 64/3 = 32/3",
        topic: "Calculus",
        difficulty: "hard",
        hint: "Calculate the definite integral of f(x) from x = 0 to x = 4"
      }
    ];
  } else if (topic === 'Geometry' || (fromPdf && Math.random() > 0.6)) {
    questions = [
      {
        id: 1,
        text: "In a triangle with sides a, b, and c, if a = 8, b = 15, what is the value of c for the triangle to be right-angled?",
        options: ["17", "16", "15", "9"],
        correctAnswer: 0,
        explanation: "Using the Pythagorean theorem, in a right-angled triangle: a² + b² = c². So c = √(a² + b²) = √(8² + 15²) = √(64 + 225) = √289 = 17",
        topic: "Geometry",
        difficulty: "medium",
        hint: "Apply the Pythagorean theorem: a² + b² = c² in a right-angled triangle"
      },
      {
        id: 2,
        text: "What is the area of a regular hexagon with side length 6 units?",
        options: ["54√3 square units", "36√3 square units", "108 square units", "72 square units"],
        correctAnswer: 0,
        explanation: "For a regular hexagon with side length s, the area is (3√3/2)s². With s = 6, the area = (3√3/2)(6)² = (3√3/2)(36) = 54√3 square units.",
        topic: "Geometry",
        difficulty: "hard",
        hint: "The area of a regular hexagon with side length s is (3√3/2)s²"
      },
      {
        id: 3,
        text: "A sector of a circle has a central angle of 60° and a radius of 8 cm. Find its area.",
        options: ["16π/3 cm²", "32π/3 cm²", "8π/3 cm²", "4π cm²"],
        correctAnswer: 0,
        explanation: "The area of a sector = (θ/360°) × πr², where θ is the central angle. So area = (60/360) × π × 8² = (1/6) × π × 64 = 64π/6 = 32π/3 cm².",
        topic: "Geometry",
        difficulty: "medium",
        hint: "Use the formula: Area of sector = (θ/360°) × πr² where θ is in degrees"
      }
    ];
  } else if (topic === 'Trigonometry') {
    questions = [
      {
        id: 1,
        text: "If sin(θ) = 3/5 and θ is in the first quadrant, find cos(θ)",
        options: ["4/5", "3/4", "5/3", "5/4"],
        correctAnswer: 0,
        explanation: "Using the Pythagorean identity: sin²(θ) + cos²(θ) = 1. So cos²(θ) = 1 - sin²(θ) = 1 - (3/5)² = 1 - 9/25 = 16/25. Since θ is in the first quadrant, cos(θ) is positive, so cos(θ) = 4/5.",
        topic: "Trigonometry",
        difficulty: "medium",
        hint: "Use the Pythagorean identity: sin²(θ) + cos²(θ) = 1"
      },
      {
        id: 2,
        text: "Simplify the expression: sin(2x) · cos(x) - cos(2x) · sin(x)",
        options: ["0", "sin(x)", "sin(3x)", "-sin(3x)"],
        correctAnswer: 2,
        explanation: "Using the identity sin(A)cos(B) - cos(A)sin(B) = sin(A-B): sin(2x)cos(x) - cos(2x)sin(x) = sin(2x - (-x)) = sin(3x)",
        topic: "Trigonometry",
        difficulty: "hard",
        hint: "Try using the identity: sin(A)cos(B) - cos(A)sin(B) = sin(A-B)"
      },
      {
        id: 3,
        text: "Find the value of tan(π/3) + cot(π/6)",
        options: ["√3 + √3", "2√3", "√3", "3"],
        correctAnswer: 1,
        explanation: "tan(π/3) = √3 and cot(π/6) = cot(π/6) = 1/tan(π/6) = 1/(1/√3) = √3. So tan(π/3) + cot(π/6) = √3 + √3 = 2√3",
        topic: "Trigonometry",
        difficulty: "medium",
        hint: "Remember that cot(θ) = 1/tan(θ) and use the values of standard angles"
      }
    ];
  } else if (topic === 'Statistics' || topic === 'Probability') {
    questions = [
      {
        id: 1,
        text: "The heights of students in a class follow a normal distribution with mean 165 cm and standard deviation 8 cm. Approximately what percentage of students are taller than 173 cm?",
        options: ["16%", "34%", "50%", "68%"],
        correctAnswer: 0,
        explanation: "Using the empirical rule, 173 cm is 1 standard deviation above the mean (165 + 8 = 173). In a normal distribution, approximately 68% of data falls within 1 standard deviation of the mean, so 34% is above the mean, and 16% is more than 1 standard deviation above the mean.",
        topic: "Statistics",
        difficulty: "medium",
        hint: "Calculate how many standard deviations 173 cm is from the mean, then use the empirical rule"
      },
      {
        id: 2,
        text: "Three fair coins are tossed. What is the probability of getting at least two heads?",
        options: ["1/2", "3/8", "4/8", "5/8"],
        correctAnswer: 0,
        explanation: "When tossing 3 coins, the possible outcomes for heads are: 0, 1, 2, or 3. P(at least 2 heads) = P(2 heads) + P(3 heads) = C(3,2)·(1/2)²·(1/2) + C(3,3)·(1/2)³·(1/2)⁰ = 3·(1/2)³ + 1·(1/2)³ = 4·(1/2)³ = 4/8 = 1/2",
        topic: "Probability",
        difficulty: "medium",
        hint: "Count the number of ways to get exactly 2 heads and exactly 3 heads out of 3 tosses"
      },
      {
        id: 3,
        text: "A bag contains 5 red, 3 blue, and 7 green marbles. If two marbles are drawn randomly without replacement, what is the probability both are green?",
        options: ["7/30", "7/15", "49/225", "21/70"],
        correctAnswer: 0,
        explanation: "The probability of drawing a green marble first is 7/15 (7 green out of 15 total). The probability of drawing a green marble second is 6/14 (6 green remaining out of 14 total). So the probability of both events occurring is (7/15) × (6/14) = 42/210 = 7/35.",
        topic: "Probability",
        difficulty: "hard",
        hint: "Multiply the probability of drawing a green marble first by the probability of drawing a green marble second"
      }
    ];
  } else if (topic === 'Number Theory') {
    questions = [
      {
        id: 1,
        text: "Find the remainder when 3^17 is divided by 7",
        options: ["1", "2", "3", "4"],
        correctAnswer: 0,
        explanation: "Using Fermat's Little Theorem, since 7 is prime, 3^6 ≡ 3^0 ≡ 1 (mod 7). So 3^17 = 3^(6·2+5) = (3^6)^2 · 3^5 ≡ 1^2 · 3^5 ≡ 3^5 (mod 7). Then 3^5 = 3^4 · 3 = 81 · 3 = 243 ≡ 5 · 3 ≡ 15 ≡ 1 (mod 7).",
        topic: "Number Theory",
        difficulty: "hard",
        hint: "Try finding a pattern in the remainders of powers of 3 when divided by 7"
      },
      {
        id: 2,
        text: "How many positive integers less than 100 are relatively prime to 30?",
        options: ["40", "42", "60", "58"],
        correctAnswer: 0,
        explanation: "The positive integers less than 100 that are relatively prime to 30 are those that don't share any prime factors with 30. Since 30 = 2 × 3 × 5, we need to exclude multiples of 2, 3, and 5. Using the principle of inclusion-exclusion: total = 99 - multiples of 2, 3, or 5. This is 99 - (⌊99/2⌋ + ⌊99/3⌋ + ⌊99/5⌋ - ⌊99/6⌋ - ⌊99/10⌋ - ⌊99/15⌋ + ⌊99/30⌋) = 99 - (49 + 33 + 19 - 16 - 9 - 6 + 3) = 99 - 73 = 26.",
        topic: "Number Theory",
        difficulty: "hard",
        hint: "Use Euler's totient function and the principle of inclusion-exclusion"
      }
    ];
  } else if (topic === 'Linear Algebra') {
    questions = [
      {
        id: 1,
        text: "Find the determinant of the matrix [[3, 1], [5, 2]]",
        options: ["1", "6", "-1", "3"],
        correctAnswer: 0,
        explanation: "For a 2×2 matrix [[a, b], [c, d]], the determinant is ad - bc. So for [[3, 1], [5, 2]], the determinant is 3·2 - 1·5 = 6 - 5 = 1.",
        topic: "Linear Algebra",
        difficulty: "easy",
        hint: "For a 2×2 matrix, the determinant is ad - bc"
      },
      {
        id: 2,
        text: "Find the eigenvalues of the matrix [[2, 1], [1, 2]]",
        options: ["3 and 1", "2 and 2", "4 and 0", "3 and -1"],
        correctAnswer: 0,
        explanation: "To find eigenvalues, solve det(A - λI) = 0. For this matrix, we get det([[2-λ, 1], [1, 2-λ]]) = (2-λ)² - 1 = 4 - 4λ + λ² - 1 = λ² - 4λ + 3 = 0. Factoring: (λ - 3)(λ - 1) = 0, so λ = 3 or λ = 1.",
        topic: "Linear Algebra",
        difficulty: "medium",
        hint: "Find values of λ that satisfy det(A - λI) = 0"
      }
    ];
  } else {
    // Default for any other topic
    const randomTopics = ['Arithmetic', 'Discrete Mathematics', 'Set Theory'];
    const selectedTopic = topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];
    
    questions = [
      {
        id: 1,
        text: `Find the sum of the arithmetic sequence 3, 7, 11, 15, ..., 99`,
        options: ["1275", "1225", "1250", "1300"],
        correctAnswer: 0,
        explanation: "This is an arithmetic sequence with first term a = 3 and common difference d = 4. The last term 99 is given by a + (n-1)d, so 3 + (n-1)4 = 99. Solving for n: 3 + 4n - 4 = 99, so 4n = 100, n = 25. Now the sum is S = n(a + l)/2 where l is the last term. So S = 25(3 + 99)/2 = 25 · 102/2 = 25 · 51 = 1275.",
        topic: selectedTopic,
        difficulty: "medium",
        hint: "Use the formula for the sum of an arithmetic sequence: S = n(a + l)/2, where n is the number of terms"
      },
      {
        id: 2,
        text: `If 5 people can complete a project in 12 days, how many days would it take 8 people to complete the same project, assuming all people work at the same rate?`,
        options: ["7.5 days", "8 days", "9 days", "10 days"],
        correctAnswer: 0,
        explanation: "Let's call the total amount of work W. If 5 people complete W in 12 days, then each person completes W/(5·12) per day. So 8 people can complete 8 · W/(5·12) per day, which means they complete the whole project in W / (8 · W/(5·12)) = 5·12/8 = 60/8 = 7.5 days.",
        topic: selectedTopic,
        difficulty: "medium",
        hint: "Use the inverse proportion: if more people work, it takes less time"
      }
    ];
  }
  
  // Add more random questions to get to 10 total
  while (questions.length < 10) {
    let newQuestion: PracticeQuestion;
    const randomDifficulty = difficulties[Math.floor(Math.random() * 3)];
    
    switch (Math.floor(Math.random() * 5)) {
      case 0: // Algebra
        newQuestion = {
          id: questions.length + 1,
          text: "Solve for x: log₂(x + 3) = 4",
          options: ["x = 13", "x = 16", "x = 19", "x = 11"],
          correctAnswer: 0,
          explanation: "If log₂(x + 3) = 4, then 2⁴ = x + 3, so x + 3 = 16, thus x = 13.",
          topic: fromPdf ? "Algebra" : topic,
          difficulty: randomDifficulty,
          hint: "If log_a(b) = c, then a^c = b"
        };
        break;
      case 1: // Calculus
        newQuestion = {
          id: questions.length + 1,
          text: "Find the derivative of f(x) = e^x · ln(x)",
          options: ["e^x · ln(x) + e^x/x", "e^x · ln(x) - e^x/x", "e^x/x", "e^x · (1 + ln(x))"],
          correctAnswer: 3,
          explanation: "Using the product rule: f'(x) = (e^x)' · ln(x) + e^x · (ln(x))' = e^x · ln(x) + e^x · (1/x) = e^x · (ln(x) + 1/x) = e^x · (1 + ln(x))",
          topic: fromPdf ? "Calculus" : topic,
          difficulty: randomDifficulty,
          hint: "Apply the product rule: (u·v)' = u'·v + u·v'"
        };
        break;
      case 2: // Geometry
        newQuestion = {
          id: questions.length + 1,
          text: "The volume of a sphere is 36π cubic units. Find its radius.",
          options: ["3 units", "4 units", "6 units", "9 units"],
          correctAnswer: 0,
          explanation: "The volume of a sphere is V = (4/3)πr³. So 36π = (4/3)πr³, thus r³ = 36 · 3/4 = 27. Therefore, r = 3 units.",
          topic: fromPdf ? "Geometry" : topic,
          difficulty: randomDifficulty,
          hint: "The formula for the volume of a sphere is V = (4/3)πr³"
        };
        break;
      case 3: // Trigonometry
        newQuestion = {
          id: questions.length + 1,
          text: "What is the value of sin(π/4) · cos(π/4)?",
          options: ["1/4", "1/2", "√2/4", "√2/2"],
          correctAnswer: 1,
          explanation: "Using the double angle formula: sin(2θ) = 2sin(θ)cos(θ). With θ = π/4, we get sin(π/2) = 2sin(π/4)cos(π/4). Since sin(π/2) = 1, we have 1 = 2sin(π/4)cos(π/4), so sin(π/4)cos(π/4) = 1/2.",
          topic: fromPdf ? "Trigonometry" : topic,
          difficulty: randomDifficulty,
          hint: "Try using the double angle formula sin(2θ) = 2sin(θ)cos(θ)"
        };
        break;
      case 4: // Statistics
        newQuestion = {
          id: questions.length + 1,
          text: "The mean of 5 numbers is 12. If one number is removed, the mean of the remaining numbers is 10. What is the removed number?",
          options: ["20", "22", "18", "24"],
          correctAnswer: 0,
          explanation: "Let's call the sum of all 5 numbers S. Then S/5 = 12, so S = 60. If one number x is removed, the new mean is 10, so (S - x)/4 = 10, thus S - x = 40. Therefore, x = S - 40 = 60 - 40 = 20.",
          topic: fromPdf ? "Statistics" : topic,
          difficulty: randomDifficulty,
          hint: "Find the sum of all numbers, then use the new mean to determine the removed number"
        };
        break;
    }
    
    questions.push(newQuestion!);
  }
  
  return {
    id: `practice-${Date.now()}`,
    title: fromPdf 
      ? "Practice Set from Your Document" 
      : `${topic} Practice Challenge`,
    topic: topic,
    questions: questions,
    timeLimit: 600 // 10 minutes
  };
};

// Loader component
const Loader = (props: React.ComponentProps<typeof Clock>) => {
  return <Clock {...props} />;
};

// Info component
const Info = (props: React.ComponentProps<typeof InfoIcon>) => {
  return <InfoIcon {...props} />;
};

const PracticeIt = () => {
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [timeTaken, setTimeTaken] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [gameState, setGameState] = useState<'selection' | 'practice' | 'results'>('selection');
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [saveResults, setSaveResults] = useState(true);
  
  // Handle generating questions
  const handleGenerateQuestions = async (topic: string) => {
    setIsGenerating(true);
    try {
      // Get the Groq API key from environment variables
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!GROQ_API_KEY) {
        throw new Error("Groq API key is missing. Please check your environment variables.");
      }
      
      // Default number of questions (5-8 questions)
      const questionCount = Math.floor(Math.random() * 4) + 5;
      
      // Generate a prompt for Groq API to create math questions
      const prompt = `Generate ${questionCount} multiple-choice ${topic} math questions. 
      Each question should include:
      1. A clear problem statement
      2. Four possible answers (labeled as options)
      3. The index of the correct answer (0-based)
      4. A detailed explanation of the solution
      5. A helpful hint
      6. The difficulty level (easy, medium, or hard)
      
      Return the results as a JSON array with this structure:
      [
        {
          "text": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation of why Option A is correct",
          "topic": "${topic}",
          "difficulty": "medium",
          "hint": "A helpful hint without giving away the answer"
        }
      ]`;
      
      // Call Groq API for question generation
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: "You are a mathematics professor AI assistant that specializes in creating educational content. Generate accurate, clear, and appropriately challenging math questions."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Groq API Error:', errorData);
        throw new Error(errorData.message || 'Failed to generate questions');
      }

      const responseData = await response.json();
      const generatedQuestions = JSON.parse(responseData.choices[0].message.content).questions;
      
      if (!generatedQuestions || !Array.isArray(generatedQuestions)) {
        console.error('Invalid Groq API response:', responseData);
        throw new Error('Invalid response format from Groq API');
      }

      // Set timer based on number of questions (3-5 minutes)
      const timeLimit = Math.min(Math.max(generatedQuestions.length * 30, 180), 300);

      // Transform the API response into our PracticeSet format
      const newPracticeSet: PracticeSet = {
        id: crypto.randomUUID(),
        title: `${topic} Practice Set`,
        topic: topic,
        questions: generatedQuestions.map((q: any, idx: number) => ({
          id: idx + 1,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: topic,
          difficulty: q.difficulty || 'medium',
          hint: q.hint || "Think about the fundamental concepts related to this problem."
        })),
        timeLimit: timeLimit // Dynamic timer based on number of questions
      };

      setPracticeSet(newPracticeSet);
      setUserAnswers(new Array(newPracticeSet.questions.length).fill(null));
      setCurrentQuestion(0);
      setShowResults(false);
      setTimeTaken(0);
      setTimer(timeLimit);
      setGameState('practice');
      
      // Save starting time and questions to local storage for recovery
      localStorage.setItem('currentPracticeSet', JSON.stringify({
        practiceSet: newPracticeSet,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions with Groq API. Falling back to mock questions.",
        variant: "destructive"
      });
      
      // Fallback to mock questions if API fails
      const mockSet = generateMockPracticeSet(topic);
      setPracticeSet(mockSet);
      setUserAnswers(new Array(mockSet.questions.length).fill(null));
      setCurrentQuestion(0);
      setShowResults(false);
      setTimeTaken(0);
      setTimer(mockSet.timeLimit);
      setGameState('practice');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Timer effect
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (practiceSet && !showResults && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          setTimeTaken((prevTime) => prevTime + 1);
          return prev - 1;
        });
      }, 1000);
    } else if (timer === 0 && !showResults) {
      // Auto-submit when timer reaches zero
      handleSubmit();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [practiceSet, timer, showResults]);
  
  // Handle submission
  const handleSubmit = async () => {
    if (!practiceSet) return;

    const timeTaken = practiceSet.timeLimit - timer;
    setShowResults(true);

    // Calculate score
    const score = userAnswers.reduce((acc: number, answer, index) => {
      if (answer === null) return acc;
      return acc + (answer === practiceSet.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    const percentage = (score / practiceSet.questions.length) * 100;

    // Add to practice history
    const newHistoryItem = {
      id: `${Date.now()}`,
      topic: practiceSet.topic,
      score: percentage,
      timestamp: Date.now(),
      timeSpent: timeTaken
    };
    
    setPracticeHistory(prev => [newHistoryItem, ...prev]);
    
    // Save to Supabase if user wants to save results and user is authenticated
    if (saveResults && user?.id) {
      try {
        // Create entry in practice_sessions table
        const { data: sessionData, error: sessionError } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            topic: practiceSet.topic,
            score: percentage,
            questions_count: practiceSet.questions.length,
            correct_answers: score,
            time_spent: timeTaken,
            difficulty: getMostCommonDifficulty(practiceSet.questions),
            completed_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('Error saving practice session:', sessionError);
          throw sessionError;
        }

        // Save individual answers
        if (sessionData?.id) {
          const practiceAnswers = practiceSet.questions.map((question, index) => ({
            practice_session_id: sessionData.id,
            question_text: question.text,
            selected_option: userAnswers[index] !== null ? question.options[userAnswers[index]] : null,
            correct_option: question.options[question.correctAnswer],
            is_correct: userAnswers[index] === question.correctAnswer
          }));

          const { error: answersError } = await supabase
            .from('practice_answers')
            .insert(practiceAnswers);

          if (answersError) {
            console.error('Error saving practice answers:', answersError);
            // Continue execution even if answers fail to save
          }
        }

        toast({
          title: "Results Saved!",
          description: "Your practice results have been saved to your profile."
        });
      } catch (error) {
        console.error('Error saving practice session:', error);
        toast({
          title: "Save Error",
          description: "We couldn't save your results to the database, but they're available in this session.",
          variant: "destructive"
        });
      }
    }
    
    // Check if user earned a badge
    if (percentage >= 60 && user?.id) {
      const badgeLevel = Math.floor(percentage / 20); // Level 1-5 based on score
      
      try {
        // Award badge to the user using badgeService
        // Use the topic from practiceSet to determine the appropriate category
        const topicToCategoryMap: Record<string, BadgeCategory> = {
          'Algebra': 'algebra',
          'Geometry': 'geometry',
          'Trigonometry': 'trigonometry',
          'Calculus': 'calculus',
          'Statistics': 'statistics',
          'Arithmetic': 'arithmetic',
          'Linear Algebra': 'linear_algebra',
          'Number Theory': 'number_theory',
          'Discrete Mathematics': 'discrete_math',
          'Set Theory': 'set_theory'
        };
        
        // Default to 'algebra' if no mapping exists
        const badgeCategory: BadgeCategory = 
          topicToCategoryMap[practiceSet.topic] || 'algebra';
          
        await badgeService.awardBadge(user.id, badgeCategory);
        
        const newBadge = {
          id: `${Date.now()}`,
          name: `${practiceSet.topic} Expert`,
          level: badgeLevel,
          topic: practiceSet.topic,
          timestamp: Date.now()
        };
        
        setUserBadges(prev => [newBadge, ...prev]);
        
        toast({
          title: "Achievement Unlocked!",
          description: `You've earned a new badge for ${practiceSet.topic}!`
        });
      } catch (error) {
        console.error('Error awarding badge:', error);
      }
    }
    
    toast({
      title: "Practice Complete!",
      description: `You scored ${percentage.toFixed(1)}% on this practice set.`
    });

    // Clear any stored practice data from localStorage
    localStorage.removeItem('currentPracticeSet');
  };
  
  // Helper function to get the most common difficulty level from questions
  const getMostCommonDifficulty = (questions: PracticeQuestion[]): string => {
    const difficultyCount: Record<string, number> = {};
    
    questions.forEach(question => {
      const difficulty = question.difficulty || 'medium';
      difficultyCount[difficulty] = (difficultyCount[difficulty] || 0) + 1;
    });
    
    let mostCommon = 'medium';
    let highestCount = 0;
    
    Object.entries(difficultyCount).forEach(([difficulty, count]) => {
      if (count > highestCount) {
        mostCommon = difficulty;
        highestCount = count;
      }
    });
    
    return mostCommon;
  };
  
  // Reset the practice session
  const handlePracticeMore = () => {
    setPracticeSet(null);
    setUserAnswers([]);
    setCurrentQuestion(0);
    setTimer(600);
    setTimeTaken(0);
    setShowResults(false);
    setShowHints(false);
  };

  const handleGameSelect = (gameId: string) => {
    // Clear any existing practice set
    setPracticeSet(null);
    setSelectedGame(gameId);
    
    // Reset other practice-related state
    setUserAnswers([]);
    setCurrentQuestion(0);
    setShowResults(false);
  };

  if (selectedGame === 'transform-trek') {
    return <TransformTrekGame />;
  } else if (selectedGame === 'number-maze') {
    return <NumberMazeGame />;
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-200 animate-pulse"></div>
              <Brain className="relative h-16 w-16 text-indigo-500 animate-bounce" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-center">Generating Your Practice Set...</h2>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              Our AI is crafting personalized questions based on your selection. This might take a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-16 px-4">
      <div className="container mx-auto relative z-10">
        {!practiceSet ? (
          <TopicSelection 
            onGenerateQuestions={handleGenerateQuestions} 
            onGameSelect={handleGameSelect}
          />
        ) : showResults ? (
          <ResultsSummary
            practiceSet={practiceSet}
            userAnswers={userAnswers}
            timeTaken={timeTaken}
            onPracticeMore={handlePracticeMore}
            practiceHistory={practiceHistory}
            userBadges={userBadges}
          />
        ) : (
          <QuestionsDisplay
            practiceSet={practiceSet}
            userAnswers={userAnswers}
            setUserAnswers={setUserAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            timer={timer}
            onSubmit={handleSubmit}
            showHints={showHints}
            setShowHints={setShowHints}
          />
        )}
      </div>

      {/* Add decorative elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-cyan-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/5 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Add animation keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0% { transform: scale(1); }
            33% { transform: scale(1.1); }
            66% { transform: scale(0.9); }
            100% { transform: scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `
      }} />
    </div>
  );
};

export default PracticeIt;
