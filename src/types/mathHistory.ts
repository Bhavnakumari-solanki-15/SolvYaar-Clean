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

export interface MathHistoryItem {
  id: string;
  userId?: string;
  inputType: InputType;
  toolType: ToolType;
  timestamp: string;
  query: string;
  solution?: string;
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
}

export interface GroupedMathHistory {
  today: MathHistoryItem[];
  yesterday: MathHistoryItem[];
  lastWeek: MathHistoryItem[];
  older: MathHistoryItem[];
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