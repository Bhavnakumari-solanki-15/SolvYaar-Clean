import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { personas, Persona } from '../../../config/personas';
import { groqService } from '../../../services/groqService';
import { supabaseService, ChatSession, ChatMessage } from '../../../services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, History, Trash2, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import './Personas.css';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'persona';
  timestamp: Date;
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

const Personas: React.FC = () => {
  const { user } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadPastSessions = async (personaId: string) => {
    if (!user) return;
    const sessions = await supabaseService.getSessionHistory(user.id, personaId);
    setPastSessions(sessions);
  };

  const loadSessionMessages = async (sessionId: string) => {
    const chatMessages = await supabaseService.getSessionMessages(sessionId);
    const formattedMessages: Message[] = chatMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.role === 'user' ? 'user' : 'persona',
      timestamp: new Date(msg.created_at)
    }));
    setMessages(formattedMessages);
    
    // Also set the current session when loading messages
    if (selectedPersona && user) {
      const sessions = await supabaseService.getSessionHistory(user.id, selectedPersona.id);
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        setXp(session.xp_earned || 0);
        setShowHistory(false); // Close history panel after selection
      }
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    // All personas are now accessible
    setSelectedPersona(persona);
    setMessages([]);
    setXp(0);
    setCurrentSession(null);
    setShowHistory(false);
    
    // Load past sessions
    loadPastSessions(persona.id);
    
    // Add initial greeting from persona
    const greeting = persona.traits.greetings[Math.floor(Math.random() * persona.traits.greetings.length)];
    
    // Set initial greeting as a message
    const greetingMessage: Message = {
      id: Date.now().toString(),
      content: greeting,
      sender: 'persona',
      timestamp: new Date()
    };
    
    // Add the greeting message to the chat
    setMessages([greetingMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPersona || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create session on first user message if not exists
      let sessionId = currentSession?.id;
      if (!currentSession && user) {
        const session = await supabaseService.startNewSession(user.id, selectedPersona.id);
        if (session) {
          setCurrentSession(session);
          sessionId = session.id;
          // Only save initial messages if they exist
          if (messages.length >= 1) {
            const initialMessages = messages.map(msg => {
              return {
                role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
              };
            });
            
            await supabaseService.saveMessages(session.id, initialMessages)
              .catch(err => console.error('Failed to save initial messages:', err));
          }
        }
      }

      const prompt = `${selectedPersona.systemPrompt}\n\nPrevious messages:\n${messages.map(m => 
        `${m.sender === 'persona' ? 'You' : 'User'}: ${m.content}`).join('\n')}\n\nUser: ${inputMessage}\n\nRespond in character:`;
      
      let response;
      try {
        response = await groqService.generateResponse(prompt);
      } catch (apiError) {
        console.error('GROQ API error:', apiError);
        // Provide a fallback response that matches the persona's style
        const fallbackResponses = [
          selectedPersona.traits.catchphrase,
          `I seem to be having trouble thinking clearly right now. Can you give me a moment?`,
          `Hmm, that's an interesting question! Let me ponder that a bit more.`,
          `My mathematical brain needs a quick reboot. Can you try asking me again in a slightly different way?`
        ];
        
        response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        toast({
          title: "API Connection Issue",
          description: "Using a fallback response. Try again later for a full answer.",
          variant: "destructive"
        });
      }
      
      const personaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'persona',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, personaMessage]);
      const newXp = xp + 10;
      setXp(newXp);

      if (sessionId) {
        await Promise.all([
          supabaseService.saveMessages(sessionId, [
            { role: 'user', content: inputMessage },
            { role: 'assistant', content: response }
          ]).catch(err => console.error('Failed to save messages:', err)),
          supabaseService.updateSessionXP(sessionId, newXp)
            .catch(err => console.error('Failed to update XP:', err))
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (isDeletingSession === sessionId) return;
    
    setIsDeletingSession(sessionId);
    try {
      await supabaseService.deleteSession(sessionId);
      setPastSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: "Success",
        description: "Chat session deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive"
      });
    } finally {
      setIsDeletingSession(null);
    }
  };

  return (
    <div className="personas-container">
      {!selectedPersona ? (
        <div className="persona-selection">
          <h2 className="selection-title">Choose Your Math Mentor</h2>
          <div className="personas-grid">
            {personas.map((persona: Persona) => (
              <motion.div
                key={persona.id}
                className="persona-card"
                style={{
                  borderColor: persona.theme.primary,
                  background: `linear-gradient(${persona.theme.background})`
                }}
                onClick={() => handleSelectPersona(persona)}
              >
                <div className="persona-avatar">{persona.avatar}</div>
                <h3 style={{ color: persona.theme.primary }}>{persona.name}</h3>
                <p className="persona-title">{persona.title}</p>
                <p className="persona-description">{persona.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-header" style={{ 
            borderColor: selectedPersona.theme.primary,
            background: `linear-gradient(${selectedPersona.theme.background})`
          }}>
            <div className="header-actions">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (currentSession) {
                    supabaseService.endSession(currentSession.id);
                  }
                  setSelectedPersona(null);
                  setCurrentSession(null);
                  setMessages([]);
                  setXp(0);
                  setShowHistory(false);
                }}
                className="back-button"
              >
                ← Back
              </Button>
              {user && (
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(!showHistory)}
                  className="history-button"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              )}
            </div>
            <div className="persona-info">
              <div className="persona-avatar">{selectedPersona.avatar}</div>
              <div>
                <h3>{selectedPersona.name}</h3>
                <p>{selectedPersona.title}</p>
              </div>
            </div>
            <div className="xp-counter">
              <Sparkles className="xp-icon" />
              <span>{xp} XP</span>
            </div>
          </div>

          {showHistory ? (
            <div className="history-container">
              <h2 className="history-title">Chat History</h2>
              {pastSessions.length > 0 ? (
                <div className="sessions-list">
                  {pastSessions.map(session => (
                    <div
                      key={session.id}
                      className="session-card"
                      onClick={() => loadSessionMessages(session.id)}
                    >
                      <div className="session-info">
                        <div>
                          <span className="session-date">
                            {session.started_at ? new Date(session.started_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                          <div className="session-xp">
                            <Sparkles className="w-4 h-4" />
                            {session.xp_earned} XP
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          disabled={isDeletingSession === session.id}
                          className="delete-button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-sessions">
                  No chat history yet. Start a conversation!
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="messages-container">
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
              </div>

              <div className="chat-input">
                <Input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="message-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="send-button"
                  style={{
                    background: selectedPersona.theme.primary,
                    color: '#000'
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Personas; 