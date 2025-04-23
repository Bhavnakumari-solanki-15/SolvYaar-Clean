import React from 'react';
import Katex from "katex";
import "katex/dist/katex.min.css";

interface FormattedMathProps {
  text: string;
  className?: string;
}

export function FormattedMath({ text, className = "" }: FormattedMathProps) {
  // Process text to highlight boxed answers with a special style and render LaTeX
  const processText = () => {
    if (!text) return { __html: "" };

    // First replace boxed answers with a special style
    let processedText = text.replace(/【(.*?)】/g, '<span class="bg-primary/20 px-2 py-1 rounded text-primary font-semibold">$1</span>');
    
    // Replace common mathematical notations before LaTeX processing
    processedText = processedText
      // Fractions (a/b)
      .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
      // Square roots
      .replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}')
      // Powers/Exponents (x^n)
      .replace(/([a-zA-Z\d]+)\^(\d+)/g, '$1^{$2}')
      // Greek letters
      .replace(/\b(alpha|beta|gamma|delta|theta|pi|sigma|omega)\b/g, '\\$1')
      // Mathematical symbols
      .replace(/!=|≠/g, '\\neq')
      .replace(/<=/g, '\\leq')
      .replace(/>=/g, '\\geq')
      .replace(/\+-/g, '\\pm')
      .replace(/infinity|∞/g, '\\infty')
      .replace(/\*/g, '\\times')
      // Subscripts (x_1)
      .replace(/([a-zA-Z])_(\d+)/g, '$1_{$2}')
      // Vectors (with arrows)
      .replace(/vec\((.*?)\)/g, '\\vec{$1}')
      // Absolute values
      .replace(/\|([^|]+)\|/g, '\\left|$1\\right|')
      // Integrals
      .replace(/integral/g, '\\int')
      .replace(/integral_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '\\int_{$1}^{$2}')
      // Summations
      .replace(/sum_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '\\sum_{$1}^{$2}')
      // Limits
      .replace(/lim_([a-zA-Z0-9]+)/g, '\\lim_{$1}')
      // Derivatives
      .replace(/d\/dx/g, '\\frac{d}{dx}')
      .replace(/d\^2\/dx\^2/g, '\\frac{d^2}{dx^2}')
      // Matrices
      .replace(/matrix\[(.*?)\]/g, (match: string, content: string) => {
        const rows: string[] = content.split(';');
        return '\\begin{pmatrix}' + 
          rows.map((row: string) => row.trim().split(',').join(' & ')).join(' \\\\ ') + 
          '\\end{pmatrix}';
      });

    // Find all potential LaTeX expressions (both inline and display)
    const latexRegex = /\$(.*?)\$|\$\$(.*?)\$\$/g;
    let match;
    let lastIndex = 0;
    let result = "";
    
    while ((match = latexRegex.exec(processedText)) !== null) {
      // Add text before the LaTeX
      result += processedText.substring(lastIndex, match.index);
      
      // Determine if it's display or inline LaTeX
      const isDisplay = match[0].startsWith("$$");
      const latexContent = isDisplay ? match[2] : match[1];
      
      try {
        // Render LaTeX to HTML with enhanced options
        const html = Katex.renderToString(latexContent, {
          throwOnError: false,
          displayMode: isDisplay,
          strict: false,
          trust: true,
          macros: {
            // Add common macros
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\Q': '\\mathbb{Q}',
            '\\C': '\\mathbb{C}',
            '\\diff': '\\mathrm{d}',
            '\\grad': '\\nabla',
            '\\divg': '\\nabla\\cdot',
            '\\curl': '\\nabla\\times'
          }
        });
        result += html;
      } catch (e) {
        // Fallback to original text if rendering fails
        console.warn('LaTeX rendering failed:', e);
        result += match[0];
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    result += processedText.substring(lastIndex);
    
    return { __html: result };
  };
  
  return (
    <div className={`math-render ${className}`}>
      <div 
        className="whitespace-pre-line prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={processText()}
      />
    </div>
  );
} 