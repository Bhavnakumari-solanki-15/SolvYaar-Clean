"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CollaborativeRoomProvider, useCollaborativeRoom } from '@/contexts/CollaborativeRoomContext';
import { RoomParticipantsList } from '@/components/RoomParticipantsList';
import { CollaborativeWhiteboard } from '@/components/CollaborativeWhiteboard';
import { CollaborativeChat } from '@/components/CollaborativeChat';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, LogOut, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Room UI component
const RoomUI = () => {
  const { roomCode, userName, isConnected, leaveRoom, participants } = useCollaborativeRoom();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('participants');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  
  // Monitor connection status
  useEffect(() => {
    let statusCheck: NodeJS.Timeout;
    
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      // Set a timeout to show error if not connected after 10 seconds
      statusCheck = setTimeout(() => {
        if (!isConnected) {
          setConnectionStatus('error');
        }
      }, 10000);
    }
    
    return () => {
      clearTimeout(statusCheck);
    };
  }, [isConnected]);
  
  // Handle room exit
  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/dashboard');
  };
  
  // Handle connection retry
  const handleRetryConnection = () => {
    setConnectionStatus('connecting');
    window.location.reload();
  };
  
  // Share room link
  const shareRoomLink = () => {
    const url = `${window.location.origin}/collaborative?room=${roomCode}&join=true`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Room invite link copied to clipboard."
    });
  };
  
  if (!isConnected || connectionStatus !== 'connected') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {connectionStatus === 'error' ? 'Connection Error' : 'Connecting to room...'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {connectionStatus === 'error' 
              ? 'Failed to establish connection with the collaboration server.' 
              : 'Please wait while we establish the connection.'}
          </p>
          
          {connectionStatus === 'error' && (
            <Button onClick={handleRetryConnection}>
              Retry Connection
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Math Wizard Collaborative</h1>
          <div className="px-2 py-1 bg-muted rounded text-sm font-medium">Room: {roomCode}</div>
          <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
            {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={shareRoomLink}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Share Room
          </Button>
          <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
            <LogOut className="h-4 w-4 mr-2" />
            Leave Room
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar toggle for mobile */}
        <Button 
          variant="outline" 
          size="icon"
          className="absolute bottom-4 right-4 md:hidden z-20 rounded-full"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Users className="h-5 w-5" />
        </Button>
        
        {/* Main collaborative area */}
        <div className="flex-1 overflow-hidden p-4">
          <CollaborativeWhiteboard />
        </div>
        
        {/* Sidebar with participants and chat */}
        <div 
          className={`border-l w-80 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <Tabs defaultValue="participants" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="participants" className="flex-1 overflow-hidden">
              <div className="h-full">
                <RoomParticipantsList />
              </div>
            </TabsContent>
            
            <TabsContent value="chat" className="flex-1 overflow-hidden p-0">
              <div className="h-full">
                <CollaborativeChat />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Join dialog component
const JoinRoomDialog = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { joinRoom } = useCollaborativeRoom();
  
  // Check URL parameters for room code
  useEffect(() => {
    const roomParam = searchParams.get('room');
    const joinParam = searchParams.get('join');
    
    if (roomParam) {
      setRoomCode(roomParam);
      
      // If join=true, auto-focus the name field
      if (joinParam === 'true') {
        setIsCreatingNew(false);
      }
    }
    
    // Try to get saved username from session storage
    const savedName = sessionStorage.getItem('collaborative_userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, [searchParams]);
  
  // Handle dialog close (go back to dashboard)
  const handleClose = () => {
    setIsOpen(false);
    router.push('/dashboard');
  };
  
  // Handle room join/create
  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }
    
    if (!roomCode.trim() && !isCreatingNew) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new room code if creating a new room
    const effectiveRoomCode = isCreatingNew 
      ? `math-${Math.floor(Math.random() * 900000) + 100000}`
      : roomCode;
    
    // Join or create room
    const success = await joinRoom(effectiveRoomCode, userName, isCreatingNew);
    
    if (success) {
      setIsOpen(false);
      
      // Update URL with room code
      const url = new URL(window.location.href);
      url.searchParams.set('room', effectiveRoomCode);
      window.history.replaceState({}, '', url.toString());
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreatingNew ? 'Create New Room' : 'Join Collaborative Room'}</DialogTitle>
          <DialogDescription>
            {isCreatingNew 
              ? 'Create a new collaborative room to work with others.'
              : 'Enter a room code to join an existing collaborative session.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          
          {!isCreatingNew && (
            <div className="space-y-2">
              <Label htmlFor="roomCode">Room Code</Label>
              <Input
                id="roomCode"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="sm:order-1"
          >
            {isCreatingNew ? 'Join Existing Room' : 'Create New Room'}
          </Button>
          <Button onClick={handleJoinRoom} className="sm:order-2">
            {isCreatingNew ? 'Create Room' : 'Join Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main page component
export default function CollaborativePage() {
  return (
    <CollaborativeRoomProvider>
      <div className="h-screen overflow-hidden">
        <JoinRoomDialog />
        <RoomUI />
      </div>
    </CollaborativeRoomProvider>
  );
} 