import { CellType, Difficulty, MazeCell, MazeGrid, OperationType, Question } from './types';

// Helper function to create a unique ID
const createId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Generate random integer between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a math question based on difficulty and operation type
export const generateQuestion = (difficulty: Difficulty, operation: OperationType): Question => {
  let num1: number, num2: number, answer: number, text: string;
  let options: number[] = [];
  const operationType: OperationType = operation === 'mixed' 
    ? ['addition', 'subtraction', 'multiplication', 'division'][Math.floor(Math.random() * 4)] as OperationType
    : operation;
  
  switch (difficulty) {
    case 'easy':
      switch (operationType) {
        case 'addition':
          num1 = randomInt(1, 20);
          num2 = randomInt(1, 20);
          answer = num1 + num2;
          text = `${num1} + ${num2} = ?`;
          break;
        case 'subtraction':
          num1 = randomInt(10, 30);
          num2 = randomInt(1, num1);
          answer = num1 - num2;
          text = `${num1} - ${num2} = ?`;
          break;
        case 'multiplication':
          num1 = randomInt(1, 10);
          num2 = randomInt(1, 10);
          answer = num1 * num2;
          text = `${num1} × ${num2} = ?`;
          break;
        case 'division':
          num2 = randomInt(1, 10);
          answer = randomInt(1, 10);
          num1 = num2 * answer; // Ensure division results in a whole number
          text = `${num1} ÷ ${num2} = ?`;
          break;
        default:
          num1 = randomInt(1, 20);
          num2 = randomInt(1, 20);
          answer = num1 + num2;
          text = `${num1} + ${num2} = ?`;
      }
      break;
    
    case 'medium':
      switch (operationType) {
        case 'addition':
          num1 = randomInt(20, 100);
          num2 = randomInt(20, 100);
          answer = num1 + num2;
          text = `${num1} + ${num2} = ?`;
          break;
        case 'subtraction':
          num1 = randomInt(50, 150);
          num2 = randomInt(20, num1);
          answer = num1 - num2;
          text = `${num1} - ${num2} = ?`;
          break;
        case 'multiplication':
          num1 = randomInt(5, 15);
          num2 = randomInt(5, 15);
          answer = num1 * num2;
          text = `${num1} × ${num2} = ?`;
          break;
        case 'division':
          num2 = randomInt(2, 12);
          answer = randomInt(2, 10);
          num1 = num2 * answer;
          text = `${num1} ÷ ${num2} = ?`;
          break;
        default:
          num1 = randomInt(20, 100);
          num2 = randomInt(20, 100);
          answer = num1 + num2;
          text = `${num1} + ${num2} = ?`;
      }
      break;
    
    case 'hard':
      switch (operationType) {
        case 'addition':
          num1 = randomInt(100, 500);
          num2 = randomInt(100, 500);
          answer = num1 + num2;
          text = `${num1} + ${num2} = ?`;
          break;
        case 'subtraction':
          num1 = randomInt(200, 999);
          num2 = randomInt(100, num1);
          answer = num1 - num2;
          text = `${num1} - ${num2} = ?`;
          break;
        case 'multiplication':
          num1 = randomInt(10, 30);
          num2 = randomInt(10, 30);
          answer = num1 * num2;
          text = `${num1} × ${num2} = ?`;
          break;
        case 'division':
          num2 = randomInt(3, 20);
          answer = randomInt(3, 15);
          num1 = num2 * answer;
          text = `${num1} ÷ ${num2} = ?`;
          break;
        default:
          num1 = randomInt(100, 500);
          num2 = randomInt(100, 500);
          answer = num1 + num2;
          text = `${num1} + ${num2} = ?`;
      }
      break;
    
    default:
      num1 = randomInt(1, 20);
      num2 = randomInt(1, 20);
      answer = num1 + num2;
      text = `${num1} + ${num2} = ?`;
  }
  
  // Generate answer options
  options.push(answer);
  
  // Generate 3 additional wrong answers
  while (options.length < 4) {
    let wrongAnswer: number;
    
    // Generate a plausible wrong answer within a reasonable range
    if (operationType === 'addition' || operationType === 'subtraction') {
      wrongAnswer = answer + randomInt(-10, 10);
    } else if (operationType === 'multiplication') {
      wrongAnswer = answer + randomInt(-answer/2, answer/2);
    } else {
      wrongAnswer = answer + randomInt(-3, 3);
    }
    
    // Make sure it's not the same as the correct answer and not already in options
    if (wrongAnswer !== answer && wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  options = options.sort(() => Math.random() - 0.5);
  
  return {
    id: createId(),
    text,
    options,
    correctAnswer: answer,
    difficulty,
    operation: operationType
  };
};

// Create a maze template (0 = path, 1 = wall)
const createMazeTemplate = (level: number): number[][] => {
  switch (level) {
    case 1:
      return [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ];
    case 2:
      return [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ];
    case 3:
      return [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ];
    default:
      return [
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1]
      ];
  }
};

// Convert a maze template to a full MazeGrid with cell types and questions
export const createMazeLevel = (level: number): MazeGrid => {
  const template = createMazeTemplate(level);
  const height = template.length;
  const width = template[0].length;
  
  // Initialize the grid with walls and empty cells
  const grid: MazeGrid = [];
  
  for (let y = 0; y < height; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < width; x++) {
      // 1 represents wall, 0 represents path
      const type: CellType = template[y][x] === 1 ? 'wall' : 'empty';
      row.push({ x, y, type });
    }
    grid.push(row);
  }
  
  // Set start position (usually top-left corner of the maze)
  let startX = 1;
  let startY = 1;
  grid[startY][startX].type = 'start';
  
  // Set end position (usually bottom-right corner of the maze)
  let endX = width - 2;
  let endY = height - 2;
  
  // For level 1, specific endpoint
  if (level === 1) {
    endX = 9;
    endY = 6;
  } else if (level === 2) {
    endX = 11;
    endY = 7;
  } else if (level === 3) {
    endX = 13;
    endY = 10;
  }
  
  grid[endY][endX].type = 'end';
  
  // Place questions at junctions and decision points
  const questionDifficulty: Difficulty = 
    level === 1 ? 'easy' : level === 2 ? 'medium' : 'hard';
  
  // Find all valid path cells (not start or end)
  const pathCells: MazeCell[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === 'empty') {
        // Check if it's a junction or decision point (has more than 2 adjacent empty cells)
        const adjacentEmptyCells = countAdjacentEmptyCells(grid, x, y);
        if (adjacentEmptyCells > 2) {
          pathCells.push(grid[y][x]);
        }
      }
    }
  }
  
  // Place questions at some of the path cells
  const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division'];
  let questionCount = Math.min(pathCells.length, Math.floor(5 + level * 2)); // Increase questions with level
  
  for (let i = 0; i < questionCount; i++) {
    if (pathCells.length === 0) break;
    
    // Select a random path cell and remove it from the array
    const randomIndex = Math.floor(Math.random() * pathCells.length);
    const cell = pathCells[randomIndex];
    pathCells.splice(randomIndex, 1);
    
    // Generate a question for this cell
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const question = generateQuestion(questionDifficulty, operation);
    
    // Place the question in the cell
    grid[cell.y][cell.x].type = 'question';
    grid[cell.y][cell.x].question = question;
  }
  
  return grid;
};

// Count adjacent empty cells (for finding junctions)
const countAdjacentEmptyCells = (grid: MazeGrid, x: number, y: number): number => {
  let count = 0;
  
  if (y > 0 && (grid[y-1][x].type === 'empty' || grid[y-1][x].type === 'question')) count++;
  if (y < grid.length - 1 && (grid[y+1][x].type === 'empty' || grid[y+1][x].type === 'question')) count++;
  if (x > 0 && (grid[y][x-1].type === 'empty' || grid[y][x-1].type === 'question')) count++;
  if (x < grid[0].length - 1 && (grid[y][x+1].type === 'empty' || grid[y][x+1].type === 'question')) count++;
  
  return count;
};

// Define maze game levels with configurations
export const mazeLevels = [
  {
    id: 1,
    name: "Beginner Paths",
    description: "Solve basic math problems to navigate through a simple maze",
    difficulty: "easy" as Difficulty,
    timeLimit: 180, // 3 minutes
    minScore: 100
  },
  {
    id: 2,
    name: "Calculation Corridors",
    description: "Navigate a more complex maze with intermediate math problems",
    difficulty: "medium" as Difficulty,
    timeLimit: 240, // 4 minutes
    minScore: 200
  },
  {
    id: 3,
    name: "Math Mastermind Labyrinth",
    description: "Challenge yourself with a complex maze and difficult calculations",
    difficulty: "hard" as Difficulty,
    timeLimit: 300, // 5 minutes
    minScore: 300
  }
]; 