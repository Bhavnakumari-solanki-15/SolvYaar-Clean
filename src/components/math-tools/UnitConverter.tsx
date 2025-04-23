import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card } from "../ui/card";
import { convertUnits } from "../../lib/groq-api";
import { toast } from "../ui/sonner";
import { ArrowRight, ArrowLeftRight, Calculator, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const commonUnits = {
  length: {
    units: ["meters", "kilometers", "centimeters", "millimeters", "inches", "feet", "yards", "miles"],
    icon: "📏",
  },
  mass: {
    units: ["grams", "kilograms", "milligrams", "pounds", "ounces"],
    icon: "⚖️",
  },
  time: {
    units: ["seconds", "minutes", "hours", "days", "weeks", "months", "years"],
    icon: "⏱️",
  },
  temperature: {
    units: ["celsius", "fahrenheit", "kelvin"],
    icon: "🌡️",
  },
  area: {
    units: ["square meters", "square kilometers", "square feet", "square yards", "acres", "hectares"],
    icon: "📐",
  },
  volume: {
    units: ["cubic meters", "liters", "milliliters", "cubic feet", "gallons", "quarts", "cups"],
    icon: "🧊",
  },
  speed: {
    units: ["meters per second", "kilometers per hour", "miles per hour", "knots"],
    icon: "🏃",
  },
  pressure: {
    units: ["pascal", "kilopascal", "bar", "psi", "atmosphere"],
    icon: "🎈",
  },
};

interface Conversion {
  fromValue: string;
  fromUnit: string;
  toUnit: string;
  result: number;
  category: string;
  timestamp: Date;
}

export function UnitConverter() {
  const [category, setCategory] = useState<keyof typeof commonUnits>("length");
  const [value, setValue] = useState<string>("");
  const [fromUnit, setFromUnit] = useState<string>("");
  const [toUnit, setToUnit] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Conversion[]>([]);
  const [activeTab, setActiveTab] = useState<"converter" | "history">("converter");

  const handleConvert = async () => {
    if (!value || !fromUnit || !toUnit) {
      toast.error("Please fill in all fields");
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      toast.error("Please enter a valid number");
      return;
    }

    setLoading(true);
    try {
      const convertedValue = await convertUnits(numericValue, fromUnit, toUnit);
      setResult(convertedValue);
      
      // Add to history
      const newConversion: Conversion = {
        fromValue: value,
        fromUnit,
        toUnit,
        result: convertedValue,
        category,
        timestamp: new Date(),
      };
      setHistory(prev => [newConversion, ...prev].slice(0, 10)); // Keep last 10 conversions
      
      toast.success("Conversion successful!");
    } catch (error) {
      toast.error("Failed to convert units. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    if (result !== null) {
      setValue(result.toString());
      setResult(null);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "converter" | "history")}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Unit Converter
            </h2>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="converter" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Converter
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="converter" className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-medium flex items-center gap-2">
                  Category
                  <span role="img" aria-label={category}>
                    {commonUnits[category].icon}
                  </span>
                </label>
                <Select value={category} onValueChange={(value: keyof typeof commonUnits) => {
                  setCategory(value);
                  setFromUnit("");
                  setToUnit("");
                  setResult(null);
                }}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(commonUnits).map(([cat, { icon }]) => (
                      <SelectItem key={cat} value={cat} className="flex items-center gap-2">
                        <span role="img" aria-label={cat} className="mr-2">
                          {icon}
                        </span>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-base font-medium">From</label>
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonUnits[category].units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={swapUnits}
                    className="rounded-full h-10 w-10 bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800/50"
                  >
                    <ArrowLeftRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium">To</label>
                  <Select value={toUnit} onValueChange={setToUnit}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonUnits[category].units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-medium">Value</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter value"
                  className="h-12"
                />
              </div>

              <Button 
                className="w-full h-12 text-base"
                onClick={handleConvert}
                disabled={loading || !value || !fromUnit || !toUnit}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Converting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Convert
                  </div>
                )}
              </Button>

              {result !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-900/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Input</p>
                      <p className="text-lg font-medium">
                        {value} {fromUnit}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Result</p>
                      <p className="text-lg font-medium">
                        {result.toFixed(4)} {toUnit}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic">
              Note: History is temporary storage only and will be cleared when you refresh the page
            </p>
            {history.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No conversion history yet
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((conversion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gradient-to-br from-gray-50/50 to-purple-50/50 dark:from-gray-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span role="img" aria-label={conversion.category}>
                            {commonUnits[conversion.category as keyof typeof commonUnits].icon}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {conversion.category}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(conversion.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {conversion.fromValue} {conversion.fromUnit}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-base font-medium">
                            {conversion.result.toFixed(4)} {conversion.toUnit}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCategory(conversion.category as keyof typeof commonUnits);
                          setValue(conversion.fromValue);
                          setFromUnit(conversion.fromUnit);
                          setToUnit(conversion.toUnit);
                          setActiveTab("converter");
                        }}
                        className="shrink-0"
                      >
                        Reuse
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 