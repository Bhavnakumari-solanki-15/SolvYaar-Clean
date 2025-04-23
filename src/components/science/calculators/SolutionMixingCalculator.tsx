import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { handleCalculatorRequest } from '@/api/handlers';

const solutionMixingSchema = z.object({
  initialConcentration: z.number().min(0, "Concentration must be positive"),
  initialVolume: z.number().min(0, "Volume must be positive"),
  finalConcentration: z.number().min(0, "Concentration must be positive"),
});

type SolutionMixingFormValues = z.infer<typeof solutionMixingSchema>;

export function SolutionMixingCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<SolutionMixingFormValues>({
    resolver: zodResolver(solutionMixingSchema),
    defaultValues: {
      initialConcentration: 0,
      initialVolume: 0,
      finalConcentration: 0,
    },
  });

  const onSubmit = async (values: SolutionMixingFormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await handleCalculatorRequest({
        type: 'chemistry',
        calculator: 'solution-mixing',
        data: values,
      });
      setResult(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="initialConcentration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Concentration (M)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initialVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Volume (mL)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="finalConcentration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Final Concentration (M)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Final Volume'}
          </Button>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result !== null && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Result</h3>
          <p className="text-2xl font-bold">
            Final Volume: {result.toFixed(2)} mL
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Formula: C₁V₁ = C₂V₂
          </p>
        </Card>
      )}
    </div>
  );
} 