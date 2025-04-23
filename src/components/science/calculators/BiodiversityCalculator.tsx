import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Info, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Species {
  name: string;
  count: string;
}

export function BiodiversityCalculator() {
  const [species, setSpecies] = useState<Species[]>([
    { name: '', count: '' },
    { name: '', count: '' }
  ]);
  const [results, setResults] = useState<{
    simpson: number;
    shannon: number;
    totalIndividuals: number;
    speciesRichness: number;
  } | null>(null);

  const addSpecies = () => {
    setSpecies([...species, { name: '', count: '' }]);
  };

  const removeSpecies = (index: number) => {
    if (species.length > 2) {
      setSpecies(species.filter((_, i) => i !== index));
    }
  };

  const updateSpecies = (index: number, field: keyof Species, value: string) => {
    const newSpecies = [...species];
    newSpecies[index] = { ...newSpecies[index], [field]: value };
    setSpecies(newSpecies);
  };

  const calculateIndices = () => {
    // Filter out empty entries and parse counts
    const validSpecies = species.filter(s => s.name && s.count && !isNaN(parseInt(s.count)));
    if (validSpecies.length < 2) return;

    const counts = validSpecies.map(s => parseInt(s.count));
    const totalIndividuals = counts.reduce((sum, count) => sum + count, 0);

    // Calculate Simpson's Index (D = 1 - Σ(n(n-1)/N(N-1)))
    const simpsonD = counts.reduce((sum, n) => {
      return sum + (n * (n - 1)) / (totalIndividuals * (totalIndividuals - 1));
    }, 0);
    const simpsonIndex = 1 - simpsonD;

    // Calculate Shannon's Index (H = -Σ(pi * ln(pi)))
    const shannonIndex = counts.reduce((sum, n) => {
      const pi = n / totalIndividuals;
      return sum + (-pi * Math.log(pi));
    }, 0);

    setResults({
      simpson: Math.round(simpsonIndex * 1000) / 1000,
      shannon: Math.round(shannonIndex * 1000) / 1000,
      totalIndividuals,
      speciesRichness: validSpecies.length
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-500/10 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 text-purple-500" />
          <div className="space-y-1">
            <p className="font-medium">Biodiversity Indices</p>
            <p className="text-muted-foreground">
              This calculator provides:
            </p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Simpson's Diversity Index (0-1)</li>
              <li>Shannon's Diversity Index (H)</li>
              <li>Species Richness</li>
              <li>Total Population Size</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          {species.map((s, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="grid gap-2 flex-1">
                <Label htmlFor={`species-${index}`}>Species {index + 1}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`species-${index}`}
                    placeholder="Species name"
                    value={s.name}
                    onChange={(e) => updateSpecies(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Count"
                    value={s.count}
                    onChange={(e) => updateSpecies(index, 'count', e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
              {species.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSpecies(index)}
                  className="mt-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={addSpecies}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Species
        </Button>

        <Button 
          onClick={calculateIndices}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
        >
          Calculate Indices
        </Button>

        {results && (
          <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <div className="space-y-2">
              <p className="text-center font-medium">Biodiversity Analysis</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Simpson's Index:</p>
                  <p className="font-medium">{results.simpson.toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground">
                    (0 = low diversity, 1 = high diversity)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Shannon's Index:</p>
                  <p className="font-medium">{results.shannon.toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground">
                    (Higher value = higher diversity)
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Species Richness:</p>
                  <p className="font-medium">{results.speciesRichness}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Individuals:</p>
                  <p className="font-medium">{results.totalIndividuals}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 