// Add type declarations at the top
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

import { toast } from "../components/ui/sonner";
import { Groq } from 'groq-sdk';

// Define environment variable type
declare global {
  interface ImportMetaEnv {
    VITE_GROQ_API_KEY: string;
  }
}

// Initialize Groq client with environment variable and error handling
let groqClient: Groq;
let mockMode = false;

try {
  if (!import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_API_KEY.includes('0123456789')) {
    throw new Error('GROQ API key is not defined in environment variables or is a mock key');
  }
  
  groqClient = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true // Allow browser usage with proper security measures
  });
} catch (error) {
  console.warn('Using mock Groq client:', error);
  mockMode = true;
  
  // Provide a mock client that returns predefined responses
  groqClient = new Proxy({} as Groq, {
    get: () => () => {
      return {
        choices: [
          {
            message: {
              content: getMockSolution()
            }
          }
        ]
      };
    }
  });
}

function getMockSolution() {
  return `
CONCEPT:
The problem involves solving a quadratic equation using either factoring or the quadratic formula.

KEY_POINTS:
- A quadratic equation has the form ax² + bx + c = 0
- The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a
- The discriminant b² - 4ac determines the nature of the solutions

SOLUTION:
1. Identify the coefficients in the standard form: a = 1, b = -5, c = 6
2. Try to factor the quadratic expression: 
   x² - 5x + 6 = (x - 2)(x - 3)
3. Set each factor equal to zero:
   x - 2 = 0 → x = 2
   x - 3 = 0 → x = 3
4. Verify the solutions by substituting back into the original equation.

ANSWER:
x = 2 or x = 3

VERIFICATION:
For x = 2: (2)² - 5(2) + 6 = 4 - 10 + 6 = 0 ✓
For x = 3: (3)² - 5(3) + 6 = 9 - 15 + 6 = 0 ✓

LATEX:
x^2 - 5x + 6 = 0 \\
(x - 2)(x - 3) = 0 \\
x = 2 \\text{ or } x = 3

TOPIC:
Algebra - Quadratic Equations

HINTS:
1. Try to factor the quadratic expression first.
2. If factoring doesn't work easily, use the quadratic formula.
3. Always verify your solutions by substituting back into the original equation.

RELATED_CONCEPTS:
- Factoring polynomials
- The quadratic formula
- Vieta's formulas relating roots to coefficients
- Applications in physics for modeling projectile motion
`;
}

export interface MathProblem {
  problem: string;
  type?: 'text' | 'image' | 'voice' | 'file' | 'latex';
}

export interface MathSolution {
  solution: string;
  explanation: string;
  steps?: string[];
  latex?: string;
  visualization?: any;
  topic?: string;
  hints?: string[];
  keyPoints?: string[];
  verification?: string;
  relatedConcepts?: string[];
  plotData?: any;
  fileAnalysis?: {
    fileType: 'pdf' | 'csv' | 'docx';
    problemCount: number;
    topics: string[];
    problems: Array<{
      question: string;
      topic: string;
      solution: string;
      answer: string;
      keyPoints?: string[];
      formulas?: string[];
    }>;
  };
}

// Topic detection using keywords and patterns
const detectMathTopic = (problem: string): string => {
  const problemText = problem.toLowerCase();
  
  // Define keyword patterns for different topics
  const topicPatterns = {
    algebra: [
      'solve', 'equation', 'expression', 'simplify', 'factor', 'polynomial',
      'linear', 'quadratic', 'systems of equations', 'inequality', 'x', 'y', 'variable'
    ],
    calculus: [
      'derivative', 'integrate', 'limit', 'differentiate', 'rate of change',
      'maximum', 'minimum', 'inflection', 'critical points', 'definite integral'
    ],
    trigonometry: [
      'sin', 'cos', 'tan', 'sine', 'cosine', 'tangent', 'angle', 'radian', 'degree',
      'triangle', 'circular', 'periodic', 'cotangent', 'secant', 'cosecant'
    ],
    geometry: [
      'area', 'volume', 'perimeter', 'circle', 'triangle', 'rectangle', 'square',
      'polygon', 'sphere', 'distance', 'angle', 'chord', 'diameter', 'radius'
    ],
    statistics: [
      'probability', 'mean', 'median', 'mode', 'standard deviation', 'variance',
      'distribution', 'sample', 'histogram', 'correlation', 'regression'
    ],
    linearAlgebra: [
      'matrix', 'vector', 'determinant', 'eigenvalue', 'eigenvector',
      'linear transformation', 'span', 'basis', 'dimension', 'transpose'
    ],
    numberTheory: [
      'prime', 'divisor', 'gcd', 'lcm', 'modulo', 'congruence',
      'diophantine', 'integer', 'divisibility', 'remainder'
    ]
  };
  
  // Score each topic based on keyword matches
  const topicScores = Object.entries(topicPatterns).map(([topic, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      return count + (problemText.includes(keyword) ? 1 : 0);
    }, 0);
    return { topic, score };
  });
  
  // Find the topic with the highest score
  topicScores.sort((a, b) => b.score - a.score);
  
  // If no strong match is found, default to algebra
  return topicScores[0].score > 0 ? topicScores[0].topic : 'algebra';
};

export const solveMathProblem = async (problem: MathProblem): Promise<MathSolution> => {
  try {
    const prompt = `Solve this mathematical problem:
    ${problem.problem}
    
    Provide a detailed solution with steps, explanations, and LaTeX notation if applicable.`;

    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a mathematical expert and teacher, skilled in explaining complex concepts in simple terms.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const aiResponse = response.choices[0]?.message?.content || '';
    
    // Extract different components from the response
    const topic = extractTopic(aiResponse);
    const hints = extractHints(aiResponse);
    const latexContent = extractLatex(aiResponse);
    const plotData = extractPlotData(aiResponse);
    
    // Clean and format the response
    const cleanedResponse = aiResponse
      .replace(/\\\$/g, "")
      .replace(/\$\$(.*?)\$\$/g, "$1")
      .replace(/\$(.*?)\$/g, "$1")
      .replace(/\\boxed\{(.*?)\}/g, "【$1】");
    
    // Format the response for simpler display
    const solution: MathSolution = {
      solution: formatSolution(cleanedResponse),
      explanation: extractExplanation(cleanedResponse),
      steps: extractSteps(cleanedResponse),
      topic: topic,
      hints: hints,
      latex: latexContent,
      plotData: plotData,
      visualization: extractVisualization(cleanedResponse)
    };
    
    return solution;
  } catch (error) {
    console.error("Error solving math problem:", error);
    if (error instanceof Error && error.message.includes("rate_limit_exceeded")) {
      toast.error("Processing limit reached. Please try with a shorter input.");
    } else {
    toast.error("Failed to solve the math problem. Please try again.");
    }
    throw error;
  }
};

// Extract mathematical topic from the response
function extractTopic(text: string): string {
  const topicMatch = text.match(/Topic:\s*([^\n]+)/i);
  return topicMatch ? topicMatch[1].trim() : 'General Mathematics';
}

// Extract hints from the response
function extractHints(text: string): string[] | undefined {
  if (text.includes("Hints:")) {
    const hintsSection = text.match(/Hints:(.*?)(?=\n\n|Topic:|$)/s);
    if (hintsSection) {
      return hintsSection[1]
        .split(/\d+\.\s/)
        .filter(hint => hint.trim().length > 0)
        .map(hint => hint.trim());
    }
  }
  return undefined;
}

// Extract LaTeX content from the response
function extractLatex(text: string): string | undefined {
  // Extract all LaTeX expressions
  const latexExpressions: string[] = [];
  const displayMathRegex = /\$\$(.*?)\$\$/gs;
  const inlineMathRegex = /\$(.*?)\$/gs;
  
  let match;
  while ((match = displayMathRegex.exec(text)) !== null) {
    latexExpressions.push(match[1]);
  }
  
  while ((match = inlineMathRegex.exec(text)) !== null) {
    latexExpressions.push(match[1]);
  }
  
  return latexExpressions.length > 0 ? latexExpressions.join('\n') : undefined;
}

// Extract plot data for graphs
function extractPlotData(text: string): any {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Error parsing plot data JSON:", e);
      
      // Fallback: Try to create sample data for common functions
      if (text.toLowerCase().includes('parabola') || text.toLowerCase().includes('quadratic')) {
        return Array.from({ length: 21 }, (_, i) => ({
          x: i - 10,
          y: Math.pow(i - 10, 2) / 10
        }));
      } else if (text.toLowerCase().includes('sine') || text.toLowerCase().includes('sin(')) {
        return Array.from({ length: 21 }, (_, i) => ({
          x: i,
          y: Math.sin(i * Math.PI / 10)
        }));
      } else if (text.toLowerCase().includes('line') || text.toLowerCase().includes('linear')) {
        return Array.from({ length: 21 }, (_, i) => ({
          x: i - 10,
          y: (i - 10) / 2
        }));
      }
    }
  }
  return undefined;
}

function formatSolution(text: string): string {
  // If solution already has our desired format, return it as is
  if (text.includes("A classic!")) {
    return text;
  }
  
  // Add our desired format
  let formattedSolution = "A classic! The solution to this problem is quite simple: ";
  
  // Extract just the numerical answer if possible
  const numericMatch = text.match(/(?:=|is|equals)\s*([\d\.\-]+)/i);
  if (numericMatch && numericMatch[1]) {
    formattedSolution += `The answer is 【${numericMatch[1]}】.`;
  } else {
    // Otherwise use the whole text
    formattedSolution += text;
  }
  
  // Replace any remaining LaTeX notation with simplified text
  return formattedSolution
    .replace(/\\boxed\{(.*?)\}/g, "【$1】")
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "$1/$2")
    .replace(/\\sqrt\{(.*?)\}/g, "sqrt($1)")
    .replace(/\^(\d+)/g, "^$1");
}

// Helper functions to extract components from the AI response
function extractExplanation(text: string): string {
  if (text.includes("Explanation:")) {
    const explanationMatch = text.match(/Explanation:(.*?)(?=\n\n|$)/s);
    return explanationMatch ? explanationMatch[1].trim() : "";
  }
  
  // If no explicit explanation section, use the whole text
  return text;
}

function extractSteps(text: string): string[] | undefined {
  // Look for steps in various formats
  if (text.includes("Steps:")) {
    const stepsSection = text.match(/Steps:(.*?)(?=\n\n|$)/s);
    if (stepsSection) {
      return stepsSection[1]
        .split(/\d+\.\s/)
        .filter(step => step.trim().length > 0)
        .map(step => step.trim());
    }
  }
  
  // Look for numbered steps
  const stepLines = text.match(/\d+\.\s+(.*?)(?=\n\d+\.|$)/gs);
  if (stepLines && stepLines.length > 0) {
    return stepLines.map(line => line.trim());
  }
  
  // Try to split by new lines if no other pattern matches
  return text.split('\n').filter(line => line.trim().length > 0);
}

function extractVisualization(text: string): any | undefined {
  try {
  // Look for visualization data in JSON format
    const visualMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (visualMatch) {
      const visualData = JSON.parse(visualMatch[1]);
      return visualData;
    }

    // Look for coordinate pairs in the text
    const coordMatch = text.match(/coordinates:\s*\[([\s\S]*?)\]/);
    if (coordMatch) {
      const coords = coordMatch[1]
        .split(/[;,\n]/)
        .map(pair => pair.trim())
        .filter(pair => pair)
        .map(pair => {
          const [x, y] = pair.split(/[(),\s]+/).filter(n => n).map(Number);
          return { x, y };
        });
      return coords;
    }

    // Extract geometric shapes and their properties
    const shapes = [];
    const shapeMatches = text.matchAll(/shape:\s*(\w+)\s*\{([^}]+)\}/g);
    for (const match of shapeMatches) {
      const [_, type, props] = match;
      const properties = Object.fromEntries(
        props.split(',')
          .map(prop => prop.trim().split(':').map(p => p.trim()))
      );
      shapes.push({ type, ...properties });
    }
    if (shapes.length > 0) {
      return { shapes };
    }

    return undefined;
  } catch (error) {
    console.error("Error extracting visualization:", error);
    return undefined;
  }
}

// Add new function to enhance drawing recognition
function enhanceDrawingRecognition(content: string): string {
  // Enhance symbol recognition
  let enhanced = content
    .replace(/[×Xx]/g, '×') // Standardize multiplication symbols
    .replace(/[÷]/g, '/') // Standardize division symbols
    .replace(/[=]/g, '=') // Fix potential equals signs
    .replace(/[\^⁰¹²³⁴⁵⁶⁷⁸⁹]/g, match => {
      // Convert superscript numbers to proper exponents
      const superscriptMap: { [key: string]: string } = {
        '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
        '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9'
      };
      return superscriptMap[match] || match;
    });

  // Detect and format fractions
  enhanced = enhanced.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');

  // Detect and format square roots
  enhanced = enhanced.replace(/√(\d+)/g, '\\sqrt{$1}');

  return enhanced;
}

export const groq = {
  recognizeMathFromText: async (text: string): Promise<string> => {
    try {
      // Truncate long inputs to stay within token limits
      const maxInputLength = 2000; // Conservative limit to stay well under the 6000 TPM limit
      const truncatedText = text.length > maxInputLength 
        ? text.slice(0, maxInputLength) + "..."
        : text;

      const response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a math expert. Extract and correct mathematical expressions from the input. Return only the mathematical expression in a clear format."
          },
          {
            role: "user",
            content: truncatedText
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 500 // Reduced from 100 to allow for longer expressions
      });

      return response.choices[0].message.content || text;
    } catch (error) {
      console.error("Error improving math text:", error);
      if (error instanceof Error && error.message.includes("rate_limit_exceeded")) {
        // If we hit rate limits, return the original text
        toast.error("Processing limit reached. Using original input.");
        return text;
      }
      return text;
    }
  },

  recognizeMathFromImage: async (imageFile: File): Promise<string> => {
    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]); // Remove data URL prefix
          } else {
            reject(new Error('Failed to read image file'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(imageFile);
      });

      // Call Groq API with the image
      const response = await fetch('https://api.groq.com/v1/vision/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a math OCR expert. Extract and format mathematical expressions from images accurately. Return only the recognized mathematical expression in a clean format, suitable for computation.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  data: {
                    base64: base64Image
                  }
                },
                {
                  type: 'text',
                  data: 'Please recognize and extract the mathematical expression from this image. Format it cleanly and return only the expression.'
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 100,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process image with Groq API');
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error in recognizeMathFromImage:', error);
      throw new Error('Failed to recognize math from image');
    }
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    try {
      // Check if the audio blob is empty
      if (audioBlob.size === 0) {
        throw new Error("No audio was recorded. Please try speaking louder or closer to the microphone.");
      }

      // First, use Web Speech API for initial transcription
      const transcription = await new Promise<string>((resolve, reject) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          throw new Error("Speech recognition is not supported in this browser. Please try a different browser.");
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let hasRecognizedSpeech = false;
        let recognitionTimeout: NodeJS.Timeout;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          console.log("Initial transcription:", transcript);
          hasRecognizedSpeech = true;
          clearTimeout(recognitionTimeout);
          resolve(transcript);
        };

        recognition.onerror = (event) => {
          console.error("Recognition error:", event.error);
          clearTimeout(recognitionTimeout);
          if (event.error === 'no-speech') {
            reject(new Error('No speech detected. Please speak clearly and try again.'));
          } else if (event.error === 'audio-capture') {
            reject(new Error('No microphone was found or microphone is disabled. Please check your microphone settings.'));
          } else if (event.error === 'not-allowed') {
            reject(new Error('Microphone permission was denied. Please allow microphone access in your browser settings.'));
          } else {
            reject(new Error(`Speech recognition error: ${event.error}`));
          }
        };

        recognition.onend = () => {
          clearTimeout(recognitionTimeout);
          if (!hasRecognizedSpeech) {
            reject(new Error('No speech detected. Please speak clearly and try again.'));
          }
          recognition.stop();
        };

        // Set a timeout to prevent hanging
        recognitionTimeout = setTimeout(() => {
          recognition.stop();
          reject(new Error('Speech recognition timed out. Please try again.'));
        }, 10000); // 10 seconds timeout

        // Create an audio element and play the blob
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audio.onended = () => {
          recognition.stop();
        };
        audio.play();
        recognition.start();
      });

      // Truncate transcription if too long
      const maxTranscriptionLength = 2000;
      const truncatedTranscription = transcription.length > maxTranscriptionLength 
        ? transcription.slice(0, maxTranscriptionLength) + "..."
        : transcription;

      const response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Convert spoken math to written mathematical expressions. Be concise."
          },
          {
            role: "user",
            content: truncatedTranscription
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 500
      });

      const improvedTranscription = response.choices[0].message.content;
      console.log("Improved transcription:", improvedTranscription);

      if (!improvedTranscription || improvedTranscription.trim().length === 0) {
        throw new Error('No valid mathematical expression detected. Please try speaking more clearly.');
      }

      // Clean up the transcription
      const cleanedTranscription = improvedTranscription
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/(\d+)x/g, '$1*x')
        .replace(/\^(\d+)/g, '^{$1}')
        .replace(/sqrt/g, '\\sqrt');

      return cleanedTranscription;

    } catch (error) {
      console.error("Error in transcribeAudio:", error);
      if (error instanceof Error && error.message.includes("rate_limit_exceeded")) {
        toast.error("Processing limit reached. Please try with a shorter recording.");
        throw new Error("Processing limit reached");
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to process audio');
    }
  },

  convertToLatex: async (text: string): Promise<string> => {
    try {
      const response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a math expert specializing in LaTeX conversion.
            Convert mathematical expressions to proper LaTeX format.
            Examples:
            - "x^2 + 5" → "$x^2 + 5$"
            - "√16" → "$\\sqrt{16}$"
            - "2x - 3 = 7" → "$2x - 3 = 7$"
            - "∫x^2 dx" → "$\\int x^2 dx$"
            - "lim(x→∞) 1/x" → "$\\lim_{x \\to \\infty} \\frac{1}{x}$"
            Return only the LaTeX expression without any explanation.`
          },
          {
            role: "user",
            content: text
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 100
      });

      return response.choices[0].message.content || text;
    } catch (error) {
      console.error("Error converting to LaTeX:", error);
      return text;
    }
  }
};

// Unit conversion function
export const convertUnits = async (value: number, fromUnit: string, toUnit: string): Promise<number> => {
  try {
    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a precise mathematical unit converter. You will:
          1. Convert the given value between units accurately
          2. Return ONLY the numeric result, no text
          3. Use standard conversion formulas
          4. Handle edge cases and invalid conversions
          5. Maintain precision to 4 decimal places`
        },
        {
          role: "user",
          content: `Convert ${value} ${fromUnit} to ${toUnit}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 100,
    });

    const result = response.choices[0].message.content;
    return parseFloat(result || "0");
  } catch (error) {
    console.error("Error in unit conversion:", error);
    throw new Error("Failed to convert units");
  }
};

// Generate graph data
export const generateGraphData = async (expression: string, range: { start: number; end: number; step: number }): Promise<{ x: number; y: number }[]> => {
  try {
    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a mathematical graphing assistant. You will:
          1. Generate coordinate points for mathematical expressions
          2. Return a valid JSON array of {x, y} points
          3. Handle various mathematical functions and operators
          4. Account for domain restrictions and asymptotes
          5. Return enough points for smooth plotting
          
          Example output format:
          [{"x": -1, "y": 1}, {"x": 0, "y": 0}, {"x": 1, "y": 1}]`
        },
        {
          role: "user",
          content: `Generate coordinate points for the expression: ${expression}
          Range: x from ${range.start} to ${range.end} with step ${range.step}
          Return only the JSON array, no explanation.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 2000,
    });

    const result = response.choices[0].message.content;
    return JSON.parse(result || "[]");
  } catch (error) {
    console.error("Error generating graph data:", error);
    throw new Error("Failed to generate graph data");
  }
};

// Helper function to escape LaTeX for JSON
function escapeLatex(latex: string): string {
  return latex.replace(/\\/g, '\\\\');
}

// Helper function to unescape LaTeX after JSON parsing
function unescapeLatex(latex: string): string {
  return latex.replace(/\\\\/g, '\\');
}

// Helper function to safely parse JSON with LaTeX content
function parseLatexJson(jsonString: string) {
  try {
    // First attempt: direct parse
    return JSON.parse(jsonString);
  } catch (firstError) {
    try {
      // Second attempt: clean up the string
      const cleaned = jsonString
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .trim()
        // Handle array brackets in strings
        .replace(/\[\[(.*?)\]\]/g, (match) => match.replace(/\[/g, '\\[').replace(/\]/g, '\\]'))
        // Handle other special characters
        .replace(/\\/g, '\\\\')
        .replace(/\[\[/g, '[')
        .replace(/\]\]/g, ']');

      return JSON.parse(cleaned);
    } catch (secondError) {
      // Third attempt: more aggressive cleaning
      try {
        const aggressive = jsonString
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return JSON.parse(aggressive);
      } catch (thirdError) {
        // If all attempts fail, return a default structure
        console.error('Error parsing LaTeX JSON:', thirdError);
        console.log('Problematic JSON string:', jsonString);
        return {
          topic: "Matrices",
          definition: "A rectangular array of numbers arranged in rows and columns.",
          keyPoints: [
            "Dimensions: rows × columns",
            "Operations: add, subtract, multiply",
            "Types: square, identity, zero matrices",
            "Used for solving systems of equations",
            "Key properties: determinant, inverse"
          ],
          example: {
            problem: "Basic matrix addition",
            solution: "Simple step-by-step solution"
          },
          relatedTopics: [
            "Linear Algebra",
            "Vector Spaces",
            "Systems of Equations"
          ]
        };
      }
    }
  }
}

// Helper function to clean and format LaTeX content
export const formatLatexContent = (content: string): string => {
  // First, unescape double backslashes
  const unescaped = content.replace(/\\\\/g, '\\');
  
  // Split into sections (assuming each rule is separated by newlines)
  const sections = unescaped.split('\n\n').filter(section => section.trim());
  
  // Process each section
  const formattedSections = sections.map(section => {
    // Extract title (first line)
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    // Find the main formula (usually after "Formula:" or similar)
    const formulaLine = lines.find(line => line.toLowerCase().includes('formula:'));
    const formula = formulaLine ? formulaLine.split(':')[1].trim() : '';
    
    // Find the explanation (usually after "Explanation:" or similar)
    const explanationLine = lines.find(line => line.toLowerCase().includes('explanation:'));
    const explanation = explanationLine ? explanationLine.split(':')[1].trim() : '';
    
    // Find the example (usually after "Example:" or similar)
    const exampleLine = lines.find(line => line.toLowerCase().includes('example:'));
    const example = exampleLine ? exampleLine.split(':')[1].trim() : '';
    
    // Format the section in Markdown
    return `## ${title}

**Formula:**
$$${formula}$$

**Explanation:**
${explanation}

**Example:**
$$${example}$$

---`;
  });
  
  return formattedSections.join('\n\n');
};

// Helper function to convert LaTeX to plain text
export const latexToPlainText = (content: string): string => {
  // Common LaTeX to plain text conversions
  const replacements = {
    '\\\\frac\\{([^}]+)\\}\\{([^}]+)\\}': '$1/$2',
    '\\\\theta': 'θ',
    '\\\\sin': 'sin',
    '\\\\cos': 'cos',
    '\\\\tan': 'tan',
    '\\\\sqrt\\{([^}]+)\\}': 'sqrt($1)',
    '\\\\pi': 'π',
    '\\\\infty': '∞',
    '\\\\cdot': '·',
    '\\\\times': '×',
    '\\\\div': '÷',
    '\\\\pm': '±',
    '\\\\approx': '≈',
    '\\\\neq': '≠',
    '\\\\leq': '≤',
    '\\\\geq': '≥',
    '\\\\rightarrow': '→',
    '\\\\leftarrow': '←',
    '\\\\Rightarrow': '⇒',
    '\\\\Leftarrow': '⇐',
    '\\\\leftrightarrow': '↔',
    '\\\\Leftrightarrow': '⇔',
    '\\\\sum': 'Σ',
    '\\\\prod': 'Π',
    '\\\\int': '∫',
    '\\\\partial': '∂',
    '\\\\nabla': '∇',
    '\\\\alpha': 'α',
    '\\\\beta': 'β',
    '\\\\gamma': 'γ',
    '\\\\delta': 'δ',
    '\\\\epsilon': 'ε',
    '\\\\zeta': 'ζ',
    '\\\\eta': 'η',
    '\\\\lambda': 'λ',
    '\\\\mu': 'μ',
    '\\\\nu': 'ν',
    '\\\\xi': 'ξ',
    '\\\\rho': 'ρ',
    '\\\\sigma': 'σ',
    '\\\\tau': 'τ',
    '\\\\phi': 'φ',
    '\\\\chi': 'χ',
    '\\\\psi': 'ψ',
    '\\\\omega': 'ω',
    '\\\\Delta': 'Δ',
    '\\\\Gamma': 'Γ',
    '\\\\Theta': 'Θ',
    '\\\\Lambda': 'Λ',
    '\\\\Xi': 'Ξ',
    '\\\\Pi': 'Π',
    '\\\\Sigma': 'Σ',
    '\\\\Phi': 'Φ',
    '\\\\Psi': 'Ψ',
    '\\\\Omega': 'Ω'
  };

  // Remove markdown formatting
  let text = content
    .replace(/##\s*/g, '')
    .replace(/\*\*Formula:\*\*\s*/, '')
    .replace(/\$\$?/g, '')
    .replace(/\*\*/g, '');

  // Apply LaTeX to plain text conversions
  for (const [pattern, replacement] of Object.entries(replacements)) {
    text = text.replace(new RegExp(pattern, 'g'), replacement);
  }

  // Clean up any remaining LaTeX commands
  text = text.replace(/\\[a-zA-Z]+/g, '');
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};

// Update the getFormula function to use the new formatting
export const getFormula = async (topic: string): Promise<{ name: string; formula: string; description: string; example: string }[]> => {
  try {
    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a mathematical formula expert. Return a JSON array of formulas.
          Each formula must include: name, formula (in LaTeX), description, and example.
          
          Format your response EXACTLY like this, with no additional text:
          {
            "formulas": [
              {
                "name": "Formula Name",
                "formula": "LaTeX Formula",
                "description": "Clear description",
                "example": "Example"
              }
            ]
          }
          
          Important:
          1. Keep LaTeX simple and avoid complex nesting
          2. Use basic LaTeX commands only
          3. Escape special characters properly
          4. Return ONLY the JSON object`
        },
        {
          role: "user",
          content: `Provide formulas related to: ${topic}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2000,
    });

    const result = response.choices[0].message.content;
    if (!result) return [];

    // Clean up the response
    const cleaned = result
      .trim()
      .replace(/^[^{]*(\{)/, '$1')
      .replace(/}[^}]*$/, '}')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/\s+/g, ' ');

    try {
      const parsed = parseLatexJson(cleaned);
      const formulas = Array.isArray(parsed.formulas) ? parsed.formulas : [];
      
      // Format each formula's content
      return formulas.map(formula => ({
        ...formula,
        formula: latexToPlainText(formula.formula),
        example: latexToPlainText(formula.example)
      }));
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Fallback: Try to extract formulas using regex
      const formulas = [];
      const formulaMatches = cleaned.matchAll(/"name":\s*"([^"]+)".*?"formula":\s*"([^"]+)".*?"description":\s*"([^"]+)".*?"example":\s*"([^"]+)"/g);
      
      for (const match of formulaMatches) {
        formulas.push({
          name: match[1],
          formula: latexToPlainText(match[2]),
          description: match[3],
          example: latexToPlainText(match[4])
        });
      }
      
      return formulas;
    }
  } catch (error) {
    console.error("Error fetching formulas:", error);
    return [];
  }
};

// Helper function to format educational content
export const formatEducationalContent = (topic: string, content: any): {
  topic: string;
  definition: string;
  keyPoints: string[];
  example: {
    problem: string;
    solution: string;
  };
  relatedTopics: string[];
} => {
  // Default content for Matrices if none provided
  const defaultContent = {
    topic: "Matrices",
    definition: "A rectangular array of numbers arranged in rows and columns, used in linear algebra and various applications.",
    keyPoints: [
      "Dimensions: rows × columns",
      "Operations: add, subtract, multiply",
      "Types: square, identity, zero matrices",
      "Used for solving systems of equations",
      "Key properties: determinant, inverse"
    ],
    example: {
      problem: "Add matrices A = [1 2] and B = [5 6]\n    [3 4]      [7 8]",
      solution: "A + B = [6 8]\n        [10 12]"
    },
    relatedTopics: [
      "Linear Algebra",
      "Vector Spaces",
      "Systems of Equations",
      "Determinants",
      "Eigenvalues"
    ]
  };

  const data = content || defaultContent;

  return {
    topic: data.topic,
    definition: data.definition,
    keyPoints: data.keyPoints,
    example: data.example,
    relatedTopics: data.relatedTopics
  };
};

// Update the exploreTopic function to use the new formatting
export const exploreTopic = async (topic: string): Promise<{
  topic: string;
  definition: string;
  keyPoints: string[];
  example: {
    problem: string;
    solution: string;
  };
  relatedTopics: string[];
}> => {
  try {
    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Create a structured educational explanation for the topic. Return a JSON object with the following format:

{
  "topic": "Topic Name",
  "definition": "Concise definition",
  "keyPoints": [
    "Point 1",
    "Point 2",
    "Point 3",
    "Point 4"
  ],
  "example": {
    "problem": "Example problem",
    "solution": "Example solution"
  },
  "relatedTopics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ]
}

Keep the content concise and easy to read. Each section should be independent and clearly formatted.`
        },
        {
          role: "user",
          content: `Create educational content for: ${topic}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2000,
    });

    const result = response.choices[0].message.content;
    if (!result) {
      return formatEducationalContent(topic, null);
    }

    // Clean and parse the response
    const cleaned = result
      .trim()
      .replace(/^[^{]*(\{)/, '$1')
      .replace(/}[^}]*$/, '}')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/\s+/g, ' ');

    try {
      const parsed = parseLatexJson(cleaned);
      return formatEducationalContent(topic, parsed);
    } catch (parseError) {
      return formatEducationalContent(topic, null);
    }
  } catch (error) {
    console.error("Error exploring topic:", error);
    return formatEducationalContent(topic, null);
  }
};
