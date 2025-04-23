import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const hardyWeinbergSchema = z.object({
  dominantPhenotype: z.number().min(0, "Count must be positive"),
  recessivePhenotype: z.number().min(0, "Count must be positive"),
});

type HardyWeinbergFormValues = z.infer<typeof hardyWeinbergSchema>;

export function HardyWeinbergCalculator() {
  const [result, setResult] = useState<{
    p: number;
    q: number;
    genotypesFreq: {
      dominant: number;
      heterozygous: number;
      recessive: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<HardyWeinbergFormValues>({
    resolver: zodResolver(hardyWeinbergSchema),
    defaultValues: {
      dominantPhenotype: 0,
      recessivePhenotype: 0,
    },
  });

  const onSubmit = (values: HardyWeinbergFormValues) => {
    try {
      const { dominantPhenotype, recessivePhenotype } = values;
      const total = dominantPhenotype + recessivePhenotype;
      
      // Calculate q (frequency of recessive allele)
      const q = Math.sqrt(recessivePhenotype / total);
      // Calculate p (frequency of dominant allele)
      const p = 1 - q;
      
      // Calculate genotype frequencies
      const genotypesFreq = {
        dominant: p * p,         // p²
        heterozygous: 2 * p * q, // 2pq
        recessive: q * q         // q²
      };

      setResult({ p, q, genotypesFreq });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="dominantPhenotype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dominant Phenotype Count</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recessivePhenotype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recessive Phenotype Count</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Calculate Frequencies</Button>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <div className="space-y-2">
            <p><strong>Allele Frequencies:</strong></p>
            <p>p (dominant): {result.p.toFixed(4)}</p>
            <p>q (recessive): {result.q.toFixed(4)}</p>
            
            <p className="mt-4"><strong>Genotype Frequencies:</strong></p>
            <p>Homozygous Dominant (p²): {result.genotypesFreq.dominant.toFixed(4)}</p>
            <p>Heterozygous (2pq): {result.genotypesFreq.heterozygous.toFixed(4)}</p>
            <p>Homozygous Recessive (q²): {result.genotypesFreq.recessive.toFixed(4)}</p>
            
            <p className="text-sm text-muted-foreground mt-4">
              Formula: p² + 2pq + q² = 1
            </p>
          </div>
        </Card>
      )}
    </div>
  );
} 