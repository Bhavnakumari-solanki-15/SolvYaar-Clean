import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Lightbulb, ChevronRight, SkipForward, Trophy, Flag } from "lucide-react";
import { GameState, Shape, Transformation, TransformationType } from './types';
import { applyTransformation, shapesMatch } from './transformations';
import { gameLevels } from './levels';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { badgeService } from '@/services/badgeService';
import { BadgeCategory } from '@/types/badge.types';

interface AchievementBadgeProps {
  icon: string;
  title: string;
  description?: string;
  className?: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  icon, 
  title, 
  description,
  className 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center p-4 text-center", 
      className
    )}>
      <div className="text-5xl mb-2">{icon}</div>
      <h3 className="font-bold text-lg">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
};

const TransformTrekGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    currentShape: gameLevels[0].initialShape,
    targetShape: gameLevels[0].targetShape,
    transformationHistory: [],
    isValid: true,
    score: 0
  });

  const [selectedTransform, setSelectedTransform] = useState<TransformationType>('translation');
  const [transformParams, setTransformParams] = useState({
    angle: 0,
    dx: 0,
    dy: 0,
    sx: 1,
    sy: 1
  });

  const [showHint, setShowHint] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [gameCompleted, setGameCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const currentLevel = gameLevels.find(level => level.id === gameState.currentLevel);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const { user } = useAuth();

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape, color: string) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    shape.points.forEach((point, index) => {
      const canvasX = point.x + ctx.canvas.width / 2;
      const canvasY = point.y + ctx.canvas.height / 2;
      
      if (index === 0) {
        ctx.moveTo(canvasX, canvasY);
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    });
    
    ctx.closePath();
    ctx.stroke();
  }, []);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw target shape (semi-transparent)
    drawShape(ctx, gameState.targetShape, 'rgba(74, 222, 128, 0.5)');
    
    // Draw current shape
    drawShape(ctx, gameState.currentShape, '#3b82f6');
  }, [gameState.currentShape, gameState.targetShape, drawShape]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const checkGameCompletion = (currentLevelNumber: number) => {
    if (currentLevelNumber > gameLevels.length) {
      setFinalScore(gameState.score);
      setGameCompleted(true);
    }
  };

  const applyTransform = () => {
    const transformation: Transformation = {
      id: Date.now().toString(),
      type: selectedTransform,
      params: transformParams
    };

    const result = applyTransformation(gameState.currentShape, transformation);
    
    if (result._tag === 'Right') {
      const newShape = result.value as Shape;
      const newHistory = [...gameState.transformationHistory, transformation];
      
      setGameState(prev => ({
        ...prev,
        currentShape: newShape,
        transformationHistory: newHistory,
        isValid: true
      }));

      // Check if level is completed for the first time
      if (shapesMatch(newShape, gameState.targetShape) && !completedLevels.has(gameState.currentLevel)) {
        const newCompletedLevels = new Set(completedLevels);
        newCompletedLevels.add(gameState.currentLevel);
        setCompletedLevels(newCompletedLevels);
        
        const newScore = gameState.score + 100;
        setGameState(prev => ({
          ...prev,
          score: newScore
        }));

        // If this was the last level and it was just completed
        if (gameState.currentLevel === gameLevels.length) {
          setFinalScore(newScore);
          setGameCompleted(true);
        }
      }
    } else {
      setGameState(prev => ({
        ...prev,
        isValid: false
      }));
    }
  };

  const resetLevel = () => {
    const level = gameLevels.find(l => l.id === gameState.currentLevel);
    if (level) {
      setGameState(prev => ({
        ...prev,
        currentShape: level.initialShape,
        transformationHistory: [],
        isValid: true
      }));
    }
  };

  const goToNextLevel = (skipLevel: boolean = false) => {
    const nextLevelNumber = gameState.currentLevel + 1;
    
    if (nextLevelNumber <= gameLevels.length) {
      const nextLevel = gameLevels[nextLevelNumber - 1];
      setGameState(prev => ({
        ...prev,
        currentLevel: nextLevelNumber,
        currentShape: nextLevel.initialShape,
        targetShape: nextLevel.targetShape,
        transformationHistory: []
      }));
    } else {
      setFinalScore(gameState.score);
      setGameCompleted(true);
    }
  };

  const resetGame = () => {
    setGameState({
      currentLevel: 1,
      currentShape: gameLevels[0].initialShape,
      targetShape: gameLevels[0].targetShape,
      transformationHistory: [],
      isValid: true,
      score: 0
    });
    setCompletedLevels(new Set());
    setGameCompleted(false);
    setFinalScore(0);
  };

  const clearTransforms = () => {
    const currentLevelData = gameLevels.find(l => l.id === gameState.currentLevel);
    if (currentLevelData) {
      setGameState(prev => ({
        ...prev,
        currentShape: currentLevelData.initialShape,
        transformationHistory: [],
        isValid: true
      }));
      setTransformParams({
        angle: 0,
        dx: 0,
        dy: 0,
        sx: 1,
        sy: 1
      });
    }
  };

  const getHintForTransformation = (type: TransformationType): string => {
    switch (type) {
      case 'translation':
        return "• Positive X moves right\n• Positive Y moves down\n• Negative values move in opposite directions";
      case 'rotation':
        return "• Positive angles rotate clockwise\n• 90° makes a quarter turn\n• 180° flips the shape\n• 360° makes a full rotation";
      case 'scaling':
        return "• Values > 1 make the shape larger\n• Values < 1 make the shape smaller\n• Use different X/Y values to stretch";
      default:
        return "";
    }
  };

  const isLastLevel = gameState.currentLevel === gameLevels.length;
  const isLevelComplete = shapesMatch(gameState.currentShape, gameState.targetShape) && gameState.transformationHistory.length > 0;

  const completeGame = async () => {
    setFinalScore(gameState.score);
    setGameCompleted(true);
    
    // Award badge if user is logged in
    if (user) {
      try {
        const badge = await badgeService.awardBadge(user.id, 'transformations');
        if (badge) {
          console.log('Awarded transformations badge:', badge);
        }
      } catch (error) {
        console.error('Error awarding transformation badge:', error);
      }
    }
  };

  const calculateTotalScore = () => {
    const baseScore = completedLevels.size * 100;
    const bonusScore = Array.from(completedLevels).reduce((total, levelId) => {
      const level = gameLevels.find(l => l.id === levelId);
      if (level) {
        const usedSteps = gameState.transformationHistory.length;
        const optimalSteps = level.minSteps || 1;
        // Bonus points for using optimal number of steps
        const bonus = usedSteps <= optimalSteps ? 50 : 0;
        return total + bonus;
      }
      return total;
    }, 0);
    return baseScore + bonusScore;
  };

  const getLevelStatus = (levelId: number) => {
    if (completedLevels.has(levelId)) {
      return 'completed';
    }
    if (levelId === gameState.currentLevel) {
      return 'current';
    }
    // Only allow access to completed levels + 1
    const maxAccessibleLevel = Math.max(...Array.from(completedLevels), 0) + 1;
    if (levelId <= maxAccessibleLevel) {
      return 'accessible';
    }
    return 'locked';
  };

  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 p-5 rounded-full">
                <Trophy className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-400 bg-clip-text text-transparent">
                Game Completed!
              </CardTitle>
              <CardDescription>Congratulations on completing Transform Trek!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Final Score</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{finalScore}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Levels Completed</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{completedLevels.size}/{gameLevels.length}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Mastery Level</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {
                      finalScore >= 1000 ? 'Master' :
                      finalScore >= 750 ? 'Expert' :
                      finalScore >= 500 ? 'Advanced' :
                      'Beginner'
                    }
                  </p>
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
                    <CardTitle>Transform Trek</CardTitle>
                    <CardDescription>{currentLevel?.description}</CardDescription>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-md text-indigo-700 dark:text-indigo-300 font-semibold">
                    Level {gameState.currentLevel}/{gameLevels.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden mb-4">
                  <canvas 
                    ref={canvasRef} 
                    width={500} 
                    height={400} 
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-lg"
                  ></canvas>
                </div>

                {gameState.isValid === false && (
                  <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <AlertTitle className="text-red-600 dark:text-red-400">Invalid Transformation</AlertTitle>
                    <AlertDescription className="text-red-500 dark:text-red-300">
                      The transformation could not be applied. Please check your parameters.
                    </AlertDescription>
                  </Alert>
                )}

                {isLevelComplete && (
                  <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <AlertTitle className="text-green-600 dark:text-green-400">Level Complete!</AlertTitle>
                    <AlertDescription className="text-green-500 dark:text-green-300">
                      You've successfully transformed the shape. 
                      {!isLastLevel ? ' Ready for the next challenge?' : ' You\'ve reached the final level!'}
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="translation" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="translation">Translation</TabsTrigger>
                    <TabsTrigger value="rotation">Rotation</TabsTrigger>
                    <TabsTrigger value="scaling">Scaling</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="translation" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dx">X Translation</Label>
                        <Input
                          id="dx"
                          type="number"
                          value={transformParams.dx}
                          onChange={e => setTransformParams(prev => ({ ...prev, dx: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dy">Y Translation</Label>
                        <Input
                          id="dy"
                          type="number"
                          value={transformParams.dy}
                          onChange={e => setTransformParams(prev => ({ ...prev, dy: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedTransform('translation');
                        applyTransform();
                      }}
                      className="w-full"
                    >
                      Apply Translation
                    </Button>
                    {showHint && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md whitespace-pre-line">
                        <div className="flex items-center mb-1">
                          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-1" />
                          <span className="text-amber-800 dark:text-amber-300 font-medium">Translation Hint:</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {getHintForTransformation('translation')}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="rotation" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="angle">Angle (degrees)</Label>
                      <Input
                        id="angle"
                        type="number"
                        value={transformParams.angle}
                        onChange={e => setTransformParams(prev => ({ ...prev, angle: Number(e.target.value) }))}
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedTransform('rotation');
                        applyTransform();
                      }}
                      className="w-full"
                    >
                      Apply Rotation
                    </Button>
                    {showHint && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md whitespace-pre-line">
                        <div className="flex items-center mb-1">
                          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-1" />
                          <span className="text-amber-800 dark:text-amber-300 font-medium">Rotation Hint:</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {getHintForTransformation('rotation')}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="scaling" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sx">X Scale Factor</Label>
                        <Input
                          id="sx"
                          type="number"
                          step="0.1"
                          value={transformParams.sx}
                          onChange={e => setTransformParams(prev => ({ ...prev, sx: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sy">Y Scale Factor</Label>
                        <Input
                          id="sy"
                          type="number"
                          step="0.1"
                          value={transformParams.sy}
                          onChange={e => setTransformParams(prev => ({ ...prev, sy: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedTransform('scaling');
                        applyTransform();
                      }}
                      className="w-full"
                    >
                      Apply Scaling
                    </Button>
                    {showHint && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md whitespace-pre-line">
                        <div className="flex items-center mb-1">
                          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-1" />
                          <span className="text-amber-800 dark:text-amber-300 font-medium">Scaling Hint:</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {getHintForTransformation('scaling')}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:w-4/12">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button onClick={resetLevel} variant="outline">Reset Level</Button>
                    <Button onClick={clearTransforms} variant="outline">Clear Transforms</Button>
                  </div>
                  
                  <Button
                    onClick={() => setShowHint(!showHint)}
                    className="w-full"
                    variant="outline"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {showHint ? "Hide Hint" : "Show Hint"}
                  </Button>
                  
                  {isLevelComplete && !isLastLevel && (
                    <Button
                      onClick={() => goToNextLevel()}
                      className="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0"
                    >
                      Next Level <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                  
                  {isLevelComplete && isLastLevel && (
                    <Button
                      onClick={completeGame}
                      className="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-0"
                    >
                      Complete Game <Flag className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                  
                  {!isLevelComplete && (
                    <Button
                      onClick={() => goToNextLevel(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Skip Level <SkipForward className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Game Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Current Score</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{gameState.score}</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Transformations</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{gameState.transformationHistory.length}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Transformation History:</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {gameState.transformationHistory.length > 0 ? (
                        gameState.transformationHistory.map((t, index) => (
                          <div key={t.id} className="bg-muted p-2 rounded-md text-xs">
                            {index + 1}. {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                            {t.type === 'translation' && ` (dx: ${t.params.dx}, dy: ${t.params.dy})`}
                            {t.type === 'rotation' && ` (angle: ${t.params.angle}°)`}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No transformations applied yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformTrekGame;