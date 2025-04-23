import { supabase } from '@/integrations/supabase/client';
import { uploadFile, getFileUrl } from '@/lib/supabase';
import { HistoryItem, GroupedHistory, InputType, ToolType } from '@/types/history';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'mathwizard_history';

// Helper function to group history items by time
function groupHistoryItems(items: HistoryItem[]): GroupedHistory {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  return items.reduce((groups: GroupedHistory, item) => {
    const itemDate = new Date(item.created_at);
    
    if (itemDate >= today) {
      groups.today.push(item);
    } else if (itemDate >= yesterday) {
      groups.yesterday.push(item);
    } else if (itemDate >= lastWeek) {
      groups.lastWeek.push(item);
    } else {
      groups.older.push(item);
    }
    
    return groups;
  }, { today: [], yesterday: [], lastWeek: [], older: [] });
}

// Helper function to map database row to HistoryItem
function mapDbRowToHistoryItem(row: any): HistoryItem {
  return {
    id: row.id,
    user_id: row.user_id,
    tool_used: row.tool_used as ToolType,
    input_type: row.input_type as InputType,
    topic: row.topic,
    content: row.content,
    result: row.result,
    created_at: row.created_at,
  };
}

// Helper function to map HistoryItem to database row
function mapHistoryItemToDbRow(item: Omit<HistoryItem, 'id'>) {
  return {
    user_id: item.user_id,
    tool_used: item.tool_used,
    input_type: item.input_type,
    topic: item.topic,
    content: item.content,
    result: item.result,
    created_at: item.created_at,
  };
}

// Local storage operations
function getLocalHistory(): HistoryItem[] {
  const history = localStorage.getItem(STORAGE_KEY);
  return history ? JSON.parse(history) : [];
}

function setLocalHistory(history: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export const historyService = {
  // Add new history item
  async addHistoryItem(
    input_type: InputType,
    tool_used: ToolType,
    query: string,
    solution: string,
    topic?: string,
    file?: File
  ): Promise<HistoryItem> {
    const user = await supabase.auth.getUser();
    const user_id = user.data.user?.id;

    if (!user_id) {
      throw new Error('User must be authenticated to add history items');
    }

    let fileUrl: string | undefined;

    // Handle file upload if present
    if (file) {
      const path = `${user_id}/${uuidv4()}-${file.name}`;
      await uploadFile(file, 'history-files', path);
      fileUrl = await getFileUrl('history-files', path);
    }

    const historyItem = {
      user_id,
      tool_used,
      input_type,
      topic,
      content: {
        query,
        imageUrl: input_type === 'image' ? fileUrl : undefined,
        audioUrl: input_type === 'voice' ? fileUrl : undefined,
        fileUrl: input_type === 'file' ? fileUrl : undefined,
      },
      result: {
        solution,
      },
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('math_history')
      .insert(mapHistoryItemToDbRow(historyItem))
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create history item');

    return mapDbRowToHistoryItem(data);
  },

  // Get history items
  async getHistory(): Promise<GroupedHistory> {
    const user = await supabase.auth.getUser();
    const user_id = user.data.user?.id;

    if (!user_id) {
      return { today: [], yesterday: [], lastWeek: [], older: [] };
    }

    const { data, error } = await supabase
      .from('math_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return groupHistoryItems(data.map(mapDbRowToHistoryItem));
  },

  // Delete a single history item
  async deleteHistoryItem(id: string): Promise<void> {
    const user = await supabase.auth.getUser();
    const user_id = user.data.user?.id;

    if (!user_id) {
      throw new Error('User must be authenticated to delete history items');
    }

    const { error } = await supabase
      .from('math_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) throw error;
  },

  // Clear all history
  async clearHistory(): Promise<void> {
    const user = await supabase.auth.getUser();
    const user_id = user.data.user?.id;

    if (!user_id) {
      throw new Error('User must be authenticated to clear history');
    }

    const { error } = await supabase
      .from('math_history')
      .delete()
      .eq('user_id', user_id);

    if (error) throw error;
  },

  // Filter history by input type or tool type
  async filterHistory(
    input_type?: InputType,
    tool_used?: ToolType
  ): Promise<GroupedHistory> {
    const user = await supabase.auth.getUser();
    const user_id = user.data.user?.id;

    if (!user_id) {
      return { today: [], yesterday: [], lastWeek: [], older: [] };
    }

    let query = supabase
      .from('math_history')
      .select('*')
      .eq('user_id', user_id);

    if (input_type) {
      query = query.eq('input_type', input_type);
    }
    if (tool_used) {
      query = query.eq('tool_used', tool_used);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return groupHistoryItems(data.map(mapDbRowToHistoryItem));
  }
}; 