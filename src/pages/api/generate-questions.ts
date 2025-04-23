import { Groq } from "groq-sdk";
import type { NextApiRequest, NextApiResponse } from 'next';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type Question = {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  try {
    const prompt = `Generate 5 multiple choice questions about ${topic} in mathematics. 
    Each question should have 4 options with one correct answer.
    Format the response as a JSON array of objects with the following structure:
    {
      "text": "The question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0, // index of the correct option (0-3)
      "explanation": "Detailed explanation of the solution",
      "difficulty": "easy|medium|hard",
      "hint": "A helpful hint for solving the question"
    }
    
    Make sure the questions are:
    1. Challenging but solvable
    2. Cover different aspects of the topic
    3. Have clear and unambiguous answers
    4. Include detailed explanations
    5. Have appropriate difficulty levels
    6. Are suitable for advanced mathematics students`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a mathematics expert who creates high-quality multiple choice questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from Groq');
    }

    // Parse the response and validate the structure
    const questions = JSON.parse(response) as Question[];
    
    // Validate each question
    const validatedQuestions = questions.map((q, index) => ({
      ...q,
      id: index + 1,
      topic: topic,
      // Ensure correctAnswer is within bounds
      correctAnswer: Math.min(Math.max(0, q.correctAnswer), 3),
      // Ensure options array has exactly 4 items
      options: q.options.slice(0, 4).concat(Array(4).fill('')).slice(0, 4),
    }));

    return res.status(200).json({ questions: validatedQuestions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ message: 'Failed to generate questions' });
  }
} 