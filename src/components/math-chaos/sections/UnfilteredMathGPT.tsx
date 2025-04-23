import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { groqService } from '../../../services/groqService';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'sonner';
import { supabaseService } from '../../../services/supabaseService';
import { Sparkles, History, Trash2, Send, X } from 'lucide-react';
import './UnfilteredMathGPT.css';

interface Message {
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
}

const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
};

export const UnfilteredMathGPT: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabaseService.getChatHistory('unfiltered_math');
      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
    }
  };

  const saveChat = async () => {
    if (!user || messages.length <= 2) return;
    
    try {
      const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
      const lastMessage = messages[messages.length - 1].content;
      
      await supabaseService.saveChat({
        type: 'unfiltered_math',
        title,
        last_message: lastMessage,
        messages: messages.map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString()
        }))
      });
      
      toast.success('Chat saved successfully');
      loadChatHistory();
    } catch (error) {
      console.error('Error saving chat:', error);
      toast.error('Failed to save chat');
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const { data, error } = await supabaseService.getChat(chatId);
      if (error) throw error;
      
      if (data) {
        setMessages(data.messages.map((msg: { content: string; sender: string; timestamp: string }) => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp)
        })));
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await supabaseService.deleteChat(chatId);
      toast.success('Chat deleted successfully');
      loadChatHistory();
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are "Unfiltered MathGPT," a sarcastic math professor. Keep responses short and funny.`;
      const response = await groqService.generateResponse(
        `System: ${systemPrompt}\n\nUser: ${inputMessage}`
      );

      const assistantMessage: Message = {
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Automatically save chat if it has more than 2 messages
      if (messages.length + 2 > 2) {
        saveChat();
      }
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="unfiltered-math-container">
      <div className="chat-header">
        <div className="header-content">
          <div className="title-section">
            <Sparkles className="sparkle-icon" />
            <h2>Unfiltered MathGPT</h2>
          </div>
          <p>Where Math Meets Chaos and Comedy</p>
        </div>
        <div className="chat-actions">
          <button 
            className="history-button"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={20} />
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="chat-history">
          <div className="history-header">
            <h3>Chat History</h3>
            <button 
              className="close-button"
              onClick={() => setShowHistory(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="history-list">
            {chatHistory.length === 0 ? (
              <div className="empty-history">
                <p>No saved chats yet</p>
              </div>
            ) : (
              chatHistory.map(chat => (
                <motion.div
                  key={chat.id}
                  className="history-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div 
                    className="history-content"
                    onClick={() => loadChat(chat.id)}
                  >
                    <h4>{chat.title}</h4>
                    <p>{chat.last_message}</p>
                    <span>{new Date(chat.created_at).toLocaleDateString()}</span>
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => deleteChat(chat.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <Sparkles size={48} />
                <h3>Start a Conversation</h3>
                <p>Ask me anything about math, and I'll respond with a mix of knowledge and sarcasm!</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    className={`message ${message.sender}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="message-content">
                      {message.content}
                    </div>
                    <div className="message-timestamp">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    className="message assistant typing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about math..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="send-button"
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default UnfilteredMathGPT; 