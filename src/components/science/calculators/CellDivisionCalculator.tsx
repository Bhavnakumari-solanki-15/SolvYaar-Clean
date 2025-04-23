import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const cellDivisionSchema = z.object({
  initialCells: z.number().min(1, "Initial cells must be at least 1"),
  divisions: z.number().min(0, "Number of divisions cannot be negative"),
  divisionTime: z.number().min(0, "Division time cannot be negative"),
});

type CellDivisionFormValues = z.infer<typeof cellDivisionSchema>;

export function CellDivisionCalculator() {
  const [result, setResult] = useState<{
    finalCells: number;
    totalTime: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CellDivisionFormValues>({
    resolver: zodResolver(cellDivisionSchema),
    defaultValues: {
      initialCells: 1,
      divisions: 0,
      divisionTime: 0,
    },
  });

  const onSubmit = (values: CellDivisionFormValues) => {
    try {
      const { initialCells, divisions, divisionTime } = values;
      
      // Calculate final number of cells using 2^n formula
      const finalCells = initialCells * Math.pow(2, divisions);
      
      // Calculate total time
      const totalTime = divisions * divisionTime;

      setResult({ finalCells, totalTime });
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
            name="initialCells"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Number of Cells</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
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
            name="divisions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Divisions</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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
            name="divisionTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time per Division (hours)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Calculate Cell Population</Button>
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
            <p><strong>Final Cell Count:</strong> {result.finalCells.toLocaleString()} cells</p>
            <p><strong>Total Time:</strong> {result.totalTime} hours</p>
            <p className="text-sm text-muted-foreground mt-4">
              Formula: Final Cells = Initial Cells × 2ⁿ
              <br />
              (where n is the number of divisions)
            </p>
          </div>
        </Card>
      )}
    </div>
  );
} 