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

const reactionYieldSchema = z.object({
  actualYield: z.number().min(0, "Yield must be positive"),
  theoreticalYield: z.number().min(0, "Yield must be positive"),
});

type ReactionYieldFormValues = z.infer<typeof reactionYieldSchema>;

export function ReactionYieldCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<ReactionYieldFormValues>({
    resolver: zodResolver(reactionYieldSchema),
    defaultValues: {
      actualYield: 0,
      theoreticalYield: 0,
    },
  });

  const onSubmit = async (values: ReactionYieldFormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await handleCalculatorRequest({
        type: 'chemistry',
        calculator: 'reaction-yield',
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
            name="actualYield"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Yield (g)</FormLabel>
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
            name="theoreticalYield"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theoretical Yield (g)</FormLabel>
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
            {loading ? 'Calculating...' : 'Calculate Yield Percentage'}
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
            Yield: {result.toFixed(2)}%
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Formula: % yield = (actual yield / theoretical yield) × 100
          </p>
        </Card>
      )}
    </div>
  );
} 