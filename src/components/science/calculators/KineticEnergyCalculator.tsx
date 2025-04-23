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

const kineticEnergySchema = z.object({
  mass: z.number().min(0, "Mass must be positive"),
  velocity: z.number(),
});

type KineticEnergyFormValues = z.infer<typeof kineticEnergySchema>;

export function KineticEnergyCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<KineticEnergyFormValues>({
    resolver: zodResolver(kineticEnergySchema),
    defaultValues: {
      mass: 0,
      velocity: 0,
    },
  });

  const onSubmit = async (values: KineticEnergyFormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await handleCalculatorRequest({
        type: 'physics',
        calculator: 'kinetic-energy',
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" onClick={(e) => e.stopPropagation()}>
          <FormField
            control={form.control}
            name="mass"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mass (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="velocity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Velocity (m/s)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Kinetic Energy'}
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
            Kinetic Energy: {result.toFixed(2)} J
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Formula: KE = ½mv²
          </p>
        </Card>
      )}
    </div>
  );
} 