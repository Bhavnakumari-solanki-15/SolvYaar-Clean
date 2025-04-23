import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Plus, Search, Mic, Image, Send, MessageSquare, Calculator } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { toast } from "./ui/sonner";

export function ChatPanel() {
  const [input, setInput] = useState("");

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#343541]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-2 text-center border-b border-white/20">
        <div className="flex items-center gap-3 border-b p-3">
          <Calculator className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">SolvYaar</h1>
        </div>
      </div>

      {/* Empty State / Chat Messages */}
      <div className="flex-1 overflow-auto pt-16 pb-32">
        <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-6">
          <h2 className="text-2xl font-semibold">What can I help with?</h2>
          <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 bg-transparent border border-white/20 hover:bg-gray-700"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Solve equations</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 bg-transparent border border-white/20 hover:bg-gray-700"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Graph functions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 bg-transparent border border-white/20 hover:bg-gray-700"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Step-by-step solutions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 bg-transparent border border-white/20 hover:bg-gray-700"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Practice problems</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#343541]">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              placeholder="Ask anything"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[56px] w-full resize-none rounded-lg pr-20 pl-4 py-4 bg-[#40414f] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-white/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // Handle submit
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-gray-700"
              >
                <Image className="h-4 w-4 text-white/70" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-gray-700"
              >
                <Mic className="h-4 w-4 text-white/70" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 bg-[#19c37d] hover:bg-[#19c37d]/90"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground p-2 text-center">
            SolvYaar can make mistakes. Consider checking important calculations.
          </div>
        </div>
      </div>
    </div>
  );
} 