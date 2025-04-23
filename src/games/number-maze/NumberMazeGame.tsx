import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Timer, Lightbulb, Flag, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Calculator } from "lucide-react";
import { GameState, MazeCell, MazeGrid as MazeGridType, PlayerPosition, Question } from './types';
import { createMazeLevel, mazeLevels } from './levels';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { badgeService } from '@/services/badgeService';
import { BadgeCategory } from '@/types/badge.types';
import { useWorker } from '@/hooks';

// Cell size in pixels
const CELL_SIZE = 40;

interface CellProps {
  cell: MazeCell;
  player: boolean;
}

// Component for rendering a single cell in the maze
const Cell: React.FC<CellProps> = React.memo(({ cell, player }) => {
  let bgColor = 'bg-gray-200 dark:bg-gray-800';
  let content = null;

  switch (cell.type) {
    case 'wall':
      bgColor = 'bg-gray-700 dark:bg-gray-900';
      break;
    case 'start':
      bgColor = 'bg-green-200 dark:bg-green-900';
      content = <span className="text-green-600 dark:text-green-400">S</span>;
      break;
    case 'end':
      bgColor = 'bg-red-200 dark:bg-red-900';
      content = <span className="text-red-600 dark:text-red-400">E</span>;
      break;
    case 'question':
      bgColor = 'bg-amber-100 dark:bg-amber-900/40';
      content = <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      break;
    case 'path':
      bgColor = 'bg-blue-100 dark:bg-blue-900/30';
      break;
  }

  if (player) {
    content = (
      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
        <span>P</span>
      </div>
    );
  }

  return (
    <div 
      className={`${bgColor} border border-gray-300 dark:border-gray-700 flex items-center justify-center`}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    >
      {content}
    </div>
  );
});

// Component for rendering the maze grid
const MazeGrid: React.FC<{ grid: MazeGridType; player: PlayerPosition }> = React.memo(({ grid, player }) => {
  // References for chunk rendering
  const [renderedRows, setRenderedRows] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Safety check for invalid grid
  if (!grid || !grid.length) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 text-center">Generating maze...</p>
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  // Render the grid in chunks to avoid UI freezing
  useEffect(() => {
    if (!grid || !grid.length) return;
    
    setRenderedRows(0); // Reset when grid changes
    
    // Render rows in batches of 3 
    const totalRows = grid.length;
    let currentRow = 0;
    
    const renderNextChunk = () => {
      // Only continue if we haven't rendered all rows yet
      if (currentRow < totalRows) {
        // Render the next 3 rows (or until the end)
        currentRow = Math.min(currentRow + 3, totalRows);
        setRenderedRows(currentRow);
        
        // Schedule the next chunk
        if (currentRow < totalRows) {
          requestAnimationFrame(renderNextChunk);
        }
      }
    };
    
    // Start rendering
    requestAnimationFrame(renderNextChunk);
  }, [grid]);
  
  // Only render up to the calculated number of rows
  // Guard against undefined grid or empty grid
  const visibleGrid = grid && grid.length ? grid.slice(0, renderedRows) : [];

  return (
    <div 
      ref={gridRef}
      className="overflow-auto p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700"
    >
      <div className="inline-block">
        {visibleGrid.map((row, y) => (
          <div key={y} className="flex">
            {Array.isArray(row) ? row.map((cell, x) => (
              <Cell 
                key={`${x}-${y}`} 
                cell={cell || { x, y, type: 'wall' }} 
                player={player.x === x && player.y === y} 
              />
            )) : null}
          </div>
        ))}
        
        {/* Show loading indicator if not all rows are rendered */}
        {grid && grid.length && renderedRows < grid.length && (
          <div className="py-2 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>
    </div>
  );
});

// Component for displaying a math question
const QuestionDisplay: React.FC<{ 
  question: Question;
  onAnswer: (answer: string) => void;
  showAnswerFeedback?: boolean;
  isCorrect?: boolean;
}> = React.memo(({ question, onAnswer, showAnswerFeedback = false, isCorrect = false }) => {
  // Create a safe handler for answering questions
  const handleOptionClick = useCallback((option: string) => {
    // Use requestAnimationFrame to avoid blocking the main thread
    requestAnimationFrame(() => {
      onAnswer(option);
    });
  }, [onAnswer]);
  
  // Add safety check for question object
  if (!question) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Question Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Add safety checks for question properties
  const questionText = question.text || "Loading question...";
  const options = Array.isArray(question.options) ? question.options : [];
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Math Question</CardTitle>
        <CardDescription>
          Solve this problem to continue your journey through the maze.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xl font-bold text-center py-3 bg-gray-50 dark:bg-gray-900 rounded-md">
          {questionText}
        </div>

        {showAnswerFeedback && (
          <Alert className={cn(
            "mb-4",
            isCorrect 
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          )}>
            <AlertTitle className={isCorrect 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
            }>
              {isCorrect ? "Correct!" : "Incorrect!"}
            </AlertTitle>
            <AlertDescription className={isCorrect 
              ? "text-green-500 dark:text-green-300" 
              : "text-red-500 dark:text-red-300"
            }>
              {isCorrect 
                ? "Well done! You can proceed through the maze." 
                : `The correct answer is ${question.correctAnswer !== undefined ? question.correctAnswer : "..."}`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2">
          {options.length > 0 ? options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-12 text-lg"
              onClick={() => handleOptionClick(option)}
              disabled={showAnswerFeedback}
            >
              {option}
            </Button>
          )) : (
            <div className="col-span-2 py-4 text-center text-gray-500 dark:text-gray-400">
              Loading options...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Main game component
const NumberMazeGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    lives: 3,
    grid: [],  // Start with empty grid for better performance
    player: { x: 1, y: 1 },
    currentQuestion: null,
    completedLevels: new Set<number>(),
    gameCompleted: false,
    timeRemaining: mazeLevels[0].timeLimit,
    isCorrect: null,
    showAnswerFeedback: false
  });
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Add a ref to track the last movement time for debouncing
  const lastMoveTimeRef = useRef<number>(0);
  const movementCooldown = 150; // ms between movements
  
  // Initialize worker
  const { isReady, processInWorker } = useWorker();
  
  const { user } = useAuth();

  // Timer effect with optimized performance
  useEffect(() => {
    if (gameState.gameCompleted || !gameState.grid || gameState.grid.length === 0) return;
    
    let lastUpdateTime = Date.now();
    let rafId: number | null = null;
    
    // Use requestAnimationFrame instead of setInterval for smoother performance
    const updateTimer = () => {
      try {
        const currentTime = Date.now();
        const deltaTime = currentTime - lastUpdateTime;
        
        // Only update state if enough time has passed (1 second)
        if (deltaTime >= 1000) {
          lastUpdateTime = currentTime;
          
          setGameState(prev => {
            // Skip if game is completed or we no longer have a grid
            if (prev.gameCompleted || !prev.grid || prev.grid.length === 0) {
              return prev;
            }
            
            if (prev.timeRemaining <= 0) {
              // Time's up, reduce a life
              return {
                ...prev,
                lives: prev.lives - 1,
                timeRemaining: 0 // Ensure it doesn't go negative
              };
            }
            return {
              ...prev,
              timeRemaining: prev.timeRemaining - 1
            };
          });
        }
        
        // Continue the animation loop
        rafId = requestAnimationFrame(updateTimer);
      } catch (error) {
        console.error('Error in timer update:', error);
        // Ensure we keep the loop going even if there's an error
        rafId = requestAnimationFrame(updateTimer);
      }
    };
    
    // Start the timer
    rafId = requestAnimationFrame(updateTimer);
    
    // Cleanup function
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [gameState.gameCompleted, gameState.grid]);

  // Effect to check game over condition
  useEffect(() => {
    if (gameState.lives <= 0) {
      // Use requestAnimationFrame to avoid blocking UI when setting game completed
      requestAnimationFrame(() => {
        setGameState(prev => ({ ...prev, gameCompleted: true }));
      });
    }
  }, [gameState.lives]);

  // Get the current level config
  const currentLevelConfig = mazeLevels.find(level => level.id === gameState.level) || mazeLevels[0];

  // Setup effect that initializes the grid
  useEffect(() => {
    const initializeGrid = async () => {
      setIsLoading(true);
      
      try {
        // Set a default empty grid structure to avoid undefined errors
        let newGrid: MazeGridType = [];
        
        if (isReady) {
          try {
            // Generate the maze grid in the worker
            const workerGrid = await processInWorker({
              type: 'CREATE_MAZE',
              level: gameState.level
            });
            
            // Ensure we have a valid grid
            if (workerGrid && Array.isArray(workerGrid) && workerGrid.length > 0) {
              newGrid = workerGrid;
            } else {
              // Fallback if worker returns invalid grid
              console.warn("Worker returned invalid grid, falling back to local generation");
              newGrid = createMazeLevel(gameState.level);
            }
          } catch (error) {
            console.error("Worker error:", error);
            newGrid = createMazeLevel(gameState.level);
          }
        } else {
          // Fallback to main thread if worker isn't ready
          newGrid = createMazeLevel(gameState.level);
        }
        
        // Final safety check - never set an invalid grid
        if (!newGrid || !Array.isArray(newGrid) || newGrid.length === 0) {
          console.error("Failed to create a valid grid, using minimal fallback");
          // Create a minimal 3x3 grid as absolute fallback
          newGrid = [
            [{ x: 0, y: 0, type: 'wall' }, { x: 1, y: 0, type: 'wall' }, { x: 2, y: 0, type: 'wall' }],
            [{ x: 0, y: 1, type: 'wall' }, { x: 1, y: 1, type: 'start' }, { x: 2, y: 1, type: 'wall' }],
            [{ x: 0, y: 2, type: 'wall' }, { x: 1, y: 2, type: 'wall' }, { x: 2, y: 2, type: 'wall' }]
          ];
        }
        
        // Find start position
        let startX = 1;
        let startY = 1;
        let startFound = false;
        
        for (let y = 0; y < newGrid.length; y++) {
          for (let x = 0; x < (newGrid[y]?.length || 0); x++) {
            if (newGrid[y]?.[x]?.type === 'start') {
              startX = x;
              startY = y;
              startFound = true;
              break;
            }
          }
          if (startFound) break;
        }
        
        // Update state with new grid and player position
        setGameState(prev => ({
          ...prev,
          grid: newGrid,
          player: { x: startX, y: startY },
          timeRemaining: mazeLevels[gameState.level - 1]?.timeLimit || 180
        }));
        
      } catch (error) {
        console.error("Fatal error initializing grid:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeGrid();
  }, [gameState.level, isReady, processInWorker]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle player movement
  const movePlayer = (dx: number, dy: number) => {
    // Add debouncing to prevent too many movements at once
    const now = Date.now();
    if (now - lastMoveTimeRef.current < movementCooldown) {
      return; // Skip this movement if it's too soon
    }
    lastMoveTimeRef.current = now;
    
    setGameState(prev => {
      try {
        // Prevent movement if a question is active or no grid
        if (prev.currentQuestion || !prev.grid || !prev.grid.length) {
          return prev;
        }
        
        const newX = prev.player.x + dx;
        const newY = prev.player.y + dy;
        
        // Safety checks - validate grid dimensions
        if (!Array.isArray(prev.grid) || prev.grid.length === 0 || !Array.isArray(prev.grid[0]) || prev.grid[0].length === 0) {
          console.error('Invalid grid structure');
          return prev;
        }
      
        // Check if the new position is valid
        if (
          newX < 0 || 
          newY < 0 || 
          newY >= prev.grid.length || 
          !prev.grid[newY] || 
          newX >= prev.grid[newY].length ||
          !prev.grid[newY][newX] ||
          prev.grid[newY][newX].type === 'wall'
        ) {
          return prev; // Invalid move
        }
        
        const cell = prev.grid[newY][newX];
        
        // Additional safety check
        if (!cell) {
          console.error('Cell at position', newX, newY, 'is undefined');
          return prev;
        }
        
        // Handle question cell
        if (cell.type === 'question' && cell.question) {
          return {
            ...prev,
            player: { x: newX, y: newY },
            currentQuestion: cell.question
          };
        }
        
        // Handle end cell (level completion)
        if (cell.type === 'end') {
          const completedLevels = new Set(prev.completedLevels);
          completedLevels.add(prev.level);
          
          // Calculate bonus for time
          const timeBonus = Math.floor(prev.timeRemaining / 10);
          
          // If this was the last level, complete the game
          if (prev.level === mazeLevels.length) {
            return {
              ...prev,
              player: { x: newX, y: newY },
              score: prev.score + 100 + timeBonus,
              completedLevels,
              gameCompleted: true
            };
          }
          
          // Otherwise, move to the next level - but be extra careful with state updates
          try {
            // Set loading state during level transition
            setIsLoading(true);
            
            const nextLevel = prev.level + 1;
            const completedLevelsCopy = new Set(prev.completedLevels);
            completedLevelsCopy.add(prev.level);
            
            // Return a transitional state first - keep the current grid until the new one is ready
            const transitionalState = {
              ...prev,
              player: { x: newX, y: newY },
              score: prev.score + 100 + timeBonus,
              completedLevels: completedLevelsCopy
            };
            
            // Schedule the next level creation for the next frame
            window.requestAnimationFrame(() => {
              try {
                // Generate the new level grid
                const newGrid = createMazeLevel(nextLevel);
                
                // Verify grid validity
                if (!newGrid || !Array.isArray(newGrid) || newGrid.length === 0) {
                  console.error("Level transition: invalid grid created");
                  setIsLoading(false);
                  return;
                }
                
                // Find start position in new level
                let startX = 1;
                let startY = 1;
                let startFound = false;
                
                for (let y = 0; y < newGrid.length; y++) {
                  if (!Array.isArray(newGrid[y])) continue;
                  
                  for (let x = 0; x < newGrid[y].length; x++) {
                    if (newGrid[y][x]?.type === 'start') {
                      startX = x;
                      startY = y;
                      startFound = true;
                      break;
                    }
                  }
                  if (startFound) break;
                }
                
                const nextLevelConfig = mazeLevels.find(level => level.id === nextLevel) || mazeLevels[0];
                
                // Update state with new level
                setGameState(currentState => ({
                  ...currentState,
                  level: nextLevel,
                  grid: newGrid,
                  player: { x: startX, y: startY },
                  timeRemaining: nextLevelConfig.timeLimit
                }));
              } catch (error) {
                console.error('Error creating next level:', error);
              } finally {
                // Always turn off loading state
                setIsLoading(false);
              }
            });
            
            return transitionalState;
          } catch (error) {
            console.error('Error creating next level:', error);
            setIsLoading(false);
            return prev;
          }
        }
        
        // Mark cell as part of the path - Create a deep copy to avoid mutation issues
        // Use a more efficient cloning technique instead of JSON.parse/stringify
        const newGrid = prev.grid.map(row => Array.isArray(row) ? row.map(cell => ({...cell})) : row);
        
        if (cell.type === 'empty' && newGrid[newY] && newGrid[newY][newX]) {
          newGrid[newY][newX] = { ...cell, type: 'path' };
        }
        
        return {
          ...prev,
          player: { x: newX, y: newY },
          grid: newGrid
        };
      } catch (error) {
        console.error('Error in movePlayer:', error);
        return prev; // Return unchanged state on error
      }
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // Skip if question is active or game is completed
        if (gameState.currentQuestion || gameState.gameCompleted) return;
        
        // Prevent default behavior for arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          
          // Apply the same debouncing as the button clicks
          const now = Date.now();
          if (now - lastMoveTimeRef.current < movementCooldown) {
            return; // Skip this movement if it's too soon
          }
          lastMoveTimeRef.current = now;
          
          // Only process the keypress if we're not on cooldown
          switch (e.key) {
            case 'ArrowUp':
              movePlayer(0, -1);
              break;
            case 'ArrowDown':
              movePlayer(0, 1);
              break;
            case 'ArrowLeft':
              movePlayer(-1, 0);
              break;
            case 'ArrowRight':
              movePlayer(1, 0);
              break;
          }
        }
      } catch (error) {
        console.error('Error in keyboard navigation:', error);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.currentQuestion, gameState.gameCompleted]);

  // Handle answering a question
  const handleAnswer = (answer: string) => {
    try {
      if (!gameState.currentQuestion) return;
      
      // Set loading to true during processing
      setIsLoading(true);
      
      // Store a local copy of the question for safety
      const isCorrect = answer === gameState.currentQuestion.correctAnswer;
      const currentQuestionRef = {...gameState.currentQuestion};
      
      // First update: Show feedback without changing lives yet
      requestAnimationFrame(() => {
        try {
          setGameState(prev => {
            // Make sure the question hasn't changed
            if (!prev.currentQuestion || prev.currentQuestion.id !== currentQuestionRef.id) {
              return prev;
            }
            
            return {
              ...prev,
              isCorrect,
              showAnswerFeedback: true,
              score: isCorrect ? prev.score + 20 : prev.score
            };
          });
          
          // Turn off loading now that UI is updated
          setIsLoading(false);
          
          // Second update: After a delay, hide feedback and update lives if needed
          setTimeout(() => {
            // Set loading again for the second update
            setIsLoading(true);
            
            requestAnimationFrame(() => {
              try {
                setGameState(prev => {
                  // Make sure we're still working with the same question
                  if (!prev.currentQuestion || prev.currentQuestion.id !== currentQuestionRef.id) {
                    return prev; // Question has changed, don't update
                  }
                  
                  return {
                    ...prev,
                    currentQuestion: null,
                    isCorrect: null,
                    showAnswerFeedback: false,
                    // If answer was wrong, reduce lives
                    lives: isCorrect ? prev.lives : prev.lives - 1
                  };
                });
              } catch (error) {
                console.error('Error in second question update:', error);
              } finally {
                // Turn off loading after the second update
                setIsLoading(false);
              }
            });
          }, 2000);
        } catch (error) {
          console.error('Error in first question update:', error);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error handling answer:', error);
      // Reset to a safe state
      setGameState(prev => ({
        ...prev,
        currentQuestion: null,
        isCorrect: null,
        showAnswerFeedback: false
      }));
      setIsLoading(false);
    }
  };

  // Reset the game
  const resetGame = () => {
    setIsLoading(true);
    
    try {
      // Use requestAnimationFrame to avoid UI blocking
      requestAnimationFrame(() => {
        try {
          // Create a new level 1 grid
          const newGrid = createMazeLevel(1);
          
          // Find the start position
          let startX = 1;
          let startY = 1;
          let startFound = false;
          
          if (newGrid && Array.isArray(newGrid)) {
            for (let y = 0; y < newGrid.length; y++) {
              if (!Array.isArray(newGrid[y])) continue;
              
              for (let x = 0; x < newGrid[y].length; x++) {
                if (newGrid[y][x]?.type === 'start') {
                  startX = x;
                  startY = y;
                  startFound = true;
                  break;
                }
              }
              if (startFound) break;
            }
          }
          
          // Reset the game state completely
          setGameState({
            level: 1,
            score: 0,
            lives: 3,
            grid: newGrid,
            player: { x: startX, y: startY },
            currentQuestion: null,
            completedLevels: new Set<number>(),
            gameCompleted: false,
            timeRemaining: mazeLevels[0].timeLimit,
            isCorrect: null,
            showAnswerFeedback: false
          });
        } catch (error) {
          console.error('Error in resetGame:', error);
          // Create a minimal default grid as fallback
          setGameState({
            level: 1,
            score: 0,
            lives: 3,
            grid: [
              [{ x: 0, y: 0, type: 'wall' }, { x: 1, y: 0, type: 'wall' }, { x: 2, y: 0, type: 'wall' }],
              [{ x: 0, y: 1, type: 'wall' }, { x: 1, y: 1, type: 'start' }, { x: 2, y: 1, type: 'end' }],
              [{ x: 0, y: 2, type: 'wall' }, { x: 1, y: 2, type: 'wall' }, { x: 2, y: 2, type: 'wall' }]
            ],
            player: { x: 1, y: 1 },
            currentQuestion: null,
            completedLevels: new Set<number>(),
            gameCompleted: false,
            timeRemaining: mazeLevels[0].timeLimit,
            isCorrect: null,
            showAnswerFeedback: false
          });
        } finally {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Fatal error in resetGame:', error);
      setIsLoading(false);
    }
  };

  // Complete the game and handle awards
  const completeGame = async () => {
    if (user) {
      try {
        const badge = await badgeService.awardBadge(user.id, 'math' as BadgeCategory);
        if (badge) {
          console.log('Awarded math badge:', badge);
        }
      } catch (error) {
        console.error('Error awarding math badge:', error);
      }
    }
  };

  // Effect to handle game completion
  useEffect(() => {
    if (gameState.gameCompleted) {
      completeGame();
    }
  }, [gameState.gameCompleted]);

  // Now display a loading screen if needed
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
            <CardTitle className="text-xl font-bold mb-2">Loading Number Maze...</CardTitle>
            <CardDescription>Preparing the puzzle grid for you</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game completion screen
  if (gameState.gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 p-5 rounded-full">
                <Trophy className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-400 bg-clip-text text-transparent">
                {gameState.lives > 0 ? "Game Completed!" : "Game Over!"}
              </CardTitle>
              <CardDescription>
                {gameState.lives > 0 
                  ? "Congratulations on completing Number Maze!" 
                  : "You ran out of lives! Better luck next time."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Final Score</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{gameState.score}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Levels Completed</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {gameState.completedLevels.size}/{mazeLevels.length}
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Lives Remaining</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{gameState.lives}</p>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Back to Practice
                </Button>
                <Button
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0"
                  onClick={resetGame}
                >
                  Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-6 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-8/12 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Number Maze</CardTitle>
                    <CardDescription>{currentLevelConfig.description}</CardDescription>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-md text-indigo-700 dark:text-indigo-300 font-semibold">
                    Level {gameState.level}/{mazeLevels.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-semibold">{gameState.score}</span>
                    </div>
                    <div className="flex items-center">
                      <Timer className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-semibold">{formatTime(gameState.timeRemaining)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: gameState.lives }).map((_, i) => (
                      <div key={i} className="text-red-500">❤️</div>
                    ))}
                  </div>
                </div>

                <MazeGrid grid={gameState.grid} player={gameState.player} />
                
                {gameState.currentQuestion && (() => {
                  try {
                    return (
                      <QuestionDisplay 
                        question={gameState.currentQuestion} 
                        onAnswer={handleAnswer}
                        showAnswerFeedback={gameState.showAnswerFeedback}
                        isCorrect={gameState.isCorrect}
                      />
                    );
                  } catch (error) {
                    console.error('Error rendering question:', error);
                    return (
                      <Card className="mt-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-semibold">Math Question</CardTitle>
                          <CardDescription>
                            There was an error loading this question
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button 
                            onClick={() => setGameState(prev => ({ ...prev, currentQuestion: null }))}
                            className="w-full"
                          >
                            Continue Without Answering
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }
                })()}

                {!gameState.currentQuestion && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.preventDefault();
                        movePlayer(0, -1);
                      }} 
                      className="w-12 h-12 p-0 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          movePlayer(-1, 0);
                        }} 
                        className="w-12 h-12 p-0 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          movePlayer(0, 1);
                        }} 
                        className="w-12 h-12 p-0 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50"
                      >
                        <ArrowDown className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          movePlayer(1, 0);
                        }} 
                        className="w-12 h-12 p-0 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:w-4/12">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Play</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">1.</div>
                      <p>Navigate through the maze using arrow keys or on-screen buttons.</p>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">2.</div>
                      <p>When you encounter a question cell (marked with <Calculator className="h-4 w-4 inline" />), solve the math problem to proceed.</p>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">3.</div>
                      <p>Reach the end cell (marked with 'E') to complete the level.</p>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">4.</div>
                      <p>Watch your timer and complete the level before time runs out.</p>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">5.</div>
                      <p>Wrong answers or running out of time will cost you a life. You have 3 lives.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Level Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {mazeLevels.map((level) => (
                      <div key={level.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Level {level.id}: {level.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {gameState.completedLevels.has(level.id) 
                              ? "Completed" 
                              : level.id === gameState.level 
                                ? "Current" 
                                : "Locked"}
                          </span>
                        </div>
                        <Progress
                          value={gameState.completedLevels.has(level.id) 
                            ? 100 
                            : level.id === gameState.level 
                              ? 50 
                              : 0}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={resetGame}
                    disabled={gameState.level === 1 && gameState.score === 0}
                  >
                    Restart Game
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberMazeGame; 