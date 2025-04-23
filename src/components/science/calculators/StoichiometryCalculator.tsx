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

const stoichiometrySchema = z.object({
  molesReactant: z.number().min(0, "Moles must be positive"),
  coefficientReactant: z.number().min(1, "Coefficient must be at least 1"),
  coefficientProduct: z.number().min(1, "Coefficient must be at least 1"),
});

type StoichiometryFormValues = z.infer<typeof stoichiometrySchema>;

export function StoichiometryCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<StoichiometryFormValues>({
    resolver: zodResolver(stoichiometrySchema),
    defaultValues: {
      molesReactant: 0,
      coefficientReactant: 1,
      coefficientProduct: 1,
    },
  });

  const onSubmit = async (values: StoichiometryFormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await handleCalculatorRequest({
        type: 'chemistry',
        calculator: 'stoichiometry',
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
            name="molesReactant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moles of Reactant</FormLabel>
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
            name="coefficientReactant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coefficient of Reactant</FormLabel>
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
            name="coefficientProduct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coefficient of Product</FormLabel>
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

          <Button type="submit" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Moles of Product'}
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
            Moles of Product: {result.toFixed(4)} mol
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Formula: n₂ = n₁ × (c₂/c₁)
          </p>
        </Card>
      )}
    </div>
  );
} 