import { useState, useEffect, useRef, useCallback } from 'react';

export interface WorkerMessage {
  type: string;
  [key: string]: any;
}

export const useWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Only create worker in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Create a dynamic worker by creating a blob URL
        const workerCode = `
          self.onmessage = function(e) {
            const { type, ...data } = e.data;
            
            switch (type) {
              case 'CREATE_MAZE':
                // This would contain the maze generation logic
                // For now, we're creating a simple maze
                const { level } = data;
                const size = Math.min(5 + level, 15); // Larger mazes for higher levels
                
                const grid = [];
                for (let y = 0; y < size; y++) {
                  const row = [];
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
                
                self.postMessage({ type: 'CREATE_MAZE_RESULT', grid });
                break;
              
              case 'CHECK_ANSWER':
                const { answer, correctAnswer } = data;
                const isCorrect = parseFloat(answer) === parseFloat(correctAnswer);
                self.postMessage({ type: 'CHECK_ANSWER_RESULT', isCorrect });
                break;
                
              case 'PING':
                self.postMessage({ type: 'PONG' });
                break;
              
              default:
                console.error('Unknown action:', type);
            }
          }
          
          function generateQuestion(level) {
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
              text: \`\${num1} \${operation} \${num2} = ?\`,
              answer: answer.toString()
            };
          }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        workerRef.current = new Worker(url);
        
        // Set up message listener
        workerRef.current.onmessage = (e) => {
          if (e.data.type === 'PONG') {
            setIsReady(true);
          }
        };
        
        // Check if worker is ready
        workerRef.current.postMessage({ type: 'PING' });
        
        return () => {
          if (workerRef.current) {
            workerRef.current.terminate();
            URL.revokeObjectURL(url);
          }
        };
      } catch (error) {
        console.error('Error creating worker:', error);
        // Fallback: set ready even without worker
        setIsReady(true);
      }
    } else {
      // Set ready if not in browser
      setIsReady(true);
    }
  }, []);
  
  const processInWorker = useCallback(async (message: WorkerMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback processing on main thread
        if (message.type === 'CREATE_MAZE') {
          // Fallback to synchronous maze creation
          import('@/games/number-maze/mazeGenerator').then(({ createMazeLevel }) => {
            resolve(createMazeLevel(message.level));
          }).catch(err => {
            reject(err);
          });
        } else if (message.type === 'CHECK_ANSWER') {
          resolve({ isCorrect: message.answer === message.correctAnswer });
        } else {
          reject(new Error('Unknown action or worker not available'));
        }
        return;
      }
      
      // Process in worker
      const messageHandler = (e: MessageEvent) => {
        const responseType = `${message.type}_RESULT`;
        if (e.data.type === responseType) {
          workerRef.current?.removeEventListener('message', messageHandler);
          resolve(e.data.type === 'CREATE_MAZE_RESULT' ? e.data.grid : e.data);
        }
      };
      
      workerRef.current.addEventListener('message', messageHandler);
      workerRef.current.postMessage(message);
      
      // Add timeout
      setTimeout(() => {
        workerRef.current?.removeEventListener('message', messageHandler);
        reject(new Error('Worker timeout'));
      }, 5000);
    });
  }, []);
  
  return { isReady, processInWorker };
}; 