import React from 'react';
import { Button } from "../components/ui/button";
import { useCollaborativeRoom } from "../contexts/CollaborativeRoomContext";
import { v4 as uuidv4 } from 'uuid';

export const TestMockUsers: React.FC = () => {
  const { participants, refreshParticipants } = useCollaborativeRoom();
  
  // Function to manually add a mock user to participants (client-side only)
  const addMockUser = () => {
    // Use the browser console to access and modify the state
    console.log("%c ADDING MOCK USER FOR TESTING", "background: #4CAF50; color: white; padding: 4px;");
    
    // In a real app, this would come from the server
    const mockUser = {
      id: `mock-${uuidv4().substring(0, 8)}`,
      name: `Test User ${Math.floor(Math.random() * 100)}`,
      joinedAt: Date.now(),
      isActive: true
    };
    
    // Access the window.__PARTICIPANTS_TEST__ global or create it
    if (!window.__PARTICIPANTS_TEST__) {
      window.__PARTICIPANTS_TEST__ = {
        addParticipant: (user: any) => {
          // This will access CollaborativeRoomContext for testing
          const event = new CustomEvent('mock-user-joined', { 
            detail: { 
              type: 'user_joined',
              userId: user.id,
              userName: user.name,
              timestamp: user.joinedAt
            } 
          });
          window.dispatchEvent(event);
          console.log("Dispatched mock user join event:", user);
        },
        removeParticipant: (userId: string) => {
          const event = new CustomEvent('mock-user-left', { 
            detail: { 
              type: 'user_left',
              userId: userId,
              userName: `User ${userId.substring(0, 5)}`,
              timestamp: Date.now()
            } 
          });
          window.dispatchEvent(event);
          console.log("Dispatched mock user leave event:", userId);
        }
      };
    }
    
    // Add the mock user
    window.__PARTICIPANTS_TEST__.addParticipant(mockUser);
  };
  
  // Function to remove a random mock user
  const removeMockUser = () => {
    console.log("%c REMOVING MOCK USER FOR TESTING", "background: #F44336; color: white; padding: 4px;");
    
    // Get mock users (filtering by ID prefix)
    const mockUsers = participants.filter(p => p.id.startsWith('mock-'));
    
    if (mockUsers.length > 0) {
      // Remove a random mock user
      const userToRemove = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      window.__PARTICIPANTS_TEST__?.removeParticipant(userToRemove.id);
    } else {
      console.log("No mock users to remove");
    }
  };
  
  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-2">
      <h3 className="text-sm font-medium mb-2">Testing Tools</h3>
      <div className="text-xs text-muted-foreground mb-2">
        Current participants: {participants.length}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addMockUser}>
          Add Mock User
        </Button>
        <Button variant="outline" size="sm" onClick={removeMockUser} 
                disabled={!participants.some(p => p.id.startsWith('mock-'))}>
          Remove Mock User
        </Button>
        <Button variant="outline" size="sm" onClick={refreshParticipants}>
          Refresh All
        </Button>
      </div>
    </div>
  );
};

// Add a global type for testing
declare global {
  interface Window {
    __PARTICIPANTS_TEST__?: {
      addParticipant: (user: any) => void;
      removeParticipant: (userId: string) => void;
    }
  }
} 