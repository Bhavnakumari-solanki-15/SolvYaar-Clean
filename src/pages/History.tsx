import { useState } from "react";
import { useHistory } from "@/contexts/HistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { GroupedHistory, HistoryItem } from "@/types/history";

const History = () => {
  const { history, isLoading, clearHistory } = useHistory();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Helper function to filter history items
  const filterHistoryItems = (items: HistoryItem[] = []) => {
    return items.filter(item => 
      (item.content?.query || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.result?.solution || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.topic || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Filter all history groups
  const filteredHistory: GroupedHistory = {
    today: filterHistoryItems(history?.today || []),
    yesterday: filterHistoryItems(history?.yesterday || []),
    lastWeek: filterHistoryItems(history?.lastWeek || []),
    older: filterHistoryItems(history?.older || [])
  };
  
  const hasHistoryItems = Object.values(history || {}).some(group => group?.length > 0);
  const hasFilteredItems = Object.values(filteredHistory).some(group => group?.length > 0);
  
  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">History</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your solution history.
          </p>
          <Link to="/">
            <Button>Back to Solver</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">History</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  function renderHistoryItem(item: HistoryItem) {
    return (
      <Card key={item.id} className="history-item">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex justify-between">
            <span className="truncate">{item.content?.query}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </CardTitle>
          {item.topic && (
            <CardDescription className="text-sm text-muted-foreground">
              Topic: {item.topic}
            </CardDescription>
          )}
          {item.result?.solution && (
            <CardDescription className="truncate">
              {item.result.solution}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {(item.content?.imageUrl || item.content?.audioUrl || item.content?.fileUrl) && (
            <div className="mt-2">
              {item.content.imageUrl && (
                <img src={item.content.imageUrl} alt="Problem" className="max-w-md rounded" />
              )}
              {item.content.audioUrl && (
                <audio src={item.content.audioUrl} controls className="mt-2" />
              )}
              {item.content.fileUrl && (
                <a 
                  href={item.content.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  View File
                </a>
              )}
            </div>
          )}
          {item.result?.steps && item.result.steps.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Solution Steps:</h4>
              <ol className="list-decimal list-inside space-y-1">
                {item.result.steps.map((step, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 flex justify-end">
          <Link to={`/solver?query=${encodeURIComponent(item.content?.query || '')}`}>
            <Button variant="ghost" size="sm">View Solution</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  function renderHistoryGroup(title: string, items: HistoryItem[]) {
    if (!items || items.length === 0) return null;

    return (
      <div key={title} className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">{title}</h2>
        <div className="space-y-4">
          {items.map(renderHistoryItem)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Solution History</h1>
        {hasHistoryItems && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>
      
      {hasHistoryItems ? (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your solution history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {hasFilteredItems ? (
            <div className="space-y-8">
              {renderHistoryGroup("Today", filteredHistory.today)}
              {renderHistoryGroup("Yesterday", filteredHistory.yesterday)}
              {renderHistoryGroup("Last 7 Days", filteredHistory.lastWeek)}
              {renderHistoryGroup("Older", filteredHistory.older)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No matching results found.</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-medium mb-2">No History Yet</h2>
          <p className="text-muted-foreground mb-6">
            Your solved math problems will appear here.
          </p>
          <Link to="/">
            <Button>Solve a Problem</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default History;
