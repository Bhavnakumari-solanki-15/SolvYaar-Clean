import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Image, Mic, PenTool, Send, History, LineChart, Lightbulb } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

type InputType = "text" | "image" | "voice" | "draw" | "file";

export function ToolsPanel() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedInput, setSelectedInput] = useState<InputType>("text");
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = async () => {
    if (!problem.trim()) return;
    setLoading(true);
    // TODO: Implement solution logic
    setLoading(false);
  };

  const handleRecordClick = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Left Panel */}
      <div className="w-[280px] absolute left-0 top-0 bottom-0 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 space-y-4">
          <div className="flex flex-col space-y-1">
            <h2 className="text-sm font-semibold">Smart AI Features</h2>
            <p className="text-xs text-muted-foreground">Customize your solving experience</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12h6m-2 2l2-2-2-2m4 0h12" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Graph & Visualization</span>
                  <span className="text-xs text-muted-foreground">Plot graphs and visualize concepts</span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="h-4 w-8 rounded-full bg-primary/30"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Hint System</span>
                  <span className="text-xs text-muted-foreground">Get step-by-step hints</span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="h-4 w-8 rounded-full bg-primary/30"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Auto Topic Detection</span>
                  <span className="text-xs text-muted-foreground">Identify math topics automatically</span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="h-4 w-8 rounded-full bg-primary/30"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Symbolic Engine</span>
                  <span className="text-xs text-muted-foreground">Precise algebraic calculations</span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="h-4 w-8 rounded-full bg-primary/30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] px-4">
        <div className="w-full max-w-3xl space-y-4">
          {/* Input Type Selector */}
          <div className="flex justify-center space-x-1 bg-muted/50 rounded-lg p-1">
            <Button 
              variant="ghost" 
              className={cn(
                "flex-1 text-sm",
                selectedInput === "text" && "bg-background shadow-sm"
              )}
              onClick={() => setSelectedInput("text")}
            >
              Text
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "flex-1 text-sm",
                selectedInput === "image" && "bg-background shadow-sm"
              )}
              onClick={() => setSelectedInput("image")}
            >
              Image
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "flex-1 text-sm",
                selectedInput === "voice" && "bg-background shadow-sm"
              )}
              onClick={() => setSelectedInput("voice")}
            >
              Voice
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "flex-1 text-sm",
                selectedInput === "draw" && "bg-background shadow-sm"
              )}
              onClick={() => setSelectedInput("draw")}
            >
              Draw
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "flex-1 text-sm",
                selectedInput === "file" && "bg-background shadow-sm"
              )}
              onClick={() => setSelectedInput("file")}
            >
              File
            </Button>
          </div>

          {/* Voice Recording Interface */}
          <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
            <button
              onClick={handleRecordClick}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                isRecording ? "bg-red-500" : "bg-primary",
                "hover:opacity-90"
              )}
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
            <p className="text-muted-foreground">
              {isRecording ? "Recording..." : "Click to start recording"}
            </p>
          </div>

          {/* Solve Button */}
          <Button 
            className="w-full py-6 text-lg font-medium"
            variant="default"
          >
            Solve Problem
          </Button>
        </div>
      </div>
    </div>
  );
}
