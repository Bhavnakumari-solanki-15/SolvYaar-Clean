import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, User } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  joinedAt: number;
  isActive: boolean;
  isHost: boolean;
  socketId: string;
}

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId: string;
  isHost: boolean;
}

export function ParticipantsPanel({ participants, currentUserId, isHost }: ParticipantsPanelProps) {
  const [showInactive, setShowInactive] = useState(false);

  const activeParticipants = participants.filter(p => p.isActive);
  const inactiveParticipants = participants.filter(p => !p.isActive);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Participants ({activeParticipants.length})</CardTitle>
        {inactiveParticipants.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Participants */}
        <div className="space-y-2">
          {activeParticipants.map(participant => (
            <div
              key={participant.id}
              className={`flex items-center space-x-3 p-2 rounded-lg ${
                participant.id === currentUserId ? 'bg-primary/10' : ''
              }`}
            >
              <Avatar>
                <AvatarFallback>
                  {participant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium">{participant.name}</span>
                  {participant.isHost && (
                    <Crown className="h-4 w-4 ml-2 text-yellow-500" />
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Inactive Participants */}
        {showInactive && inactiveParticipants.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Inactive</div>
            {inactiveParticipants.map(participant => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-2 rounded-lg opacity-50"
              >
                <Avatar>
                  <AvatarFallback>
                    {participant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">{participant.name}</span>
                    {participant.isHost && (
                      <Crown className="h-4 w-4 ml-2 text-yellow-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    Left {new Date(participant.joinedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 