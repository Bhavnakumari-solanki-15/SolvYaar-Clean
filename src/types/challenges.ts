export type ChallengeFormat = 
  | 'reverse'
  | 'error-spotting'
  | 'logic-story'
  | 'build-meme'
  | 'choose-path'
  | 'proof-walkthrough'
  | 'debate-prompt'
  | 'visual-puzzle';

export type ChallengeCategory = 
  | 'probability' 
  | 'statistics' 
  | 'algebra' 
  | 'geometry';

export type ResponseFormat = 
  | 'textbox'
  | 'long_text'
  | 'multiple_choice'
  | 'table'
  | 'single_number'
  | 'visual_interactive';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  format: ChallengeFormat;
  category: ChallengeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit?: number;
  icon?: string;
  isLocked: boolean;
  progress: number;
  responseFormat: ResponseFormat;
  taskPrompt?: string;
  options?: {
    id: string;
    text: string;
    isCorrect?: boolean;
  }[];
  targetValues?: {
    mean?: number;
    median?: number;
    mode?: number[];
  };
  dataset?: {
    input: any;
    output: any;
  };
}

export const CHALLENGE_FORMATS: Record<ChallengeFormat, { 
  icon: string; 
  color: string;
  description: string;
  defaultResponseFormat: ResponseFormat;
  level: 1 | 2;
}> = {
  'reverse': { 
    icon: '🔄',
    color: 'from-blue-500 to-purple-500',
    description: 'Create your own scenario with specific probability',
    defaultResponseFormat: 'long_text',
    level: 1
  },
  'error-spotting': { 
    icon: '🎯',
    color: 'from-red-500 to-pink-500',
    description: 'Find and explain probability mistakes',
    defaultResponseFormat: 'textbox',
    level: 1
  },
  'logic-story': { 
    icon: '🎭',
    color: 'from-green-500 to-teal-500',
    description: 'Solve real-world probability puzzles',
    defaultResponseFormat: 'long_text',
    level: 1
  },
  'build-meme': { 
    icon: '🎨',
    color: 'from-yellow-500 to-orange-500',
    description: 'Create memes to explain probability concepts',
    defaultResponseFormat: 'visual_interactive',
    level: 1
  },
  'choose-path': { 
    icon: '🔀',
    color: 'from-indigo-500 to-blue-500',
    description: 'Choose your approach to solve problems',
    defaultResponseFormat: 'multiple_choice',
    level: 2
  },
  'proof-walkthrough': { 
    icon: '📝',
    color: 'from-purple-500 to-pink-500',
    description: 'Walk through mathematical proofs',
    defaultResponseFormat: 'textbox',
    level: 2
  },
  'debate-prompt': { 
    icon: '💭',
    color: 'from-pink-500 to-rose-500',
    description: 'Debate mathematical concepts',
    defaultResponseFormat: 'long_text',
    level: 2
  },
  'visual-puzzle': { 
    icon: '🧩',
    color: 'from-cyan-500 to-blue-500',
    description: 'Solve visual math puzzles',
    defaultResponseFormat: 'visual_interactive',
    level: 2
  }
}; 