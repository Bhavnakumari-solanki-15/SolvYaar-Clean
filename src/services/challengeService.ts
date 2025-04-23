import { Groq } from "groq-sdk";
import { Challenge, ChallengeFormat } from "@/types/challenges";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

interface GeneratedChallenge extends Challenge {
  generatedContent: any;
}

interface GroqCompletion {
  choices: Array<{
    message?: {
      content: string | null;
    };
  }>;
}

// Cache for generated challenges with timestamp
const challengeCache = new Map<string, {
  content: any;
  timestamp: number;
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Types for predefined challenges
interface PredefinedChallengeContent {
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  concept?: string;
  hints?: string[];
  hint?: string;
  explanation?: string;
}

interface PredefinedChallengesByCategory {
  [category: string]: PredefinedChallengeContent;
}

type PredefinedChallengesByFormat = Partial<Record<ChallengeFormat, PredefinedChallengesByCategory>>;

// Predefined challenge responses
const PREDEFINED_CHALLENGES: PredefinedChallengesByFormat = {
  'build-meme': {
    'probability': {
      question: "Which of these meme concepts best explains the concept of conditional probability?",
      concept: "Conditional probability, which is the probability of an event occurring given that another event has occurred",
      options: [
        {
          id: "A",
          text: "A meme showing a person trying to find a specific book in a library, with the caption 'Finding the book I want is easy, but finding it in the right section is conditional on it being in the library first'. This meme uses a relatable scenario to illustrate how conditional probability works.",
          isCorrect: true,
          explanation: "This works well because it uses a everyday scenario to illustrate the concept of conditional probability, making it easy for people to understand the idea that the probability of an event is affected by the occurrence of another event."
        },
        {
          id: "B",
          text: "A meme with a picture of a coin flip, saying 'Heads or tails, it's all just probability'. This meme tries to explain probability in general but doesn't specifically address conditional probability.",
          isCorrect: false,
          explanation: "This isn't as effective because it doesn't specifically illustrate the concept of conditional probability, instead focusing on probability in general."
        },
        {
          id: "C",
          text: "A meme showing a flowchart with many conditional statements, but without a clear connection to probability. This meme tries to use a technical approach but fails to make it accessible.",
          isCorrect: false,
          explanation: "This doesn't work because it uses a technical approach that may be confusing to those without a background in probability or programming, and it doesn't provide a clear illustration of the concept."
        },
        {
          id: "D",
          text: "A meme with a picture of a person getting stuck in a loop of conditional statements, with the caption 'Conditional probability: where you get stuck in a never-ending loop'. This meme tries to be humorous but doesn't provide a clear explanation of the concept.",
          isCorrect: false,
          explanation: "This misses the mark because while it tries to be humorous, it doesn't provide a clear explanation of conditional probability and may confuse people who are trying to understand the concept."
        }
      ],
      hints: [
        "Think about how to visualize the concept of one event affecting the probability of another event",
        "Consider what makes a meme both funny and educational for explaining conditional probability",
        "Focus on the key idea that conditional probability is about how the occurrence of one event changes the probability of another event"
      ]
    }
  },
  'error-spotting': {
    'probability': {
      question: "A student claims that if a coin is flipped three times, the probability of getting at least two heads is calculated as follows: 'The probability of getting exactly two heads is (1/2)^2 * (1/2)^1 = 1/8, and the probability of getting exactly three heads is (1/2)^3 = 1/8. Therefore, the probability of getting at least two heads is 1/8 + 1/8 = 1/4.' Identify the mistake in the student's reasoning.",
      options: [
        {
          id: "A",
          text: "The student incorrectly calculated the probability of getting exactly two heads.",
          isCorrect: false,
          explanation: "The calculation of (1/2)^2 * (1/2)^1 = 1/8 for exactly two heads is correct for a single sequence."
        },
        {
          id: "B",
          text: "The student did not consider all the possible ways to get exactly two heads.",
          isCorrect: true,
          explanation: "The student failed to account for all three possible sequences (HHT, HTH, THH) that give exactly two heads."
        },
        {
          id: "C",
          text: "The student incorrectly calculated the probability of getting exactly three heads.",
          isCorrect: false,
          explanation: "The calculation of (1/2)^3 = 1/8 for exactly three heads is correct."
        },
        {
          id: "D",
          text: "The student used the wrong formula to calculate the probabilities.",
          isCorrect: false,
          explanation: "The basic probability formulas used are correct, but the student missed counting all possible sequences."
        }
      ],
      hint: "Consider how many different sequences of heads and tails can result in exactly two heads when a coin is flipped three times.",
      explanation: "The student's mistake is in not considering all the possible ways to get exactly two heads. There are three ways to get exactly two heads: HHT, HTH, and THH. Each of these has a probability of (1/2)^3 = 1/8. So, the total probability of getting exactly two heads is 3 * (1/8) = 3/8. The probability of getting exactly three heads is indeed 1/8. Therefore, the probability of getting at least two heads is 3/8 + 1/8 = 4/8 = 1/2. The student's error was in not accounting for all the different ways to achieve exactly two heads."
    }
  }
};

const generatePromptForFormat = (format: ChallengeFormat, category: string): string => {
  switch (format) {
    case 'error-spotting':
      return `Generate a challenging ${category} problem with a common mistake that students make. The response should be in this format:
      {
        "question": "The problem statement containing an error in ${category} calculation",
        "options": [
          {
            "id": "A",
            "text": "First possible error explanation",
            "isCorrect": false
          },
          {
            "id": "B",
            "text": "Second possible error explanation",
            "isCorrect": true
          },
          {
            "id": "C",
            "text": "Third possible error explanation",
            "isCorrect": false
          },
          {
            "id": "D",
            "text": "Fourth possible error explanation",
            "isCorrect": false
          }
        ],
        "hint": "A helpful hint about what to look for in the ${category} calculation",
        "explanation": "Detailed explanation of why the correct answer is right"
      }`;

    case 'reverse':
      return `Generate a ${category} scenario creation challenge. The response should be in this format:
      {
        "question": "Create a scenario that results in a specific ${category} outcome. Which of these scenarios correctly matches this requirement?",
        "options": [
          {
            "id": "A",
            "text": "A detailed scenario description that results in the correct ${category} outcome",
            "isCorrect": true,
            "explanation": "This works because..."
          },
          {
            "id": "B",
            "text": "A similar but incorrect scenario",
            "isCorrect": false,
            "explanation": "This doesn't work because..."
          },
          {
            "id": "C",
            "text": "Another incorrect scenario",
            "isCorrect": false,
            "explanation": "This is wrong because..."
          },
          {
            "id": "D",
            "text": "A fourth scenario option",
            "isCorrect": false,
            "explanation": "This isn't correct because..."
          }
        ],
        "hints": [
          "Think about different ways to approach this ${category} problem",
          "Consider real-world situations where you can apply ${category} concepts",
          "Remember to verify your solution carefully"
        ]
      }`;

    case 'logic-story':
      return `Create a real-world ${category} story problem. The response should be in this format:
      {
        "question": "A detailed ${category} story problem in a real-world context",
        "context": "Additional background information if needed",
        "options": [
          {
            "id": "A",
            "text": "First possible solution with calculation",
            "isCorrect": true,
            "explanation": "This is correct because..."
          },
          {
            "id": "B",
            "text": "Second possible solution",
            "isCorrect": false,
            "explanation": "This is incorrect because..."
          },
          {
            "id": "C",
            "text": "Third possible solution",
            "isCorrect": false,
            "explanation": "This is wrong because..."
          },
          {
            "id": "D",
            "text": "Fourth possible solution",
            "isCorrect": false,
            "explanation": "This isn't right because..."
          }
        ],
        "hints": [
          "First hint about approaching the ${category} problem",
          "Second hint about key ${category} concepts",
          "Final hint about common mistakes to avoid in ${category}"
        ]
      }`;

    case 'build-meme':
      return `Create a ${category} concept meme challenge. The response should be in this format:
      {
        "question": "Which of these meme concepts best explains the given ${category} concept?",
        "concept": "The ${category} concept to be explained",
        "options": [
          {
            "id": "A",
            "text": "First meme concept description",
            "isCorrect": true,
            "explanation": "This works well because..."
          },
          {
            "id": "B",
            "text": "Second meme concept",
            "isCorrect": false,
            "explanation": "This isn't as effective because..."
          },
          {
            "id": "C",
            "text": "Third meme concept",
            "isCorrect": false,
            "explanation": "This doesn't work because..."
          },
          {
            "id": "D",
            "text": "Fourth meme concept",
            "isCorrect": false,
            "explanation": "This misses the mark because..."
          }
        ],
        "hints": [
          "Think about how to visualize this ${category} concept",
          "Consider what makes a meme both funny and educational for ${category}",
          "Focus on the key ${category} idea"
        ]
      }`;

    case 'choose-path':
      return `Create a ${category} path-choice problem. The response should be in this format:
      {
        "question": "Initial ${category} scenario with multiple possible approaches",
        "options": [
          {
            "id": "A",
            "text": "First approach description",
            "isCorrect": true,
            "explanation": "This is the best approach because...",
            "subProblem": "Follow-up question for this path"
          },
          {
            "id": "B",
            "text": "Second approach description",
            "isCorrect": false,
            "explanation": "This approach is less effective because...",
            "subProblem": "Alternative follow-up question"
          },
          {
            "id": "C",
            "text": "Third approach description",
            "isCorrect": false,
            "explanation": "This approach isn't ideal because...",
            "subProblem": "Another follow-up question"
          }
        ],
        "hints": [
          "Consider which approach best suits this ${category} problem",
          "Think about the implications of each method in ${category}",
          "Look for the most mathematically sound method for ${category}"
        ]
      }`;

    case 'proof-walkthrough':
      return `Create a ${category} proof challenge. The response should be in this format:
      {
        "question": "Prove the following ${category} statement",
        "statement": "The ${category} statement to prove",
        "options": [
          {
            "id": "A",
            "text": "First proof step explanation",
            "isCorrect": true,
            "explanation": "This is the correct next step because..."
          },
          {
            "id": "B",
            "text": "Second possible step",
            "isCorrect": false,
            "explanation": "This step is incorrect because..."
          },
          {
            "id": "C",
            "text": "Third possible step",
            "isCorrect": false,
            "explanation": "This step is wrong because..."
          },
          {
            "id": "D",
            "text": "Fourth possible step",
            "isCorrect": false,
            "explanation": "This step doesn't work because..."
          }
        ],
        "hints": [
          "Think about the fundamental principles of ${category}",
          "Consider what needs to be proven first in this ${category} proof",
          "Look for logical connections in ${category}"
        ]
      }`;

    case 'debate-prompt':
      return `Create a ${category} debate challenge. The response should be in this format:
      {
        "question": "Do you agree or disagree with the following ${category} statement?",
        "statement": "A controversial ${category} statement",
        "options": [
          {
            "id": "A",
            "text": "Agree with detailed reasoning",
            "isCorrect": true,
            "explanation": "This is the best argument because..."
          },
          {
            "id": "B",
            "text": "Disagree with detailed reasoning",
            "isCorrect": false,
            "explanation": "This argument is flawed because..."
          },
          {
            "id": "C",
            "text": "Partially agree with conditions",
            "isCorrect": false,
            "explanation": "This perspective misses..."
          },
          {
            "id": "D",
            "text": "Alternative interpretation",
            "isCorrect": false,
            "explanation": "This interpretation is incorrect because..."
          }
        ],
        "hints": [
          "Consider the ${category} principles involved",
          "Think about edge cases in ${category}",
          "Look for logical fallacies in ${category} reasoning"
        ]
      }`;

    case 'visual-puzzle':
      return `Create a visual ${category} puzzle. The response should be in this format:
      {
        "question": "Given the ${category} diagram, which approach is most appropriate?",
        "diagram": "Description of the visual ${category} diagram",
        "options": [
          {
            "id": "A",
            "text": "First approach description with calculation",
            "isCorrect": true,
            "explanation": "This approach is best because..."
          },
          {
            "id": "B",
            "text": "Second approach description",
            "isCorrect": false,
            "explanation": "This approach is less effective because..."
          },
          {
            "id": "C",
            "text": "Third approach description",
            "isCorrect": false,
            "explanation": "This approach is incorrect because..."
          },
          {
            "id": "D",
            "text": "Fourth approach description",
            "isCorrect": false,
            "explanation": "This approach doesn't work because..."
          }
        ],
        "hints": [
          "Analyze the ${category} diagram carefully",
          "Consider all aspects of the ${category} problem",
          "Think about the relationships shown in the diagram"
        ]
      }`;

    default:
      return `Generate a ${category} practice problem with multiple choice options. The response should be in this format:
      {
        "question": "A clear ${category} problem statement",
        "options": [
          {
            "id": "A",
            "text": "First possible answer",
            "isCorrect": true,
            "explanation": "Why this is correct"
          },
          {
            "id": "B",
            "text": "Second possible answer",
            "isCorrect": false,
            "explanation": "Why this is wrong"
          },
          {
            "id": "C",
            "text": "Third possible answer",
            "isCorrect": false,
            "explanation": "Why this is incorrect"
          },
          {
            "id": "D",
            "text": "Fourth possible answer",
            "isCorrect": false,
            "explanation": "Why this isn't right"
          }
        ],
        "hints": [
          "First helpful hint about ${category}",
          "Second helpful hint about ${category}",
          "Final hint about ${category}"
        ]
      }`;
  }
};

export const generateChallenge = async (challenge: Challenge): Promise<GeneratedChallenge> => {
  try {
    // Check if we have a predefined challenge for this format and category
    const predefinedChallenge = PREDEFINED_CHALLENGES[challenge.format]?.[challenge.category];
    if (predefinedChallenge) {
      return {
        ...challenge,
        generatedContent: predefinedChallenge
      };
    }

    // If no predefined challenge exists, generate one using the AI
    const formatContext = `Create a unique ${challenge.category} challenge for ${challenge.format} format`;
    const prompt = generatePromptForFormat(challenge.format, challenge.category);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a mathematics education expert specializing in ${challenge.category} and creating engaging educational math challenges. Each challenge must be unique and tailored to the specific format and category. Focus specifically on ${challenge.category} concepts and principles. Provide responses in valid JSON format without any markdown formatting or code blocks.`
        },
        {
          role: "user",
          content: `${formatContext}. ${prompt}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    }) as GroqCompletion;

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) throw new Error("No response from AI");

    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned response:', cleanedResponse);
      
      const parsedResponse = JSON.parse(cleanedResponse);
      
      if (!parsedResponse.question || !parsedResponse.options) {
        throw new Error("Invalid response format: missing required fields");
      }

      const hasCorrectOption = parsedResponse.options.some((opt: any) => opt.isCorrect);
      if (!hasCorrectOption) {
        throw new Error("Invalid response format: no correct option provided");
      }
      
      return {
        ...challenge,
        generatedContent: parsedResponse
      };
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      console.error("Raw response:", aiResponse);
      throw new Error("Invalid response format from AI");
    }

  } catch (error) {
    console.error("Error generating challenge:", error);
    throw error;
  }
};

export const verifyAnswer = async (challenge: Challenge & { generatedContent: any }, userResponse: string) => {
  try {
    console.log('Verifying answer:', { userResponse, challengeContent: challenge.generatedContent });
    
    // For multiple choice questions, directly verify against the options
    if (challenge.generatedContent?.options) {
      const selectedOption = challenge.generatedContent.options.find(
        (option: any) => option.id === userResponse
      );

      if (!selectedOption) {
        return {
          isCorrect: false,
          score: 0,
          feedback: "Please select a valid option.",
          hint: "Make sure to select one of the available options.",
          explanation: "No answer was selected."
        };
      }

      return {
        isCorrect: selectedOption.isCorrect,
        score: selectedOption.isCorrect ? 100 : 0,
        feedback: selectedOption.explanation || (selectedOption.isCorrect ? "Correct!" : "Incorrect. Try again."),
        hint: selectedOption.isCorrect ? null : (challenge.generatedContent.hints?.[0] || "Try reviewing the question again."),
        explanation: selectedOption.explanation || "No detailed explanation available."
      };
    }

    // For other types of questions, use AI verification
    const prompt = `Verify this student's answer for a ${challenge.format} challenge in ${challenge.category}.
    
Challenge: ${JSON.stringify(challenge.generatedContent)}

Student's Response: ${userResponse}

Provide your response in this format:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedback": "Detailed feedback explaining what was good and what needs improvement",
  "hint": "A helpful hint if the answer was incorrect",
  "explanation": "Detailed explanation of the correct approach"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a mathematics education expert specializing in evaluating student responses. Be thorough but encouraging in your feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    }) as GroqCompletion;

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) throw new Error("No response from AI");

    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      console.error("Raw AI response:", aiResponse);
      throw new Error("Invalid response format from AI");
    }
  } catch (error) {
    console.error("Error in verifyAnswer:", error);
    throw error;
  }
}; 