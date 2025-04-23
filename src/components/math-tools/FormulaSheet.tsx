import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { getFormula } from "../../lib/groq-api";
import { toast } from "../ui/sonner";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Loader2, Search, BookOpen, History, Star, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";

interface Formula {
  name: string;
  formula: string;
  description: string;
  example: string;
}

interface SearchHistory {
  term: string;
  timestamp: Date;
}

export function FormulaSheet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "history" | "favorites">("search");
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) {
      toast.error("Please enter a topic to search");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await getFormula(searchTerm);
      if (results.length === 0) {
        setError(`No formulas found for "${searchTerm}"`);
      } else {
        setFormulas(results);
        // Add to search history
        setSearchHistory(prev => [
          { term: searchTerm, timestamp: new Date() },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch formulas";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFavorite = (formulaName: string) => {
    setFavorites(prev => 
      prev.includes(formulaName)
        ? prev.filter(f => f !== formulaName)
        : [...prev, formulaName]
    );
  };

  const copyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(formula);
    setTimeout(() => setCopiedFormula(null), 2000);
    toast.success("Formula copied to clipboard");
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6">
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search formulas (e.g., trigonometry, calculus)"
              className="pl-9"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={loading || !searchTerm}
            className="min-w-[100px]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "search" | "history" | "favorites")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites
            </TabsTrigger>
          </TabsList>

          <div className="h-[500px] overflow-y-auto">
            <TabsContent value="search" className="space-y-6 min-h-full">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {formulas.map((formula, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card/50 hover:bg-card/70 transition-colors">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-primary">{formula.name}</h3>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleFavorite(formula.name)}
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      favorites.includes(formula.name)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {favorites.includes(formula.name)
                                  ? "Remove from favorites"
                                  : "Add to favorites"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyFormula(formula.formula)}
                                >
                                  {copiedFormula === formula.formula ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {copiedFormula === formula.formula
                                  ? "Copied!"
                                  : "Copy formula"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="p-3 bg-primary/5 rounded-md overflow-x-auto">
                          <InlineMath math={formula.formula} />
                        </div>
                        <p className="text-sm text-muted-foreground">{formula.description}</p>
                        <div className="mt-2 bg-background/50 p-3 rounded-md">
                          <p className="text-sm font-medium text-primary">Example:</p>
                          <p className="text-sm mt-1">{formula.example}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 min-h-full">
              <ScrollArea className="h-[450px]">
                {searchHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No search history yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchHistory.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span>{item.term}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchTerm(item.term);
                            handleSearch();
                          }}
                        >
                          Search
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4 min-h-full">
              <ScrollArea className="h-[450px]">
                {favorites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No favorites yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((formulaName, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{formulaName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchTerm(formulaName);
                              handleSearch();
                            }}
                          >
                            Search
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(formulaName)}
                          >
                            Remove
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
} 