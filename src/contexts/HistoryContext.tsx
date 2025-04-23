import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HistoryItem, GroupedHistory, InputType, ToolType } from '@/types/history';
import { historyService } from '../services/historyService';
import { supabase } from '../lib/supabase';

interface HistoryContextType {
  history: GroupedHistory;
  isLoading: boolean;
  addToHistory: (
    input_type: InputType,
    tool_used: ToolType,
    query: string,
    solution: string,
    topic?: string,
    file?: File
  ) => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  filterHistory: (input_type?: InputType, tool_used?: ToolType) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<GroupedHistory>({
    today: [],
    yesterday: [],
    lastWeek: [],
    older: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial history
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const groupedHistory = await historyService.getHistory();
      setHistory(groupedHistory);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }

  async function addToHistory(
    input_type: InputType,
    tool_used: ToolType,
    query: string,
    solution: string,
    topic?: string,
    file?: File
  ) {
    try {
      // Check if user is authenticated before attempting to add to history
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // User is not authenticated - just log this info in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('History not saved: User not authenticated');
        }
        return;
      }
      
      await historyService.addHistoryItem(input_type, tool_used, query, solution, topic, file);
      await loadHistory(); // Reload history to get the updated list
      toast.success('Added to history');
    } catch (error) {
      console.error('Failed to add to history:', error);
      // Only show error toast if it's not an authentication error
      if (error instanceof Error && !error.message.includes('authenticated')) {
        toast.error('Failed to add to history');
      }
    }
  }

  async function deleteFromHistory(id: string) {
    try {
      await historyService.deleteHistoryItem(id);
      await loadHistory(); // Reload history to get the updated list
      toast.success('Removed from history');
    } catch (error) {
      console.error('Failed to delete from history:', error);
      toast.error('Failed to delete from history');
    }
  }

  async function clearHistory() {
    try {
      await historyService.clearHistory();
      setHistory({
        today: [],
        yesterday: [],
        lastWeek: [],
        older: []
      });
      toast.success('History cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  }

  async function filterHistory(input_type?: InputType, tool_used?: ToolType) {
    try {
      setIsLoading(true);
      const filteredHistory = await historyService.filterHistory(input_type, tool_used);
      setHistory(filteredHistory);
    } catch (error) {
      console.error('Failed to filter history:', error);
      toast.error('Failed to filter history');
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    history,
    isLoading,
    addToHistory,
    deleteFromHistory,
    clearHistory,
    filterHistory
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
