import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, CheckCircle2, Crown, User, UserCheck, RefreshCw } from "lucide-react";
import { useCollaborativeRoom } from "@/contexts/CollaborativeRoomContext";
import { useToast } from "@/hooks/use-toast";

export function RoomParticipantsList() {
  const { roomCode, participants, isHost, userId, refreshParticipants } = useCollaborativeRoom();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard."
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleRefresh = () => {
    if (refreshParticipants) {
      refreshParticipants();
      toast({
        title: "Success",
        description: "Participants list refreshed"
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot refresh participants list - no connection",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="pb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Room Code</span>
          <div className="flex">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-2 lg:px-3"
              onClick={copyRoomCode}
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-md bg-muted p-2 text-center font-mono text-sm">
            {roomCode}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          Participants ({participants.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 lg:px-3"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {participants.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-4">
              No participants found. Try clicking refresh.
            </div>
          ) : (
            participants.map((participant) => (
              <div 
                key={participant.id} 
                className={`p-2 rounded-lg flex items-center justify-between ${
                  participant.id === userId ? "bg-secondary" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {participant.id === userId ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">
                        {participant.name}
                        {participant.id === userId && " (You)"}
                      </span>
                      {participant.isHost && (
                        <Crown className="h-3 w-3 ml-1 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {participant.isHost ? "Host" : "Participant"}
                      </Badge>
                      {participant.isActive && (
                        <Badge variant="outline" className="text-xs ml-1 bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 