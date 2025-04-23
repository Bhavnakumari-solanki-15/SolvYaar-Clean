import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, BrainCircuit } from 'lucide-react';

// This is a mock solution that doesn't require a real solver
const mockSolutions = {
  '2x + 5 = 15': [
    "Step 1: Subtract 5 from both sides of the equation",
    "2x + 5 - 5 = 15 - 5",
    "Step 2: Simplify",
    "2x = 10",
    "Step 3: Divide both sides by 2",
    "2x/2 = 10/2",
    "Step 4: Final solution",
    "x = 5"
  ],
  '∫x²dx': [
    "Step 1: Apply the power rule for integration",
    "∫x^n dx = x^(n+1)/(n+1) + C",
    "Step 2: For x², n = 2",
    "∫x² dx = x^(2+1)/(2+1) + C",
    "Step 3: Simplify",
    "∫x² dx = x³/3 + C",
    "Step 4: Final solution",
    "x³/3 + C"
  ],
  'sin(30°)': [
    "Step 1: Convert to radians",
    "30° = 30 × (π/180) = π/6 radians",
    "Step 2: Recall the value of sin(π/6)",
    "sin(π/6) = 1/2",
    "Step 3: Verify using the unit circle",
    "At angle π/6, the y-coordinate on the unit circle is 1/2",
    "Step 4: Final solution",
    "sin(30°) = 0.5"
  ],
  'default': [
    "Step 1: Analyze the problem",
    "Identify the mathematical operation required",
    "Step 2: Apply the appropriate formula",
    "Use the correct mathematical rules",
    "Step 3: Perform the calculation",
    "Execute the operations in the proper order",
    "Step 4: Final solution",
    "Simplify to get the answer"
  ]
};

const DemoSection: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [solution, setSolution] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleSolve = (input: string = inputValue) => {
    if (!input.trim()) return;
    
    setIsCalculating(true);
    
    // Simulate API call for demo purposes
    setTimeout(() => {
      // Choose the appropriate mock solution based on input
      if (input === '2x + 5 = 15') {
        setSolution(mockSolutions['2x + 5 = 15']);
      } else if (input === '∫x²dx') {
        setSolution(mockSolutions['∫x²dx']);
      } else if (input === 'sin(30°)') {
        setSolution(mockSolutions['sin(30°)']);
      } else {
        setSolution(mockSolutions.default);
      }
      
      setIsCalculating(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSolve();
  };

  return (
    <section id="demo" className="py-20 md:py-28 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="particle" 
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.2,
              animationDuration: `${Math.random() * 15 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Try the Magic
          </h2>
          <span className="block text-muted-foreground text-center max-w-xs mx-auto text-xs sm:text-sm">
            Type any math problem and watch our AI solver solve it step-by-step.
          </span>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Input form */}
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="rounded-3xl shadow-md bg-background/95 dark:bg-background/80 backdrop-blur-xl border border-border p-6 md:p-8">
              <div className="mb-6">
                <label htmlFor="math-input" className="block text-foreground/80 mb-2 text-sm">
                  Enter your problem:
                </label>
                <div className="relative">
                  <input
                    id="math-input"
                    type="text"
                    placeholder="e.g., 2x + 5 = 15 or ∫x²dx"
                    className="w-full bg-background/50 dark:bg-background/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder-foreground/40 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <div className="absolute right-3 top-2.5">
                    <Search className="h-5 w-5 text-foreground/50" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mb-4">
                {['2x + 5 = 15', '∫x²dx', 'sin(30°)'].map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="text-xs bg-background/50 dark:bg-background/30 hover:bg-background/70 dark:hover:bg-background/40 px-3 py-1.5 rounded-full text-foreground/70 transition-colors border border-border/60"
                    onClick={() => {
                      setInputValue(example);
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Solve Problem
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
          
          {/* Solution visualization */}
          <motion.div 
            className="rounded-3xl shadow-md bg-background/95 dark:bg-background/80 backdrop-blur-xl border border-border p-6 md:p-8 min-h-[280px] flex flex-col"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shadow-sm border border-primary/20 backdrop-blur-sm">
                <BrainCircuit className="h-4 w-4 text-primary" />
              </span>
              <h3 className="text-lg font-medium text-foreground">
                Solution Steps
              </h3>
            </div>
            
            <div className="flex-1">
              {isCalculating ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                  <p className="text-muted-foreground">Calculating solution...</p>
                </div>
              ) : solution.length > 0 ? (
                <div className="space-y-3">
                  {solution.map((step, index) => (
                    <motion.div
                      key={index}
                      className={`flex gap-3 items-start ${index % 2 === 1 ? 'pl-8 text-muted-foreground text-sm italic' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {index % 2 === 0 && (
                        <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-foreground flex-shrink-0">
                          {Math.floor(index/2) + 1}
                        </div>
                      )}
                      <p className={`${index % 2 === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground">
                    Enter a math problem to see the step-by-step solution here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection; 