import { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { toast } from "./ui/sonner";
import { 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  X,
  Upload
} from "lucide-react";

interface ProblemInputProps {
  onSubmit: (problem: string) => void;
}

const ProblemInput: React.FC<ProblemInputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setInput(`Image: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info("Voice recording started");
    } else {
      toast.success("Voice recording stopped");
      setInput("Voice input placeholder");
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) {
      toast.error("Please enter a problem first");
      return;
    }
    onSubmit(input);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-lg">
      <CardContent className="p-6">
        <div className="relative">
          <Textarea
            placeholder="Enter your math problem here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] pr-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
          />
          {input && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              onClick={() => {
                setInput('');
                setImagePreview(null);
                setIsRecording(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {imagePreview && (
          <div className="mt-4 relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-[300px] mx-auto rounded-lg shadow-md"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
              onClick={() => {
                setImagePreview(null);
                setInput('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex justify-between gap-4 mt-4">
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              id="image-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Upload Image
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              onClick={handleVoiceInput}
              className="bg-gradient-to-r from-rose-500 to-pink-500 text-white"
            >
              <Mic className={`h-4 w-4 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
              {isRecording ? "Stop Recording" : "Record Voice"}
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!input}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Solve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemInput; 