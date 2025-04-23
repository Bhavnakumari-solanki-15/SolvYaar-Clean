import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getChatCompletion, getCodeCompletion, getMathCompletion, getVisionCompletion } from '@/lib/groq';
import { Loader2 } from 'lucide-react';

export default function AITest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [input, setInput] = useState('');

  // Test chat completion
  const testChat = async () => {
    setLoading(true);
    try {
      const response = await getChatCompletion([
        { role: "user", content: input || "What is the capital of France?" }
      ]);
      setResult(response);
    } catch (error) {
      console.error("Chat error:", error);
      setResult("Error: " + (error as Error).message);
    }
    setLoading(false);
  };

  // Test code completion
  const testCode = async () => {
    setLoading(true);
    try {
      const response = await getCodeCompletion(
        input || "Write a function to calculate fibonacci numbers in JavaScript"
      );
      setResult(response);
    } catch (error) {
      console.error("Code error:", error);
      setResult("Error: " + (error as Error).message);
    }
    setLoading(false);
  };

  // Test math completion
  const testMath = async () => {
    setLoading(true);
    try {
      const response = await getMathCompletion(
        input || "Solve the equation: 2x + 5 = 13"
      );
      setResult(response);
    } catch (error) {
      console.error("Math error:", error);
      setResult("Error: " + (error as Error).message);
    }
    setLoading(false);
  };

  // Test vision completion
  const testVision = async () => {
    setLoading(true);
    try {
      const response = await getVisionCompletion(
        input || "A red apple sitting on a wooden table",
        "What do you see in this image?"
      );
      setResult(response);
    } catch (error) {
      console.error("Vision error:", error);
      setResult("Error: " + (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Groq AI Test</CardTitle>
          <CardDescription>Test different AI capabilities using Groq</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Input:</label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your prompt here..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={testChat} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Chat
            </Button>
            <Button onClick={testCode} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Code
            </Button>
            <Button onClick={testMath} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Math
            </Button>
            <Button onClick={testVision} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Vision
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Result:</label>
            <div className="p-4 rounded-lg bg-muted/50 min-h-[200px] whitespace-pre-wrap">
              {result || "Results will appear here..."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 