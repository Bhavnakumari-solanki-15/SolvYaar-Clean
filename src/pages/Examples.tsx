import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { Calculator, Sigma, Ruler, BarChart2 } from "lucide-react";
// Import KaTeX CSS inline to avoid module resolution issues
// We'll load the styles in the useEffect hook instead

// Define a custom BlockMath component that uses KaTeX directly
const BlockMath = ({ math }: { math: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !window.katex) return;
    
    try {
      window.katex.render(math, containerRef.current, {
        displayMode: true,
        throwOnError: false
      });
    } catch (error) {
      console.error("KaTeX rendering error:", error);
      if (containerRef.current) {
        containerRef.current.textContent = math;
      }
    }
  }, [math]);

  return <div ref={containerRef} className="katex-block" />;
};

// Example problems by category
const examples = {
  algebra: [
    {
      title: "Solve Quadratic Equation",
      problem: "Solve for x: 3x^2 - 14x + 8 = 0",
      description: "Find the roots of a quadratic equation using the quadratic formula."
    },
    {
      title: "Linear System",
      problem: "Solve the system of equations: 2x + y = 5 and 3x - 2y = 4",
      description: "Find the values of x and y that satisfy both equations."
    },
    {
      title: "Simplify Expression",
      problem: "Simplify the expression: (2x^3 - 3x^2 + 5x - 7) - (3x^3 + 2x^2 - 5x + 8)",
      description: "Combine like terms and simplify this algebraic expression."
    }
  ],
  calculus: [
    {
      title: "Find Derivative",
      problem: "Find the derivative of f(x) = 3x^4 - 2x^3 + 5x^2 - 7x + 2",
      description: "Calculate the first derivative of a polynomial function."
    },
    {
      title: "Evaluate Integral",
      problem: "Evaluate the indefinite integral: ∫(3x^2 + 2x - 5) dx",
      description: "Find the antiderivative of a polynomial function."
    },
    {
      title: "Limit Calculation",
      problem: "Calculate the limit: lim (x→2) (x^3 - 8) / (x - 2)",
      description: "Evaluate the limit as x approaches 2."
    }
  ],
  geometry: [
    {
      title: "Find Area of Triangle",
      problem: "Find the area of a triangle with vertices at (0,0), (4,0), and (2,3)",
      description: "Calculate the area of a triangle given its vertices."
    },
    {
      title: "Volume of Cone",
      problem: "Calculate the volume of a cone with radius 3 units and height 7 units.",
      description: "Apply the formula for the volume of a cone."
    },
    {
      title: "Angle in a Circle",
      problem: "Find the measure of an inscribed angle that intercepts an arc of 120° in a circle",
      description: "Use the relationship between inscribed angles and their intercepted arcs."
    }
  ],
  statistics: [
    {
      title: "Calculate Mean and Standard Deviation",
      problem: "Find the mean and standard deviation of the data set: 12, 15, 18, 22, 30, 35, 38",
      description: "Compute basic statistical measures for a data set."
    },
    {
      title: "Probability Problem",
      problem: "A bag contains 5 red marbles, 3 blue marbles, and 2 green marbles. If two marbles are drawn without replacement, what is the probability of drawing a red marble followed by a blue marble?",
      description: "Calculate a probability using the multiplication rule."
    },
    {
      title: "Normal Distribution",
      problem: "If X is normally distributed with mean μ = 70 and standard deviation σ = 5, find P(X > 75)",
      description: "Calculate probability using the normal distribution."
    }
  ]
};

const tabMeta = [
  { value: 'algebra', label: 'Algebra', icon: <Calculator className="h-5 w-5" /> },
  { value: 'calculus', label: 'Calculus', icon: <Sigma className="h-5 w-5" /> },
  { value: 'geometry', label: 'Geometry', icon: <Ruler className="h-5 w-5" /> },
  { value: 'statistics', label: 'Statistics', icon: <BarChart2 className="h-5 w-5" /> },
];

// Add katex to the window object
declare global {
  interface Window {
    katex: any;
  }
}

const Examples = () => {
  const [activeCategory, setActiveCategory] = useState("algebra");
  const navigate = useNavigate();
  
  // Load KaTeX from CDN
  useEffect(() => {
    if (window.katex) return;
    
    // Add KaTeX CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    // Add KaTeX JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    script.async = true;
    script.integrity = 'sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  const handleTryExample = (problem: string) => {
    navigate("/");
    toast.info("Example copied", {
      description: "The example has been copied. You can now paste it in the solver.",
      action: {
        label: "Copy",
        onClick: () => {
          navigator.clipboard.writeText(problem);
          toast.success("Copied to clipboard");
        }
      }
    });
  };
  
  return (
    <div className="container py-8 space-y-6">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-4xl font-bold mb-4">Example Problems</h1>
        <p className="text-lg text-muted-foreground">
          Explore these example problems to see SolvYaar in action
        </p>
      </div>
      
      <Tabs defaultValue="algebra" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <div className="flex justify-center mb-8">
          <div className="flex gap-4 p-2">
            {tabMeta.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveCategory(tab.value)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-base font-semibold transition-all
                  ${activeCategory === tab.value 
                    ? 'bg-primary text-white dark:text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105' 
                    : 'bg-white/50 dark:bg-slate-800/50 text-gray-700 dark:text-gray-200 hover:bg-white hover:dark:bg-slate-700 hover:shadow-md'}`}
              >
                <span className="w-5 h-5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {Object.entries(examples).map(([category, problems]) => (
          <TabsContent key={category} value={category} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {problems.map((example, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col items-center min-h-[320px] hover:border-primary/50 transition-colors"
                >
                  <span className="text-2xl mb-3">
                    {category === 'algebra' ? '🔢' : category === 'calculus' ? '∑' : category === 'geometry' ? '📐' : '📊'}
                  </span>
                  <h3 className="text-xl font-bold mb-2 text-foreground text-center leading-tight">{example.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center leading-relaxed">{example.description}</p>
                  <div className="mb-4 w-full">
                    {category === 'geometry' ? (
                      <div className="bg-secondary/50 rounded-lg p-4 text-secondary-foreground text-sm text-center w-full break-words border border-border">
                        {example.problem}
                      </div>
                    ) : category === 'statistics' ? (
                      <div className="bg-secondary/50 rounded-lg p-4 text-secondary-foreground text-sm text-center w-full break-words border border-border overflow-auto max-h-[120px]">
                        {example.problem}
                      </div>
                    ) : (
                      <div className="bg-secondary/50 rounded-lg p-4 text-secondary-foreground border border-border overflow-x-auto max-w-full">
                        {window.katex ? (
                          <BlockMath math={example.problem.replace(/^(Solve for x:|Solve the system of equations:|Simplify the expression:|Find the derivative of f\(x\) =|Evaluate the indefinite integral:|Calculate the limit:)\s*/, '').trim()} />
                        ) : (
                          <div className="text-center">{example.problem}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button 
                    className="mt-auto w-full px-4 py-2.5 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground border border-border transition-colors font-medium text-sm"
                    onClick={() => handleTryExample(example.problem)}
                  >
                    Try this example <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Examples;
