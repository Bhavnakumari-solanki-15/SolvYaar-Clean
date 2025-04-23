
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/contexts/RoomContext";
import { useToast } from "@/hooks/use-toast";
import { Clock, HelpCircle, Share2, BrainCircuit } from "lucide-react";

export const ProblemPanel: React.FC = () => {
  const { isHost, userRole } = useRoom();
  const { toast } = useToast();
  const [problemTitle, setProblemTitle] = useState("Solve the quadratic equation: x² - 5x + 6 = 0");
  const [isEditing, setIsEditing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setTimerActive(false);
      toast({
        title: "Time's up!",
        description: "The timer has reached zero."
      });
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, toast]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleTimer = () => {
    if (timeRemaining === 0) {
      // Reset timer to 10 minutes
      setTimeRemaining(600);
      setTimerActive(true);
    } else {
      setTimerActive(!timerActive);
    }
  };
  
  const resetTimer = () => {
    setTimeRemaining(600);
    setTimerActive(false);
  };
  
  const requestAIHelp = () => {
    toast({
      title: "AI Help Requested",
      description: "Our AI assistant is analyzing the problem..."
    });
    
    // In a real app, this would call the GROQ API to get AI assistance
    setTimeout(() => {
      toast({
        title: "AI Solution",
        description: "For x² - 5x + 6 = 0, try factoring: (x-2)(x-3)=0, so x=2 or x=3"
      });
    }, 1500);
  };
  
  const handleShareProblem = () => {
    toast({
      title: "Problem Shared",
      description: "A link to this problem has been copied to your clipboard."
    });
  };
  
  const canEditProblem = isHost || userRole === "co-host";
  
  return (
    <div className="border-b border-border p-3 flex items-center justify-between bg-card/50">
      <div className="flex-1 mr-4">
        {isEditing && canEditProblem ? (
          <Input
            value={problemTitle}
            onChange={(e) => setProblemTitle(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
            className="font-medium"
            autoFocus
          />
        ) : (
          <h2 
            className={`font-medium truncate ${canEditProblem ? "cursor-pointer hover:text-primary" : ""}`}
            onClick={() => canEditProblem && setIsEditing(true)}
            title={canEditProblem ? "Click to edit problem" : problemTitle}
          >
            {problemTitle}
          </h2>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className={timerActive ? "bg-primary/10" : ""}
            onClick={toggleTimer}
          >
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(timeRemaining)}
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={requestAIHelp}
        >
          <BrainCircuit className="h-4 w-4 mr-2" />
          AI Help
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleShareProblem}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
