import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

interface PowerCard {
  id: string;
  user_id: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at: string;
  animation_type: string;
}

export const savePowerCard = async (card: Omit<PowerCard, 'id' | 'earned_at'>): Promise<PowerCard | null> => {
  try {
    // Check for duplicate card
    const { data: existingCard } = await supabase
      .from('power_cards')
      .select('*')
      .eq('user_id', card.user_id)
      .eq('title', card.title)
      .single();

    if (existingCard) {
      return existingCard;
    }

    // Save new card
    const { data, error } = await supabase
      .from('power_cards')
      .insert([card])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving power card:', error);
    return null;
  }
};

export const getUserPowerCards = async (userId: string): Promise<PowerCard[]> => {
  try {
    const { data, error } = await supabase
      .from('power_cards')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching power cards:', error);
    return [];
  }
};

export const getDailyChallenge = async (userId: string): Promise<{
  challenge: {
    problem: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    hints: string[];
  };
  completed: boolean;
} | null> => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has completed today's challenge
    const { data: completion } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', today.toISOString())
      .single();

    if (completion) {
      return {
        challenge: completion.challenge,
        completed: true
      };
    }

    // Get today's challenge
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('*')
      .gte('created_at', today.toISOString())
      .single();

    if (challenge) {
      return {
        challenge: challenge.challenge,
        completed: false
      };
    }

    // Generate new challenge if none exists
    const newChallenge = {
      challenge: {
        problem: 'Solve for x: 2x + 5 = 15',
        topic: 'Algebra',
        difficulty: 'easy',
        hints: ['Try isolating x', 'Remember to perform the same operation on both sides']
      },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('daily_challenges')
      .insert([newChallenge])
      .select()
      .single();

    if (error) throw error;
    return {
      challenge: data.challenge,
      completed: false
    };
  } catch (error) {
    console.error('Error getting daily challenge:', error);
    return null;
  }
}; 