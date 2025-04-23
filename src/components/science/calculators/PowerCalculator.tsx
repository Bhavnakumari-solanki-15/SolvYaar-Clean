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

const powerSchema = z.object({
  voltage: z.number().min(0, "Voltage must be positive"),
  current: z.number().min(0, "Current must be positive"),
});

type PowerFormValues = z.infer<typeof powerSchema>;

export function PowerCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<PowerFormValues>({
    resolver: zodResolver(powerSchema),
    defaultValues: {
      voltage: 0,
      current: 0,
    },
  });

  const onSubmit = async (values: PowerFormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await handleCalculatorRequest({
        type: 'physics',
        calculator: 'power',
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
            name="voltage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Voltage (V)</FormLabel>
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
            name="current"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current (A)</FormLabel>
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
            {loading ? 'Calculating...' : 'Calculate Power'}
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
            Power: {result.toFixed(2)} W
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Formula: P = VI
          </p>
        </Card>
      )}
    </div>
  );
} 