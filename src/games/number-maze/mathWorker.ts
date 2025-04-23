/**
 * Web Worker for handling math calculations and answer checking
 * This offloads potentially heavy math operations from the main thread
 */

import { checkAnswer, generateFeedback } from './questionUtils';

// Define the message types for type safety
interface WorkerMessage {
  type: 'CHECK_ANSWER' | 'EVALUATE_EXPRESSION';
  payload: any;
}

interface CheckAnswerPayload {
  userAnswer: string;
  correctAnswer: string;
  level: number;
}

interface EvaluateExpressionPayload {
  expression: string;
}

// Handle incoming messages from the main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CHECK_ANSWER':
      handleCheckAnswer(payload as CheckAnswerPayload);
      break;
    case 'EVALUATE_EXPRESSION':
      handleEvaluateExpression(payload as EvaluateExpressionPayload);
      break;
    default:
      console.error('Unknown message type:', type);
  }
};

/**
 * Handles checking if an answer is correct and generates feedback
 */
function handleCheckAnswer(payload: CheckAnswerPayload) {
  const { userAnswer, correctAnswer, level } = payload;
  
  try {
    const isCorrect = checkAnswer(userAnswer, correctAnswer);
    const feedback = generateFeedback(isCorrect, level);
    
    self.postMessage({
      type: 'CHECK_ANSWER_RESULT',
      payload: {
        isCorrect,
        feedback
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: 'Error checking answer',
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

/**
 * Safely evaluates a mathematical expression
 * Only allows basic math operations for security
 */
function handleEvaluateExpression(payload: EvaluateExpressionPayload) {
  const { expression } = payload;
  
  try {
    // Validate expression - only allow numbers and basic operators
    if (!/^[0-9+\-*/\s().]+$/.test(expression)) {
      throw new Error('Invalid expression. Only basic math operations are allowed.');
    }
    
    // Safely evaluate the expression
    // eslint-disable-next-line no-new-func
    const result = Function(`'use strict'; return (${expression})`)();
    
    self.postMessage({
      type: 'EVALUATE_EXPRESSION_RESULT',
      payload: {
        result
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: 'Error evaluating expression',
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
} 