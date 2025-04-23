import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { toast } from 'react-hot-toast';
import { getMathCompletion } from "@/lib/groq";
import {
  Brain,
  Timer,
  Trophy,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check,
  X
} from "lucide-react";

// Dice faces using emojis
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const OPERATORS = ['+', '-', '×', '÷'];

interface GameState {
  dice: number[];
  operators: string[];
  answer: number;
  userAnswer: string;
  isCorrect: boolean | null;
  explanation: string;
  isLoading: boolean;
  timeStarted: number;
  timeElapsed: number;
}

interface Record {
  time: number;
  problem: string;
  answer: number;
  userAnswer: number;
}

export function BrainBooster() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [fastestTime, setFastestTime] = useState<number | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    dice: [],
    operators: [],
    answer: 0,
    userAnswer: '',
    isCorrect: null,
    explanation: '',
    isLoading: false,
    timeStarted: 0,
    timeElapsed: 0
  });

  const generateDiceRoll = () => Math.floor(Math.random() * 6) + 1;
  const generateOperator = () => OPERATORS[Math.floor(Math.random() * OPERATORS.length)];

  const calculateResult = (numbers: number[], ops: string[]): number => {
    // First handle multiplication and division
    let tempNumbers = [...numbers];
    let tempOps = [...ops];
    
    for (let i = 0; i < tempOps.length; i++) {
      if (tempOps[i] === '×' || tempOps[i] === '÷') {
        const result = tempOps[i] === '×' 
          ? tempNumbers[i] * tempNumbers[i + 1]
          : tempNumbers[i] / tempNumbers[i + 1];
        tempNumbers.splice(i, 2, result);
        tempOps.splice(i, 1);
        i--;
      }
    }
    
    // Then handle addition and subtraction
    let result = tempNumbers[0];
    for (let i = 0; i < tempOps.length; i++) {
      if (tempOps[i] === '+') {
        result += tempNumbers[i + 1];
      } else if (tempOps[i] === '-') {
        result -= tempNumbers[i + 1];
      }
    }
    
    return Number(result.toFixed(2));
  };

  const generateNewProblem = useCallback(() => {
    const newDice = [generateDiceRoll(), generateDiceRoll(), generateDiceRoll()];
    const newOperators = [generateOperator(), generateOperator()];
    const result = calculateResult(newDice, newOperators);

    setGameState({
      dice: newDice,
      operators: newOperators,
      answer: result,
      userAnswer: '',
      isCorrect: null,
      explanation: '',
      isLoading: false,
      timeStarted: Date.now(),
      timeElapsed: 0
    });
  }, []);

  useEffect(() => {
    generateNewProblem();
  }, []);

  const getExplanation = async (dice: number[], operators: string[], answer: number) => {
    setGameState(prev => ({ ...prev, isLoading: true }));
    
    const prompt = `
Explain how to solve this math problem with dice in a clear, step-by-step format:
${dice[0]} ${operators[0]} ${dice[1]} ${operators[1]} ${dice[2]} = ${answer}

Format your response like this:
**Problem: [Write the problem]**

Following PEMDAS:
1. First step: [calculation]
2. Second step: [calculation]

Therefore, [final answer]

Keep it brief and clear.`;

    try {
      const explanation = await getMathCompletion(prompt, "llama-3.3-70b-versatile");
      // Format the explanation with markdown-style bold text
      const formattedExplanation = explanation
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      setGameState(prev => ({ 
        ...prev, 
        explanation: formattedExplanation,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error getting explanation:', error);
      toast.error('Failed to get explanation');
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSubmit = async () => {
    const timeElapsed = (Date.now() - gameState.timeStarted) / 1000;
    const isCorrect = Number(gameState.userAnswer) === gameState.answer;
    
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned += 10; // Base points for correct answer
      if (timeElapsed <= 5) {
        pointsEarned += 5; // Speed bonus
        toast.success('Speed bonus! +5 points! 🚀');
      }
      
      // Update fastest time if this is faster
      if (!fastestTime || timeElapsed < fastestTime) {
        setFastestTime(timeElapsed);
        toast.success('New speed record! ⚡');
      }
      
      // Add to records
      setRecords(prev => [...prev, {
        time: timeElapsed,
        problem: `${gameState.dice[0]} ${gameState.operators[0]} ${gameState.dice[1]} ${gameState.operators[1]} ${gameState.dice[2]}`,
        answer: gameState.answer,
        userAnswer: Number(gameState.userAnswer)
      }].sort((a, b) => a.time - b.time).slice(0, 5)); // Keep top 5 fastest times
      
      toast.success(`Correct! +${pointsEarned} points`);
    } else {
      pointsEarned = -5; // Penalty for wrong answer
      toast.error('Incorrect! -5 points');
    }
    
    setScore(prev => {
      const newScore = prev + pointsEarned;
      setHighScore(current => Math.max(current, newScore));
      return newScore;
    });
    
    setGameState(prev => ({
      ...prev,
      isCorrect,
      timeElapsed
    }));
    
    await getExplanation(gameState.dice, gameState.operators, gameState.answer);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
          Dice Math Challenge
        </h2>
        <div className="flex gap-4">
          <Badge variant="outline" className="px-4 py-2 text-lg bg-yellow-100 text-yellow-700">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            Score: {score}
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-lg bg-purple-100 text-purple-700">
            <Trophy className="w-4 h-4 mr-2 text-purple-500" />
            Best: {highScore}
          </Badge>
          {fastestTime && (
            <Badge variant="outline" className="px-4 py-2 text-lg bg-blue-100 text-blue-700">
              <Timer className="w-4 h-4 mr-2 text-blue-500" />
              Record: {fastestTime.toFixed(1)}s
            </Badge>
          )}
        </div>
      </div>

      {/* Game Area */}
      <Card className="p-8 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div className="relative space-y-8">
          {/* Dice Display */}
          <div className="flex justify-center items-center gap-4">
            {[0, 1, 2].map((index) => (
              <React.Fragment key={index}>
                <motion.span
                  key={`dice-${gameState.dice[index]}`}
                  initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  className="text-6xl"
                >
                  {DICE_FACES[gameState.dice[index] - 1]}
                </motion.span>
                {index < 2 && (
                  <motion.span
                    key={`op-${gameState.operators[index]}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-purple-500"
                  >
                    {gameState.operators[index]}
                  </motion.span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex justify-center gap-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
            >
              <Input
                type="number"
                step="0.01"
                value={gameState.userAnswer}
                onChange={(e) => setGameState(prev => ({ ...prev, userAnswer: e.target.value }))}
                placeholder="Enter your answer"
                className="w-48 text-lg text-center"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            <Button
              onClick={handleSubmit}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              disabled={gameState.isCorrect !== null}
            >
              Submit
            </Button>
          </div>

          {/* Records Display */}
          {records.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Fastest Solves
              </h3>
              <div className="space-y-2">
                {records.map((record, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-white/5"
                  >
                    <span className="text-sm">{record.problem} = {record.answer}</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {record.time.toFixed(1)}s
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Result & Explanation */}
          <AnimatePresence>
            {gameState.isCorrect !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Result Badge */}
                <div className="flex justify-center">
                  <Badge
                    variant="outline"
                    className={`px-6 py-3 text-lg ${
                      gameState.isCorrect
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-red-100 text-red-700 border-red-300"
                    }`}
                  >
                    {gameState.isCorrect ? (
                      <Check className="w-5 h-5 mr-2" />
                    ) : (
                      <X className="w-5 h-5 mr-2" />
                    )}
                    {gameState.isCorrect ? "Correct!" : "Incorrect!"}
                    {gameState.timeElapsed <= 5 && gameState.isCorrect && " 🚀 Speed Bonus!"}
                  </Badge>
                </div>

                {/* Explanation */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Solution Steps:
                  </h3>
                  {gameState.isLoading ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  ) : (
                    <div 
                      className="text-gray-700 dark:text-gray-300 space-y-2"
                      dangerouslySetInnerHTML={{ 
                        __html: gameState.explanation
                          .split('\n')
                          .map(line => `<p>${line}</p>`)
                          .join('') 
                      }}
                    />
                  )}
                </Card>

                {/* Next Problem Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={generateNewProblem}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Next Problem
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
} 