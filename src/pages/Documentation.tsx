import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Calculator, Beaker, Zap, Brain, Star } from "lucide-react";

const Documentation = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = {
    docs: [
      {
        id: "overview",
        title: "Overview",
        content: `## Welcome to SolvYaar

SolvYaar is your all-in-one platform for mathematics learning and problem-solving. Whether you're a student, teacher, or professional, we're here to help you master mathematics.

## What We Offer

• Step-by-step problem solving
• Clear explanations for every solution
• Multiple subject areas coverage
• Interactive learning tools

## Getting Started

1. Create a Free Account
   Visit our signup page to create your account and start exploring.

2. Choose Your Learning Path
   Select the subjects you want to focus on: Mathematics, Physics, or Chemistry.

3. Start Learning
   Begin with practice problems or upload your own questions for instant solutions.

## Available Plans

| Plan | Best For | Features |
|------|----------|-----------|
| Free | Students getting started | Basic problem solving + All subjects detailed guides |


## Learning Experience

Our platform guides you through each problem with:

• Clear explanations at each step
• Visual aids when helpful
• Practice suggestions
• Progress tracking`
      },
      {
        id: "subjects",
        title: "Subjects",
        content: `## Mathematics

### Algebra
Learn how to solve equations, work with expressions, and understand functions. Perfect for:
• Basic equations
• Advanced algebra
• Function analysis
• Number theory

### Calculus
Master derivatives, integrals, and limits with clear explanations:
• Step-by-step solutions
• Visual representations
• Practice problems
• Real-world applications

### Geometry
Explore shapes, spaces, and measurements:
• 2D and 3D geometry
• Proofs and theorems
• Coordinate geometry
• Transformations

## Physics

Our physics section covers:

### Mechanics
• Motion and forces
• Energy and work
• Momentum
• Rotational motion

### Electromagnetics
• Electric fields
• Magnetic forces
• Circuit analysis
• Electromagnetic waves

### Modern Physics
• Quantum mechanics
• Relativity
• Nuclear physics
• Wave-particle duality

## Chemistry

### General Chemistry
• Atomic structure
• Chemical bonding
• Stoichiometry
• Gas laws

### Advanced Topics
• Thermodynamics
• Kinetics
• Equilibrium
• Organic chemistry`
      },
      {
        id: "features",
        title: "Features",
        content: `## Learning Tools

### Interactive Calculator
Our smart calculator doesn't just solve problems - it teaches you how to solve them:
• Clear step-by-step explanations
• Multiple solution methods
• Practice suggestions
• Common mistake warnings

### Math Mentor
Get personalized guidance from our AI-powered mentor:
• One-on-one tutoring experience
• Customized learning paths
• Adaptive difficulty levels
• Real-time feedback

### Practice
Strengthen your skills with targeted practice sessions:
• Varied difficulty levels
• Topic-specific exercises
• Custom problem sets
• Instant feedback

### Math Oracle
Explore advanced problem-solving techniques:
• Predictive analysis
• Pattern recognition
• Alternative solution methods
• Complex problem breakdowns

### Math Chaos
Challenge yourself with our advanced problem generator:
• Randomized challenges
• Competitive leaderboards
• Time-based exercises
• Advanced concepts

### Science Calculators
Specialized tools for physics and chemistry calculations:
• Unit conversions
• Formula application
• Visual representations
• Conceptual explanations

### Study Guides
Comprehensive guides for every topic:
• Concept explanations
• Example problems
• Common pitfalls
• Study tips

### Progress Tracking
Monitor your learning journey:
• Topic mastery levels
• Practice history
• Weak areas identification
• Improvement suggestions`
      }
    ]
  };

  const renderContent = () => {
    const section = sections.docs.find(s => s.id === activeSection);
    if (section) {
      return (
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">{section.title}</h1>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {section.content.split('\n').map((line, idx) => {
              if (line.startsWith('##')) {
                const match = line.match(/^#+/);
                const level = match ? match[0].length : 2; // Default to h2 if match fails
                const title = line.slice(level + 1);
                const Tag = level === 2 ? 'h2' : 'h3';
                return (
                  <Tag key={idx} className={cn(
                    "font-semibold tracking-tight",
                    level === 2 ? "text-2xl mt-8 mb-4" : "text-xl mt-6 mb-3"
                  )}>
                    {title.trim()}
                  </Tag>
                );
              } else if (line.startsWith('|')) {
                if (idx === 0 || section.content.split('\n')[idx - 1].startsWith('|')) {
                  // Table header
                  const cells = line.split('|').filter(Boolean).map(cell => cell.trim());
                  if (line.includes('---')) {
                    return null; // Skip separator line
                  }
                  return (
                    <div key={idx} className="my-6">
                      <div className="overflow-hidden rounded-lg bg-[#1C1C1C] border border-[#2A2A2A]">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr>
                              {cells.map((cell, cellIdx) => (
                                <th key={cellIdx} className="px-6 py-4 text-left font-medium text-gray-400 border-b border-[#2A2A2A] bg-[#1C1C1C]">
                                  {cell}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.content
                              .split('\n')
                              .slice(idx + 2) // Skip header and separator
                              .filter(row => row.startsWith('|'))
                              .map((row, rowIdx) => {
                                const cells = row.split('|').filter(Boolean).map(cell => cell.trim());
                                return (
                                  <tr key={rowIdx} className="border-b border-[#2A2A2A] last:border-0">
                                    {cells.map((cell, cellIdx) => (
                                      <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-gray-300">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
                return null;
              } else if (line.startsWith('•')) {
                return (
                  <li key={idx} className="ml-4 text-muted-foreground">
                    {line.slice(2)}
                  </li>
                );
              } else if (line.trim().length > 0) {
                return (
                  <p key={idx} className="my-4 leading-7 text-muted-foreground">
                    {line}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-muted/50 border-r border-border">
        <div className="p-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Documentation
            </h3>
            {sections.docs.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-muted font-normal"
                )}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Documentation; 