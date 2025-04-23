import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseService';

export function useScrollBalance(userId: string | null) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!userId) {
        setBalance(0);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('scrollgallery')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setBalance(data?.length || 0);
      } catch (err) {
        console.error('Error fetching Scroll balance:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch Scroll balance');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [userId]);

  return { balance, isLoading, error };
} 