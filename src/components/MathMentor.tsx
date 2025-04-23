import { useState, useEffect, useRef } from 'react';
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FormattedMath } from './FormattedMath';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, ChevronDown, Search, BookOpen, Check, X, AlertCircle, Award, HelpCircle, BarChart2, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import ReactConfetti from 'react-confetti';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "../lib/utils";

// Define types for react-confetti props
interface ConfettiProps {
  width?: number;
  height?: number;
  numberOfPieces?: number;
  recycle?: boolean;
  run?: boolean;
}

interface TopicPreview {
  title: string;
  tags: string[];
  difficulty: string;
  explanation: string;
  keyPoints: string[];
  applications: string[];
  prerequisites: string[];
  icon: string;
}

interface SubTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
}

interface Step {
  description: string;
  formula?: string;
  explanation: string;
  status?: 'understood' | 'needs-review' | 'retry';
  hint?: string;
  logicPattern?: string[];
  formatExample?: string;
}

interface Problem {
  topicPreview: TopicPreview;
  question: string;
  steps: Step[];
  answer: string;
  difficulty: string;
  realWorldContext: string;
}

interface SkillMetrics {
  stepAccuracy: number;
  formulaRecall: number;
  hintUsage: number;
  topicMastery: number;
  correctSteps: string[];
  incorrectLogic: Array<{
    step: number;
    expected: string;
    received: string;
    explanation: string;
  }>;
  earnedBadges: string[];
}

interface FormulaPreview {
  formula: string;
  description: string;
  meaning: string;
}

const TOPIC_ICONS = {
  "Algebra": "📚",
  "Geometry": "📐",
  "Calculus": "📊",
  "Probability": "🎲",
  "Statistics": "📈",
  "Graph Theory": "🔗",
  "Number Theory": "🔢",
  "Linear Algebra": "📏",
  "Trigonometry": "angles",
} as const;

const MATH_SYMBOLS = [
  { symbol: '²', label: 'Square', shortcut: 'Ctrl+2' },
  { symbol: '³', label: 'Cube', shortcut: 'Ctrl+3' },
  { symbol: '√', label: 'Square Root', shortcut: 'Ctrl+R' },
  { symbol: 'π', label: 'Pi', shortcut: 'Ctrl+P' },
  { symbol: '∑', label: 'Sum', shortcut: 'Ctrl+S' },
  { symbol: '±', label: 'Plus-Minus', shortcut: 'Ctrl+M' },
  { symbol: '×', label: 'Multiply', shortcut: 'Ctrl+X' },
  { symbol: '÷', label: 'Divide', shortcut: 'Ctrl+D' },
  { symbol: '∫', label: 'Integral', shortcut: 'Ctrl+I' },
  { symbol: '∞', label: 'Infinity', shortcut: 'Ctrl+8' },
];

const PRESET_TOPICS = [
  {
    title: "Graph Theory",
    subtopics: [
      { id: "gt1", title: "Vertex and Edge Basics", icon: "🔵", description: "Learn about vertices, edges, and basic graph concepts" },
      { id: "gt2", title: "Graph Connectivity", icon: "🔗", description: "Explore connected components and paths" },
      { id: "gt3", title: "Tree Structures", icon: "🌳", description: "Study trees, spanning trees, and their properties" }
    ]
  },
  {
    title: "Probability",
    subtopics: [
      { id: "pb1", title: "Basic Probability", icon: "🎲", description: "Understand fundamental probability concepts" },
      { id: "pb2", title: "Conditional Probability", icon: "🔄", description: "Learn about dependent and independent events" },
      { id: "pb3", title: "Probability Distributions", icon: "📊", description: "Explore different types of distributions" }
    ]
  },
  // ... existing code ...
];

const MathMentor: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<'learn' | 'practice'>('learn');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userSteps, setUserSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [strongPoints, setStrongPoints] = useState<string[]>([]);
  const [weakPoints, setWeakPoints] = useState<string[]>([]);
  const [hasUnderstood, setHasUnderstood] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showTopicPreview, setShowTopicPreview] = useState<boolean>(false);
  const [selectedSubTopic, setSelectedSubTopic] = useState<SubTopic | null>(null);
  const [showFormulaPreview, setShowFormulaPreview] = useState<boolean>(false);
  const [currentFormula, setCurrentFormula] = useState<FormulaPreview | null>(null);
  const [showPerformanceCard, setShowPerformanceCard] = useState<boolean>(false);
  const [skillMetrics, setSkillMetrics] = useState<SkillMetrics>({
    stepAccuracy: 0,
    formulaRecall: 0,
    hintUsage: 0,
    topicMastery: 0,
    correctSteps: [],
    incorrectLogic: [],
    earnedBadges: []
  });
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateProblem = async (topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    setIsSearching(true);
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are an expert math tutor. Generate math problems in valid JSON format. Include step-by-step solutions with LaTeX formatting. Ensure all JSON is properly escaped and formatted."
              },
              {
                role: "user",
                content: `Generate a ${difficulty} math problem about ${topic}. Respond with a JSON object in this format:
{
  "topicPreview": {
    "title": "${topic}",
    "tags": ["tag1", "tag2"],
    "difficulty": "${difficulty}",
    "explanation": "topic explanation",
    "keyPoints": ["point1", "point2"],
    "applications": ["app1", "app2"],
    "prerequisites": ["prereq1", "prereq2"],
    "icon": "📚"
  },
  "question": "question in LaTeX",
  "steps": [
    {
      "description": "step in LaTeX",
      "formula": "formula in LaTeX",
      "explanation": "explanation",
      "hint": "hint",
      "formatExample": "format example",
      "logicPattern": ["keyword1", "keyword2"]
    }
  ],
  "answer": "answer in LaTeX",
  "difficulty": "${difficulty}",
  "realWorldContext": "context"
}`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API request failed: ${response.status} ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid API response structure');
        }

        try {
          // Clean the response content
          const content = data.choices[0].message.content.trim();
          let cleanContent = content;
          
          // Remove any markdown or code block markers
          cleanContent = cleanContent.replace(/^```json\s*|\s*```$/g, '');
          cleanContent = cleanContent.replace(/^```\s*|\s*```$/g, '');
          
          // Try to find JSON object within the content if it's wrapped in other text
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanContent = jsonMatch[0];
          }

          const parsedProblem = JSON.parse(cleanContent);

          // Validate the problem structure
          if (!parsedProblem || typeof parsedProblem !== 'object') {
            throw new Error('Invalid problem structure: not an object');
          }

          if (!parsedProblem.question || !Array.isArray(parsedProblem.steps) || !parsedProblem.answer) {
            throw new Error('Invalid problem structure: missing required fields');
          }

          // Get topic information
          const topicInfo = getTopicExplanation(topic);

          // Ensure all required fields exist with defaults if needed
          const processedProblem: Problem = {
            topicPreview: {
              title: topic,
              tags: ['Math', topic],
              difficulty: difficulty,
              explanation: topicInfo.explanation,
              keyPoints: topicInfo.keyPoints,
              applications: topicInfo.applications,
              prerequisites: topicInfo.prerequisites,
              icon: TOPIC_ICONS[topic as keyof typeof TOPIC_ICONS] || '📚'
            },
            question: parsedProblem.question,
            steps: parsedProblem.steps.map((step: Step) => ({
              description: step.description || '',
              formula: step.formula || '',
              explanation: step.explanation || '',
              hint: step.hint || 'Think about the previous steps and apply similar logic.',
              formatExample: step.formatExample || "Let's solve this step by...",
              logicPattern: step.logicPattern || [
                step.description?.toLowerCase() || '',
                ...(step.explanation?.toLowerCase().split(' ').filter((word: string) => word.length > 4) || [])
              ]
            })),
            answer: parsedProblem.answer,
            difficulty: parsedProblem.difficulty || difficulty,
            realWorldContext: parsedProblem.realWorldContext || `This concept is commonly used in ${topic} applications.`
          };

          setCurrentProblem(processedProblem);
          setShowTopicPreview(true);
          setIsSearching(false);
          return processedProblem;
        } catch (parseError) {
          console.error('Failed to parse API response:', {
            error: parseError,
            content: data.choices[0].message.content
          });
          throw new Error(`Failed to parse problem: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        retryCount++;
        
        if (retryCount === maxRetries) {
          console.error('Error generating problem:', lastError);
          toast({
            title: "Error",
            description: `Failed to generate problem: ${lastError.message}`,
            variant: "destructive"
          });
          setIsSearching(false);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
    }
    setIsSearching(false);
    return null;
  };

  const insertMathSymbol = (symbol: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const value = inputRef.current.value;
      const newValue = value.substring(0, start) + symbol + value.substring(end);
      inputRef.current.value = newValue;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(start + symbol.length, start + symbol.length);
    }
  };

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      const symbol = MATH_SYMBOLS.find(s => s.shortcut.endsWith(e.key.toUpperCase()));
      if (symbol) {
        e.preventDefault();
        insertMathSymbol(symbol.symbol);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

  const handleShowAnswer = () => {
    if (!showHint) {
      setShowHint(true);
      toast({
        title: "💡 Hint Available",
        description: currentProblem?.steps[currentStepIndex].hint || "Think about the previous step and try to apply the same concept.",
      });
    } else {
      setShowAnswer(true);
      if (inputRef.current) {
        inputRef.current.value = currentProblem?.steps[currentStepIndex].description || '';
      }
    }
  };

  const handleStepSubmit = (stepInput: string) => {
    if (!currentProblem) return;

    const isCorrect = validateStep(stepInput, currentProblem.steps[currentStepIndex]);
    const totalStepsAttempted = userSteps.length + 1;
    
    if (isCorrect) {
      setConsecutiveCorrect(prev => prev + 1);
      setConsecutiveWrong(0);
      setStrongPoints(prev => [...prev, currentProblem.steps[currentStepIndex].description]);
      setProgress(prev => prev + (100 / currentProblem.steps.length));
      setCurrentStepIndex(prev => prev + 1);
      setUserSteps(prev => [...prev, stepInput]);
      
      // Calculate new accuracy based on total attempts
      const correctSteps = skillMetrics.correctSteps.length + 1;
      const newAccuracy = Math.round((correctSteps / totalStepsAttempted) * 100);
      
      // Calculate mastery based on multiple factors
      const masteryIncrease = calculateMasteryIncrease(stepInput, currentProblem.steps[currentStepIndex]);
      
      setSkillMetrics(prev => ({
        ...prev,
        stepAccuracy: newAccuracy,
        formulaRecall: Math.min(100, prev.formulaRecall + 3),
        topicMastery: Math.min(100, prev.topicMastery + masteryIncrease),
        correctSteps: [...prev.correctSteps, currentProblem.steps[currentStepIndex].description]
      }));

      // Adaptive difficulty
      if (consecutiveCorrect >= 3) {
        generateProblem(selectedTopic, 'hard');
        setConsecutiveCorrect(0);
      }
    } else {
      setConsecutiveCorrect(0);
      setConsecutiveWrong(prev => prev + 1);
      setWeakPoints(prev => [...prev, currentProblem.steps[currentStepIndex].description]);
      
      // Calculate new accuracy considering the incorrect attempt
      const correctSteps = skillMetrics.correctSteps.length;
      const newAccuracy = Math.round((correctSteps / totalStepsAttempted) * 100);
      
      setSkillMetrics(prev => ({
        ...prev,
        stepAccuracy: newAccuracy,
        hintUsage: Math.min(100, prev.hintUsage + 5),
        incorrectLogic: [...prev.incorrectLogic, {
          step: currentStepIndex,
          expected: currentProblem.steps[currentStepIndex].description,
          received: stepInput,
          explanation: "Incorrect answer. Please try again."
        }]
      }));

      toast({
        title: "Try Again",
        description: "Need a hint? Click 'Show Answer' for help!",
        variant: "default"
      });

      if (consecutiveWrong >= 2) {
        generateProblem(selectedTopic, 'easy');
        setConsecutiveWrong(0);
      }
    }
  };

  const validateStep = (userInput: string, correctStep: Step): boolean => {
    // Simple validation - in a real app, you'd want more sophisticated validation
    return userInput.toLowerCase().includes(correctStep.description.toLowerCase());
  };

  const handleNextChallenge = () => {
    setCurrentPhase('learn');
    setCurrentStepIndex(0);
    setProgress(0);
    setUserSteps([]);
    setStrongPoints([]);
    setWeakPoints([]);
    setShowAnswer(false);
    setHasUnderstood(false);
    generateProblem(selectedTopic);
  };

  const handleCustomTopicSearch = async (topic: string) => {
    setIsSearching(true);
    try {
      const topicPreview = {
        title: topic,
        tags: ['Custom Topic', 'New'],
        difficulty: 'medium',
        explanation: 'Loading example...',
        keyPoints: ['Loading key points...'],
        applications: ['Loading applications...'],
        prerequisites: ['Basic understanding'],
        icon: TOPIC_ICONS[topic as keyof typeof TOPIC_ICONS] || '📚'
      };
      
      setShowTopicPreview(true);
      await generateProblem(topic);
    } catch (error) {
      console.error('Error searching topic:', error);
      toast({
        title: "Error",
        description: "Failed to search topic. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormulaClick = (formula: string, description: string) => {
    setCurrentFormula({
      formula,
      description,
      meaning: "This formula helps solve the current step by..."
    });
    setShowFormulaPreview(true);
  };

  const handleStepComplete = () => {
    if (currentStepIndex === (currentProblem?.steps.length || 0) - 1) {
      const perfectScore = skillMetrics.stepAccuracy === 100;
      if (perfectScore) {
        setSkillMetrics(prev => ({
          ...prev,
          earnedBadges: [...prev.earnedBadges, `${selectedTopic} Ace!`]
        }));
      }
    }
  };

  const handleTopicSelection = async (topic: string, subtopic?: SubTopic) => {
    setIsSearching(true);
    setSelectedTopic(topic);
    if (subtopic) {
      setSelectedSubTopic(subtopic);
    }
    setCurrentPhase('learn');
    setProgress(0);
    setCurrentStepIndex(0);
    setHasUnderstood(false);
    setShowPerformanceCard(false);
    setUserSteps([]);
    setStrongPoints([]);
    setWeakPoints([]);
    
    try {
      const problem = await generateProblem(topic);
      if (problem) {
        setShowTopicPreview(true);
      }
    } catch (error) {
      console.error('Error generating problem:', error);
      toast({
        title: "Error",
        description: "Failed to generate problem. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getTopicExplanation = (topic: string): Omit<TopicPreview, 'title' | 'tags' | 'difficulty' | 'icon'> => {
    const explanations: Record<string, {
      explanation: string;
      keyPoints: string[];
      applications: string[];
      prerequisites: string[];
    }> = {
      "Graph Theory": {
        explanation: "Graph Theory is a mathematical study of networks and connections. It deals with vertices (points) connected by edges (lines), useful for modeling relationships, routes, and networks. Key concepts include paths, connectivity, and algorithms like Dijkstra's shortest path.",
        keyPoints: [
          "Vertices and Edges",
          "Directed vs Undirected Graphs",
          "Graph Traversal Algorithms",
          "Shortest Path Problems",
          "Minimum Spanning Trees",
          "Graph Coloring"
        ],
        applications: [
          "Social Network Analysis",
          "Transportation Networks",
          "Computer Network Design",
          "Circuit Design",
          "GPS and Navigation Systems"
        ],
        prerequisites: [
          "Basic Set Theory",
          "Matrix Operations",
          "Logical Reasoning",
          "Basic Programming Concepts"
        ]
      },
      "Probability": {
        explanation: "Probability is the branch of mathematics that deals with the likelihood of events occurring. It involves analyzing random phenomena, calculating odds, and making predictions based on data.",
        keyPoints: [
          "Sample Spaces and Events",
          "Probability Distributions",
          "Conditional Probability",
          "Random Variables",
          "Expected Value",
          "Variance and Standard Deviation"
        ],
        applications: [
          "Risk Assessment",
          "Weather Forecasting",
          "Game Theory",
          "Insurance Calculations",
          "Quality Control"
        ],
        prerequisites: [
          "Basic Algebra",
          "Set Theory",
          "Counting Principles",
          "Fractions and Decimals"
        ]
      }
      // ... Add similar detailed information for other topics
    };

    const defaultInfo = {
      explanation: `${topic} is a fascinating branch of mathematics that combines logical reasoning with practical applications.`,
      keyPoints: [
        "Fundamental Concepts",
        "Problem-Solving Techniques",
        "Practical Applications"
      ],
      applications: [
        "Real-world Problem Solving",
        "Scientific Research",
        "Engineering Applications"
      ],
      prerequisites: [
        "Basic Mathematical Knowledge",
        "Logical Thinking",
        "Problem-Solving Skills"
      ]
    };

    return explanations[topic] || defaultInfo;
  };

  const calculateMasteryIncrease = (userInput: string, step: Step): number => {
    let increase = 2; // Base increase

    // Check for formula usage
    if (step.formula && userInput.includes(step.formula)) {
      increase += 1;
    }

    // Check for understanding of concepts (using logicPattern)
    if (step.logicPattern?.some(pattern => 
      userInput.toLowerCase().includes(pattern.toLowerCase())
    )) {
      increase += 1;
    }

    // Consider difficulty
    if (currentProblem?.difficulty === 'hard') {
      increase *= 1.5;
    }

    return Math.round(increase);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="relative mb-12">
        {/* Hero Section with Search - Only show when no problem is selected */}
        {!currentProblem && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-3xl" />
            <div className="relative">
              <div className="flex flex-col items-center text-center mb-8 pt-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  Math Mentor
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Your personal AI-powered math tutor. Choose a topic or enter your own to start learning with interactive, step-by-step guidance.
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row gap-4 p-6 bg-card rounded-2xl shadow-lg border border-border/50 backdrop-blur-sm">
                  <select
                    className="flex-1 p-3 rounded-xl bg-background border border-input hover:border-primary/50 focus:border-primary transition-colors"
                    value={selectedTopic}
                    onChange={(e) => {
                      const topic = e.target.value;
                      if (topic) {
                        handleTopicSelection(topic);
                      }
                    }}
                  >
                    <option value="">Select a topic</option>
                    {PRESET_TOPICS.map((topic) => (
                      <option key={topic.title} value={topic.title}>{topic.title}</option>
                    ))}
                  </select>
                  
                  <div className="relative flex-[2]">
                    <Input
                      placeholder="Enter any math topic (e.g., 'Linear Equations', 'Trigonometry')"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customTopic) {
                          handleTopicSelection(customTopic);
                        }
                      }}
                      className="w-full p-3 pr-12 rounded-xl border-input focus:border-primary transition-colors"
                    />
                    {isSearching ? (
                      <motion.div
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </motion.div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/10"
                        onClick={() => customTopic && handleTopicSelection(customTopic)}
                      >
                        <Search className="w-5 h-5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick Access Topics */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {['Algebra', 'Calculus', 'Geometry', 'Statistics'].map((topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      className="p-4 h-auto flex flex-col items-center gap-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-all group"
                      onClick={() => handleTopicSelection(topic)}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {TOPIC_ICONS[topic as keyof typeof TOPIC_ICONS]}
                      </span>
                      <span className="font-medium">{topic}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Show only topic preview and learning sections when problem is selected */}
        {currentProblem && (
          <div className="space-y-8">
            {/* Compact Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {currentProblem.topicPreview.title}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentProblem(null);
                    setSelectedTopic("");
                    setCustomTopic("");
                  }}
                >
                  Change Topic
                </Button>
              </div>
            </div>

            {/* Topic Preview and Learning Sections */}
            <AnimatePresence>
              {showTopicPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-2xl bg-card border border-border/50 shadow-lg overflow-hidden"
                >
                  {/* Rest of the topic preview content remains the same */}
                  {/* Header */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
                    <div className="relative p-8">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl p-4 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
                          {currentProblem.topicPreview.icon}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{currentProblem.topicPreview.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            {currentProblem.topicPreview.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 grid gap-8">
                    {/* About Section */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        About this topic
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {currentProblem.topicPreview.explanation}
                      </p>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Key Points */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <Check className="w-5 h-5 text-primary" />
                          Key Points
                        </h4>
                        <ul className="space-y-3">
                          {currentProblem.topicPreview.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="text-muted-foreground">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Applications */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart2 className="w-5 h-5 text-primary" />
                          Real-world Applications
                        </h4>
                        <ul className="space-y-3">
                          {currentProblem.topicPreview.applications.map((app, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="text-muted-foreground">{app}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Prerequisites and Difficulty */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          Prerequisites
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {currentProblem.topicPreview.prerequisites.map((prereq, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors text-sm"
                            >
                              {prereq}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          Difficulty Level
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="relative flex-1 h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
                              style={{ 
                                width: currentProblem.topicPreview.difficulty === 'easy' ? '33%' : 
                                       currentProblem.topicPreview.difficulty === 'medium' ? '66%' : '100%' 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium capitalize">
                            {currentProblem.topicPreview.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTopic && !selectedSubTopic && !currentProblem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8"
          >
            {PRESET_TOPICS.find(t => t.title === selectedTopic)?.subtopics.map((subtopic) => (
              <motion.div
                key={subtopic.id}
                whileHover={{ scale: 1.02 }}
                className="group p-6 rounded-2xl bg-card border border-border/50 shadow-lg cursor-pointer hover:shadow-xl transition-all"
                onClick={() => handleTopicSelection(selectedTopic, subtopic)}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{subtopic.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{subtopic.title}</h3>
                <p className="text-sm text-muted-foreground">{subtopic.description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {currentProblem && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Left Panel - Problem Statement */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Problem Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <FormattedMath text={currentProblem.question} />
              </div>
              <div className="mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => generateProblem(selectedTopic)}
                  className="w-full"
                >
                  🔄 Explain Again (Simpler Version)
                </Button>
                {currentProblem.realWorldContext && (
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">🌍 Real World Application</h4>
                    <p>{currentProblem.realWorldContext}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Learning/Practice */}
          <Card>
            <CardHeader>
              <CardTitle>
                {currentPhase === 'learn' ? '📚 Learn the Steps' : '✍️ Practice Time'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={currentPhase}>
                <TabsList className="mb-4">
                  <TabsTrigger value="learn">📖 Learn</TabsTrigger>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <TabsTrigger 
                            value="practice" 
                            disabled={!hasUnderstood}
                            onClick={() => setCurrentPhase('practice')}
                          >
                            {!hasUnderstood && <Lock className="w-4 h-4 mr-2" />}
                            🎯 Practice
                          </TabsTrigger>
                        </div>
                      </TooltipTrigger>
                      {!hasUnderstood && (
                        <TooltipContent>
                          <p>Complete the learning phase first!</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </TabsList>

                <TabsContent value="learn">
                  {currentProblem.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={cn(
                        "mb-4 p-4 border rounded",
                        step.status === 'understood' && "bg-green-50 border-green-200",
                        step.status === 'needs-review' && "bg-yellow-50 border-yellow-200",
                        step.status === 'retry' && "bg-red-50 border-red-200"
                      )}
                    >
                      <h3 className="font-bold mb-2">Step {index + 1}</h3>
                      <FormattedMath text={step.description} />
                      {step.formula && (
                        <div className="my-2 p-2 bg-muted rounded">
                          <FormattedMath text={step.formula} />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        {step.explanation}
                      </p>
                    </motion.div>
                  ))}
                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      setHasUnderstood(true);
                      setCurrentPhase('practice');
                      toast({
                        title: "🎉 Great Progress!",
                        description: "You can now move to practice mode!",
                      });
                    }}
                  >
                    ✅ I Understand
                  </Button>
                </TabsContent>

                <TabsContent value="practice">
                  <Progress value={progress} className="mb-4" />
                  {currentStepIndex < currentProblem.steps.length ? (
                    <div>
                      <h3 className="font-bold mb-2">Step {currentStepIndex + 1}</h3>
                      <div className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Format Example:</p>
                          <div className="font-mono text-sm bg-background p-2 rounded border">
                            {currentProblem.steps[currentStepIndex].formatExample || 
                             "Let G be a graph with n = 5 vertices and e = 7 edges..."}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              ref={inputRef}
                              placeholder="Enter your solution step"
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleStepSubmit(e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                  {MATH_SYMBOLS.map((symbol) => (
                                    <Tooltip key={symbol.symbol}>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => insertMathSymbol(symbol.symbol)}
                                        >
                                          {symbol.symbol}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{symbol.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {symbol.shortcut}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {currentProblem.steps[currentStepIndex].formula && (
                            <Button
                              variant="ghost"
                              className="w-full text-left justify-start gap-2"
                              onClick={() => handleFormulaClick(
                                currentProblem.steps[currentStepIndex].formula!,
                                currentProblem.steps[currentStepIndex].description
                              )}
                            >
                              <BookOpen className="w-4 h-4" />
                              View Formula
                            </Button>
                          )}
                        </div>

                        <AnimatePresence>
                          {showHint && !showAnswer && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-4 bg-muted rounded"
                            >
                              <h4 className="font-semibold mb-2">💡 Hint</h4>
                              <p>{currentProblem.steps[currentStepIndex].hint}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={handleShowAnswer}
                          >
                            {!showHint ? '💡 Show Hint' : '👀 Show Answer'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (inputRef.current) {
                                const value = inputRef.current.value;
                                const logicPattern = currentProblem.steps[currentStepIndex].logicPattern;
                                if (logicPattern && value) {
                                  // Check if logic is valid but syntax needs formatting
                                  const hasValidLogic = logicPattern.some(pattern => 
                                    value.toLowerCase().includes(pattern.toLowerCase())
                                  );
                                  if (hasValidLogic) {
                                    inputRef.current.value = currentProblem.steps[currentStepIndex].formatExample || value;
                                    toast({
                                      title: "✨ Format Fixed",
                                      description: "Your logic was correct! We've formatted it properly.",
                                    });
                                  }
                                }
                              }
                            }}
                          >
                            ✨ Fix Format
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold mb-4">🎉 Great Job!</h3>
                      <div className="mb-4">
                        <h4 className="font-semibold">📈 Your Progress</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div className="p-4 bg-muted rounded">
                            <p className="text-sm font-medium">Step Accuracy</p>
                            <p className="text-2xl font-bold">{skillMetrics.stepAccuracy}%</p>
                          </div>
                          <div className="p-4 bg-muted rounded">
                            <p className="text-sm font-medium">Topic Mastery</p>
                            <p className="text-2xl font-bold">{skillMetrics.topicMastery}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-semibold">💪 Strong Points</h4>
                        <ul className="list-disc pl-4">
                          {strongPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-semibold">🎯 Areas to Improve</h4>
                        <ul className="list-disc pl-4">
                          {weakPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-4">
                        <Button onClick={handleNextChallenge}>
                          Next Challenge
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentPhase('learn')}>
                          Revise Topic
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowPerformanceCard(true)}
                        >
                          View Detailed Performance
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showFormulaPreview} onOpenChange={setShowFormulaPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formula Preview</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {currentFormula && (
              <>
                <div className="mb-4">
                  <FormattedMath text={currentFormula.formula} />
                </div>
                <p className="mb-2 font-medium">{currentFormula.description}</p>
                <p className="text-muted-foreground">{currentFormula.meaning}</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    if (inputRef.current) {
                      navigator.clipboard.writeText(currentFormula.formula);
                      toast({
                        title: "Copied to clipboard",
                        description: "You can now paste the formula in your solution",
                      });
                    }
                    setShowFormulaPreview(false);
                  }}
                >
                  Copy to Clipboard
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showPerformanceCard && (
        <PerformanceCard
          metrics={skillMetrics}
          onClose={() => setShowPerformanceCard(false)}
          onTryAgain={handleNextChallenge}
          onRevise={() => {
            setShowPerformanceCard(false);
            setCurrentPhase('learn');
          }}
        />
      )}
    </div>
  );
};

const PerformanceCard: React.FC<{
  metrics: SkillMetrics;
  onClose: () => void;
  onTryAgain: () => void;
  onRevise: () => void;
}> = ({ metrics, onClose, onTryAgain, onRevise }) => {
  const [showConfetti, setShowConfetti] = useState(metrics.stepAccuracy === 100);
  const [selectedError, setSelectedError] = useState<number | null>(null);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {showConfetti && <ReactConfetti recycle={false} numberOfPieces={200} />}
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center text-2xl font-bold gap-2 mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-center gap-2"
            >
              <Award className="w-8 h-8 text-yellow-500" />
              <span>You did it! 🎉</span>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-muted"
            >
              <p className="text-sm font-medium">Step Accuracy</p>
              <p className="text-3xl font-bold">{metrics.stepAccuracy}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg bg-muted"
            >
              <p className="text-sm font-medium">Topic Mastery</p>
              <p className="text-3xl font-bold">{metrics.topicMastery}%</p>
            </motion.div>
          </div>

          {metrics.correctSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h4 className="font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Check className="w-5 h-5 text-green-500" />
                Correct Steps
              </h4>
              <div className="space-y-2">
                {metrics.correctSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm"
                  >
                    <Check className="w-4 h-4 mt-1 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{step}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {metrics.incorrectLogic.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <h4 className="font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Areas to Improve
              </h4>
              <div className="space-y-2">
                {metrics.incorrectLogic.map((error, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={cn(
                      "p-3 rounded-lg transition-all cursor-pointer",
                      "bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm",
                      "hover:bg-white/50 dark:hover:bg-gray-800/50",
                      selectedError === index && "ring-2 ring-blue-500"
                    )}
                    onClick={() => setSelectedError(selectedError === index ? null : index)}
                  >
                    <div className="flex items-start gap-2">
                      <X className="w-4 h-4 mt-1 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-700 dark:text-gray-200">Step {error.step + 1}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{error.explanation}</p>
                        {selectedError === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-700/50"
                          >
                            <p className="text-sm font-medium mb-1">Expected:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{error.expected}</p>
                            <p className="text-sm font-medium mt-2 mb-1">Your answer:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{error.received}</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {metrics.earnedBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-2"
            >
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">🏆 Badges Earned</h4>
              <div className="flex gap-2 flex-wrap">
                {metrics.earnedBadges.map((badge, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-sm font-medium border border-yellow-500/20"
                  >
                    {badge}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex gap-4 mt-4">
            <Button
              onClick={onTryAgain}
              className="flex-1 bg-primary hover:bg-primary/90"
              variant="default"
            >
              Try Similar Challenge
            </Button>
            <Button
              onClick={onRevise}
              className="flex-1"
              variant="outline"
            >
              Revise Topic
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MathMentor; 