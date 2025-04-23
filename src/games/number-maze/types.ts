export type Difficulty = 'easy' | 'medium' | 'hard';

export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';

export type Question = {
  id: string;
  text: string;
  options: number[];
  correctAnswer: number;
  difficulty: Difficulty;
  operation: OperationType;
};

export type CellType = 'empty' | 'wall' | 'start' | 'end' | 'question' | 'path';

export type MazeCell = {
  x: number;
  y: number;
  type: CellType;
  question?: Question;
  visited?: boolean;
  distance?: number;
  solution?: boolean;
};

export type MazeGrid = MazeCell[][];

export type PlayerPosition = {
  x: number;
  y: number;
};

export type GameState = {
  level: number;
  score: number;
  lives: number;
  grid: MazeGrid;
  player: PlayerPosition;
  currentQuestion: Question | null;
  completedLevels: Set<number>;
  gameCompleted: boolean;
  timeRemaining: number;
  isCorrect: boolean | null;
  showAnswerFeedback: boolean;
}; 