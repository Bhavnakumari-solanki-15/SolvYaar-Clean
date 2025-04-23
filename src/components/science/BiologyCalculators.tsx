import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Calculator, Leaf, Dna, Brain, Microscope } from "lucide-react";
import { DNAViewer } from './visualizations/DNAViewer';
import { CellViewer } from './visualizations/CellViewer';
import { NeuralNetwork } from './visualizations/NeuralNetwork';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BiologyCalculators() {
  const [activeTab, setActiveTab] = useState('visualizations');
  const [activeVisualization, setActiveVisualization] = useState<string | null>(null);
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Population Growth Calculator States
  const [initialPopulation, setInitialPopulation] = useState<number>(0);
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [finalPopulation, setFinalPopulation] = useState<number | null>(null);

  // Hardy-Weinberg Calculator States
  const [dominantAllele, setDominantAllele] = useState<number>(0);
  const [recessiveAllele, setRecessiveAllele] = useState<number>(0);
  const [genotypes, setGenotypes] = useState<{ AA: number; Aa: number; aa: number } | null>(null);

  // Cell Division Calculator States
  const [initialCells, setInitialCells] = useState<number>(0);
  const [divisions, setDivisions] = useState<number>(0);
  const [finalCells, setFinalCells] = useState<number | null>(null);

  // Biodiversity Calculator States
  const [species, setSpecies] = useState<{ name: string; count: number }[]>([{ name: '', count: 0 }]);
  const [biodiversityIndices, setBiodiversityIndices] = useState<{ simpson: number; shannon: number } | null>(null);

  const visualizationTools = [
    {
      id: "cell-viewer",
      title: "Interactive Cell Viewer",
      description: "Explore the structure and organelles of different cell types",
      icon: Microscope,
      component: CellViewer
    },
    {
      id: "dna-viewer",
      title: "DNA Structure Explorer",
      description: "Visualize DNA structure and base pairing",
      icon: Dna,
      component: DNAViewer
    },
    {
      id: "neural-network",
      title: "Neural Network Simulator",
      description: "Simulate neural connections and signal transmission",
      icon: Brain,
      component: NeuralNetwork
    }
  ];

  const calculators = [
    {
      id: 'population-growth',
      title: 'Population Growth Calculator',
      description: 'Calculate exponential growth using N = N₀eʳᵗ',
      component: () => (
        <div className="p-4 space-y-4">
          <div className="grid gap-3">
            <div>
              <Label>Initial Population (N₀)</Label>
              <Input 
                type="number" 
                value={initialPopulation}
                onChange={(e) => setInitialPopulation(Number(e.target.value))}
                placeholder="Enter initial population"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <Label>Growth Rate (r)</Label>
              <Input 
                type="number" 
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                placeholder="Enter growth rate"
                step="0.01"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <Label>Time (t)</Label>
              <Input 
                type="number" 
                value={time}
                onChange={(e) => setTime(Number(e.target.value))}
                placeholder="Enter time"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <Button onClick={() => {
            const result = initialPopulation * Math.exp(growthRate * time);
            setFinalPopulation(Number(result.toFixed(2)));
          }}>
            Calculate
          </Button>
          {finalPopulation !== null && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p>Final Population: {finalPopulation}</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'hardy-weinberg',
      title: 'Hardy-Weinberg Calculator',
      description: 'Calculate allele frequencies using p² + 2pq + q² = 1',
      component: () => (
        <div className="p-4 space-y-4">
          <div className="grid gap-3">
            <div>
              <Label>Dominant Allele Frequency (p)</Label>
              <Input 
                type="number" 
                value={dominantAllele}
                onChange={(e) => setDominantAllele(Number(e.target.value))}
                placeholder="Enter p value (0-1)"
                step="0.01"
                min="0"
                max="1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <Label>Recessive Allele Frequency (q)</Label>
              <Input 
                type="number" 
                value={recessiveAllele}
                onChange={(e) => setRecessiveAllele(Number(e.target.value))}
                placeholder="Enter q value (0-1)"
                step="0.01"
                min="0"
                max="1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <Button onClick={() => {
            const p = dominantAllele;
            const q = recessiveAllele;
            if (p + q !== 1) {
              toast.error("p + q must equal 1");
              return;
            }
            setGenotypes({
              AA: Number((p * p).toFixed(4)),
              Aa: Number((2 * p * q).toFixed(4)),
              aa: Number((q * q).toFixed(4))
            });
          }}>
            Calculate
          </Button>
          {genotypes && (
            <div className="mt-4 p-3 bg-secondary rounded-lg space-y-2">
              <p>Homozygous Dominant (AA): {genotypes.AA}</p>
              <p>Heterozygous (Aa): {genotypes.Aa}</p>
              <p>Homozygous Recessive (aa): {genotypes.aa}</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'cell-division',
      title: 'Cell Division Calculator',
      description: 'Calculate cell population after mitotic divisions',
      component: () => (
        <div className="p-4 space-y-4">
          <div className="grid gap-3">
            <div>
              <Label>Initial Number of Cells</Label>
              <Input 
                type="number" 
                value={initialCells}
                onChange={(e) => setInitialCells(Number(e.target.value))}
                placeholder="Enter initial cells"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <Label>Number of Divisions</Label>
              <Input 
                type="number" 
                value={divisions}
                onChange={(e) => setDivisions(Number(e.target.value))}
                placeholder="Enter number of divisions"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <Button onClick={() => {
            const result = initialCells * Math.pow(2, divisions);
            setFinalCells(result);
          }}>
            Calculate
          </Button>
          {finalCells !== null && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p>Final Number of Cells: {finalCells.toLocaleString()}</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'biodiversity',
      title: 'Biodiversity Index Calculator',
      description: 'Calculate Simpson and Shannon diversity indices',
      component: () => (
        <div className="p-4 space-y-4">
          <div className="space-y-4">
            {species.map((s, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Species Name</Label>
                  <Input 
                    value={s.name}
                    onChange={(e) => {
                      const newSpecies = [...species];
                      newSpecies[index].name = e.target.value;
                      setSpecies(newSpecies);
                    }}
                    placeholder="Enter species name"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div>
                  <Label>Count</Label>
                  <Input 
                    type="number"
                    value={s.count}
                    onChange={(e) => {
                      const newSpecies = [...species];
                      newSpecies[index].count = Number(e.target.value);
                      setSpecies(newSpecies);
                    }}
                    placeholder="Enter count"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => setSpecies([...species, { name: '', count: 0 }])}>
            Add Species
          </Button>
          <Button onClick={() => {
            const totalCount = species.reduce((sum, s) => sum + s.count, 0);
            
            // Simpson's Index
            const simpson = 1 - species.reduce((sum, s) => {
              const proportion = s.count / totalCount;
              return sum + (proportion * proportion);
            }, 0);

            // Shannon Index
            const shannon = -species.reduce((sum, s) => {
              const proportion = s.count / totalCount;
              return proportion === 0 ? sum : sum + (proportion * Math.log(proportion));
            }, 0);

            setBiodiversityIndices({
              simpson: Number(simpson.toFixed(4)),
              shannon: Number(shannon.toFixed(4))
            });
          }}>
            Calculate Indices
          </Button>
          {biodiversityIndices && (
            <div className="mt-4 p-3 bg-secondary rounded-lg space-y-2">
              <p>Simpson's Diversity Index: {biodiversityIndices.simpson}</p>
              <p>Shannon's Diversity Index: {biodiversityIndices.shannon}</p>
            </div>
          )}
        </div>
      )
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
        <Leaf className="mx-auto h-12 w-12 text-purple-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Interactive Biology Tools</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Log in to access our advanced visualization tools and calculators
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-6">
        Interactive Biology Tools
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="calculators">Calculators</TabsTrigger>
        </TabsList>

        <TabsContent value="visualizations" className="space-y-4">
          {activeVisualization === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visualizationTools.map((tool) => (
                <Card
                  key={tool.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleToolClick(tool.id)}
                >
                  <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                    <div className="w-full space-y-1">
                      <div className="flex items-center">
                        <tool.icon className="h-5 w-5 mr-2 text-primary" />
                        <CardTitle className="text-lg">{tool.title}</CardTitle>
                      </div>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
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
            {calculators.map((calculator) => (
              <div key={calculator.id} className="space-y-4">
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${
                    activeCalculator === calculator.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => handleCalculatorClick(calculator.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{calculator.title}</CardTitle>
                      </div>
                      {activeCalculator === calculator.id ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    <CardDescription>{calculator.description}</CardDescription>
                  </CardHeader>
                  {activeCalculator === calculator.id && (
                    <CardContent className="pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                      {calculator.component()}
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