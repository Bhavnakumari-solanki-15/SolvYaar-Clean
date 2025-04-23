// Web worker for handling CPU-intensive operations
// Type definitions
type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
type Difficulty = 'easy' | 'medium' | 'hard';

type Question = {
  id: string;
  text: string;
  options: number[];
  correctAnswer: number;
  difficulty: Difficulty;
  operation: OperationType;
};

// Worker context
const ctx: Worker = self as any;

// Message handler
ctx.addEventListener('message', (event) => {
  const { action, payload } = event.data;
  
  switch (action) {
    case 'generateQuestion':
      const question = generateQuestion(payload.difficulty, payload.operation);
      ctx.postMessage({ action: 'questionGenerated', payload: question });
      break;
      
    case 'checkAnswer':
      const { userAnswer, correctAnswer } = payload;
      const isCorrect = userAnswer === correctAnswer;
      ctx.postMessage({ action: 'answerChecked', payload: { isCorrect } });
      break;
      
    default:
      console.error('Unknown action:', action);
  }
});

// Helper function to create a unique ID
const createId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Generate random integer between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a math question (similar to the one in levels.ts)
const generateQuestion = (difficulty: Difficulty, operation: OperationType): Question => {
  let num1: number, num2: number, answer: number, text: string;
  let options: number[] = [];
  const operationType: OperationType = operation === 'mixed' 
    ? ['addition', 'subtraction', 'multiplication', 'division'][Math.floor(Math.random() * 4)] as OperationType
    : operation;
  
  // Question generation logic
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
          num1 = num2 * answer;
          text = `${num1} ÷ ${num2} = ?`;
          break;
        default:
          num1 = randomInt(1, 20);
          num2 = randomInt(1, 20);
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
    wrongAnswer = answer + randomInt(-10, 10);
    
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

// Export dummy function to satisfy TypeScript
export {}; 