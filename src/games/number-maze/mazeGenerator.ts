interface Cell {
  x: number;
  y: number;
  type: 'wall' | 'path' | 'start' | 'end' | 'question';
  question?: {
    text: string;
    answer: string;
  };
  attempted?: boolean;
}

/**
 * Creates a maze grid for the specified level
 */
export const createMazeLevel = (level: number): Cell[][] => {
  const size = Math.min(5 + level, 15); // Larger mazes for higher levels
  
  const grid: Cell[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) {
      // Border walls
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
        row.push({ x, y, type: 'wall' });
      } 
      // Start position
      else if (x === 1 && y === 1) {
        row.push({ x, y, type: 'start' });
      }
      // End position
      else if (x === size - 2 && y === size - 2) {
        row.push({ x, y, type: 'end' });
      }
      // Questions - add some math problems
      else if ((x + y) % 4 === 0 && Math.random() > 0.5) {
        row.push({
          x, y, 
          type: 'question',
          question: generateQuestion(level),
          attempted: false
        });
      }
      // Regular paths
      else {
        row.push({ x, y, type: 'path' });
      }
    }
    grid.push(row);
  }
  
  return grid;
};

/**
 * Generates a math question appropriate for the current level
 */
export const generateQuestion = (level: number) => {
  const operations = ['+', '-', '*'];
  let operation = operations[Math.floor(Math.random() * (level === 1 ? 2 : 3))];
  
  let num1, num2, answer;
  
  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * (10 * level)) + 1;
      num2 = Math.floor(Math.random() * (10 * level)) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * (10 * level)) + 10;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * (level * 2)) + 1;
      num2 = Math.floor(Math.random() * (level * 2)) + 1;
      answer = num1 * num2;
      break;
    default:
      num1 = 1;
      num2 = 1;
      answer = 2;
  }
  
  return {
    text: `${num1} ${operation} ${num2} = ?`,
    answer: answer.toString()
  };
}; 