import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Mic, PenTool, Send, Calculator, Menu } from "lucide-react";
import MathOutput from "@/components/MathOutput";
import { MathProblem, MathSolution } from "@/lib/groq-api";
import { cn } from "@/lib/utils";

interface MainContentProps {
  onSubmit: (problem: MathProblem) => void;
  solution: MathSolution | null;
  isLoading: boolean;
  toggleSidebar?: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  onSubmit, 
  solution, 
  isLoading,
  toggleSidebar = () => {} 
}) => {
  const [inputText, setInputText] = useState('');
  
  const handleSubmit = () => {
    if (inputText.trim()) {
      onSubmit({ text: inputText.trim() });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">SolvYaar</h1>
        </div>
        <Button variant="outline" size="sm" onClick={toggleSidebar} className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {solution ? (
          <MathOutput
            problem={{ problem: inputText, type: "text" }}
            solution={solution}
            loading={isLoading}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4">
              <div className="min-h-fit w-full max-w-xl mx-auto rounded-2xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Welcome to SolvYaar</h2>
                <p className="text-muted-foreground">
                  Enter your math problem below to get started
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Textarea
              placeholder="Enter your math problem here... (e.g., Solve for x: 2x + 5 = 13)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[60px] w-full resize-none rounded-lg pr-20 pl-4 py-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Upload Image"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Voice Input"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Draw"
              >
                <PenTool className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={handleSubmit}
                disabled={!inputText.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent; 