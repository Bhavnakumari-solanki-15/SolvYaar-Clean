import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info, Copy, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const commonStructures = {
  'ethanol': 'CCO',
  'glucose': 'C([C@@H]1[C@H]([C@@H]([C@H](C(O1)O)O)O)O)O',
  'aspirin': 'CC(=O)OC1=CC=CC=C1C(=O)O',
  'caffeine': 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
  'ibuprofen': 'CC(C)CC1=CC=C(C=C1)[C@H](C)C(=O)O',
};

export function ChemicalStructure() {
  const [smiles, setSmiles] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateStructureUrl = (smilesString: string) => {
    // Using PubChem's structure visualization service
    const encodedSmiles = encodeURIComponent(smilesString);
    return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smiles) {
      setError('Please enter a SMILES notation');
      return;
    }
    setError('');
    setLoading(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(smiles);
  };

  const handleDownload = () => {
    if (smiles) {
      const link = document.createElement('a');
      link.href = generateStructureUrl(smiles);
      link.download = 'chemical-structure.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chemical Structure Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-purple-500/10 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-purple-500" />
              <div>
                <p className="font-medium">Chemical Structure Viewer</p>
                <p className="text-muted-foreground">
                  Enter SMILES notation or select a common structure to visualize molecules.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smiles">SMILES Notation</Label>
              <Input
                id="smiles"
                placeholder="Enter SMILES notation (e.g., CCO for ethanol)"
                value={smiles}
                onChange={(e) => setSmiles(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label>Common Structures</Label>
              <Select onValueChange={(value) => setSmiles(commonStructures[value])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a common structure" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(commonStructures).map(([name, smiles]) => (
                    <SelectItem key={name} value={name}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Generate Structure</Button>
              <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
              {smiles && (
                <Button type="button" variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {smiles && (
            <Card className="p-4 bg-white">
              <div className="aspect-square w-full flex items-center justify-center">
                <img
                  src={generateStructureUrl(smiles)}
                  alt="Chemical structure"
                  className="max-w-full max-h-full object-contain"
                  onError={() => setError('Failed to generate structure. Please check your SMILES notation.')}
                />
              </div>
            </Card>
          )}

          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Common SMILES Examples:
              <br />
              • Ethanol (CCO)
              <br />
              • Aspirin (CC(=O)OC1=CC=CC=C1C(=O)O)
              <br />
              • Caffeine (CN1C=NC2=C1C(=O)N(C(=O)N2C)C)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 