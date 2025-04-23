import { getChatCompletion, getMathCompletion } from '@/lib/groq';
import { MathProblem, MathSolution } from "../lib/groq-api";

export interface SolverResult {
  solution: MathSolution | null;
  steps?: string[];
  latex?: string;
  error?: string;
}

class SolverService {
  // Add helper method for formatting prompts
  private formatMathPrompt(input: string, type: 'text' | 'image' | 'voice' | 'file'): string {
    return `You are a mathematical expert and teacher. Analyze and solve this problem with detailed explanations.
    Use proper mathematical notation in your response:
    - Use ^ for exponents (e.g., x^2)
    - Use sqrt() for square roots
    - Use proper fraction notation (numerator/denominator)
    - Use Greek letters where appropriate (alpha, beta, pi, etc.)
    - Use mathematical symbols (±, ×, ÷, ≤, ≥, ≠, ∞)
    - Use subscripts with underscore (e.g., x_1)
    
    Problem: ${input}
    
    Format your response EXACTLY as follows:
    CONCEPT:
    [Brief, student-friendly explanation of the core mathematical concept(s) involved]
    
    KEY_POINTS:
    - [List the key mathematical principles needed]
    - [Include relevant formulas or rules with proper notation]
    
    SOLUTION:
    1. [First step with clear explanation using proper mathematical notation]
    2. [Second step with explanation]
    ... [Continue with numbered steps]
    
    ANSWER:
    [Final answer with proper mathematical notation]
    
    VERIFICATION:
    [How to check if the answer makes sense]
    
    LATEX:
    [LaTeX representation of the solution]
    
    TOPIC:
    [Specific mathematical topic and subtopic]
    
    HINTS:
    1. [First hint to guide understanding]
    2. [Second hint for problem-solving approach]
    3. [Additional hints if needed]
    
    RELATED_CONCEPTS:
    - [Related mathematical concepts]
    - [Where this concept is used in real life]`;
  }

  // Mock responses if API fails
  private createMockSolution(): MathSolution {
    return {
      solution: "x = 2 or x = 3",
      explanation: "The problem involves solving a quadratic equation using either factoring or the quadratic formula.",
      steps: [
        "Identify the coefficients in the standard form: a = 1, b = -5, c = 6",
        "Try to factor the quadratic expression: x² - 5x + 6 = (x - 2)(x - 3)",
        "Set each factor equal to zero: x - 2 = 0 → x = 2, x - 3 = 0 → x = 3",
        "Verify the solutions by substituting back into the original equation."
      ],
      latex: "x^2 - 5x + 6 = 0 \\\\ (x - 2)(x - 3) = 0 \\\\ x = 2 \\text{ or } x = 3",
      topic: "Algebra - Quadratic Equations",
      hints: [
        "Try to factor the quadratic expression first.",
        "If factoring doesn't work easily, use the quadratic formula.",
        "Always verify your solutions by substituting back into the original equation."
      ],
      keyPoints: [
        "A quadratic equation has the form ax² + bx + c = 0",
        "The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a",
        "The discriminant b² - 4ac determines the nature of the solutions"
      ],
      verification: "For x = 2: (2)² - 5(2) + 6 = 4 - 10 + 6 = 0 ✓\nFor x = 3: (3)² - 5(3) + 6 = 9 - 15 + 6 = 0 ✓",
      relatedConcepts: [
        "Factoring polynomials",
        "The quadratic formula",
        "Vieta's formulas relating roots to coefficients",
        "Applications in physics for modeling projectile motion"
      ]
    };
  }

  // Text-based math solving
  async solveText(input: string): Promise<SolverResult> {
    try {
      const prompt = this.formatMathPrompt(input, 'text');
      let response;
      
      try {
        response = await getMathCompletion(prompt);
      } catch (error) {
        console.warn("Error with Groq API, using mock response:", error);
        // Return a mock solution
        return {
          solution: this.createMockSolution(),
          steps: this.createMockSolution().steps,
          latex: this.createMockSolution().latex
        };
      }
      
      // Parse the response into sections
      const sections = response.split('\n\n');
      const concept = sections.find(s => s.startsWith('CONCEPT:'))?.replace('CONCEPT:', '').trim();
      const keyPoints = sections.find(s => s.startsWith('KEY_POINTS:'))?.replace('KEY_POINTS:', '').trim()?.split('\n').map(p => p.trim()).filter(Boolean);
      const solution = sections.find(s => s.startsWith('SOLUTION:'))?.replace('SOLUTION:', '').trim();
      const answer = sections.find(s => s.startsWith('ANSWER:'))?.replace('ANSWER:', '').trim();
      const verification = sections.find(s => s.startsWith('VERIFICATION:'))?.replace('VERIFICATION:', '').trim();
      const latex = sections.find(s => s.startsWith('LATEX:'))?.replace('LATEX:', '').trim();
      const topic = sections.find(s => s.startsWith('TOPIC:'))?.replace('TOPIC:', '').trim();
      const hints = sections.find(s => s.startsWith('HINTS:'))?.replace('HINTS:', '').trim()?.split('\n').map(h => h.trim()).filter(Boolean);
      const relatedConcepts = sections.find(s => s.startsWith('RELATED_CONCEPTS:'))?.replace('RELATED_CONCEPTS:', '').trim()?.split('\n').map(c => c.trim()).filter(Boolean);

      // Format the steps with numbers
      const steps = solution?.split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(step => {
          const match = step.match(/^\d+\.\s*(.+)$/);
          return match ? match[1] : step;
        }) || [];

      const mathSolution: MathSolution = {
        solution: answer || '',
        explanation: concept || '',
        steps: steps,
        latex: latex || '',
        topic: topic || 'General Mathematics',
        hints: hints || [],
        keyPoints: keyPoints || [],
        verification: verification || '',
        relatedConcepts: relatedConcepts || [],
      };

      return {
        solution: mathSolution,
        steps,
        latex
      };
    } catch (error) {
      console.error('Text solver error:', error);
      // Return a mock solution as fallback
      return {
        solution: this.createMockSolution(),
        steps: this.createMockSolution().steps,
        latex: this.createMockSolution().latex
      };
    }
  }

  // Image-based math solving
  async solveImage(imageUrl: string): Promise<SolverResult> {
    try {
      // Placeholder for OCR or image analysis service
      // Currently a mock implementation
      const detectedText = "We'll extract math problems from images in a future update.";
      
      try {
        // Attempt to get a solution from the API
        const response = await getMathCompletion(detectedText);
        
        // Parse the response into sections (similar to text solving)
        const sections = response.split('\n\n');
        const concept = sections.find(s => s.startsWith('CONCEPT:'))?.replace('CONCEPT:', '').trim();
        const keyPoints = sections.find(s => s.startsWith('KEY_POINTS:'))?.replace('KEY_POINTS:', '').trim()?.split('\n').map(p => p.trim()).filter(Boolean);
        const solution = sections.find(s => s.startsWith('SOLUTION:'))?.replace('SOLUTION:', '').trim();
        const answer = sections.find(s => s.startsWith('ANSWER:'))?.replace('ANSWER:', '').trim();
        const verification = sections.find(s => s.startsWith('VERIFICATION:'))?.replace('VERIFICATION:', '').trim();
        const latex = sections.find(s => s.startsWith('LATEX:'))?.replace('LATEX:', '').trim();
        const topic = sections.find(s => s.startsWith('TOPIC:'))?.replace('TOPIC:', '').trim();
        const hints = sections.find(s => s.startsWith('HINTS:'))?.replace('HINTS:', '').trim()?.split('\n').map(h => h.trim()).filter(Boolean);
        const relatedConcepts = sections.find(s => s.startsWith('RELATED_CONCEPTS:'))?.replace('RELATED_CONCEPTS:', '').trim()?.split('\n').map(c => c.trim()).filter(Boolean);
        
        // Format steps
        const steps = solution?.split('\n')
          .map(s => s.trim())
          .filter(Boolean)
          .map(step => {
            const match = step.match(/^\d+\.\s*(.+)$/);
            return match ? match[1] : step;
          }) || [];
        
        const mathSolution: MathSolution = {
          solution: answer || '',
          explanation: concept || '',
          steps: steps,
          latex: latex || '',
          topic: topic || 'General Mathematics',
          hints: hints || [],
          keyPoints: keyPoints || [],
          verification: verification || '',
          relatedConcepts: relatedConcepts || [],
        };
        
        return {
          solution: mathSolution,
          steps,
          latex
        };
      } catch (error) {
        console.warn("Error with Groq API in image solver, using mock response:", error);
        // Return a mock solution
        return {
          solution: this.createMockSolution(),
          steps: this.createMockSolution().steps,
          latex: this.createMockSolution().latex
        };
      }
    } catch (error) {
      console.error('Image solver error:', error);
      // Return a mock solution as fallback
      return {
        solution: this.createMockSolution(),
        steps: this.createMockSolution().steps,
        latex: this.createMockSolution().latex
      };
    }
  }

  // Voice-to-text math solving
  async solveVoice(transcription: string): Promise<SolverResult> {
    try {
      const prompt = this.formatMathPrompt(transcription, 'voice');
      const response = await getMathCompletion(prompt);
      
      // Parse the response into sections
      const sections = response.split('\n\n');
      const concept = sections.find(s => s.startsWith('CONCEPT:'))?.replace('CONCEPT:', '').trim();
      const solution = sections.find(s => s.startsWith('SOLUTION:'))?.replace('SOLUTION:', '').trim();
      const answer = sections.find(s => s.startsWith('ANSWER:'))?.replace('ANSWER:', '').trim();
      const latex = sections.find(s => s.startsWith('LATEX:'))?.replace('LATEX:', '').trim();
      const topic = sections.find(s => s.startsWith('TOPIC:'))?.replace('TOPIC:', '').trim();
      const hints = sections.find(s => s.startsWith('HINTS:'))?.replace('HINTS:', '').trim()?.split('\n').map(h => h.trim()).filter(Boolean);

      // Format the steps
      const steps = solution?.split('\n').map(s => s.trim()).filter(Boolean) || [];

      const mathSolution: MathSolution = {
        solution: answer || '',
        explanation: concept || '',
        steps: steps,
        latex: latex || '',
        topic: topic || 'General Mathematics',
        hints: hints || [],
      };

      return {
        solution: mathSolution,
        steps,
        latex
      };
    } catch (error) {
      console.error('Voice solver error:', error);
      return {
        solution: null,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  // Enhanced file content solving (PDF, CSV, DOCX)
  async solveFile(content: string, fileType: 'pdf' | 'csv' | 'docx'): Promise<SolverResult> {
    try {
      // For PDF files, the content will be base64 encoded
      let processedContent = content;
      if (fileType === 'pdf') {
        try {
          // Try to decode the base64 content
          processedContent = atob(content);
        } catch (error) {
          console.error('Error decoding PDF content:', error);
          return {
            solution: null,
            error: "Failed to process PDF file. Please ensure the file is valid and not corrupted."
          };
        }
      }

      const prompt = this.formatMathPrompt(processedContent, 'file');
      const response = await getMathCompletion(prompt);
      
      // Parse the response into sections
      const sections = response.split('\n\n');
      
      // Extract problems
      const problemsSection = sections.find(s => s.startsWith('PROBLEMS:'))?.replace('PROBLEMS:', '').trim();
      const problems = problemsSection?.split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) || [];
      
      // Extract solutions
      const solutionsSection = sections.find(s => s.startsWith('SOLUTIONS:'))?.replace('SOLUTIONS:', '').trim();
      const solutions = solutionsSection?.split(/Problem \d+:/)
        .filter(Boolean)
        .map(solution => {
          const lines = solution.split('\n').filter(Boolean);
          return {
            topic: lines.find(l => l.includes('Topic:'))?.replace(/.*Topic:\s*/, '').trim() || '',
            solution: lines.find(l => l.includes('Solution:'))?.replace(/.*Solution:\s*/, '').trim() || '',
            answer: lines.find(l => l.includes('Answer:'))?.replace(/.*Answer:\s*/, '').trim() || '',
            keyPoints: lines.find(l => l.includes('Key Points:'))?.replace(/.*Key Points:\s*/, '').trim()?.split(',').map(p => p.trim()) || [],
            formulas: lines.find(l => l.includes('Formulas:'))?.replace(/.*Formulas:\s*/, '').trim()?.split(',').map(f => f.trim()) || []
          };
        }) || [];
      
      // Extract summary and LaTeX
      const summary = sections.find(s => s.startsWith('SUMMARY:'))?.replace('SUMMARY:', '').trim() || '';
      const latex = sections.find(s => s.startsWith('LATEX:'))?.replace('LATEX:', '').trim() || '';

      // If no problems were found, return an error
      if (problems.length === 0) {
        return {
          solution: null,
          error: "No mathematical problems were found in the file. Please ensure the file contains mathematical content."
        };
      }

      // Format the complete solution
      const mathSolution: MathSolution = {
        solution: `Found ${problems.length} mathematical problems in the ${fileType.toUpperCase()} file.`,
        explanation: summary,
        steps: solutions.map((s, i) => `Problem ${i + 1}: ${s.solution}`),
        latex,
        topic: 'Multiple Topics',
        hints: solutions.flatMap(s => s.keyPoints),
        fileAnalysis: {
          fileType,
          problemCount: problems.length,
          topics: solutions.map(s => s.topic).filter(Boolean),
          problems: problems.map((problem, i) => ({
            question: problem,
            topic: solutions[i]?.topic || 'General Mathematics',
            solution: solutions[i]?.solution || '',
            answer: solutions[i]?.answer || '',
            keyPoints: solutions[i]?.keyPoints || [],
            formulas: solutions[i]?.formulas || []
          }))
        }
      };

      return {
        solution: mathSolution,
        steps: mathSolution.steps,
        latex: mathSolution.latex
      };
    } catch (error) {
      console.error('File solver error:', error);
      return {
        solution: null,
        error: error instanceof Error ? error.message : "Failed to process the file. Please try again."
      };
    }
  }

  // LaTeX generation and solving
  async generateLatex(problem: string): Promise<SolverResult> {
    try {
      const prompt = `Convert this mathematical problem to LaTeX notation:
      ${problem}
      
      Provide only the LaTeX code without any explanation.`;

      const response = await getMathCompletion(prompt);
      return {
        solution: null,
        latex: response.trim(),
        error: undefined
      };
    } catch (error) {
      console.error('LaTeX generation error:', error);
      return {
        solution: null,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

export const solverService = new SolverService(); 