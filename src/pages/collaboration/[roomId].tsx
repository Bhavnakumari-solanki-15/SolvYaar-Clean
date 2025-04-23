import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CollaborativeRoomProvider, useCollaborativeRoom } from '@/contexts/CollaborativeRoomContext';
import { CollaborativeFormula } from '@/components/CollaborativeFormula';
import { CollaborativeWhiteboard } from '@/components/CollaborativeWhiteboard';
import { CollaborativeChat } from '@/components/CollaborativeChat';
import { RoomParticipantsList } from '@/components/RoomParticipantsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Users, MessageSquare, PenTool, Calculator } from 'lucide-react';

// Create a wrapper component for the room content that has access to the context
const RoomContent = () => {
  const navigate = useNavigate();
  const { leaveRoom } = useCollaborativeRoom();
  
  const handleBackButton = () => {
    leaveRoom(() => navigate('/dashboard'));
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handleBackButton}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Math Collaboration Room</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Invite
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-card hidden md:block">
          <div className="p-4">
            <h2 className="font-medium flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Participants
            </h2>
          </div>
          <RoomParticipantsList />
        </aside>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="formulas" className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="formulas">
                  <Calculator className="h-4 w-4 mr-1" />
                  Math Formulas
                </TabsTrigger>
                <TabsTrigger value="whiteboard">
                  <PenTool className="h-4 w-4 mr-1" />
                  Whiteboard
                </TabsTrigger>
                <TabsTrigger value="chat">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="formulas" className="flex-1 overflow-hidden">
              <CollaborativeFormula />
            </TabsContent>
            
            <TabsContent value="whiteboard" className="flex-1 overflow-hidden">
              <CollaborativeWhiteboard />
            </TabsContent>
            
            <TabsContent value="chat" className="flex-1 overflow-hidden">
              <CollaborativeChat />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

const CollaborationRoom = () => {
  // Get room ID from URL using React Router
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [isNewRoom, setIsNewRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [finalRoomId, setFinalRoomId] = useState<string | null>(null);
  
  // Parse query parameters from the URL and set up room state
  useEffect(() => {
    // Check if we have a roomId from the params
    if (!roomId) {
      // Check if we have a stored room code from a previous session
      const storedRoomCode = localStorage.getItem('collaboration_room_code');
      
      if (storedRoomCode) {
        console.log(`Redirecting to stored room: ${storedRoomCode}`);
        navigate(`/collaboration/${storedRoomCode}`, { replace: true });
      } else {
        console.log('No room ID available, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
      return;
    }
    
    // Process query parameters
    const searchParams = new URLSearchParams(location.search);
    const isNew = searchParams.get('isNew') === 'true';
    const nameParam = searchParams.get('name');
    
    setIsNewRoom(isNew);
    setFinalRoomId(roomId);
    
    // Set user name with priority:
    // 1. URL parameter
    // 2. localStorage
    // 3. Generate random name
    if (nameParam) {
      setUserName(nameParam);
      localStorage.setItem('userName', nameParam);
    } else {
      // Use stored name or generate a default one
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      } else {
        const defaultName = `User_${Math.floor(Math.random() * 1000)}`;
        setUserName(defaultName);
        localStorage.setItem('userName', defaultName);
      }
    }
    
    setIsLoading(false);
    
    // Cleanup on unmount - make sure we don't have lingering room info
    return () => {
      // We don't remove room code here as that's handled by the leave room function
    };
  }, [roomId, location, navigate]);
  
  // Handle errors and loading state
  if (isLoading || !finalRoomId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <CollaborativeRoomProvider 
      initialRoomCode={finalRoomId} 
      initialUserName={userName}
      isNewRoom={isNewRoom}
    >
      <RoomContent />
    </CollaborativeRoomProvider>
  );
};

export default CollaborationRoom; 