export type InputType = 'text' | 'image' | 'voice' | 'latex' | 'file';

export type ToolType = 
  | 'solver' 
  | 'calculator' 
  | 'unit-converter' 
  | 'graphing-tool' 
  | 'formula-sheet'
  | 'brain-booster'
  | 'practice'
  | 'physics-calculator'
  | 'chemistry-calculator';

export interface HistoryItem {
  id: string;
  user_id: string;
  tool_used: ToolType;
  input_type: InputType;
  topic?: string;
  content: {
    query: string;
    imageUrl?: string;
    audioUrl?: string;
    fileUrl?: string;
  };
  result: {
    solution: string;
    steps?: string[];
    error?: string;
  };
  created_at: string;
}

export interface GroupedHistory {
  today: HistoryItem[];
  yesterday: HistoryItem[];
  lastWeek: HistoryItem[];
  older: HistoryItem[];
}

export const INPUT_TYPE_ICONS: Record<InputType, string> = {
  text: '📝',
  image: '📷',
  voice: '🎤',
  latex: '∑',
  file: '📁'
};

export const TOOL_TYPE_ICONS: Record<ToolType, string> = {
  solver: '🔢',
  calculator: '🧮',
  'unit-converter': '📏',
  'graphing-tool': '📊',
  'formula-sheet': '📑',
  'brain-booster': '🧩',
  practice: '✏️',
  'physics-calculator': '⚡',
  'chemistry-calculator': '⚗️'
}; 