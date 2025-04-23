import { useState, useRef, ChangeEvent } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "./ui/sonner";
import { useAuth } from "../contexts/AuthContext";
import { Camera, FileText, Mic, PenTool, Upload, Calculator, X } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import DrawingCanvas from "./DrawingCanvas";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { createWorker, PSM } from 'tesseract.js';
import { groq } from "../lib/groq-api";
import { LineChart, PenLine } from "lucide-react";
import LatexInput from "./LatexInput";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

interface MathProblem {
  problem: string;
  type: "text" | "image" | "voice" | "latex" | "file";
  content?: string;
  latex?: string;  // Add latex field to MathProblem interface
}

interface MathInputProps {
  onSubmit: (problem: MathProblem) => void;
  isLoading?: boolean;
  onClear: () => void;
}

const MathInput: React.FC<MathInputProps> = ({ onSubmit, isLoading, onClear }) => {
  const [inputMethod, setInputMethod] = useState<"text" | "image" | "voice" | "latex" | "file">("text");
  const [textInput, setTextInput] = useState("");
  const [latexPreview, setLatexPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { user, isAuthenticated } = useAuth();
  const [solution, setSolution] = useState<{
    steps: string[];
    answer: string;
    explanation: string;
  } | null>(null);
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [textSolveCount, setTextSolveCount] = useState(0);

  // Function to send event to WebSocket server
  const sendEventToServer = async (query: {
    topic: string;
    latex: string;
    formulaType: string;
  }) => {
    try {
      // Only skip if not authenticated
      if (!isAuthenticated) {
        console.log('Event not sent: User not authenticated');
        return;
      }

      const event = {
        userId: user?.id || 'anonymous',
        ...query,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.error('Failed to send event to server');
      }
    } catch (error) {
      console.error('Error sending event to server:', error);
    }
  };

  const tabMeta = [
    { value: 'text', label: 'Text', icon: FileText },
    { value: 'image', label: 'Image', icon: Camera },
    { value: 'voice', label: 'Voice', icon: Mic },
    { value: 'latex', label: 'LaTeX', icon: Calculator },
    { value: 'file', label: 'File', icon: Upload },
  ];

  const visibleTabs = isAuthenticated
    ? tabMeta
    : tabMeta.filter(tab => tab.value === 'text');

  // Process image using Tesseract and Groq
  const processImage = async (file: File) => {
    try {
      setIsProcessing(true);
      
      // Create and initialize worker
      const worker = await createWorker();
      await worker.load();
      await worker.reinitialize('eng');
      
      // Configure worker for math symbols
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789+-×÷=()[]{}<>√π∞abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });

      toast.info("Reading image...");
      const { data: { text } } = await worker.recognize(file);
      
      if (!text) {
        toast.error("No text found. Please upload a clearer image.");
        setIsProcessing(false);
        await worker.terminate();
        return;
      }

      toast.info("Processing math content...");
      // Use Groq to improve the recognized text
      const improvedText = await groq.recognizeMathFromText(text);
      
      if (improvedText.toLowerCase().includes("unreadable")) {
        toast.error("Image is unclear. Please upload a clearer image with better lighting and contrast.");
        setIsProcessing(false);
        await worker.terminate();
      return;
    }

      toast.info("Converting to LaTeX...");
      // Convert to LaTeX and get solution
      const latex = await groq.convertToLatex(improvedText);
      
      toast.info("Solving problem...");
      const solution = await groq.recognizeMathFromText(`Solve the following math problem step by step and explain each step clearly:

      ${improvedText}

      Provide your response in this format:
      
      SOLUTION:
      1. [First step explanation]
      2. [Second step explanation]
      ...

      ANSWER:
      [Final answer]

      EXPLANATION:
      [Any additional explanations or diagrams needed]`);

      // Parse the solution response
      const solutionParts = solution.split('\n\n');
      const steps = solutionParts.find(part => part.startsWith('SOLUTION:'))?.split('\n').slice(1) || [];
      const answer = solutionParts.find(part => part.startsWith('ANSWER:'))?.split('\n')[1] || '';
      const explanation = solutionParts.find(part => part.startsWith('EXPLANATION:'))?.split('\n').slice(1).join('\n') || '';

      // Update UI with extracted content and solution
      setTextInput(improvedText);
      setLatexPreview(latex);
      
      // Store the full solution for display
      setSolution({
        steps,
        answer,
        explanation
      });

      toast.success("Problem solved successfully!");
      await worker.terminate();
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image. Please try again with a clearer image.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Process voice recording
  const processVoiceRecording = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Check if the audio blob is empty
      if (audioBlob.size === 0) {
        throw new Error("No audio was recorded. Please try speaking louder or closer to the microphone.");
      }

      const transcription = await groq.transcribeAudio(audioBlob);
      
      if (!transcription || transcription.trim().length === 0) {
        throw new Error("Could not transcribe the audio. Please try speaking more clearly.");
      }

      // Convert transcription to LaTeX
      const latex = await groq.recognizeMathFromText(transcription);
      
      if (!latex || latex.trim().length === 0) {
        throw new Error("Could not convert the transcription to a mathematical expression. Please try speaking more clearly.");
      }

      setTranscribedText(transcription);
      setError(null);
    } catch (err) {
      console.error("Error processing voice recording:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process voice recording";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle voice recording complete
  const handleVoiceRecordingComplete = async () => {
    try {
      if (!transcribedText) {
        toast.error("No transcription available");
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });

    onSubmit({
        problem: transcribedText,
        type: "voice",
        content: undefined
    });
    } catch (error) {
      console.error("Error processing voice recording:", error);
      toast.error("Failed to process your recording. Please try again.");
    }
  };

  // Handle file change for images
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    
    if (inputMethod === "image" && !allowedImageTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    setSelectedFile(file);
    
    // Create a preview URL for images
    if (allowedImageTypes.includes(file.type)) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
      
      // Process image
      await processImage(file);
    } else {
      setFilePreviewUrl(null);
    }
  };

  // Handle file submit
  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    
    try {
      const content = await readFileAsBase64(selectedFile);
      
      onSubmit({
        problem: textInput,
        type: inputMethod === "image" ? "image" : "file",
        content,
      });
      
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process the file. Please try again.");
    }
  };

  // Read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      setError(null);
      console.log("Starting recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Check for best supported audio format
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log("Using audio format:", mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsProcessing(true);
          toast.info("Processing your voice recording...");
          
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log("Final audio size:", audioBlob.size, "bytes");
          
          if (audioBlob.size === 0) {
            throw new Error("No audio was recorded. Please try again.");
          }
          
          if (audioBlob.size > 5 * 1024 * 1024) {
            throw new Error("Recording too long. Please keep it under 15 seconds.");
          }
          
          // Process the audio
          const transcription = await groq.transcribeAudio(audioBlob);
          console.log("Transcription:", transcription);
          
          if (!transcription || transcription.trim().length === 0) {
            throw new Error("No speech detected. Please speak clearly and try again.");
          }
          
          setTranscribedText(transcription);
          setError(null);
          toast.success("Voice recording processed successfully");
          
        } catch (error) {
          console.error("Error processing voice:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to process voice recording";
          setError(errorMessage);
          toast.error(errorMessage, {
            description: "Try speaking more clearly or closer to the microphone.",
            action: {
              label: "Try Again",
              onClick: () => startRecording()
            }
          });
        } finally {
          setIsProcessing(false);
          // Stop all tracks in the stream
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(500);
      setIsRecording(true);
      toast.success("Recording started", {
        description: "Speak your math problem clearly and press the button again to stop."
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access microphone";
      setError(errorMessage);
      toast.error("Failed to start recording: " + errorMessage);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Processing your voice...");
    }
  };

  // Handle voice submit
  const handleVoiceSubmit = async () => {
    if (!transcribedText) {
      setError("Please record your math problem first");
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      
      const solution = await groq.recognizeMathFromText(`Solve the following math problem step by step and explain each step clearly:

      ${transcribedText}

      Provide your response in this format:
      
      SOLUTION:
      1. [First step explanation]
      2. [Second step explanation]
      ...

      ANSWER:
      [Final answer]

      EXPLANATION:
      [Any additional explanations or diagrams needed]`);

      // Parse the solution response
      const solutionParts = solution.split('\n\n');
      const steps = solutionParts.find(part => part.startsWith('SOLUTION:'))?.split('\n').slice(1) || [];
      const answer = solutionParts.find(part => part.startsWith('ANSWER:'))?.split('\n')[1] || '';
      const explanation = solutionParts.find(part => part.startsWith('EXPLANATION:'))?.split('\n').slice(1).join('\n') || '';

      // Format the LaTeX for better readability
      const formattedSteps = steps.map(step => {
        return step
          .replace(/\\lim_\{x \\to \\infty\}/g, '\\lim_{x \\to \\infty}')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}')
          .replace(/\\cdot/g, ' \\cdot ')
          .replace(/\\infty/g, '\\infty')
          .replace(/\\boxed\{([^}]+)\}/g, '\\boxed{$1}');
      });

      setSolution({
        steps: formattedSteps,
        answer: answer.replace(/\\boxed\{([^}]+)\}/g, '\\boxed{$1}'),
        explanation
      });

      // Call the parent onSubmit handler with the solution
      onSubmit({
        problem: transcribedText,
        type: "voice",
        content: undefined
      });

      toast.success("Problem solved successfully!");
    } catch (error) {
      console.error("Error solving problem:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to solve the problem";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate mathematical expression
  const validateMathExpression = (input: string): boolean => {
    // Basic validation rules
    const hasValidParentheses = (str: string) => {
      const stack = [];
      for (let char of str) {
        if (char === '(' || char === '{' || char === '[') {
          stack.push(char);
        } else if (char === ')' || char === '}' || char === ']') {
          if (stack.length === 0) return false;
          const last = stack.pop();
          if (
            (char === ')' && last !== '(') ||
            (char === '}' && last !== '{') ||
            (char === ']' && last !== '[')
          ) {
            return false;
          }
        }
      }
      return stack.length === 0;
    };

    // Check for basic syntax errors
    const hasValidOperators = !/([\+\-\*\/]){2,}/.test(input); // No consecutive operators
    const hasValidEquals = (input.match(/=/g) || []).length <= 1; // At most one equals sign
    const hasBalancedParentheses = hasValidParentheses(input);

    return hasValidOperators && hasValidEquals && hasBalancedParentheses;
  };

  // Convert plain text to LaTeX
  const convertToLatex = (input: string): string => {
    let latex = input
      .replace(/\^(\d+)/g, "^{$1}") // Convert powers
      .replace(/sqrt\((.*?)\)/g, "\\sqrt{$1}") // Convert square roots
      .replace(/\*/g, "\\times ") // Convert multiplication
      .replace(/\//g, "\\div ") // Convert division
      .replace(/(sin|cos|tan|log|ln)\((.*?)\)/g, "\\$1($2)"); // Convert functions
    
    return latex;
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextInput(newValue);
    
    // Update LaTeX preview
    groq.convertToLatex(newValue).then(latex => {
      setLatexPreview(latex);
    });
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast.error("Please enter a math problem");
      return;
    }

    if (!validateMathExpression(textInput)) {
      toast.error("Invalid math expression. Please check your input.");
      return;
    }

    try {
      const latex = convertToLatex(textInput);
      setLatexPreview(latex);

      // Send event to server (already has error handling inside)
      sendEventToServer({
        topic: 'algebra', // You might want to detect this based on the input
        latex: latex,
        formulaType: 'text',
      });

      onSubmit({
        problem: textInput,
        type: "text",
        latex: latex,
      });

      // Only for non-logged-in users, increment solve count and show modal if needed
      if (!isAuthenticated) {
        const newCount = textSolveCount + 1;
        setTextSolveCount(newCount);
        if (newCount === 3) {
          setShowLoginPrompt(true);
        }
      }
    } catch (error) {
      // Log error but don't show to user
      console.error("Error submitting text input:", error);
    }
  };

  const handleLatexSubmit = (latex: string) => {
    if (!latex.trim()) {
      toast.error("Please enter a LaTeX expression");
      return;
    }

    // Send event to server
    sendEventToServer({
      topic: 'algebra', // You might want to detect this based on the input
      latex: latex,
      formulaType: 'latex',
    });

    onSubmit({
      problem: latex,
      type: "latex",
      latex: latex,
    });
  };

  const handlePremiumFeatureClick = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to use this feature", {
        description: "Create an account to unlock all premium features.",
        action: {
          label: "Log in",
          onClick: () => {
            // This would trigger the login dialog, but for now we'll just show another toast
            toast.info("Click the Login button in the header to get started");
          },
        },
      });
    }
  };

  const handleClear = () => {
    setTextInput("");
    setLatexPreview("");
    setTranscribedText("");
    setError(null);
    setSolution(null);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  return (
    <>
      <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-background/90 backdrop-blur-sm">
          {tabMeta.map(({ value, label, icon: Icon }) => {
            const isDisabled = !isAuthenticated && value !== 'text';
            return (
              <TabsTrigger
                key={value}
                value={value}
                disabled={isDisabled}
                className="flex items-center gap-2 data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-900/40"
                title={isDisabled ? "Please sign in to use this feature" : undefined}
              >
                <Icon className="h-4 w-4" /> {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="text">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-400/20 rounded-xl p-6 bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl">
              <div className="w-full">
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-purple-200/20 dark:border-purple-900/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-gray-100">Enter Math Problem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Textarea
                        placeholder="Enter your math problem here... (e.g., Solve for x: 2x + 5 = 13)"
                        value={textInput}
                        onChange={handleTextChange}
                        className="min-h-[120px] w-full resize-none rounded-xl pr-20 pl-4 py-3 bg-white/20 dark:bg-slate-800/40 border border-purple-400/20 focus:ring-4 focus:ring-purple-500/40 shadow-inner text-lg"
                      />
                      {textInput && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8"
                          onClick={handleClear}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* LaTeX preview */}
                {latexPreview && (
                  <Card className="mt-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-purple-200/20 dark:border-purple-900/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-gray-900 dark:text-gray-100">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-mono p-4 bg-slate-900 text-white rounded-lg">
                        {textInput
                          .replace(/\*/g, '×')
                          .replace(/\^2/g, '²')
                          .replace(/\^3/g, '³')
                          .replace(/\^4/g, '⁴')
                          .replace(/\^5/g, '⁵')
                          .replace(/\^6/g, '⁶')
                          .replace(/\^7/g, '⁷')
                          .replace(/\^8/g, '⁸')
                          .replace(/\^9/g, '⁹')
                          .replace(/sqrt\((.*?)\)/g, '√$1')
                          .replace(/\//g, '÷')}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Solve button */}
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  >
                    {isLoading ? "Solving..." : "Solve"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="m-0">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-400/20 rounded-xl p-8 bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl">
              {filePreviewUrl ? (
                <div className="relative w-full">
                  <img 
                    src={filePreviewUrl} 
                    alt="Selected" 
                    className="mx-auto max-h-[200px] rounded-md object-contain"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Math Problem</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Take a clear photo or upload an image of your math problem
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/20 dark:bg-slate-800/40 border-purple-400/20 hover:bg-purple-50/80 dark:hover:bg-purple-900/40"
                  >
                    <Upload className="h-4 w-4 mr-2" /> Choose Image
                  </Button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {filePreviewUrl && (
                <div className="flex justify-end w-full mt-4">
                  <Button 
                    onClick={handleFileSubmit} 
                    disabled={!selectedFile || isProcessing}
                    className="px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl"
                  >
                    {isProcessing ? "Processing..." : "Solve"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="voice" className="m-0">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-400/20 rounded-xl p-8 bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl">
              {isRecording ? (
                <div className="text-center">
                  <div className="relative">
                    <Mic className="h-12 w-12 text-purple-400 animate-pulse" />
                    <div className="absolute inset-0 bg-purple-400/10 rounded-full animate-ping" />
                  </div>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">Recording...</p>
                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={stopRecording}
                  >
                    Stop Recording
                  </Button>
                </div>
              ) : transcribedText ? (
                <div className="w-full">
                  <div className="relative">
                    <Textarea
                      value={transcribedText}
                      onChange={(e) => setTranscribedText(e.target.value)}
                      className="min-h-[200px] w-full resize-none rounded-xl pr-20 pl-4 py-3 bg-white/20 dark:bg-slate-800/40 border border-purple-400/20 focus:ring-4 focus:ring-purple-500/40 shadow-inner text-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={handleClear}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleVoiceSubmit}
                      disabled={!transcribedText.trim() || isProcessing}
                      className="px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl"
                    >
                      {isProcessing ? "Solving..." : "Solve"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Mic className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Voice Input</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Speak your math problem clearly
                  </p>
                  <Button 
                    onClick={startRecording}
                    className="bg-white/20 dark:bg-slate-800/40 border-purple-400/20 hover:bg-purple-50/80 dark:hover:bg-purple-900/40"
                  >
                    Start Recording
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="latex" className="m-0">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-400/20 rounded-xl p-8 bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl">
              {!isAuthenticated ? (
                <div className="text-center">
                  <Calculator className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">LaTeX Input</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Log in to use the LaTeX input feature for your math problems.
                  </p>
                  <Button 
                    onClick={handlePremiumFeatureClick}
                    className="bg-white/20 dark:bg-slate-800/40 border-purple-400/20 hover:bg-purple-50/80 dark:hover:bg-purple-900/40"
                  >
                    Log in to Access
                  </Button>
                </div>
              ) : (
                <LatexInput onSave={handleLatexSubmit} onClear={handleClear} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="file" className="m-0">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-400/20 rounded-xl p-8 bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl">
              {!isAuthenticated ? (
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Log in to upload and solve math problems from PDF, DOCX, or CSV files.
                  </p>
                  <Button 
                    onClick={handlePremiumFeatureClick}
                    className="bg-white/20 dark:bg-slate-800/40 border-purple-400/20 hover:bg-purple-50/80 dark:hover:bg-purple-900/40"
                  >
                    Log in to Access
                  </Button>
                </div>
              ) : (
                <>
                  {selectedFile ? (
                    <div className="w-full">
                      <div className="flex items-center p-4 bg-white/20 dark:bg-slate-800/40 rounded-xl border border-purple-400/20">
                        <FileText className="h-8 w-8 text-purple-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{selectedFile.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={handleFileSubmit} 
                          disabled={!selectedFile || isProcessing}
                          className="px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl"
                        >
                          {isProcessing ? "Processing..." : "Extract & Solve"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 text-purple-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Upload File</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                        Upload PDF, DOCX, or CSV files to extract and solve math problems
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/20 dark:bg-slate-800/40 border-purple-400/20 hover:bg-purple-50/80 dark:hover:bg-purple-900/40"
                      >
                        <Upload className="h-4 w-4 mr-2" /> Choose File
                      </Button>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock More Features</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="mb-4">Log in or sign up to save your progress and access more features!</p>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setShowLoginPrompt(false);
                navigate("/login");
              }}
            >
              Log in / Sign up
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowLoginPrompt(false)}
            >
              Continue without login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MathInput;
