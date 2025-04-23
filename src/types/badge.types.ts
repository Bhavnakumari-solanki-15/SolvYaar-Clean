export type BadgeCategory = 
  | 'algebra' 
  | 'geometry' 
  | 'trigonometry' 
  | 'calculus' 
  | 'statistics' 
  | 'arithmetic'
  | 'linear_algebra'
  | 'number_theory'
  | 'discrete_math'
  | 'set_theory'
  | 'transformations';

export interface Badge {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
}

export interface BadgeStyle {
  light: {
    background: string;
    border: string;
    icon: string;
    text: string;
    glow: string;
  };
  dark: {
    background: string;
    border: string;
    icon: string;
    text: string;
    glow: string;
  };
}

export interface BadgeConfig {
  name: string;
  description: string;
  icon: string;
  style: BadgeStyle;
  category: BadgeCategory;
}

export interface UserBadges {
  userId: string;
  badges: Badge[];
}

export const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  algebra: {
    name: 'Algebra Ace',
    description: 'Master of algebraic concepts',
    icon: '🧠',
    style: {
      light: {
        background: 'bg-gradient-to-br from-violet-400 to-purple-600 p-3 rounded-full ring-4 ring-violet-200',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-black font-bold tracking-wide',
        glow: 'shadow-lg shadow-violet-500/30'
      },
      dark: {
        background: 'bg-gradient-to-br from-violet-600 to-purple-800 p-3 rounded-full ring-4 ring-violet-900/50',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-white font-bold tracking-wide',
        glow: 'shadow-lg shadow-violet-500/50'
      }
    },
    category: 'algebra'
  },
  geometry: {
    name: 'Geometry Genius',
    description: 'Master of geometric concepts',
    icon: '📐',
    style: {
      light: {
        background: 'bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-full ring-4 ring-orange-200',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-black font-bold tracking-wide',
        glow: 'shadow-lg shadow-orange-500/30'
      },
      dark: {
        background: 'bg-gradient-to-br from-orange-600 to-red-700 p-3 rounded-full ring-4 ring-orange-900/50',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-white font-bold tracking-wide',
        glow: 'shadow-lg shadow-orange-500/50'
      }
    },
    category: 'geometry'
  },
  trigonometry: {
    name: 'Trig Titan',
    description: 'Master of trigonometric concepts',
    icon: '📏',
    style: {
      light: {
        background: 'bg-gradient-to-br from-amber-400 to-yellow-500 p-3 rounded-full ring-4 ring-amber-200',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-black font-bold tracking-wide',
        glow: 'shadow-lg shadow-amber-500/30'
      },
      dark: {
        background: 'bg-gradient-to-br from-amber-600 to-yellow-700 p-3 rounded-full ring-4 ring-amber-900/50',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-white font-bold tracking-wide',
        glow: 'shadow-lg shadow-amber-500/50'
      }
    },
    category: 'trigonometry'
  },
  calculus: {
    name: 'Calculus Champion',
    description: 'Master of calculus concepts',
    icon: '∫',
    style: {
      light: {
        background: 'bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-full ring-4 ring-emerald-200',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-black font-bold tracking-wide',
        glow: 'shadow-lg shadow-emerald-500/30'
      },
      dark: {
        background: 'bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-full ring-4 ring-emerald-900/50',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-white font-bold tracking-wide',
        glow: 'shadow-lg shadow-emerald-500/50'
      }
    },
    category: 'calculus'
  },
  statistics: {
    name: 'Statistics Star',
    description: 'Master of statistical concepts',
    icon: '📊',
    style: {
      light: {
        background: 'bg-gradient-to-br from-blue-400 to-cyan-500 p-3 rounded-full ring-4 ring-blue-200',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-black font-bold tracking-wide',
        glow: 'shadow-lg shadow-blue-500/30'
      },
      dark: {
        background: 'bg-gradient-to-br from-blue-600 to-cyan-700 p-3 rounded-full ring-4 ring-blue-900/50',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-white font-bold tracking-wide',
        glow: 'shadow-lg shadow-blue-500/50'
      }
    },
    category: 'statistics'
  },
  transformations: {
    name: 'Transformation Wizard',
    description: 'Master of geometric transformations',
    icon: '🔄',
    style: {
      light: {
        background: 'bg-gradient-to-br from-pink-400 to-purple-500 p-3 rounded-full ring-4 ring-pink-200',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-black font-bold tracking-wide',
        glow: 'shadow-lg shadow-pink-500/30'
      },
      dark: {
        background: 'bg-gradient-to-br from-pink-600 to-purple-700 p-3 rounded-full ring-4 ring-pink-900/50',
        border: 'border-none',
        icon: 'text-4xl',
        text: 'text-white font-bold tracking-wide',
        glow: 'shadow-lg shadow-pink-500/50'
      }
    },
    category: 'transformations'
  }
}; 