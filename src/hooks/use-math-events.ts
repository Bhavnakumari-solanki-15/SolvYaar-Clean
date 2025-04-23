import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MathEvent {
  userId: string;
  topic: string;
  latex: string;
  formulaType: string;
  timestamp: number;
}

const useMathEvents = () => {
  const { user } = useAuth();

  const sendMathEvent = useCallback(async (event: Omit<MathEvent, 'userId' | 'timestamp'>) => {
    try {
      const fullEvent: MathEvent = {
        ...event,
        userId: user?.id || 'anonymous',
        timestamp: Date.now()
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to send event');
      }

      console.log('Math event sent:', fullEvent);
    } catch (error) {
      console.error('Error sending math event:', error);
    }
  }, [user]);

  return { sendMathEvent };
};

export default useMathEvents; 