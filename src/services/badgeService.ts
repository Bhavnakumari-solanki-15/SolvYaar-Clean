import { supabase } from '@/lib/supabase';
import { Badge, BadgeCategory, BADGE_CONFIGS } from '@/types/badge.types';

// Helper function to verify user session before making API calls
async function verifySession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error verifying session:', error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error('Error verifying session:', error);
    return false;
  }
}

export const badgeService = {
  async awardBadge(userId: string, category: BadgeCategory): Promise<Badge | null> {
    try {
      console.log('Attempting to award badge:', { userId, category });
      
      // Check session first
      const hasValidSession = await verifySession();
      if (!hasValidSession) {
        console.error('No valid session found when trying to award badge');
        return null;
      }
      
      // Check if user already has this badge
      const { data: existingBadges, error: existingError } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category);

      if (existingError) {
        console.error('Error checking existing badge:', existingError);
        console.error('Error details:', {
          message: existingError.message,
          details: existingError.details,
          hint: existingError.hint,
          code: existingError.code
        });
        return null;
      }

      if (existingBadges && existingBadges.length > 0) {
        console.log('Badge already awarded:', existingBadges[0]);
        return null; // Badge already awarded
      }

      const badgeConfig = BADGE_CONFIGS[category];
      if (!badgeConfig) {
        console.error('No badge config found for category:', category);
        return null;
      }
      
      const newBadge = {
        user_id: userId,
        name: badgeConfig.name,
        description: badgeConfig.description,
        category: category,
        icon: badgeConfig.icon,
      };

      console.log('Creating new badge:', newBadge);

      // Try a simpler insert first to test connection
         const testResult = await supabase.from('badges').select('*').limit(1);
      if (testResult.error) {
        console.error('Connection test failed:', testResult.error);
        console.error('Connection details:', {
          message: testResult.error.message,
          details: testResult.error.details
        });
        return null;
      }

      const { data, error } = await supabase
        .from('badges')
        .insert([newBadge])
        .select()
        .single();

      if (error) {
        console.error('Error inserting badge:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error message:', error.message);
        return null;
      }
      
      console.log('Successfully created badge:', data);
      // Type assertion to convert from database type to our Badge type
      return data ? { ...data, category: data.category as BadgeCategory } : null;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return null;
    }
  },

  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      console.log('Fetching badges for user:', userId);
      
      // Check session first
      const hasValidSession = await verifySession();
      if (!hasValidSession) {
        console.error('No valid session found when trying to get user badges');
        return [];
      }
      
      console.log('Checking auth session...');
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching badges:', error);
        console.error('Full error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return [];
      }
      
      console.log('Retrieved badges:', data);
      // Map the database results to ensure correct typing
      return data ? data.map(badge => ({ ...badge, category: badge.category as BadgeCategory })) : [];
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  }
};