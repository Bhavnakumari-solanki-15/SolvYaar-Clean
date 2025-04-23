interface MathProblem {
  question: string;
  solution: string;
  steps: string[];
  hints: string[];
}

interface StepVerification {
  isCorrect: boolean;
  feedback: string;
  hint?: string;
}

class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not defined in environment variables');
    }
  }

  async generateMathProblem(topic: string): Promise<MathProblem> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a math tutor specializing in ${topic}. Generate a challenging but solvable problem that requires multiple steps to solve. Include the solution and hints.`
            },
            {
              role: 'user',
              content: 'Generate a math problem with solution steps and hints.'
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the response to extract problem, solution, steps, and hints
      // This is a simplified example - you'll need to adjust based on the actual response format
      return {
        question: content.split('Solution:')[0].trim(),
        solution: content.split('Solution:')[1].split('Steps:')[0].trim(),
        steps: content.split('Steps:')[1].split('Hints:')[0].trim().split('\n'),
        hints: content.split('Hints:')[1].trim().split('\n'),
      };
    } catch (error) {
      console.error('Error generating math problem:', error);
      throw error;
    }
  }

  async verifyStep(problem: string, currentStep: string, previousSteps: string[]): Promise<StepVerification> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a math tutor verifying a student\'s solution step. Provide feedback and hints if needed.'
            },
            {
              role: 'user',
              content: `Problem: ${problem}\nPrevious steps: ${previousSteps.join('\n')}\nCurrent step: ${currentStep}\nIs this step correct? If not, provide a hint.`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.toLowerCase();

      // Parse the response to determine if the step is correct and extract feedback
      const isCorrect = !content.includes('incorrect') && !content.includes('wrong');
      const feedback = content.split('hint:')[0].trim();
      const hint = content.includes('hint:') ? content.split('hint:')[1].trim() : undefined;

      return {
        isCorrect,
        feedback,
        hint,
      };
    } catch (error) {
      console.error('Error verifying step:', error);
      throw error;
    }
  }

  async generateResponse(prompt: string, retries = 2): Promise<string> {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt}/${retries} for GROQ API call`);
          // Add a small delay between retries
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [
              {
                role: 'system',
                content: 'You are a creative and knowledgeable AI assistant.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Groq API error (${response.status}): ${response.statusText}. Details: ${errorText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from Groq API');
        }
        
        return data.choices[0].message.content;
      } catch (error) {
        console.error(`Error generating response (attempt ${attempt+1}/${retries+1}):`, error);
        lastError = error;
        
        // If this is the last attempt, throw the error
        if (attempt === retries) {
          throw lastError;
        }
        // Otherwise, continue to the next retry
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript requires a return
    throw lastError;
  }
}

export const groqService = new GroqService(); 