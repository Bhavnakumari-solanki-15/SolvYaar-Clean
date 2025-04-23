import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOLECULE_PRESETS = {
  'DNA Structure': {
    id: '1BNA',
    style: {
      cartoon: { color: 'spectrum' },
      stick: { radius: 0.15, colorscheme: 'chainHelix' }
    },
    description: 'Classic B-form DNA double helix'
  },
  'Hemoglobin': {
    id: '1HHO',
    style: {
      cartoon: { color: 'spectrum' },
      stick: { radius: 0.1, bonds: 0.7 }
    },
    description: 'Oxygen-carrying protein in blood'
  },
  'SARS-CoV-2 Spike': {
    id: '6VXX',
    style: {
      cartoon: { color: 'chainHelix' },
      surface: { opacity: 0.7, colorscheme: 'whiteCarbon' }
    },
    description: 'COVID-19 virus spike protein'
  },
  'Green Fluorescent Protein': {
    id: '1EMA',
    style: {
      cartoon: { color: 'greenCarbon' },
      stick: { selectedOnly: true, radius: 0.15 }
    },
    description: 'Fluorescent protein from jellyfish'
  },
  'Insulin': {
    id: '4INS',
    style: {
      cartoon: { color: 'spectrum' },
      stick: { radius: 0.1, bonds: 0.7 }
    },
    description: 'Hormone regulating blood sugar'
  },
  'Antibody': {
    id: '1IGT',
    style: {
      cartoon: { color: 'chain' },
      line: { colorscheme: 'whiteCarbon' }
    },
    description: 'Immunoglobulin antibody structure'
  },
  'ATP Synthase': {
    id: '5ARA',
    style: {
      cartoon: { color: 'spectrum' },
      surface: { opacity: 0.5 }
    },
    description: 'Cellular energy production machine'
  },
  'Ribosome': {
    id: '4V6X',
    style: {
      cartoon: { color: 'spectrum' },
      line: { colorscheme: 'whiteCarbon' }
    },
    description: 'Protein synthesis machinery'
  }
};

export function MoleculeViewer3D() {
  const [selectedMolecule, setSelectedMolecule] = useState('');
  const [pdbId, setPdbId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewStyle, setViewStyle] = useState('cartoon');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://3Dmol.org/build/3Dmol-min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const loadMolecule = async (id: string, preset?: keyof typeof MOLECULE_PRESETS) => {
    setLoading(true);
    setError('');
    
    try {
      const viewer = (window as any).$3Dmol.createViewer('viewer', {
        backgroundColor: 'white',
      });
      
      const response = await fetch(`https://files.rcsb.org/view/${id}.pdb`);
      if (!response.ok) {
        throw new Error('Failed to fetch molecule data');
      }
      
      const data = await response.text();
      viewer.addModel(data, "pdb");

      // Apply preset styles if available
      if (preset && MOLECULE_PRESETS[preset]) {
        const styles = MOLECULE_PRESETS[preset].style;
        Object.entries(styles).forEach(([style, params]) => {
          viewer.setStyle({}, { [style]: params });
        });
      } else {
        // Default style
        viewer.setStyle({}, { 
          [viewStyle]: { color: 'spectrum' } 
        });
      }

      viewer.zoomTo();
      viewer.render();
    } catch (err) {
      setError('Failed to load molecule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (value: string) => {
    setSelectedMolecule(value);
    const preset = MOLECULE_PRESETS[value];
    if (preset) {
      setPdbId(preset.id);
      loadMolecule(preset.id, value as keyof typeof MOLECULE_PRESETS);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdbId) {
      setError('Please enter a PDB ID');
      return;
    }
    loadMolecule(pdbId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>3D Molecule Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-blue-500/10 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium">Interactive 3D Molecule Viewer</p>
                <p className="text-muted-foreground">
                  Explore complex molecular structures in 3D. Select from our curated collection or enter a custom PDB ID.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Featured Molecules</Label>
              <Select onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a molecule to view" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOLECULE_PRESETS).map(([name, data]) => (
                    <SelectItem key={name} value={name}>
                      <div className="flex flex-col">
                        <span>{name}</span>
                        <span className="text-xs text-gray-500">{data.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="pdbId">Custom PDB ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="pdbId"
                    placeholder="Enter PDB ID (e.g., 1HHO)"
                    value={pdbId}
                    onChange={(e) => setPdbId(e.target.value)}
                  />
                  <Button type="submit" disabled={loading} onClick={handleSubmit}>
                    {loading ? 'Loading...' : 'View'}
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <Label>View Style</Label>
                <Select value={viewStyle} onValueChange={setViewStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="stick">Stick</SelectItem>
                    <SelectItem value="sphere">Sphere</SelectItem>
                    <SelectItem value="surface">Surface</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div 
            id="viewer" 
            style={{ 
              height: '500px', 
              width: '100%', 
              position: 'relative',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          />

          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Controls:
              <br />
              • Click and drag to rotate
              <br />
              • Scroll or pinch to zoom
              <br />
              • Right-click and drag to translate
              <br />
              • Double-click to center on atom
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 