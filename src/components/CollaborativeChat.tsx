import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollaborativeRoom } from "@/contexts/CollaborativeRoomContext";
import { Send } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const CollaborativeChat: React.FC = () => {
  const { userId, userName, sendChatMessage, chatMessages, participants } = useCollaborativeRoom();
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Add a debug state to show when no messages are received
  const [debug, setDebug] = useState<{
    lastAttempt: string | null;
    error: string | null;
  }>({
    lastAttempt: null,
    error: null
  });
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [chatMessages]);
  
  // Log messages for debugging
  useEffect(() => {
    console.log('Chat messages updated:', chatMessages.length);
  }, [chatMessages]);
  
  // Get name and color for a user
  const getUserInfo = (userId: string) => {
    const participant = participants.find(p => p.id === userId);
    return {
      name: participant?.name || 'Unknown User',
      color: participant?.avatarColor || `hsl(${userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 50%)`,
    };
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Update debug info
      setDebug({
        lastAttempt: message,
        error: null
      });
      
      const success = sendChatMessage(message);
      
      if (success) {
        setMessage("");
      } else {
        // Handle failed send
        setDebug(prev => ({
          ...prev,
          error: "Failed to send message. Connection issue."
        }));
        
        toast({
          title: "Message Failed",
          description: "Could not send your message. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      setDebug(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error"
      }));
      
      toast({
        title: "Error",
        description: "An error occurred while sending your message",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle key press (send on Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  
  // Add a test message function for debugging
  const sendTestMessage = () => {
    sendChatMessage("This is a test message to verify chat functionality");
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <h3 className="text-sm font-medium">Chat</h3>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full p-4">
          {chatMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chatMessages.map((chat, index) => {
                const isCurrentUser = chat.userId === userId;
                const { name, color } = getUserInfo(chat.userId);
                
                return (
                  <div
                    key={`${chat.userId}-${chat.timestamp}-${index}`}
                    className={cn(
                      "flex gap-2 max-w-[85%]",
                      isCurrentUser ? "self-end flex-row-reverse" : "self-start"
                    )}
                  >
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback style={{ backgroundColor: color }}>
                        {name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {isCurrentUser ? 'You' : name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(chat.timestamp)}
                        </span>
                      </div>
                      
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {chat.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-2 pt-0">
        <form 
          className="w-full flex gap-2" 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(e);
          }}
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-grow"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
