/**
 * Custom hook for managing the math worker
 */
import { useEffect, useRef, useCallback } from 'react';

type WorkerResponseType = 'CHECK_ANSWER_RESULT' | 'EVALUATE_EXPRESSION_RESULT' | 'ERROR';

interface WorkerResponse {
  type: WorkerResponseType;
  payload: any;
}

interface UseWorkerHook {
  checkAnswer: (userAnswer: string, correctAnswer: string, level: number) => Promise<{
    isCorrect: boolean;
    feedback: string;
  }>;
  evaluateExpression: (expression: string) => Promise<number>;
}

export function useMathWorker(): UseWorkerHook {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (response: WorkerResponse) => void>>(new Map());

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(new URL('./mathWorker.ts', import.meta.url));

    // Set up message handler
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;
      
      // Find and execute the appropriate callback
      const callbackId = `${type}_${Date.now()}`;
      const callback = callbacksRef.current.get(callbackId);
      
      if (callback) {
        callback(event.data);
        callbacksRef.current.delete(callbackId);
      }
    };

    // Cleanup
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Send message to worker and return a promise that resolves with the response
  const sendToWorker = useCallback(<T>(type: string, payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const callbackId = `${type}_RESULT_${Date.now()}`;
      
      // Store callback for when response comes back
      callbacksRef.current.set(callbackId, (response) => {
        if (response.type === 'ERROR') {
          reject(new Error(response.payload.message));
        } else {
          resolve(response.payload as T);
        }
      });

      // Send message to worker
      workerRef.current.postMessage({ type, payload });
    });
  }, []);

  // Check an answer
  const checkAnswer = useCallback(
    (userAnswer: string, correctAnswer: string, level: number) => {
      return sendToWorker<{ isCorrect: boolean; feedback: string }>('CHECK_ANSWER', {
        userAnswer,
        correctAnswer,
        level,
      });
    },
    [sendToWorker]
  );

  // Evaluate an expression
  const evaluateExpression = useCallback(
    (expression: string) => {
      return sendToWorker<{ result: number }>('EVALUATE_EXPRESSION', {
        expression,
      }).then(data => data.result);
    },
    [sendToWorker]
  );

  return {
    checkAnswer,
    evaluateExpression,
  };
} 