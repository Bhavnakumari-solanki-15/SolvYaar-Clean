import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BasePair {
  base: string;
  color: string;
}

const complementaryBases: Record<string, BasePair> = {
  'A': { base: 'T', color: '#FF6B6B' }, // Red for A-T
  'T': { base: 'A', color: '#FF6B6B' },
  'G': { base: 'C', color: '#4ECDC4' }, // Teal for G-C
  'C': { base: 'G', color: '#4ECDC4' }
};

const exampleSequences = [
  {
    name: "Simple Sequence",
    sequence: "ATGC",
    description: "Basic sequence with all four bases"
  },
  {
    name: "Repeating Pattern",
    sequence: "ATGCATGCATGC",
    description: "Sequence with repeating ATGC pattern"
  },
  {
    name: "Palindrome",
    sequence: "AATTGGCCTTAA",
    description: "Palindrome sequence (reads same forwards and backwards)"
  },
  {
    name: "Hairpin Structure",
    sequence: "GGGTTTTCCCC",
    description: "Sequence that can form a hairpin structure"
  },
  {
    name: "Human Genome Segment",
    sequence: "GATCGATCGATC",
    description: "Short segment from human genome"
  },
  {
    name: "Coding Region",
    sequence: "ATGCCGTAAGCT",
    description: "Example of a coding region sequence"
  },
  {
    name: "Promoter Region",
    sequence: "TATAAAAGGGCC",
    description: "Example of a promoter region sequence"
  }
];

export function DNAViewer() {
  const [sequence, setSequence] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState<string>('');
  const svgRef = useRef<SVGSVGElement>(null);

  const validateSequence = (seq: string) => {
    return /^[ATGC]+$/i.test(seq);
  };

  const generateComplementaryStrand = (seq: string) => {
    return seq.split('').map(base => complementaryBases[base.toUpperCase()].base).join('');
  };

  const renderDNAStructure = () => {
    if (!sequence || !validateSequence(sequence)) return null;

    const complementary = generateComplementaryStrand(sequence);
    const baseWidth = 30;
    const baseHeight = 20;
    const spacing = 5;
    const totalWidth = sequence.length * (baseWidth + spacing);
    const totalHeight = 100;

    return (
      <svg
        ref={svgRef}
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full h-auto"
      >
        {/* Backbone lines */}
        <line
          x1={0}
          y1={totalHeight / 2 - baseHeight}
          x2={totalWidth}
          y2={totalHeight / 2 - baseHeight}
          stroke="#666"
          strokeWidth={2}
        />
        <line
          x1={0}
          y1={totalHeight / 2 + baseHeight}
          x2={totalWidth}
          y2={totalHeight / 2 + baseHeight}
          stroke="#666"
          strokeWidth={2}
        />

        {/* Base pairs */}
        {sequence.split('').map((base, index) => {
          const x = index * (baseWidth + spacing) + baseWidth / 2;
          const compBase = complementaryBases[base.toUpperCase()];
          
          return (
            <g key={index}>
              {/* Original strand base */}
              <rect
                x={x - baseWidth / 2}
                y={totalHeight / 2 - baseHeight}
                width={baseWidth}
                height={baseHeight}
                fill={compBase.color}
                opacity={0.7}
              />
              <text
                x={x}
                y={totalHeight / 2 - baseHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={14}
              >
                {base.toUpperCase()}
              </text>

              {/* Complementary strand base */}
              <rect
                x={x - baseWidth / 2}
                y={totalHeight / 2}
                width={baseWidth}
                height={baseHeight}
                fill={compBase.color}
                opacity={0.7}
              />
              <text
                x={x}
                y={totalHeight / 2 + baseHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={14}
              >
                {compBase.base}
              </text>

              {/* Connecting lines */}
              <line
                x1={x}
                y1={totalHeight / 2}
                x2={x}
                y2={totalHeight / 2}
                stroke={compBase.color}
                strokeWidth={2}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  const handleSequenceChange = (value: string) => {
    setSequence(value.toUpperCase());
    setError(null);
  };

  const handleExampleSelect = (value: string) => {
    const example = exampleSequences.find(seq => seq.name === value);
    if (example) {
      setSequence(example.sequence);
      setSelectedExample(value);
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sequence">DNA Sequence</Label>
          <div className="flex gap-2">
            <Input
              id="sequence"
              value={sequence}
              onChange={(e) => handleSequenceChange(e.target.value)}
              placeholder="Enter DNA sequence (A, T, G, C)"
              className="flex-1"
            />
            <Select value={selectedExample} onValueChange={handleExampleSelect}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select example" />
              </SelectTrigger>
              <SelectContent>
                {exampleSequences.map((seq) => (
                  <SelectItem key={seq.name} value={seq.name}>
                    {seq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (!validateSequence(sequence)) {
                setError('Invalid sequence. Only A, T, G, and C are allowed.');
                return;
              }
              setError(null);
            }}
          >
            Generate Structure
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSequence('');
              setSelectedExample('');
              setError(null);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DNA Structure</CardTitle>
          <CardDescription>
            {selectedExample && (
              <p className="text-sm text-muted-foreground">
                {exampleSequences.find(seq => seq.name === selectedExample)?.description}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            {renderDNAStructure()}
          </div>
          {sequence && (
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Original Strand:</span> {sequence}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Complementary Strand:</span> {generateComplementaryStrand(sequence)}
              </p>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm bg-[#FF6B6B]" />
                  <span className="text-sm">A-T Base Pair</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm bg-[#4ECDC4]" />
                  <span className="text-sm">G-C Base Pair</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 