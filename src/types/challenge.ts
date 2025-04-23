export type ChallengeFormat = 
  | 'reverse' 
  | 'error-spotting' 
  | 'logic-story' 
  | 'build-meme' 
  | 'choose-path';

export type ChallengeCategory =
  | 'algebra'
  | 'geometry'
  | 'statistics'
  | 'calculus'
  | 'logic';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  format: ChallengeFormat;
  category: ChallengeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit: number;
  options?: string[];  // For multiple choice challenges
  target_values?: {    // For dataset challenges
    mean?: number;
    median?: number;
    mode?: number[];
  };
}

export interface ChallengeResponse {
  type: ChallengeFormat;
  content: string | number[] | { 
    imageUrl?: string;
    explanation?: string;
  };
  metadata?: {
    selectedOption?: string;
    datasetStats?: {
      mean: number;
      median: number;
      mode: number[];
    };
  };
} 