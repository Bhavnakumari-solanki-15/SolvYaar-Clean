import React, { useState, useEffect, useMemo } from 'react';
import { useCollaborativeRoom } from '@/contexts/CollaborativeRoomContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, UserPlus, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Formula {
  id: string;
  userId: string;
  userName: string;
  latex: string;
  timestamp: number;
}

// Changed to named function declaration for better Fast Refresh compatibility
export function CollaborativeFormula() {
  const { roomCode, sendChatMessage, userId, isConnected, participants, chatMessages } = useCollaborativeRoom();
  const [latex, setLatex] = useState('');
  const [sharedFormulas, setSharedFormulas] = useState<Formula[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const { toast } = useToast();

  // Deduplicate participants by name to get accurate count
  const uniqueParticipantCount = useMemo(() => {
    // Create a Map to deduplicate by name
    const nameMap = new Map<string, boolean>();
    
    // Add each participant by name
    participants.forEach(p => {
      nameMap.set(p.name, true);
    });
    
    // Return the count of unique names
    return nameMap.size;
  }, [participants]);

  // Handle formula submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!latex.trim()) return;
    
    const formulaMessage = `/formula ${latex}`;
    sendChatMessage(formulaMessage);
    setLatex('');
  };

  // Extract formulas from chat messages
  useEffect(() => {
    // Filter messages that contain formulas
    const formulaMessages = chatMessages.filter(msg => 
      msg.content.startsWith('/formula ') || msg.content.startsWith('/math ')
    );
    
    // Convert to formula objects
    const formulas = formulaMessages.map(msg => ({
      id: msg.id,
      userId: msg.userId,
      userName: msg.userName,
      latex: msg.content.replace(/^\/formula |^\/math /, ''),
      timestamp: msg.timestamp
    }));
    
    setSharedFormulas(formulas);
  }, [chatMessages]);

  // Copy room code to clipboard
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: 'Room code copied',
      description: 'Share this code with others to collaborate'
    });
  };

  // Start editing a formula
  const startEditing = (formula: Formula) => {
    setLatex(formula.latex);
    setIsEditing(true);
    setEditingFormulaId(formula.id);
  };

  // Cancel editing
  const cancelEditing = () => {
    setLatex('');
    setIsEditing(false);
    setEditingFormulaId(null);
  };

  // Edit and update a formula
  const updateFormula = () => {
    if (!latex.trim()) return;
    
    const updateMessage = `/update ${editingFormulaId} ${latex}`;
    sendChatMessage(updateMessage);
    setLatex('');
    setIsEditing(false);
    setEditingFormulaId(null);
  };

  // Safely render KaTeX with error handling
  const RenderMath = ({ latex }: { latex: string }) => {
    try {
      return <BlockMath math={latex} />;
    } catch (error: any) {
      return <div className="text-red-500 text-sm">Error rendering formula: {error.message || 'Unknown error'}</div>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with room info */}
      <div className="bg-secondary/50 p-3 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Collaborative Formulas</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>Room: {roomCode}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-1" 
              onClick={copyRoomCode}
              title="Copy room code"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center">
          <UserPlus className="h-4 w-4 mr-1" />
          <span className="text-sm">{uniqueParticipantCount} {uniqueParticipantCount === 1 ? 'participant' : 'participants'}</span>
          <div className={`ml-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
      
      {/* Formulas display area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-background/50">
        {sharedFormulas.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No formulas shared yet</p>
            <p className="text-sm">Be the first to share a LaTeX formula!</p>
          </div>
        ) : (
          sharedFormulas.map(formula => (
            <div 
              key={formula.id} 
              className={`p-3 rounded-lg ${formula.userId === userId ? 'bg-primary/10' : 'bg-secondary/20'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">{formula.userName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(formula.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="bg-card p-3 rounded border">
                <RenderMath latex={formula.latex} />
              </div>
              
              <div className="mt-2 flex justify-between">
                <div className="text-xs font-mono bg-muted px-2 py-1 rounded overflow-x-auto max-w-[calc(100%-80px)]">
                  {formula.latex}
                </div>
                
                {formula.userId === userId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6" 
                    onClick={() => startEditing(formula)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Formula input area */}
      <form onSubmit={handleSubmit} className="p-3 border-t">
        {isEditing && (
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-primary">Editing formula</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-6" 
              onClick={cancelEditing}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Input
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Enter LaTeX formula (e.g. \frac{x}{y})"
            className="flex-grow"
            disabled={!isConnected}
          />
          
          <Button 
            type={isEditing ? 'button' : 'submit'} 
            disabled={!isConnected || !latex.trim()}
            onClick={isEditing ? updateFormula : undefined}
          >
            <Send className="h-4 w-4 mr-1" />
            {isEditing ? 'Update' : 'Send'}
          </Button>
        </div>
        
        {latex && (
          <div className="mt-3 p-2 border rounded bg-card">
            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
            <RenderMath latex={latex} />
          </div>
        )}
      </form>
    </div>
  );
} 