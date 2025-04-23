
import React from "react";
import { useRoom } from "@/contexts/RoomContext";
import { Award, LucideIcon, Star, User, UserCog, UserMinus, Eye } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ParticipantsList: React.FC = () => {
  const { participants, userRole, teamMode, updateUserRole } = useRoom();
  
  // Get role icon
  const getRoleIcon = (role: string): LucideIcon => {
    switch (role) {
      case "host":
        return Star;
      case "co-host":
        return UserCog;
      case "solver":
        return User;
      case "viewer":
        return Eye;
      default:
        return User;
    }
  };
  
  // Get role display name
  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case "host":
        return "Host";
      case "co-host":
        return "Co-host";
      case "solver":
        return "Solver";
      case "viewer":
        return "Viewer";
      default:
        return "User";
    }
  };
  
  // Get role badge color
  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case "host":
        return "default";
      case "co-host":
        return "secondary";
      case "solver":
        return "outline";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };
  
  // Function to handle role change
  const handleRoleChange = (userId: string, newRole: "host" | "co-host" | "solver" | "viewer") => {
    updateUserRole(userId, newRole);
  };
  
  // Check if current user can modify roles
  const canModifyRoles = userRole === "host" || userRole === "co-host";
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-medium">Participants ({participants.length})</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {participants.map((participant) => {
            const RoleIcon = getRoleIcon(participant.role);
            
            return (
              <div key={participant.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{participant.name}</span>
                      {participant.id === "user-123" && (
                        <span className="text-xs text-muted-foreground">(You)</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant={getRoleBadgeVariant(participant.role)} className="text-xs py-0 h-5">
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {getRoleDisplayName(participant.role)}
                      </Badge>
                      
                      {teamMode && participant.team && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          Team {participant.team}
                        </Badge>
                      )}
                      
                      {participant.score !== undefined && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          <Award className="h-3 w-3 mr-1" />
                          {participant.score} XP
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {canModifyRoles && participant.id !== "user-123" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRoleChange(participant.id, "co-host")}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Make Co-host
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(participant.id, "solver")}>
                        <User className="h-4 w-4 mr-2" />
                        Make Solver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(participant.id, "viewer")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Make Viewer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
