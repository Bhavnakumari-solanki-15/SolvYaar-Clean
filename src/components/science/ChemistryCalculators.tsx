import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Beaker, Atom, TestTube, Box, Calculator } from "lucide-react";
import { MolarityCalculator } from './calculators/MolarityCalculator';
import { StoichiometryCalculator } from './calculators/StoichiometryCalculator';
import { SolutionMixingCalculator } from './calculators/SolutionMixingCalculator';
import { ReactionYieldCalculator } from './calculators/ReactionYieldCalculator';
import { PeriodicTable } from './visualizations/PeriodicTable';
import { MoleculeViewer } from './visualizations/MoleculeViewer';
import { ChemicalStructure } from './visualizations/ChemicalStructure';
import { MoleculeViewer3D } from './visualizations/MoleculeViewer3D';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function ChemistryCalculators() {
  const [activeTab, setActiveTab] = useState('visualizations');
  const [activeVisualization, setActiveVisualization] = useState<string | null>(null);
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const visualizationTools = [
    {
      id: "periodic-table",
      title: "Interactive Periodic Table",
      description: "View detailed information about chemical elements",
      icon: TestTube,
      component: PeriodicTable
    },
    {
      id: "molecule-3d",
      title: "3D Molecule Viewer",
      description: "Visualize molecular structures in 3D",
      icon: Box,
      component: MoleculeViewer3D
    },
    {
      id: "chemical-structure",
      title: "Chemical Structure Viewer",
      description: "Generate and view 2D chemical structures",
      icon: Atom,
      component: ChemicalStructure
    }
  ];

  const calculators = [
    {
      id: 'molarity',
      title: 'Molarity Calculator',
      description: 'Calculate solution concentration in moles per liter',
      component: <MolarityCalculator />
    },
    {
      id: 'stoichiometry',
      title: 'Stoichiometry Calculator',
      description: 'Balance chemical equations and calculate molar ratios',
      component: <StoichiometryCalculator />
    },
    {
      id: 'solution-mixing',
      title: 'Solution Mixing Calculator',
      description: 'Calculate dilutions using C₁V₁ = C₂V₂',
      component: <SolutionMixingCalculator />
    },
    {
      id: 'reaction-yield',
      title: 'Reaction Yield Calculator',
      description: 'Calculate percent yield from actual and theoretical yields',
      component: <ReactionYieldCalculator />
    }
  ];

  const handleToolClick = (tool: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to use this feature", {
        description: "Create an account to unlock all premium features.",
        action: {
          label: "Log in",
          onClick: () => {
            toast.info("Click the Login button in the header to get started");
          },
        },
      });
      return;
    }
    setActiveVisualization(tool);
  };

  const handleCalculatorClick = (id: string) => {
    setActiveCalculator(activeCalculator === id ? null : id);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <Beaker className="mx-auto h-12 w-12 text-purple-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Interactive Tools</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Log in to access our advanced visualization tools and calculators
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-6">
        Interactive Chemistry Tools
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="calculators">Calculators</TabsTrigger>
        </TabsList>

        <TabsContent value="visualizations" className="space-y-4">
          {!activeVisualization ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visualizationTools.map((tool) => (
                <Card
                  key={tool.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleToolClick(tool.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <tool.icon className="w-8 h-8" />
                      <CardTitle>{tool.title}</CardTitle>
                    </div>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setActiveVisualization(null)}
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to visualizations
              </button>
              {(() => {
                const tool = visualizationTools.find(t => t.id === activeVisualization);
                if (tool) {
                  const ToolComponent = tool.component;
                  return <ToolComponent />;
                }
                return null;
              })()}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculators" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculators.map((calc) => (
              <div key={calc.id} className="space-y-4">
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${
                    activeCalculator === calc.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => handleCalculatorClick(calc.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{calc.title}</CardTitle>
                      </div>
                      {activeCalculator === calc.id ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    <CardDescription>{calc.description}</CardDescription>
                  </CardHeader>
                  {activeCalculator === calc.id && (
                    <CardContent className="pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                      {calc.component}
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 