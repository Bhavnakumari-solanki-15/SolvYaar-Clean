import { Groq } from "groq-sdk";
import { fetchImageForFortune } from "./imageFetch";

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true  // Enable browser usage
});

// Model configurations
export const MODELS = {
  // For general text generation and chat
  CHAT: "llama-3.3-70b-versatile",
  // For image understanding and analysis
  VISION: "llama-3.3-70b-versatile",
  // For code generation and analysis
  CODE: "llama-3.3-70b-versatile",
  // For mathematical computations
  MATH: "llama-3.3-70b-versatile",
} as const;

// Helper function for chat completions
export async function getChatCompletion(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  model = MODELS.CHAT
) {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    return {
      completion: completion.choices[0]?.message?.content || ""
    };
  } catch (error) {
    console.error("Error in getChatCompletion:", error);
    throw error;
  }
}

// Helper function for code generation
export async function getCodeCompletion(
  prompt: string,
  model = MODELS.CODE
) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model,
      temperature: 0.3, // Lower temperature for more precise code generation
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error in getCodeCompletion:", error);
    throw error;
  }
}

// Helper function for math problem solving
export async function getMathCompletion(
  problem: string,
  model = MODELS.MATH
) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a mathematical problem-solving assistant. Provide clear, step-by-step solutions."
        },
        { role: "user", content: problem }
      ],
      model,
      temperature: 0.2, // Even lower temperature for mathematical precision
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error in getMathCompletion:", error);
    throw error;
  }
}

// Helper function for vision tasks using text-only responses for now
// Note: Currently Groq doesn't support direct image input, so we'll describe the image in text
export async function getVisionCompletion(
  imageDescription: string,
  prompt: string,
  model = MODELS.VISION
) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a vision analysis assistant. Analyze the described image and provide detailed responses."
        },
        {
          role: "user",
          content: `Image Description: ${imageDescription}\n\nQuestion: ${prompt}`
        }
      ],
      model,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error in getVisionCompletion:", error);
    throw error;
  }
}

/**
 * Groq API integration for generating math fortunes
 */

// This will need to be provided by the user or stored in environment variables
let GROQ_API_KEY = '';

/**
 * Set the Groq API key
 */
export function setGroqApiKey(apiKey: string): void {
  GROQ_API_KEY = apiKey;
}

/**
 * Generate a math fortune for the math oracle
 */
export async function generateMathFortune(generatingCallback?: (image: string | null) => void): Promise<{
  name: string;
  fortune: string;
  facts: string;
  image: string;
}> {
  // Pick random keywords for image search
  const keywords = ['mathematics', 'math education', 'geometric pattern', 'mathematical formula'];
  
  try {
    // Start fetching the image early in the background
    const imagePromise = fetchImageForFortune('', keywords);
    
    // Call the callback with null to indicate we're starting
    generatingCallback?.(null);
    
    // Generate the fortune from Groq
    const { completion } = await getChatCompletion([
      {
        role: 'system',
        content: `You are a Mathematical Achievement Generator that creates personal math-themed achievements for people.
        
Present this directly to the person as if they have unlocked an achievement (do not use JSON format or mention this being a fortune).

Your response should include:
1. A math-inspired name (creative, like "Calculus Conqueror" or "Probability Pioneer")
2. A short personal fortune (1-2 lines maximum)
3. A couple fascinating facts about this math area (2-3 lines maximum)

Be extremely concise - each section should be just 1-3 lines at most. 
Avoid complex mathematical symbols or jargon.
Make it inspirational and personal, addressing the person directly.

Do NOT format with "Title:", "Fortune:", etc. - just provide the three sections in order.`
      },
      {
        role: 'user',
        content: 'Generate a mathematical achievement for me'
      }
    ],
    MODELS.MATH
    );
    
    // Parse the completion
    const lines = completion.trim().split('\n').filter(line => line.trim() !== '');
    
    // The first non-empty line is the name
    const name = lines[0]?.trim() || 'Math Achievement';
    
    // Next is the fortune (1-2 lines)
    const fortune = lines.length > 1 ? lines[1]?.trim() || '' : '';
    
    // Remaining lines are considered facts
    const facts = lines.length > 2 ? lines.slice(2).join('\n').trim() : '';
    
    // Call the callback to indicate we're fetching the image
    generatingCallback?.('generating');
    
    // Wait for the image to be ready
    let imageData;
    try {
      // Try fetching the image with the name/title for better context
      imageData = await fetchImageForFortune(fortune, keywords, name);
    } catch (error) {
      console.error('Error fetching image, retrying:', error);
      // If it fails, try again with just the fortune and keywords
      imageData = await fetchImageForFortune(fortune, keywords);
    }
    
    return {
      name,
      fortune,
      facts,
      image: imageData.url
    };
  } catch (error) {
    console.error('Error generating math fortune:', error);
    throw error;
  }
}

/**
 * Extract keywords from a fortune for image search
 */
export function extractKeywords(fortune: string): string[] {
  // Remove common words and punctuation, focus on nouns and meaningful terms
  const words = fortune.toLowerCase().replace(/[.,?!;:()"']/g, '').split(/\s+/);
  
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 
    'by', 'about', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
    'may', 'might', 'must', 'can', 'could', 'of', 'from', 'into', 'during', 'you',
    'your', 'will', 'today', 'tomorrow', 'yesterday'
  ]);
  
  // Words related to math that we want to keep for image search
  const mathWords = new Set([
    'math', 'mathematics', 'equation', 'formula', 'number', 'pi', 'infinity',
    'calculation', 'geometry', 'algebra', 'calculus', 'probability', 'statistics',
    'fraction', 'decimal', 'graph', 'function', 'variable', 'constant', 'theorem',
    'proof', 'angle', 'circle', 'square', 'triangle', 'rectangle', 'polygon',
    'prime', 'rational', 'irrational', 'integer', 'matrix', 'vector', 'dimension'
  ]);
  
  // Extract meaningful keywords
  const keywords = words.filter(word => 
    mathWords.has(word) || 
    (word.length > 3 && !stopWords.has(word))
  );
  
  // Add 'math' as a default keyword if no math-related words are found
  if (!keywords.some(word => mathWords.has(word))) {
    keywords.push('math');
  }
  
  // Return unique keywords, up to 5
  return [...new Set(keywords)].slice(0, 5);
} 