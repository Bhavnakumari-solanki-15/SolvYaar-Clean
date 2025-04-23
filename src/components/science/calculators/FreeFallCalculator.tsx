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

const freeFallSchema = z.object({
  time: z.number().min(0, "Time must be positive"),
});

type FreeFallFormValues = z.infer<typeof freeFallSchema>;

export function FreeFallCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FreeFallFormValues>({
    resolver: zodResolver(freeFallSchema),
    defaultValues: {
      time: 0,
    },
  });

  const onSubmit = async (values: FreeFallFormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await handleCalculatorRequest({
        type: 'physics',
        calculator: 'free-fall',
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
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time (s)</FormLabel>
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
            {loading ? 'Calculating...' : 'Calculate Distance'}
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
            Distance: {result.toFixed(2)} m
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Formula: d = ½gt² (where g = 9.81 m/s²)
          </p>
        </Card>
      )}
    </div>
  );
} 