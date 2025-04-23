import { createClient } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ChatSession {
  id: string;
  user_id: string;
  persona_id: string;
  started_at: string;
  ended_at: string | null;
  xp_earned: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface SavedMeme {
  id: string;
  user_id: string;
  meme_url: string;
  title: string;
  description?: string;
  template_name?: string;
  created_at: string;
}

interface Chat {
  id: string;
  user_id: string;
  type: string;
  title: string;
  last_message: string;
  messages: {
    content: string;
    sender: 'user' | 'assistant';
    timestamp: string;
  }[];
  created_at: string;
}

export const supabaseService = {
  async startNewSession(userId: string, personaId: string): Promise<ChatSession | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ 
        user_id: userId, 
        persona_id: personaId, 
        xp_earned: 0,
        started_at: now
      }])
      .select()
      .single();

    if (error) {
      console.error('Error starting new session:', error);
      return null;
    }

    return data;
  },

  async saveMessages(sessionId: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
    const { error } = await supabase
      .from('messages')
      .insert(
        messages.map(msg => ({
          session_id: sessionId,
          role: msg.role,
          content: msg.content
        }))
      );

    if (error) {
      console.error('Error saving messages:', error);
    }
  },

  async getSessionHistory(userId: string, personaId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('persona_id', personaId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching session history:', error);
      return [];
    }

    return data || [];
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching session messages:', error);
      return [];
    }

    return data || [];
  },

  async endSession(sessionId: string) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending session:', error);
    }
  },

  async updateSessionXP(sessionId: string, xp: number) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ xp_earned: xp })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session XP:', error);
    }
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    // Delete messages first due to foreign key constraint
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', sessionId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return false;
    }

    // Then delete the session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Error deleting session:', sessionError);
      return false;
    }

    return true;
  },

  async saveMeme(userId: string, memeData: Omit<SavedMeme, 'id' | 'user_id' | 'created_at'>): Promise<SavedMeme | null> {
    const { data, error } = await supabase
      .from('saved_memes')
      .insert([{ ...memeData, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Error saving meme:', error);
      return null;
    }

    return data;
  },

  async getSavedMemes(userId: string): Promise<SavedMeme[]> {
    const { data, error } = await supabase
      .from('saved_memes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved memes:', error);
      return [];
    }

    return data || [];
  },

  async deleteSavedMeme(memeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_memes')
      .delete()
      .eq('id', memeId);

    if (error) {
      console.error('Error deleting saved meme:', error);
      return false;
    }

    return true;
  },

  async getChatHistory(type: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async saveChat(chat: {
    type: string;
    title: string;
    last_message: string;
    messages: {
      content: string;
      sender: 'user' | 'assistant';
      timestamp: string;
    }[];
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        type: chat.type,
        title: chat.title,
        last_message: chat.last_message,
        messages: chat.messages
      })
      .select()
      .single();

    return { data, error };
  },

  async getChat(chatId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single();

    return { data, error };
  },

  async deleteChat(chatId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id);

    return { error };
  }
}; 