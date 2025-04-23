import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const populationSchema = z.object({
  initialPopulation: z.number().min(0, "Initial population must be positive"),
  growthRate: z.number(),
  time: z.number().min(0, "Time must be positive"),
});

type PopulationFormValues = z.infer<typeof populationSchema>;

export function PopulationGrowthCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PopulationFormValues>({
    resolver: zodResolver(populationSchema),
    defaultValues: {
      initialPopulation: 0,
      growthRate: 0,
      time: 0,
    },
  });

  const onSubmit = (values: PopulationFormValues) => {
    try {
      const { initialPopulation, growthRate, time } = values;
      const finalPopulation = initialPopulation * Math.exp(growthRate * time);
      setResult(finalPopulation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/10 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 text-purple-500" />
          <div className="space-y-1">
            <p className="font-medium">About Population Growth</p>
            <p className="text-muted-foreground">
              The exponential growth model (N = N₀eʳᵗ) assumes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Unlimited resources</li>
              <li>No environmental resistance</li>
              <li>Constant growth rate</li>
            </ul>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="initialPopulation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Population (N₀)</FormLabel>
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
            name="growthRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Growth Rate (r)</FormLabel>
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
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time (t)</FormLabel>
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

          <Button type="submit">Calculate Population</Button>
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
            Final Population: {result.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Formula: N = N₀eʳᵗ
          </p>
        </Card>
      )}
    </div>
  );
} 