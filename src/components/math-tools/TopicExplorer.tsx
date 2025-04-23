import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { exploreTopic } from "../../lib/groq-api";
import { toast } from "../ui/sonner";
import { Badge } from "../ui/badge";
import { Loader2, BookOpen, ListChecks, BookMarked, ArrowRight, Search, History, Star, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface TopicInfo {
  topic: string;
  definition: string;
  keyPoints: string[];
  example: {
    problem: string;
    solution: string;
  };
  relatedTopics: string[];
}

interface SearchHistory {
  topic: string;
  timestamp: Date;
}

export function TopicExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"explore" | "history" | "favorites">("explore");

  const handleSearch = async () => {
    if (!searchTerm) {
      toast.error("Please enter a topic to explore");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const info = await exploreTopic(searchTerm);
      if (!info?.topic) {
        setError(`No information found for "${searchTerm}"`);
        setTopicInfo(null);
      } else {
        setTopicInfo(info);
        // Add to search history
        setSearchHistory(prev => [
          { topic: searchTerm, timestamp: new Date() },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch topic information";
      setError(errorMessage);
      toast.error(errorMessage);
      setTopicInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRelatedTopicClick = (topic: string) => {
    setSearchTerm(topic);
    handleSearch();
  };

  const toggleFavorite = (topic: string) => {
    setFavorites(prev => 
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const renderKeyPoints = () => {
    if (!topicInfo?.keyPoints?.length) {
      return <p className="text-muted-foreground">No key points available.</p>;
    }

    return (
      <ul className="space-y-2">
        {topicInfo.keyPoints.map((point, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-2"
          >
            <ArrowRight className="h-4 w-4 mt-1 text-primary" />
            <span className="text-muted-foreground">{point}</span>
          </motion.li>
        ))}
      </ul>
    );
  };

  const renderExample = () => {
    if (!topicInfo?.example) {
      return <p className="text-muted-foreground">No example available.</p>;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="bg-card/50 hover:bg-card/70 transition-colors">
          <CardContent className="p-4">
            <p className="font-medium text-primary mb-2">Problem:</p>
            <p className="text-muted-foreground mb-4 bg-background/50 p-3 rounded-md">
              {topicInfo.example.problem}
            </p>
            <p className="font-medium text-primary mb-2">Solution:</p>
            <p className="text-muted-foreground bg-background/50 p-3 rounded-md">
              {topicInfo.example.solution}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderRelatedTopics = () => {
    if (!topicInfo?.relatedTopics?.length) {
      return <p className="text-muted-foreground">No related topics available.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {topicInfo.relatedTopics.map((topic, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleRelatedTopicClick(topic)}
            >
              {topic}
            </Badge>
          </motion.div>
        ))}
      </div>
    );
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
              placeholder="Enter a math topic (e.g., derivatives, matrices)"
              className="pl-9"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={loading || !searchTerm}
            className="min-w-[100px]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Explore"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "explore" | "history" | "favorites")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Explore
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
            <TabsContent value="explore" className="space-y-6 min-h-full">
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

              {topicInfo && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h2 className="text-2xl font-bold text-primary">{topicInfo.topic}</h2>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(topicInfo.topic)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              favorites.includes(topicInfo.topic)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {favorites.includes(topicInfo.topic)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="bg-card/50 p-4 rounded-lg">
                    <p className="text-muted-foreground leading-relaxed">
                      {topicInfo.definition || 'No definition available.'}
                    </p>
                  </div>

                  <div className="bg-card/50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <ListChecks className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-primary">Key Points</h3>
                    </div>
                    {renderKeyPoints()}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <BookMarked className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-primary">Example</h3>
                    </div>
                    {renderExample()}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-3">Related Topics</h3>
                    {renderRelatedTopics()}
                  </div>
                </motion.div>
              )}
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
                          <span>{item.topic}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchTerm(item.topic);
                            handleSearch();
                          }}
                        >
                          Explore
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
                    {favorites.map((topic, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{topic}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchTerm(topic);
                              handleSearch();
                            }}
                          >
                            Explore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(topic)}
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