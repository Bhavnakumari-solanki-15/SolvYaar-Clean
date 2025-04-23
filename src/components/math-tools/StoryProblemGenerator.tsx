import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { RefreshCw, ThumbsUp, ThumbsDown, Lightbulb, Plus, X, Sparkles, Brain, Target, Book, ArrowRight, Trophy } from "lucide-react";
import { toast } from "../ui/sonner";
import { getMathCompletion } from "@/lib/groq";
import { FormattedMath } from "../FormattedMath";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/badge";
import { Loader2 } from "lucide-react";

interface Problem {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  timeToSolve?: number;
  currentHint?: string;
}

export function StoryProblemGenerator() {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswerFound, setCorrectAnswerFound] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [showCustomTopicDialog, setShowCustomTopicDialog] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [autoShowHint, setAutoShowHint] = useState(false);
  const [hintTimer, setHintTimer] = useState<NodeJS.Timeout | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fastestSolves, setFastestSolves] = useState<{ problem: string; time: number }[]>([]);
  const [solveStartTime, setSolveStartTime] = useState<number | null>(null);

  const topics = [
    { id: 'general', name: 'General Math' },
    { id: 'algebra', name: 'Algebra' },
    { id: 'geometry', name: 'Geometry' },
    { id: 'statistics', name: 'Statistics' },
    { id: 'probability', name: 'Probability' },
    { id: 'finance', name: 'Financial Math' },
    { id: 'physics', name: 'Physics Word Problems' },
    { id: 'custom', name: 'Custom Topic' },
  ];

  // Function to shuffle array
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getQuestionByDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return {
          arithmetic: [
            "If you have 5 apples and buy 3 more, how many apples do you have?",
            "There are 12 cookies, and you share them equally between 3 friends. How many cookies does each friend get?",
            "A pencil costs $2. How much do 4 pencils cost?"
          ],
          geometry: [
            "What is the perimeter of a square with sides of 4 inches?",
            "If a rectangle has length 5 cm and width 3 cm, what is its area?",
            "How many sides does a triangle have?"
          ],
          general: [
            "If you save $5 each week, how much money will you save in 4 weeks?",
            "A class has 15 boys and 12 girls. How many students are in the class?",
            "You have a 20-minute recess and spend 8 minutes playing. How many minutes are left?"
          ]
        };
      case 'medium':
        return {
          arithmetic: [
            "If you spend 1/3 of your $24 allowance on snacks and 1/4 on a book, how much money do you have left?",
            "A store offers a 25% discount on a $40 shirt. What is the final price?",
            "If 3/4 of the class of 32 students got an A, how many students got an A?"
          ],
          geometry: [
            "Find the area of a triangle with base 8 cm and height 6 cm.",
            "What is the volume of a rectangular box with length 4m, width 3m, and height 2m?",
            "If a circle has radius 5 cm, what is its circumference? (Use π = 3.14)"
          ],
          general: [
            "A train travels at 60 miles per hour. How far will it travel in 2.5 hours?",
            "If 3/5 of the 45 students in a class are girls, how many boys are there?",
            "A recipe needs 2 1/4 cups of flour. If you want to make 1.5 times the recipe, how much flour do you need?"
          ]
        };
      case 'hard':
        return {
          arithmetic: [
            "If the ratio of red to blue marbles is 3:5, and there are 48 marbles in total, how many red marbles are there?",
            "A number increased by 20% equals 144. What was the original number?",
            "Solve the equation: 2x + 5 = 13"
          ],
          geometry: [
            "Find the surface area of a cube with edges of length 6 cm.",
            "What is the area of a circle inscribed in a square with side length 10 cm? (Use π = 3.14)",
            "If the diagonal of a rectangle is 13 units and its width is 5 units, what is its length?"
          ],
          general: [
            "Two trains leave stations 400 miles apart, traveling toward each other. If one train travels at 70 mph and the other at 60 mph, how long until they meet?",
            "If an item's price is marked up by 40% and then discounted by 20%, what is the net percentage change?",
            "A phone's price depreciates by 15% each year. What will be its value after 3 years if it originally cost $800?"
          ]
        };
      default:
        return {};
    }
  };

  const generateCustomProblem = async () => {
    setLoading(true);
    setShowSolution(false);
    setShowHint(false);
    setCurrentHintIndex(0);
    setSelectedAnswer(null);
    setCorrectAnswerFound(false);

    try {
      const prompt = `Generate a ${selectedDifficulty} level math problem related to ${customTopic}.
      
      Based on the difficulty level:
      ${selectedDifficulty === 'easy' ? 'Keep it simple with basic operations and concepts.' :
        selectedDifficulty === 'medium' ? 'Include intermediate concepts and two-step problems.' :
        'Make it challenging with complex concepts and multi-step solutions.'}

      Format your response exactly as follows:
      
      QUESTION:
      [Write an engaging story problem about ${customTopic}]
      
      OPTIONS:
      [Correct option]
      [Incorrect but plausible option]
      [Incorrect but plausible option]
      [Incorrect but plausible option]
      
      CORRECT_OPTION:
      [The correct option text]
      
      HINTS:
      1) [First hint - general approach]
      2) [Second hint - more specific]
      3) [Third hint - very specific]
      
      SOLUTION:
      [Step by step solution]
      
      EXPLANATION:
      [Detailed explanation relating to ${customTopic}]`;

      const response = await getMathCompletion(prompt, "llama-3.3-70b-versatile");
      
      // Parse the response
      const sections = response.split('\n\n');
      const question = sections.find(s => s.startsWith('QUESTION:'))?.replace('QUESTION:', '').trim() || '';
      const optionsText = sections.find(s => s.startsWith('OPTIONS:'))?.replace('OPTIONS:', '').trim().split('\n').map(opt => opt.trim()) || [];
      const correctOptionText = sections.find(s => s.startsWith('CORRECT_OPTION:'))?.replace('CORRECT_OPTION:', '').trim() || '';
      const hintsText = sections.find(s => s.startsWith('HINTS:'))?.replace('HINTS:', '').trim().split('\n').map(hint => hint.replace(/^\d+\)\s*/, '').trim()) || [];
      const solution = sections.find(s => s.startsWith('SOLUTION:'))?.replace('SOLUTION:', '').trim() || '';
      const explanation = sections.find(s => s.startsWith('EXPLANATION:'))?.replace('EXPLANATION:', '').trim() || '';

      // Shuffle the options and assign letters
      const shuffledOptions = shuffleArray(optionsText);
      const optionsWithLetters = shuffledOptions.map((opt, index) => {
        const letter = String.fromCharCode(65 + index);
        return `${letter}) ${opt}`;
      });

      const correctAnswerIndex = shuffledOptions.findIndex(opt => opt === correctOptionText);
      const correctAnswer = String.fromCharCode(65 + correctAnswerIndex);

      setCurrentProblem({
        question,
        options: optionsWithLetters,
        correctAnswer,
        explanation,
        difficulty: selectedDifficulty
      });

    } catch (error) {
      console.error('Error generating custom problem:', error);
      toast.error('Failed to generate problem. Please try again.');
    } finally {
      setLoading(false);
      setShowCustomTopicDialog(false);
    }
  };

  const handleTopicSelect = (topicId: string) => {
    if (topicId === 'custom') {
      setShowCustomTopicDialog(true);
    } else {
      setSelectedTopic(topicId);
    }
  };

  // Calculate hint display duration based on hint length
  const calculateHintDuration = (hint: string) => {
    if (!hint) return 3000; // Default duration if hint is empty
    const words = hint.split(' ').length;
    return Math.min(Math.max(3000, words * 500), 10000);
  };

  // Clear any existing hint timer
  const clearHintTimer = useCallback(() => {
    if (hintTimer) {
      clearTimeout(hintTimer);
      setHintTimer(null);
    }
  }, [hintTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearHintTimer();
  }, [clearHintTimer]);

  const handleAnswerSelect = (answer: string) => {
    if (correctAnswerFound) return;
    
    const timeToSolve = solveStartTime ? (Date.now() - solveStartTime) / 1000 : null;
    setSelectedAnswer(answer);
    clearHintTimer();
    
    if (answer === currentProblem?.correctAnswer) {
      setCorrectAnswerFound(true);
      setShowHint(false);
      setAutoShowHint(false);
      setShowExplanation(true);
      
      if (timeToSolve) {
        // Update fastest solves
        setFastestSolves(prev => {
          const newSolve = {
            problem: currentProblem.question,
            time: timeToSolve
          };
          const newSolves = [...prev, newSolve]
            .sort((a, b) => a.time - b.time)
            .slice(0, 5); // Keep top 5
          return newSolves;
        });
        
        toast.success(`Correct! Solved in ${timeToSolve.toFixed(1)}s`);
      } else {
        toast.success('Correct! Well done! 🎉');
      }
    } else {
      // Wrong answer handling
      toast.error('Not quite right. Try again! 💪');
      
      // Show next hint
      if (!showHint) {
        setShowHint(true);
        setCurrentHintIndex(0);
      } else {
        // If hints are already showing, move to next hint
        if (currentHintIndex < 2) { // Assuming we want to show up to 3 hints (0, 1, 2)
          setCurrentHintIndex(prev => prev + 1);
        }
      }

      // Generate progressive hints based on the current attempt
      let hintText = "";
      switch (currentHintIndex) {
        case 0:
          hintText = "Think about the first step to solve this problem.";
          break;
        case 1:
          hintText = currentProblem?.explanation.split('\n')[0] || "Consider the key information given.";
          break;
        case 2:
          hintText = "Here's a detailed hint: " + (currentProblem?.explanation || "");
          break;
      }

      // Update the UI to show the hint
      if (currentProblem) {
        setCurrentProblem({
          ...currentProblem,
          currentHint: hintText
        });
      }
    }
  };

  const showNextHint = () => {
    if (!currentProblem?.explanation || currentHintIndex >= currentProblem.explanation.length - 1) return;
    
    clearHintTimer(); // Clear any existing timer
    setCurrentHintIndex(prev => prev + 1);
    setShowHint(true);
    setAutoShowHint(false); // Manual hint viewing
  };

  const generateProblem = async () => {
    setLoading(true);
    setShowExplanation(false);
    setSelectedAnswer(null);
    setCorrectAnswerFound(false);
    setSolveStartTime(Date.now());

    try {
      const prompt = `Generate a ${selectedDifficulty} level math story problem about ${selectedTopic === 'custom' ? customTopic : selectedTopic}.
      
Format the response exactly as follows:

QUESTION:
[Write a clear, engaging story problem]

OPTIONS:
[Correct answer with calculation]
[Plausible wrong answer 1]
[Plausible wrong answer 2]
[Plausible wrong answer 3]

CORRECT_OPTION:
[The correct answer text exactly as written in OPTIONS]

EXPLANATION:
[Step-by-step solution with clear reasoning]`;

      const response = await getMathCompletion(prompt, "llama-3.3-70b-versatile");
      
      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response from API');
      }

      // Parse the response sections
      const sections = response.split('\n\n');
      const question = sections.find(s => s.startsWith('QUESTION:'))?.replace('QUESTION:', '').trim();
      const optionsText = sections.find(s => s.startsWith('OPTIONS:'))?.replace('OPTIONS:', '').trim().split('\n').map(opt => opt.trim());
      const correctOptionText = sections.find(s => s.startsWith('CORRECT_OPTION:'))?.replace('CORRECT_OPTION:', '').trim();
      const explanation = sections.find(s => s.startsWith('EXPLANATION:'))?.replace('EXPLANATION:', '').trim();

      // Validate required fields
      if (!question || !optionsText || !correctOptionText || !explanation) {
        throw new Error('Missing required fields in the response');
      }

      // Shuffle options and assign letters
      const shuffledOptions = shuffleArray(optionsText);
      const optionsWithLetters = shuffledOptions.map((opt, index) => {
        const letter = String.fromCharCode(65 + index);
        return `${letter}) ${opt}`;
      });

      const correctAnswerIndex = shuffledOptions.findIndex(opt => opt === correctOptionText);
      const correctAnswer = String.fromCharCode(65 + correctAnswerIndex);

      // Update state with new problem
      setCurrentProblem({
        question,
        options: optionsWithLetters,
        correctAnswer,
        explanation,
        difficulty: selectedDifficulty,
        timeToSolve: 0
      });

      setTimeLeft(30);
      toast.success('New problem generated!');

    } catch (error) {
      console.error('Error generating problem:', error);
      toast.error('Failed to generate problem. Please try again.');
      
      // Set a fallback problem
      setCurrentProblem({
        question: "A store is having a 25% off sale. If a shirt originally costs $40, how much will it cost after the discount?",
        options: [
          "A) $30",
          "B) $35",
          "C) $25",
          "D) $15"
        ],
        correctAnswer: "A",
        explanation: "To solve this:\n1. Calculate 25% of $40: $40 × 0.25 = $10\n2. Subtract the discount: $40 - $10 = $30",
        difficulty: selectedDifficulty
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate first problem on mount with default difficulty (easy)
  useEffect(() => {
    generateProblem();
  }, []);

  // Regenerate problem when difficulty or topic changes
  useEffect(() => {
    if (currentProblem) {
      generateProblem();
    }
  }, [selectedDifficulty, selectedTopic]);

  const getButtonClassName = (optionLetter: string) => {
    const baseClasses = "w-full h-auto py-4 px-6 justify-start text-left relative overflow-hidden";
    
    if (!selectedAnswer) {
      return `${baseClasses} bg-background hover:border-purple-500/50 hover:text-purple-600`;
    }
    
    if (correctAnswerFound) {
      // Show correct/incorrect for all options after finding the correct answer
      const isCorrectAnswer = optionLetter === currentProblem?.correctAnswer;
      return `${baseClasses} ${
        isCorrectAnswer
          ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          : "bg-gradient-to-r from-red-500/50 to-rose-600/50 hover:from-red-600/50 hover:to-rose-700/50 text-white/75"
      }`;
    }
    
    // During attempts, only show selected answer as incorrect
    if (optionLetter === selectedAnswer) {
      return `${baseClasses} bg-gradient-to-r from-red-500/50 to-rose-600/50 hover:from-red-600/50 hover:to-rose-700/50 text-white/75`;
    }
    
    return `${baseClasses} bg-background hover:border-purple-500/50 hover:text-purple-600`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Story Problem Generator
        </h2>
        <p className="text-muted-foreground text-lg">
          Challenge yourself with custom math story problems
        </p>
      </div>

      {/* Controls */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-6 bg-gradient-to-b from-purple-50/50 to-white dark:from-gray-900/50 dark:to-gray-900 border-b border-purple-100 dark:border-purple-900/50">
          {/* Difficulty Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
              <Target className="w-5 h-5 text-purple-500" />
              Select Difficulty
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedDifficulty === "easy" ? "default" : "outline"}
                onClick={() => setSelectedDifficulty("easy")}
                className={`h-12 px-8 transition-all duration-200 ${
                  selectedDifficulty === "easy"
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                    : "hover:border-green-500/50 hover:text-green-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5" />
                  <span className="font-medium">Easy</span>
                </div>
              </Button>
              <Button
                variant={selectedDifficulty === "medium" ? "default" : "outline"}
                onClick={() => setSelectedDifficulty("medium")}
                className={`h-12 px-8 transition-all duration-200 ${
                  selectedDifficulty === "medium"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20"
                    : "hover:border-yellow-500/50 hover:text-yellow-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5" />
                  <span className="font-medium">Medium</span>
                </div>
              </Button>
              <Button
                variant={selectedDifficulty === "hard" ? "default" : "outline"}
                onClick={() => setSelectedDifficulty("hard")}
                className={`h-12 px-8 transition-all duration-200 ${
                  selectedDifficulty === "hard"
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                    : "hover:border-red-500/50 hover:text-red-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5" />
                  <span className="font-medium">Hard</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Topic Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
              <Book className="w-5 h-5 text-purple-500" />
              Choose Topic
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  variant={selectedTopic === topic.id ? "default" : "outline"}
                  onClick={() => handleTopicSelect(topic.id)}
                  className={`h-12 transition-all duration-200 ${
                    topic.id === 'custom'
                      ? selectedTopic === topic.id
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                        : 'hover:border-green-500/50 hover:text-green-600'
                      : selectedTopic === topic.id
                      ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'hover:border-purple-500/50 hover:text-purple-600'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    {topic.id === 'custom' ? <Plus className="w-4 h-4" /> : <Book className="w-4 h-4" />}
                    <span className="font-medium">{topic.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Custom Topic Dialog */}
      <Dialog open={showCustomTopicDialog} onOpenChange={setShowCustomTopicDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Custom Topic
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-base font-medium flex items-center gap-2">
                <Book className="w-5 h-5 text-purple-500" />
                Enter your math topic:
              </label>
              <Input
                placeholder="e.g., Trigonometry, Calculus, Linear Equations..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="h-12"
              />
              <p className="text-sm text-muted-foreground">
                We'll generate problems specific to your chosen topic
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCustomTopicDialog(false)}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (customTopic.trim()) {
                    setSelectedTopic('custom');
                    generateCustomProblem();
                  } else {
                    toast.error('Please enter a topic');
                  }
                }}
                className="h-11 bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Problem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Current Problem */}
      {currentProblem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Problem Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Book className="w-5 h-5 text-purple-500" />
                  Current Problem
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`px-4 py-1.5 text-sm font-medium ${
                    selectedDifficulty === "easy" ? "bg-green-100 text-green-700 dark:bg-green-900/50" :
                    selectedDifficulty === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50" :
                    "bg-red-100 text-red-700 dark:bg-red-900/50"
                  }`}>
                    {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/50">
                    {selectedTopic === 'custom' ? customTopic : (topics.find(t => t.id === selectedTopic)?.name || selectedTopic)}
                  </Badge>
                </div>
              </div>

              {/* Problem Content */}
              <div className="bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-purple-50/50 dark:from-purple-900/20 dark:via-blue-900/10 dark:to-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-lg">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  <FormattedMath text={currentProblem.question} />
                </p>
              </div>

              {/* Options */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentProblem.options?.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className={`${getButtonClassName(optionLetter)} h-auto py-4 px-6`}
                        onClick={() => handleAnswerSelect(optionLetter)}
                        disabled={correctAnswerFound && optionLetter === currentProblem.correctAnswer}
                      >
                        <div className="flex items-start gap-4">
                          <span className="font-bold text-lg">{optionLetter}.</span>
                          <span className="text-left">{option}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                {/* Progressive Hints */}
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                    className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50"
                  >
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-500" />
                      Hint {currentHintIndex + 1}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      <FormattedMath text={currentProblem.currentHint || ''} />
                    </p>
                  </motion.div>
                )}

                {/* Show full explanation only after correct answer */}
                {correctAnswerFound && showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/50"
                  >
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-500" />
                      Complete Solution
                    </h4>
                    <div 
                      className="text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: currentProblem.explanation
                          .split('\n')
                          .map(line => `<p>${line}</p>`)
                          .join('') 
                      }}
                    />
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    onClick={generateProblem}
                    variant="default"
                    className="flex-1 h-12 bg-purple-500 hover:bg-purple-600"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    New Problem
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
} 