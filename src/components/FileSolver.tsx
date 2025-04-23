import { useState, useRef } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { toast } from "./ui/sonner";
import { FileText, Upload, Download, Copy, RefreshCw, X } from "lucide-react";
import { groq } from "../lib/groq-api";

interface Solution {
  question: string;
  steps: string[];
  answer: string;
  explanation: string;
  isRetrying?: boolean;
}

// Enhanced math notation formatting function
const formatMathNotation = (text: string): string => {
  return text
    // Superscripts (x^2 -> x²)
    .replace(/\^(\d+)/g, '<sup>$1</sup>')
    // Fractions (a/b -> properly styled fraction)
    .replace(/(\d+)\/(\d+)/g, '<span class="inline-block align-middle"><span class="block text-center border-b">$1</span><span class="block text-center">$2</span></span>')
    // Square roots (sqrt(x) -> √x)
    .replace(/sqrt\((.*?)\)/g, '√($1)')
    // Mathematical symbols
    .replace(/\*/g, '×')
    .replace(/!=/g, '≠')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
    .replace(/\+-/g, '±')
    .replace(/infinity/g, '∞')
    // Greek letters
    .replace(/alpha/g, 'α')
    .replace(/beta/g, 'β')
    .replace(/gamma/g, 'γ')
    .replace(/delta/g, 'δ')
    .replace(/theta/g, 'θ')
    .replace(/pi/g, 'π')
    // Subscripts (x_1 -> x₁)
    .replace(/\_(\d)/g, '<sub>$1</sub>');
};

const FileSolver = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<string[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a PDF, DOCX, or CSV file");
      return;
    }

    setSelectedFile(file);
    await extractQuestions(file);
  };

  // Extract questions from file
  const extractQuestions = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await readFileContent(file);
      
      // Use Groq to extract math questions
      const response = await groq.recognizeMathFromText(
        `Extract all mathematical questions from the following text. Return only the questions, one per line:

        ${text}`
      );

      const questions = response.split('\n').filter(q => q.trim());
      setExtractedQuestions(questions);
      
    } catch (error) {
      console.error("Error extracting questions:", error);
      toast.error("Failed to extract questions from file");
    } finally {
      setIsProcessing(false);
    }
  };

  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            throw new Error("Failed to read file");
          }

          if (file.type === 'application/pdf') {
            // For PDF files, we need to use readAsDataURL
            const base64Content = e.target.result as string;
            // Remove the data:application/pdf;base64, prefix
            const pdfContent = base64Content.split(',')[1];
            
            // Now we can send this to our solver
            resolve(pdfContent);
          } else {
            // For other file types, we can use the text content directly
            resolve(e.target.result as string);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      
      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Solve a single question
  const solveQuestion = async (question: string, index: number) => {
    try {
      setSolutions(prev => {
        const newSolutions = [...prev];
        newSolutions[index] = {
          ...newSolutions[index],
          isRetrying: true
        };
        return newSolutions;
      });

      const solution = await groq.recognizeMathFromText(
        `Solve this math problem step-by-step and explain each step clearly:

        ${question}

        Provide your response in this format:
        
        SOLUTION:
        1. [First step explanation]
        2. [Second step explanation]
        ...

        ANSWER:
        [Final answer]

        EXPLANATION:
        [Any additional explanations or diagrams needed]`
      );

      // Parse the solution response
      const solutionParts = solution.split('\n\n');
      const steps = solutionParts.find(part => part.startsWith('SOLUTION:'))?.split('\n').slice(1) || [];
      const answer = solutionParts.find(part => part.startsWith('ANSWER:'))?.split('\n')[1] || '';
      const explanation = solutionParts.find(part => part.startsWith('EXPLANATION:'))?.split('\n').slice(1).join('\n') || '';

      setSolutions(prev => {
        const newSolutions = [...prev];
        newSolutions[index] = {
          question,
          steps,
          answer,
          explanation,
          isRetrying: false
        };
        return newSolutions;
      });

      toast.success(`Question ${index + 1} solved successfully!`);
      
    } catch (error) {
      console.error("Error solving question:", error);
      toast.error(`Failed to solve question ${index + 1}`);
      
      setSolutions(prev => {
        const newSolutions = [...prev];
        newSolutions[index] = {
          ...newSolutions[index],
          isRetrying: false
        };
        return newSolutions;
      });
    }
  };

  // Solve all questions
  const solveQuestions = async () => {
    setIsProcessing(true);
    try {
      const initialSolutions = extractedQuestions.map(question => ({
        question,
        steps: [],
        answer: '',
        explanation: '',
        isRetrying: false
      }));
      setSolutions(initialSolutions);

      // Solve questions sequentially to avoid rate limiting
      for (let i = 0; i < extractedQuestions.length; i++) {
        await solveQuestion(extractedQuestions[i], i);
      }

      toast.success("All questions solved successfully!");
      
    } catch (error) {
      console.error("Error solving questions:", error);
      toast.error("Failed to solve some questions");
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy solution to clipboard
  const copySolution = (solution: Solution) => {
    const text = `Question:\n${solution.question}\n\nSolution Steps:\n${solution.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nFinal Answer:\n${solution.answer}\n\nExplanation:\n${solution.explanation}`;
    
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Solution copied to clipboard!"))
      .catch(() => toast.error("Failed to copy solution"));
  };

  // Export solutions
  const exportSolutions = async (format: 'pdf' | 'docx' | 'csv') => {
    try {
      // Create content for export
      const content = solutions.map((sol, index) => `
Question ${index + 1}: ${sol.question}

Solution Steps:
${sol.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Final Answer:
${sol.answer}

Additional Explanation:
${sol.explanation}

-------------------
`).join('\n');

      let blob: Blob;
      let filename: string;

      // Initialize blob and filename based on format
      if (format === 'csv') {
        const csvContent = solutions.map(sol => 
          `"${sol.question}","${sol.answer}","${sol.explanation}"`
        ).join('\n');
        blob = new Blob([csvContent], { type: 'text/csv' });
        filename = 'math_solutions.csv';
      } else if (format === 'pdf') {
        // For PDF, we'll use browser's print functionality
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Math Solutions</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .question { margin-top: 20px; font-weight: bold; }
                  .solution { margin-left: 20px; }
                  .fraction { display: inline-block; text-align: center; vertical-align: middle; }
                  .fraction > span { display: block; padding: 0.1em; }
                  .fraction span.bottom { border-top: 1px solid; }
                </style>
              </head>
              <body>
                <h1>Math Solutions</h1>
                ${content.split('\n').map(line => formatMathNotation(line)).join('<br>')}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          return;
        }
        // Fallback if print window fails
        blob = new Blob([content], { type: 'text/plain' });
        filename = 'math_solutions.txt';
      } else {
        // For DOCX, create a simple text file
        blob = new Blob([content], { type: 'text/plain' });
        filename = 'math_solutions.txt';
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exporting solutions:", error);
      toast.error("Failed to export solutions");
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6">
            {selectedFile ? (
              <>
                <FileText className="h-12 w-12 text-primary/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selected File</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {selectedFile.name}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4 mr-2" /> Clear
                </Button>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-primary/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload File</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload PDF, DOCX, or CSV files to extract and solve math problems
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
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
          </div>

          {selectedFile && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={solveQuestions}
                disabled={isProcessing}
                className="px-8"
              >
                {isProcessing ? "Processing..." : "Solve"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Questions Section */}
      {extractedQuestions.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-medium mb-3">Extracted Questions:</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {extractedQuestions.map((question, index) => (
                <div key={index} className="p-3 bg-muted rounded-md">
                  <p className="font-medium mb-1">Question {index + 1}:</p>
                  {question}
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              onClick={solveQuestions}
              disabled={isProcessing}
            >
              {isProcessing ? "Solving Questions..." : "Solve All Questions"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Solutions Section */}
      {solutions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium">Solutions:</h4>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSolutions('pdf')}
              >
                <Download className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSolutions('docx')}
              >
                <Download className="h-4 w-4 mr-2" /> DOCX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSolutions('csv')}
              >
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
            </div>
          </div>

          {solutions.map((solution, index) => (
            <Card key={index}>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">Question {index + 1}:</h5>
                    <div className="space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copySolution(solution)}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => solveQuestion(solution.question, index)}
                        disabled={solution.isRetrying}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${solution.isRetrying ? 'animate-spin' : ''}`} />
                        {solution.isRetrying ? 'Retrying...' : 'Solve Again'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-red-500" dangerouslySetInnerHTML={{ __html: formatMathNotation(solution.question) }}></p>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Solution Steps:</h5>
                  <ol className="list-decimal list-inside space-y-1">
                    {solution.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="pl-2">
                        <span dangerouslySetInnerHTML={{ __html: formatMathNotation(step) }}></span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-2 border-t">
                  <h5 className="font-medium mb-2">Final Answer:</h5>
                  <p className="bg-muted/30 p-3 rounded-md" 
                     dangerouslySetInnerHTML={{ __html: formatMathNotation(solution.answer) }}>
                  </p>
                </div>

                {solution.explanation && (
                  <div className="pt-2 border-t">
                    <h5 className="font-medium mb-2">Additional Explanation:</h5>
                    <p dangerouslySetInnerHTML={{ __html: formatMathNotation(solution.explanation) }}></p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileSolver; 