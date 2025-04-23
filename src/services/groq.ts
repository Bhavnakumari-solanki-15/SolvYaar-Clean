import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY || ''
});

interface VerificationResponse {
  isValid: boolean;
  feedback: string;
  suggestedHint?: string;
}

export const verifyMathStep = async (
  topic: string,
  step: string,
  previousSteps: string[]
): Promise<VerificationResponse> => {
  try {
    const prompt = `
      You are a math tutor. Verify if this step in a ${topic} problem is logically correct.
      Previous steps: ${previousSteps.join('\n')}
      Current step: ${step}
      
      Respond with a JSON object containing:
      - isValid: boolean
      - feedback: string (explanation of why it's correct or what's wrong)
      - suggestedHint: string (if incorrect, suggest a hint to help the student)
    `;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in response');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error verifying math step:', error);
    return {
      isValid: false,
      feedback: 'Error verifying step. Please try again.',
      suggestedHint: 'Check your calculations carefully.'
    };
  }
};

export const generateMathHint = async (
  topic: string,
  problem: string,
  currentSteps: string[]
): Promise<string> => {
  try {
    const prompt = `
      You are a math tutor. Generate a helpful hint for this ${topic} problem.
      Problem: ${problem}
      Current steps: ${currentSteps.join('\n')}
      
      Provide a hint that:
      1. Doesn't give away the answer
      2. Guides the student to think about the problem differently
      3. Is specific to their current progress
    `;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    return content || 'Try breaking down the problem into smaller parts.';
  } catch (error) {
    console.error('Error generating math hint:', error);
    return 'Try breaking down the problem into smaller parts.';
  }
};

export const generateDailyChallenge = async (): Promise<{
  problem: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
}> => {
  try {
    const prompt = `
      Generate a daily math challenge with the following format:
      {
        "problem": "A challenging math problem",
        "topic": "Topic name",
        "difficulty": "easy|medium|hard",
        "hints": ["Hint 1", "Hint 2", "Hint 3"]
      }
      
      The problem should be:
      1. Unique and interesting
      2. Solvable within 15-30 minutes
      3. Include multiple steps
      4. Test conceptual understanding
    `;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in response');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating daily challenge:', error);
    return {
      problem: 'Solve for x: 2x + 5 = 15',
      topic: 'Algebra',
      difficulty: 'easy',
      hints: ['Try isolating x', 'Remember to perform the same operation on both sides']
    };
  }
}; 